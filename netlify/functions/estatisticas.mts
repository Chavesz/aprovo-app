// /api/estatisticas: % de acerto da comunidade por questão. POST {id, certa} conta uma resposta; GET ?id= devolve {a, t}.
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';

const store = () => getStore({ name: 'estatisticas', consistency: 'strong' });

export default async (req: Request) => {
  if (!(await usuarioDaRequisicao(req))) return json({ erro: 'Sessão expirada.' }, 401);
  if (req.method === 'GET') {
    const id = new URL(req.url).searchParams.get('id') ?? '';
    return json(((await store().get(id, { type: 'json' })) as { a: number; t: number } | null) ?? { a: 0, t: 0 });
  }
  const { id, certa } = (await req.json().catch(() => ({}))) as { id?: string; certa?: boolean };
  if (!id) return json({ erro: 'Sem questão.' }, 400);
  const s = ((await store().get(id, { type: 'json' })) as { a: number; t: number } | null) ?? { a: 0, t: 0 };
  const novo = { a: s.a + (certa ? 1 : 0), t: s.t + 1 };
  await store().setJSON(id, novo);
  return json(novo);
};

export const config = { path: '/api/estatisticas' };
