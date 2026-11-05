// Cakto: checkout hospedado (Pix, cartão) para a assinatura mensal do Pro.
// O link da oferta vem de CAKTO_CHECKOUT_URL (ex.: https://pay.cakto.com.br/abc123).
// O webhook (CAKTO_WEBHOOK_SECRET) ativa o Pro pela referência do checkout (sck) ou, sem ela, pelo e-mail do comprador.
// Baseado na integração do MIDAS (HMAC x-cakto-signature + x-cakto-timestamp, ou o "secret" no corpo).
import { getStore } from '@netlify/blobs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { emails, type Contato } from './email';
import { gravarPlano, lerPlano } from './assinatura';

const TOLERANCIA_S = 300;
const REFERENCIA = /^[A-Za-z0-9_-]{24,64}$/;

export const refs = () => getStore({ name: 'cakto-refs', consistency: 'strong' });
export const pendentes = () => getStore({ name: 'cakto-pendentes', consistency: 'strong' });
const indiceEmail = () => getStore({ name: 'email-usuario', consistency: 'strong' });

export function caktoCheckoutBase() {
  const u = (process.env.CAKTO_CHECKOUT_URL ?? '').trim();
  try {
    const url = new URL(u);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** Link do checkout com a referência do aluno (volta no webhook) e o e-mail já preenchido. */
export async function linkCheckout(usuario: string, email?: string) {
  const base = caktoCheckoutBase();
  if (!base) return null;
  const ref = randomBytes(24).toString('base64url');
  await refs().setJSON(ref, { usuario, criadoEm: Date.now() });
  const url = new URL(base.href);
  url.searchParams.set('sck', ref);
  url.searchParams.set('utm_content', ref);
  if (email) url.searchParams.set('email', email);
  return url.href;
}

const igual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function verificarWebhook(raw: string, headers: Headers, segredo: string, agora = Date.now()) {
  if (!segredo) return false;
  const assinatura = headers.get('x-cakto-signature');
  if (assinatura) {
    const ts = headers.get('x-cakto-timestamp') ?? '';
    if (!/^\d{1,12}$/.test(ts) || Math.abs(agora / 1000 - Number(ts)) > TOLERANCIA_S) return false;
    const esperado = `v1=${createHmac('sha256', segredo).update(`${ts}.${raw}`).digest('hex')}`;
    return assinatura.split(',').map((p) => p.trim()).some((p) => igual(p, esperado));
  }
  // Entregas sem o cabeçalho HMAC trazem o "secret" no corpo (modo antigo da Cakto).
  try {
    const corpo = JSON.parse(raw);
    return typeof corpo?.secret === 'string' && igual(corpo.secret, segredo);
  } catch {
    return false;
  }
}

export interface PedidoCakto { id: string; status: string; email: string | null; referencia: string | null; assinatura: string | null; valor: number | null }

const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function lerPedido(v: unknown): PedidoCakto | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const d = v as Record<string, unknown>;
  const id = texto(d.id), status = texto(d.status);
  if (!id || !status) return null;
  const cliente = d.customer && typeof d.customer === 'object' ? (d.customer as Record<string, unknown>) : {};
  let referencia: string | null = null;
  for (const x of [d.sck, d.utm_content, d.callback]) if (typeof x === 'string' && REFERENCIA.test(x)) referencia = x;
  if (!referencia) {
    try {
      const url = new URL(String(d.checkoutUrl));
      for (const k of ['sck', 'utm_content']) { const x = url.searchParams.get(k); if (x && REFERENCIA.test(x)) referencia = x; }
    } catch { /* sem checkoutUrl */ }
  }
  const sub = typeof d.subscription === 'string' ? d.subscription : d.subscription && typeof d.subscription === 'object' ? texto((d.subscription as Record<string, unknown>).id) : null;
  const valor = typeof d.amount === 'number' ? d.amount : typeof d.amount === 'string' ? Number(d.amount) : NaN;
  return { id: id.slice(0, 64), status, email: texto(cliente.email)?.toLowerCase() ?? null, referencia, assinatura: sub ? String(sub).slice(0, 64) : null, valor: Number.isFinite(valor) ? valor : null };
}

/** Guarda e-mail → usuário (para o webhook achar a conta pelo e-mail do comprador). */
export async function indexarEmail(usuario: string, email: string) {
  if (email) await indiceEmail().set(email.trim().toLowerCase(), usuario);
}

export async function usuarioPorEmail(email: string) {
  const e = email.trim().toLowerCase();
  const salvo = await indiceEmail().get(e);
  if (salvo) return salvo;
  // Contas antigas, de antes do índice: procura na lista de e-mails e já indexa.
  const { blobs } = await emails().list();
  for (const b of blobs) {
    const c = (await emails().get(b.key, { type: 'json' })) as Contato | null;
    if (c?.email?.toLowerCase() === e) {
      await indiceEmail().set(e, b.key);
      return b.key;
    }
  }
  return null;
}

const PAGO = new Set(['paid', 'approved', 'authorized']);
const ESTORNO = new Set(['refunded', 'chargedback', 'chargeback']);
const EVENTO_FIM = new Set(['refund', 'chargeback', 'subscription_canceled']);

/** Aplica um pedido da Cakto ao plano do aluno. Idempotente por id:status. */
export async function aplicarPedido(usuario: string, p: PedidoCakto, evento: string) {
  const atual = await lerPlano(usuario);
  const chave = `${p.id}:${p.status}:${evento}`;
  if (atual.pedidos?.includes(chave)) return atual;
  const pedidos = [...(atual.pedidos ?? []), chave].slice(-40);
  const base = { ...atual, pedidos, provedor: 'cakto' as const, assinatura: p.assinatura ?? atual.assinatura ?? p.id };
  if (ESTORNO.has(p.status) || evento === 'refund' || evento === 'chargeback') {
    return gravarPlano(usuario, { ...base, plano: 'gratis', status: 'cancelada', ate: Date.now() });
  }
  if (EVENTO_FIM.has(evento) || p.status === 'canceled') {
    // Cancelou a renovação: segue Pro até o fim do mês já pago.
    const aindaPago = !!atual.ate && atual.ate > Date.now();
    return gravarPlano(usuario, { ...base, plano: aindaPago ? 'pro' : 'gratis', status: 'cancelada' });
  }
  if (PAGO.has(p.status)) {
    // Mês pago + 3 dias de folga; renovações somam a partir do fim atual.
    const ate = Math.max(Date.now(), atual.ate ?? 0) + 33 * 86400_000;
    return gravarPlano(usuario, { ...base, plano: 'pro', status: 'ativa', ate, valor: p.valor ?? atual.valor });
  }
  return gravarPlano(usuario, base);
}

/** Chamado sempre que uma conta grava e-mail: indexa e aplica compra feita antes do cadastro. */
export async function registrarEmail(usuario: string, email: string) {
  const e = email.trim().toLowerCase();
  if (!e) return;
  await indexarEmail(usuario, e);
  const pend = (await pendentes().get(e, { type: 'json' })) as { pedido: PedidoCakto; evento: string }[] | null;
  if (pend?.length) {
    for (const x of pend) await aplicarPedido(usuario, x.pedido, x.evento);
    await pendentes().delete(e);
  }
}
