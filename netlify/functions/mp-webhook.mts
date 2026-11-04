// /api/mp-webhook: o Mercado Pago avisa aqui quando um pagamento muda de status.
// Nunca confiamos no corpo do aviso: o pagamento é buscado de novo na API do Mercado Pago com o MP_ACCESS_TOKEN.
// Se MP_WEBHOOK_SECRET estiver definido (painel do MP → Webhooks → assinatura secreta), a assinatura x-signature também é conferida.
import { getStore } from '@netlify/blobs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { json } from '../lib/contas';

const planos = () => getStore({ name: 'planos', consistency: 'strong' });

function assinaturaOk(req: Request, dataId: string) {
  const segredo = process.env.MP_WEBHOOK_SECRET;
  if (!segredo) return true;
  const sig = req.headers.get('x-signature') ?? '';
  const ts = /ts=([^,]+)/.exec(sig)?.[1] ?? '';
  const v1 = /v1=([^,]+)/.exec(sig)?.[1] ?? '';
  const manifesto = `id:${dataId.toLowerCase()};request-id:${req.headers.get('x-request-id') ?? ''};ts:${ts};`;
  const esperado = createHmac('sha256', segredo).update(manifesto).digest('hex');
  return v1.length === esperado.length && timingSafeEqual(Buffer.from(v1), Buffer.from(esperado));
}

export default async (req: Request) => {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json({ ok: false, motivo: 'cobrança desligada' }, 503);
  const url = new URL(req.url);
  const corpo = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const tipo = corpo.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const id = String(corpo.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
  if (tipo !== 'payment' || !/^\d+$/.test(id)) return json({ ok: true, ignorado: true });
  if (!assinaturaOk(req, id)) return json({ erro: 'assinatura inválida' }, 401);

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) return json({ erro: 'pagamento não encontrado' }, 502);
  const p = (await r.json()) as { status?: string; external_reference?: string; transaction_amount?: number; metadata?: { dias?: number } };
  const usuario = p.external_reference ?? '';
  if (p.status !== 'approved' || !usuario) return json({ ok: true, status: p.status });

  // Idempotente: o mesmo pagamento avisado duas vezes não soma dias de novo.
  const atual = ((await planos().get(usuario, { type: 'json' })) as { ate?: number; pagamentos?: string[] } | null) ?? {};
  if (atual.pagamentos?.includes(id)) return json({ ok: true, repetido: true });
  const dias = Number(p.metadata?.dias ?? process.env.PRO_DIAS ?? 30) || 30;
  const base = Math.max(Date.now(), atual.ate ?? 0);
  await planos().setJSON(usuario, { plano: 'pro', ate: base + dias * 86400_000, pagamentos: [...(atual.pagamentos ?? []), id].slice(-24), valor: p.transaction_amount });
  return json({ ok: true });
};

export const config = { path: '/api/mp-webhook' };
