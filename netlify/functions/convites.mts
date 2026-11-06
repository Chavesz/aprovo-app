// /api/convites: link de convite do aluno e quantos amigos já entraram.
import { json, usuarioDaRequisicao } from '../lib/contas';
import { lerConvites } from '../lib/convites';

export default async (req: Request) => {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Sessão expirada.' }, 401);
  const c = await lerConvites(usuario);
  return json({ usuario, amigos: c.amigos.length, premios: c.premios, faltam: 3 - (c.amigos.length % 3) });
};

export const config = { path: '/api/convites' };
