// /api/cakto-webhook: recebe os eventos da Cakto (compra aprovada, renovação, cancelamento, estorno, chargeback).
// DESLIGADO até existir CAKTO_WEBHOOK_SECRET (16+ caracteres) na Netlify — o mesmo segredo cadastrado no webhook da Cakto.
// Acha o aluno pela referência do checkout (sck) ou pelo e-mail do comprador. Compra de e-mail sem conta fica pendente
// e é aplicada quando alguém criar conta (ou salvar o e-mail) com esse endereço.
import { json } from '../lib/contas';
import { aplicarPedido, lerPedido, pendentes, refs, usuarioPorEmail, verificarWebhook, type PedidoCakto } from '../lib/cakto';

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);
  const segredo = process.env.CAKTO_WEBHOOK_SECRET ?? '';
  if (segredo.length < 16) return json({ erro: 'Webhook desligado: defina CAKTO_WEBHOOK_SECRET.' }, 503);
  const raw = await req.text();
  if (raw.length > 512_000) return json({ erro: 'Corpo grande demais.' }, 413);
  if (!verificarWebhook(raw, req.headers, segredo)) return json({ erro: 'Assinatura inválida.' }, 401);

  let corpo: { event?: string; data?: unknown };
  try { corpo = JSON.parse(raw); } catch { return json({ erro: 'JSON inválido.' }, 400); }
  const evento = String(corpo.event ?? '');
  const itens = (Array.isArray(corpo.data) ? corpo.data : [corpo.data]).map(lerPedido).filter((p): p is PedidoCakto => !!p);
  const resultado: { id: string; usuario?: string; pendente?: boolean }[] = [];

  for (const p of itens) {
    let usuario: string | null = null;
    if (p.referencia) usuario = ((await refs().get(p.referencia, { type: 'json' })) as { usuario?: string } | null)?.usuario ?? null;
    if (!usuario && p.email) usuario = await usuarioPorEmail(p.email);
    if (usuario) {
      await aplicarPedido(usuario, p, evento);
      resultado.push({ id: p.id, usuario });
    } else if (p.email) {
      const lista = ((await pendentes().get(p.email, { type: 'json' })) as { pedido: PedidoCakto; evento: string }[] | null) ?? [];
      lista.push({ pedido: p, evento });
      await pendentes().setJSON(p.email, lista.slice(-20));
      resultado.push({ id: p.id, pendente: true });
    } else {
      console.error('cakto-webhook: pedido sem referência nem e-mail', p.id);
    }
  }
  return json({ ok: true, evento, resultado });
};

export const config = { path: '/api/cakto-webhook' };
