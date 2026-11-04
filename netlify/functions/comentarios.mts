// /api/comentarios: comentários dos alunos em cada questão (GET ?id= lista; POST {id, texto} publica).
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';
import { espelharComentario } from '../lib/supa';

type Comentario = { usuario: string; texto: string; em: number };
const store = () => getStore({ name: 'comentarios', consistency: 'strong' });

export default async (req: Request) => {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Sessão expirada. Entre de novo.' }, 401);
  if (req.method === 'GET') {
    const id = new URL(req.url).searchParams.get('id') ?? '';
    return json(((await store().get(id, { type: 'json' })) as Comentario[] | null) ?? []);
  }
  const { id, texto } = (await req.json().catch(() => ({}))) as { id?: string; texto?: string };
  const t = String(texto ?? '').trim().slice(0, 600);
  if (!id || t.length < 3) return json({ erro: 'Escreva um comentário.' }, 400);
  const lista = ((await store().get(id, { type: 'json' })) as Comentario[] | null) ?? [];
  if (lista.filter((c) => c.usuario === usuario && Date.now() - c.em < 60_000).length) return json({ erro: 'Espere um minuto para comentar de novo.' }, 429);
  const nova = [...lista, { usuario, texto: t, em: Date.now() }].slice(-100);
  await store().setJSON(id, nova);
  await espelharComentario(usuario, id, t);
  return json(nova);
};

export const config = { path: '/api/comentarios' };
