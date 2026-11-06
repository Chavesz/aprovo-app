// /api/batalha: duelo entre amigos com as mesmas questões.
// POST {acao:'criar', ids:string[], titulo}          → { codigo }
// GET  ?codigo=XXXX                                   → batalha com o placar de todos
// POST {acao:'entrar', codigo}                        → entra (até 10 pessoas)
// POST {acao:'responder', codigo, i, certa}           → registra a resposta i (uma vez por questão)
// POST {acao:'diario', ids}                         → desafio do dia (todos os alunos)
// GET  ?minhas=1                                      → últimas batalhas do aluno e vitórias
import { getStore } from '@netlify/blobs';
import { randomBytes } from 'node:crypto';
import { json, usuarioDaRequisicao } from '../lib/contas';

interface Jogador { nome: string; respostas: (boolean | null)[]; inicio: number; fim?: number }
export interface Batalha { codigo: string; titulo: string; ids: string[]; criador: string; criadaEm: number; jogadores: Record<string, Jogador> }

const pontos = (j: Jogador) => j.respostas.filter((r) => r === true).length;
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
async function carregar(codigo: string, eu = ''): Promise<Batalha | null> {
  const b = (await store().get(codigo, { type: 'json' })) as Batalha | null;
  if (!b) return null;
  if (diaria(codigo)) {
    // Desafio do dia: lê o placar resumido e devolve os 50 melhores + o próprio aluno.
    const pl = ((await store().get(`placar-${codigo}`, { type: 'json' })) as Record<string, Jogador> | null) ?? {};
    const meu = eu ? ((await store().get(`${codigo}:${eu}`, { type: 'json' })) as Jogador | null) : null;
    if (meu) pl[eu] = meu;
    const ord = Object.entries(pl).sort(([, a], [, z]) => pontos(z) - pontos(a) || ((a.fim ?? 9e15) - a.inicio) - ((z.fim ?? 9e15) - z.inicio));
    b.jogadores = Object.fromEntries(ord.filter(([u], i) => i < 50 || u === eu));
    return b;
  }
  const { blobs } = await store().list({ prefix: `${codigo}:` });
  const js = await Promise.all(blobs.map(async (x) => [x.key.slice(codigo.length + 1), await store().get(x.key, { type: 'json' })] as const));
  b.jogadores = Object.fromEntries(js.filter(([, j]) => j)) as Record<string, Jogador>;
  return b;
}
const salvarJogador = async (codigo: string, usuario: string, j: Jogador) => {
  await store().setJSON(`${codigo}:${usuario}`, j);
  if (diaria(codigo)) {
    // Placar resumido do desafio do dia (um blob só): cada resposta regrava a linha do aluno, então uma corrida se corrige na próxima.
    const pl = ((await store().get(`placar-${codigo}`, { type: 'json' })) as Record<string, Jogador> | null) ?? {};
    pl[usuario] = j;
    await store().setJSON(`placar-${codigo}`, pl);
  }
};
const diaria = (codigo: string) => /^D\d{6}$/.test(codigo);

export default async (req: Request) => {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Entre na sua conta para batalhar.' }, 401);
  const url = new URL(req.url);

  if (req.method === 'GET') {
    if (url.searchParams.has('minhas')) {
      const codigos = ((await minhas().get(usuario, { type: 'json' })) as string[] | null) ?? [];
      const lista = (await Promise.all(codigos.map((c) => carregar(c, usuario)))).filter((b): b is Batalha => !!b);
      let vitorias = 0;
      for (const b of lista) {
        const terminados = Object.entries(b.jogadores).filter(([, j]) => j.fim);
        if (terminados.length < 2) continue;
        const melhor = terminados.sort(([, a], [, z]) => pontos(z) - pontos(a) || (a.fim! - a.inicio) - (z.fim! - z.inicio))[0][0];
        if (melhor === usuario) vitorias++;
      }
      return json({ vitorias, lista: lista.map((b) => ({ codigo: b.codigo, titulo: b.titulo, n: b.ids.length, criadaEm: b.criadaEm, jogadores: Object.keys(b.jogadores).length, pendente: !!b.jogadores[usuario] && !b.jogadores[usuario].fim && Date.now() - b.criadaEm < 3 * 86400_000 })) });
    }
    const b = await carregar((url.searchParams.get('codigo') ?? '').toUpperCase(), usuario);
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

  // Desafio do dia: uma batalha aberta a todos, com código fixo da data (D + AAMMDD) e sem limite de pessoas.
  if (p.acao === 'diario') {
    const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(2, 10).replace(/-/g, '');
    const codigo = `D${hoje}`;
    if (!(await store().get(codigo))) {
      const ids = (p.ids ?? []).filter((x) => typeof x === 'string').slice(0, 10);
      if (ids.length < 5) return json({ erro: 'Sem questões para o desafio.' }, 400);
      await store().setJSON(codigo, { codigo, titulo: `Desafio do dia ${hoje.slice(4, 6)}/${hoje.slice(2, 4)}`, ids, criador: 'aprovo', criadaEm: Date.now(), jogadores: {} } satisfies Batalha);
    }
    const b = (await carregar(codigo, usuario))!;
    if (!b.jogadores[usuario]) {
      b.jogadores[usuario] = { nome: await nomeDe(usuario), respostas: b.ids.map(() => null), inicio: Date.now() };
      await salvarJogador(codigo, usuario, b.jogadores[usuario]);
    }
    return json({ ...b, eu: usuario });
  }

  const codigo = String(p.codigo ?? '').toUpperCase();
  const b = await carregar(codigo, usuario);
  if (!b) return json({ erro: 'Batalha não encontrada.' }, 404);

  if (p.acao === 'entrar') {
    if (!b.jogadores[usuario]) {
      if (!/^D\d{6}$/.test(codigo) && Object.keys(b.jogadores).length >= 10) return json({ erro: 'Esta batalha já tem 10 pessoas.' }, 409);
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
      // O tempo conta da primeira resposta, não de quando a pessoa abriu o link.
      if (j.respostas.every((r) => r === null)) j.inicio = Date.now();
      j.respostas[i] = !!p.certa;
      if (j.respostas.every((r) => r !== null)) j.fim = Date.now();
      await salvarJogador(codigo, usuario, j);
    }
    return json({ ...b, eu: usuario });
  }
  return json({ erro: 'Ação desconhecida.' }, 400);
};

export const config = { path: '/api/batalha' };
