// Contas e sessões guardadas no Netlify Blobs (armazenamento da própria Netlify, sem serviço externo).
import { getStore } from '@netlify/blobs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const usuarios = () => getStore({ name: 'usuarios', consistency: 'strong' });
const sessoes = () => getStore({ name: 'sessoes', consistency: 'strong' });

interface Usuario {
  usuario: string;
  nome: string;
  sal: string;
  hash: string;
  criadoEm: number;
}

export const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } });

export const normalizar = (u: string) => (u ?? '').trim().toLowerCase();

function hashSenha(senha: string, sal: string) {
  return scryptSync(senha, sal, 64).toString('hex');
}

async function novaSessao(usuario: string) {
  const token = randomBytes(32).toString('hex');
  await sessoes().setJSON(token, { usuario, criadoEm: Date.now() });
  return token;
}

export async function criarConta(usuario: string, nome: string, senha: string) {
  const u = normalizar(usuario);
  if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw new Error('Use de 3 a 30 letras, números, ponto, hífen ou sublinhado no usuário.');
  if ((senha ?? '').length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  if (await usuarios().get(u)) throw new Error('Esse usuário já existe. Escolha outro ou entre.');
  const sal = randomBytes(16).toString('hex');
  const dados: Usuario = { usuario: u, nome: (nome ?? '').trim().slice(0, 60) || u, sal, hash: hashSenha(senha, sal), criadoEm: Date.now() };
  await usuarios().setJSON(u, dados);
  return { token: await novaSessao(u), usuario: u, nome: dados.nome };
}

export async function entrar(usuario: string, senha: string) {
  const u = normalizar(usuario);
  const dados = (await usuarios().get(u, { type: 'json' })) as Usuario | null;
  const ok =
    dados &&
    timingSafeEqual(Buffer.from(hashSenha(senha ?? '', dados.sal), 'hex'), Buffer.from(dados.hash, 'hex'));
  if (!dados || !ok) throw new Error('Usuário ou senha incorretos.');
  return { token: await novaSessao(u), usuario: u, nome: dados.nome };
}

export async function sair(token: string) {
  await sessoes().delete(token);
}

/** Devolve o usuário dono do token do cabeçalho Authorization, ou null. */
export async function usuarioDaRequisicao(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const s = (await sessoes().get(token, { type: 'json' })) as { usuario: string } | null;
  return s?.usuario ?? null;
}
