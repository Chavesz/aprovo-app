// /api/batalha: duelo entre amigos com as mesmas questões.
// POST {acao:'criar', ids:string[], titulo}          → { codigo }
// GET  ?codigo=XXXX                                   → batalha com o placar de todos
// POST {acao:'entrar', codigo}                        → entra (até 10 pessoas)
// POST {acao:'responder', codigo, i, certa}           → registra a resposta i (uma vez por questão)
// GET  ?minhas=1                                      → últimas batalhas do aluno e vitórias
import { getStore } from '@netlify/blobs';
import { randomBytes } from 'node:crypto';
import { json, usuarioDaRequisicao } from '../lib/contas';

interface Jogador { nome: string; respostas: (boolean | null)[]; inicio: number; fim?: number }
export interface Batalha { codigo: string; titulo: string; ids: string[]; criador: string; criadaEm: number; jogadores: Record<string, Jogador> }

const store = () => getStore({ name: 'batalhas', consistency: 'strong' });
const minhas = () => getStore({ name: 'batalhas-aluno', consistency: 'strong' });
const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const novoCodigo = () => Array.from(randomBytes(6), (b) => ALFA[b % ALFA.length]).join('');

async function nomeDe(usuario: string) {
  const c = (await getStore({ name: 'usuarios', consistency: 'strong' }).get(usuario, { type: 'json' })) as { nome?: string } | null;
  return (c?.nome || usuario).slice(0, 40);
}
async function lembrar(usuario: string, codigo: string) {
  const l = ((await minhas().get(usuario, { type: 'json' })) as string[] | null) ?? [];
  if (!l.includes(codigo)) await minhas().setJSON(usuario, [codigo, ...l].slice(0, 30));
}
// Cada jogador grava o próprio registro (codigo:usuario), para dois não sobrescreverem o placar um do outro.
async function carregar(codigo: string): Promise<Batalha | null> {
  const b = (await store().get(codigo, { type: 'json' })) as Batalha | null;
  if (!b) return null;
  const { blobs } = await store().list({ prefix: `${codigo}:` });
  const js = await Promise.all(blobs.map(async (x) => [x.key.slice(codigo.length + 1), await store().get(x.key, { type: 'json' })] as const));
  b.jogadores = Object.fromEntries(js.filter(([, j]) => j)) as Record<string, Jogador>;
  return b;
}
const salvarJogador = (codigo: string, usuario: string, j: Jogador) => store().setJSON(`${codigo}:${usuario}`, j);
const pontos = (j: Jogador) => j.respostas.filter((r) => r === true).length;

export default async (req: Request) => {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Entre na sua conta para batalhar.' }, 401);
  const url = new URL(req.url);

  if (req.method === 'GET') {
    if (url.searchParams.has('minhas')) {
      const codigos = ((await minhas().get(usuario, { type: 'json' })) as string[] | null) ?? [];
      const lista = (await Promise.all(codigos.map(carregar))).filter((b): b is Batalha => !!b);
      let vitorias = 0;
      for (const b of lista) {
        const terminados = Object.entries(b.jogadores).filter(([, j]) => j.fim);
        if (terminados.length < 2) continue;
        const melhor = terminados.sort(([, a], [, z]) => pontos(z) - pontos(a) || (a.fim! - a.inicio) - (z.fim! - z.inicio))[0][0];
        if (melhor === usuario) vitorias++;
      }
      return json({ vitorias, lista: lista.map((b) => ({ codigo: b.codigo, titulo: b.titulo, n: b.ids.length, criadaEm: b.criadaEm, jogadores: Object.keys(b.jogadores).length })) });
    }
    const b = await carregar((url.searchParams.get('codigo') ?? '').toUpperCase());
    return b ? json({ ...b, eu: usuario }) : json({ erro: 'Batalha não encontrada.' }, 404);
  }

  if (req.method !== 'POST') return json({ erro: 'Método não permitido.' }, 405);
  const p = (await req.json().catch(() => ({}))) as { acao?: string; ids?: string[]; titulo?: string; codigo?: string; i?: number; certa?: boolean };

  if (p.acao === 'criar') {
    const ids = (p.ids ?? []).filter((x) => typeof x === 'string').slice(0, 30);
    if (ids.length < 5) return json({ erro: 'Escolha pelo menos 5 questões.' }, 400);
    const codigo = novoCodigo();
    const b: Batalha = { codigo, titulo: String(p.titulo ?? 'Batalha').slice(0, 80), ids, criador: usuario, criadaEm: Date.now(), jogadores: {} };
    await store().setJSON(codigo, b);
    await salvarJogador(codigo, usuario, { nome: await nomeDe(usuario), respostas: ids.map(() => null), inicio: Date.now() });
    await lembrar(usuario, codigo);
    return json({ codigo });
  }

  const codigo = String(p.codigo ?? '').toUpperCase();
  const b = await carregar(codigo);
  if (!b) return json({ erro: 'Batalha não encontrada.' }, 404);

  if (p.acao === 'entrar') {
    if (!b.jogadores[usuario]) {
      if (Object.keys(b.jogadores).length >= 10) return json({ erro: 'Esta batalha já tem 10 pessoas.' }, 409);
      b.jogadores[usuario] = { nome: await nomeDe(usuario), respostas: b.ids.map(() => null), inicio: Date.now() };
      await salvarJogador(codigo, usuario, b.jogadores[usuario]);
      await lembrar(usuario, codigo);
    }
    return json({ ...b, eu: usuario });
  }

  if (p.acao === 'responder') {
    const j = b.jogadores[usuario];
    const i = Number(p.i);
    if (!j || !Number.isInteger(i) || i < 0 || i >= b.ids.length) return json({ erro: 'Resposta inválida.' }, 400);
    if (j.respostas[i] === null) {
      j.respostas[i] = !!p.certa;
      if (j.respostas.every((r) => r !== null)) j.fim = Date.now();
      await salvarJogador(codigo, usuario, j);
    }
    return json({ ...b, eu: usuario });
  }
  return json({ erro: 'Ação desconhecida.' }, 400);
};

export const config = { path: '/api/batalha' };
