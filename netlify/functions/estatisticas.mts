// /api/estatisticas: % de acerto da comunidade por questão. POST {id, certa} conta uma resposta; GET ?id= devolve {a, t}.
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';

const store = () => getStore({ name: 'estatisticas', consistency: 'strong' });

export default async (req: Request) => {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Sessão expirada.' }, 401);
  if (req.method === 'GET' && new URL(req.url).searchParams.has('dificeis')) {
    // Questões com menos de 40% de acerto e pelo menos 5 respostas.
    const { blobs } = await store().list();
    const ids: string[] = [];
    for (const b of blobs) {
      if (b.key.startsWith('ja/')) continue;
      const v = (await store().get(b.key, { type: 'json' })) as { a: number; t: number } | null;
      if (v && v.t >= 5 && v.a / v.t < 0.4) ids.push(b.key);
    }
    return new Response(JSON.stringify(ids), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } });
  }
  if (req.method === 'GET') {
    const id = new URL(req.url).searchParams.get('id') ?? '';
    return json(((await store().get(id, { type: 'json' })) as { a: number; t: number } | null) ?? { a: 0, t: 0 });
  }
  const { id, certa } = (await req.json().catch(() => ({}))) as { id?: string; certa?: boolean };
  if (!id || id.length > 120) return json({ erro: 'Sem questão.' }, 400);
  // Só a primeira resposta de cada aluno conta, para ninguém inflar a estatística.
  const marca = `ja/${id}/${usuario}`;
  if (await store().get(marca)) return json({ ok: true });
  await store().set(marca, '1');
  const s = ((await store().get(id, { type: 'json' })) as { a: number; t: number } | null) ?? { a: 0, t: 0 };
  const novo = { a: s.a + (certa ? 1 : 0), t: s.t + 1 };
  await store().setJSON(id, novo);
  return json(novo);
};

export const config = { path: '/api/estatisticas' };
