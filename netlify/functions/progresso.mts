// /api/progresso: guarda e devolve o progresso (histórico, marcadas, editais...) de cada conta.
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';

const LIMITE = 4_000_000; // ~4 MB por conta

export default async (req: Request) => {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Sessão expirada. Entre de novo.' }, 401);
  const store = getStore({ name: 'progresso', consistency: 'strong' });

  if (req.method === 'GET') {
    return json((await store.get(usuario, { type: 'json' })) ?? {});
  }
  if (req.method === 'PUT') {
    const texto = await req.text();
    if (texto.length > LIMITE) return json({ erro: 'Progresso grande demais.' }, 413);
    try {
      JSON.parse(texto);
    } catch {
      return json({ erro: 'Pedido inválido.' }, 400);
    }
    await store.set(usuario, texto);
    return json({ ok: true, salvoEm: Date.now() });
  }
  return json({ erro: 'Método não permitido.' }, 405);
};

export const config = { path: '/api/progresso' };
