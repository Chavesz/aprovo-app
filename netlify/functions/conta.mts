// /api/conta: criar conta, entrar e sair.
import { criarConta, entrar, json, sair } from '../lib/contas';

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);
  let corpo: { acao?: string; usuario?: string; nome?: string; senha?: string; token?: string };
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'Pedido inválido.' }, 400);
  }
  try {
    if (corpo.acao === 'criar') return json(await criarConta(corpo.usuario ?? '', corpo.nome ?? '', corpo.senha ?? ''));
    if (corpo.acao === 'entrar') return json(await entrar(corpo.usuario ?? '', corpo.senha ?? ''));
    if (corpo.acao === 'sair' && corpo.token) {
      await sair(corpo.token);
      return json({ ok: true });
    }
    return json({ erro: 'Ação desconhecida.' }, 400);
  } catch (e) {
    return json({ erro: (e as Error).message }, 400);
  }
};

export const config = { path: '/api/conta' };
