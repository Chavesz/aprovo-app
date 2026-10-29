// /api/progresso: guarda e devolve o progresso (histórico, marcadas, editais...) de cada conta.
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';

const LIMITE = 4_000_000; // ~4 MB por conta

interface Resp {
  id: string;
  certa: boolean;
  em: number;
  simulado?: boolean;
}

/** Data (AAAA-MM-DD) no horário de Brasília. */
const diaBR = (t: number) => new Date(t - 3 * 3600_000).toISOString().slice(0, 10);

/** Guarda o resumo usado no ranking: totais, o dia de hoje e as provas completas (simulados com 30+ questões). */
async function atualizarRanking(usuario: string, historico: Resp[]) {
  if (!Array.isArray(historico)) return;
  const conta = (await getStore({ name: 'usuarios', consistency: 'strong' }).get(usuario, { type: 'json' })) as {
    nome?: string;
  } | null;
  const hoje = diaBR(Date.now());
  const deHoje = historico.filter((h) => diaBR(h.em) === hoje);
  const sessoes = new Map<number, Resp[]>();
  historico.filter((h) => h.simulado).forEach((h) => sessoes.set(h.em, [...(sessoes.get(h.em) ?? []), h]));
  const provas = Array.from(sessoes.values()).filter((s) => s.length >= 30);
  await getStore({ name: 'ranking', consistency: 'strong' }).setJSON(usuario, {
    nome: conta?.nome ?? usuario,
    total: historico.length,
    acertos: historico.filter((h) => h.certa).length,
    dia: hoje,
    hoje: deHoje.length,
    acertosHoje: deHoje.filter((h) => h.certa).length,
    provas: provas.length,
    provasHoje: provas.filter((s) => diaBR(s[0].em) === hoje).length,
    atualizadoEm: Date.now(),
  });
}

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
    await atualizarRanking(usuario, JSON.parse(texto)['cq:historico'] ?? []);
    return json({ ok: true, salvoEm: Date.now() });
  }
  return json({ erro: 'Método não permitido.' }, 405);
};

export const config = { path: '/api/progresso' };
