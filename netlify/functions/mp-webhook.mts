// /api/mp-webhook: o Mercado Pago avisa aqui quando uma assinatura ou pagamento muda.
// Nunca confiamos no corpo do aviso: a assinatura/pagamento é buscado de novo na API com o MP_ACCESS_TOKEN.
// Se MP_WEBHOOK_SECRET estiver definido (painel do MP → Webhooks → assinatura secreta), a x-signature também é conferida.
// Eventos: subscription_preapproval (assinatura criada/autorizada/cancelada), subscription_authorized_payment
// (cada cobrança mensal) e payment (pagamento avulso, do Checkout Pro antigo).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { json } from '../lib/contas';
import { aplicarPreapproval, gravarPlano, lerPlano, mp, type Preapproval } from '../lib/assinatura';

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
  if (!process.env.MP_ACCESS_TOKEN) return json({ ok: false, motivo: 'cobrança desligada' }, 503);
  const url = new URL(req.url);
  const corpo = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const tipo = corpo.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic') ?? '';
  const id = String(corpo.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
  if (!/^[\w-]{1,64}$/.test(id)) return json({ ok: true, ignorado: true });
  if (!assinaturaOk(req, id)) return json({ erro: 'assinatura inválida' }, 401);

  try {
    if (tipo === 'subscription_preapproval' || tipo === 'preapproval') {
      const p = await mp<Preapproval>(`/preapproval/${id}`);
      await aplicarPreapproval(p);
      return json({ ok: true, status: p.status });
    }
    if (tipo === 'subscription_authorized_payment') {
      const cobranca = await mp<{ preapproval_id?: string; status?: string }>(`/authorized_payments/${id}`);
      if (!cobranca.preapproval_id) return json({ ok: true, ignorado: true });
      const p = await mp<Preapproval>(`/preapproval/${cobranca.preapproval_id}`);
      await aplicarPreapproval(p);
      return json({ ok: true, status: p.status, cobranca: cobranca.status });
    }
    if (tipo === 'payment' && /^\d+$/.test(id)) {
      const p = await mp<{ status?: string; external_reference?: string; transaction_amount?: number; metadata?: { dias?: number } }>(`/v1/payments/${id}`);
      const usuario = p.external_reference ?? '';
      if (p.status !== 'approved' || !usuario) return json({ ok: true, status: p.status });
      // Pagamento avulso (Checkout Pro antigo): soma dias, sem repetir o mesmo pagamento.
      const atual = await lerPlano(usuario);
      if (atual.pagamentos?.includes(id)) return json({ ok: true, repetido: true });
      const dias = Number(p.metadata?.dias ?? process.env.PRO_DIAS ?? 30) || 30;
      const base = Math.max(Date.now(), atual.ate ?? 0);
      await gravarPlano(usuario, { ...atual, plano: 'pro', status: 'ativa', provedor: 'mercadopago', ate: base + dias * 86400_000, pagamentos: [...(atual.pagamentos ?? []), id].slice(-24), valor: p.transaction_amount });
      return json({ ok: true });
    }
  } catch {
    // 5xx faz o Mercado Pago tentar de novo mais tarde.
    return json({ erro: 'falha ao consultar o Mercado Pago' }, 502);
  }
  return json({ ok: true, ignorado: true });
};

export const config = { path: '/api/mp-webhook' };
