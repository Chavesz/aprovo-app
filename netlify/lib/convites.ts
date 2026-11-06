// Convite de amigos: cada conta nova criada pelo link /?convite=<usuario> conta para quem convidou.
// A cada 3 amigos, quem convidou ganha 7 dias de Pro (somados ao que já tiver).
import { getStore } from '@netlify/blobs';
import { gravarPlano, lerPlano } from './assinatura';
import { normalizar } from './contas';

export const convites = () => getStore({ name: 'convites', consistency: 'strong' });
export interface Convites { amigos: string[]; premios: number }

export async function lerConvites(usuario: string): Promise<Convites> {
  return ((await convites().get(usuario, { type: 'json' })) as Convites | null) ?? { amigos: [], premios: 0 };
}

export async function registrarConvite(quemConvidou: string, novo: string) {
  const dono = normalizar(quemConvidou);
  if (!dono || dono === novo) return;
  const existe = await getStore({ name: 'usuarios', consistency: 'strong' }).get(dono);
  if (!existe) return;
  const c = await lerConvites(dono);
  if (c.amigos.includes(novo)) return;
  c.amigos.push(novo);
  const devidos = Math.floor(c.amigos.length / 3);
  if (devidos > c.premios) {
    const atual = await lerPlano(dono);
    const ate = Math.max(Date.now(), atual.ate ?? 0) + (devidos - c.premios) * 7 * 86400_000;
    // Liberação sem prazo (ate indefinido) continua sem prazo.
    if (!(atual.plano === 'pro' && !atual.ate)) await gravarPlano(dono, { ...atual, plano: 'pro', ate, status: atual.status ?? 'ativa', provedor: atual.provedor ?? 'manual' });
    c.premios = devidos;
  }
  await convites().setJSON(dono, c);
}
