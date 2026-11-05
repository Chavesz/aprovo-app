// Plano Pro: assinatura mensal recorrente pelo Mercado Pago (preapproval) ou liberação manual pelo admin.
// Fonte de verdade: Netlify Blobs "planos" (lido por planoDe em uso.ts). Espelho no Supabase: perfis.plano e assinaturas.
import { getStore } from '@netlify/blobs';
import { espelharAssinatura } from './supa';

export const planos = () => getStore({ name: 'planos', consistency: 'strong' });
export interface RegistroPlano {
  plano: 'gratis' | 'pro';
  ate?: number; // fim do acesso pago; sem data = liberação manual sem prazo
  provedor?: 'mercadopago' | 'manual';
  assinatura?: string; // id do preapproval no Mercado Pago
  status?: 'ativa' | 'cancelada' | 'pendente' | 'expirada';
  pagamentos?: string[];
  valor?: number;
  atualizado?: number;
}

export const cfgAssinatura = () => {
  const token = process.env.MP_ACCESS_TOKEN ?? '';
  const preco = Number(String(process.env.PRO_PRECO ?? '50').replace(',', '.')) || 50;
  const site = (process.env.SITE_URL ?? 'https://aprovoapp.netlify.app').replace(/\/$/, '');
  // Link pronto de assinatura (Mercado Pago ou Cakto). Vale quando não há MP_ACCESS_TOKEN; o admin libera o Pro à mão.
  const bruto = (process.env.CHECKOUT_URL ?? process.env.VITE_CHECKOUT_URL ?? '').trim();
  const link = /^https:\/\//.test(bruto) ? bruto : '';
  const modo: 'mercadopago' | 'link' | 'nenhum' = token ? 'mercadopago' : link ? 'link' : 'nenhum';
  return { token, preco, site, link, modo };
};

export async function lerPlano(usuario: string): Promise<RegistroPlano> {
  return ((await planos().get(usuario, { type: 'json' })) as RegistroPlano | null) ?? { plano: 'gratis' };
}

export async function gravarPlano(usuario: string, r: RegistroPlano) {
  const novo = { ...r, atualizado: Date.now() };
  await planos().setJSON(usuario, novo);
  await espelharAssinatura(usuario, {
    plano: r.plano,
    provedor: r.provedor ?? 'manual',
    referencia: r.assinatura ?? `manual-${usuario}`,
    status: r.status ?? (r.plano === 'pro' ? 'ativa' : 'expirada'),
    fim: r.ate,
  });
  return novo;
}

export async function mp<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`https://api.mercadopago.com${caminho}`, {
    ...init,
    headers: { authorization: `Bearer ${cfgAssinatura().token}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((d as { message?: string }).message ?? `Mercado Pago ${r.status}`), { status: r.status });
  return d as T;
}

export interface Preapproval {
  id: string;
  status: string;
  external_reference?: string;
  next_payment_date?: string;
  auto_recurring?: { transaction_amount?: number };
  init_point?: string;
}

/** Aplica o estado de uma assinatura do Mercado Pago ao plano do aluno. Idempotente. */
export async function aplicarPreapproval(p: Preapproval) {
  const usuario = p.external_reference ?? '';
  if (!usuario) return null;
  const atual = await lerPlano(usuario);
  if (p.status === 'authorized') {
    // Acesso vai até o próximo débito + 3 dias de folga (cartão recusado, banco lento).
    const proximo = p.next_payment_date ? Date.parse(p.next_payment_date) : Date.now() + 31 * 86400_000;
    return gravarPlano(usuario, {
      ...atual,
      plano: 'pro',
      provedor: 'mercadopago',
      assinatura: p.id,
      status: 'ativa',
      ate: Math.max(proximo, Date.now()) + 3 * 86400_000,
      valor: p.auto_recurring?.transaction_amount,
    });
  }
  if (p.status === 'cancelled' || p.status === 'paused') {
    // Quem cancela mantém o que já pagou até o fim do período.
    const aindaPago = !!atual.ate && atual.ate > Date.now();
    return gravarPlano(usuario, { ...atual, provedor: 'mercadopago', assinatura: p.id, status: 'cancelada', plano: aindaPago ? 'pro' : 'gratis' });
  }
  if (atual.plano !== 'pro') return gravarPlano(usuario, { ...atual, plano: 'gratis', provedor: 'mercadopago', assinatura: p.id, status: 'pendente' });
  return atual;
}
