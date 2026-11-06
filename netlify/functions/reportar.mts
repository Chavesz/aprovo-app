// /api/reportar: aluno avisa problema numa questão. Guarda no Blobs "reportes" para revisão no admin.
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ erro: 'Método não permitido.' }, 405);
  const usuario = (await usuarioDaRequisicao(req)) ?? 'anonimo';
  const p = (await req.json().catch(() => ({}))) as { id?: string; motivo?: string; texto?: string };
  const id = String(p.id ?? '').slice(0, 80);
  if (!id) return json({ erro: 'Questão não informada.' }, 400);
  const store = getStore({ name: 'reportes', consistency: 'strong' });
  const lista = ((await store.get(id, { type: 'json' })) as object[] | null) ?? [];
  lista.push({ usuario, motivo: String(p.motivo ?? '').slice(0, 60), texto: String(p.texto ?? '').slice(0, 400), em: Date.now() });
  await store.setJSON(id, lista.slice(-20));
  return json({ ok: true });
};

export const config = { path: '/api/reportar' };
