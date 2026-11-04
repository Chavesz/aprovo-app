// Limite diário de uso da IA por conta (compartilhado entre /api/mentor e /api/ia).
import { getStore } from '@netlify/blobs';

export const LIMITES = { gratis: 15, pro: 300 } as const;
export type Plano = keyof typeof LIMITES;
// Contas com o plano pago liberado à mão enquanto não existe cobrança.
const PRO = new Set(['chavin', 'kaua', 'kaua.chaves']);

export const diaBR = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
const uso = () => getStore({ name: 'uso-ia', consistency: 'strong' });

export async function planoDe(usuario: string): Promise<Plano> {
  const p = (await getStore({ name: 'planos', consistency: 'strong' }).get(usuario, { type: 'json' })) as { plano?: Plano } | null;
  return p?.plano ?? (PRO.has(usuario) ? 'pro' : 'gratis');
}

export async function situacao(usuario: string) {
  const plano = await planoDe(usuario);
  const usadas = Number((await uso().get(`${usuario}:${diaBR()}`)) ?? 0);
  return { plano, usadas, limite: LIMITES[plano] };
}

/** Conta uma chamada à IA (pedidos maiores, como gerar questões, podem valer mais de 1). */
export async function registrarUso(usuario: string, usadas: number, peso = 1) {
  await uso().set(`${usuario}:${diaBR()}`, String(usadas + peso));
}
