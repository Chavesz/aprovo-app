// /api/ranking: lista o resumo de todas as contas para o ranking (só para quem está logado).
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';

const diaBR = (t: number) => new Date(t - 3 * 3600_000).toISOString().slice(0, 10);

export default async (req: Request) => {
  const eu = await usuarioDaRequisicao(req);
  if (!eu) return json({ erro: 'Sessão expirada. Entre de novo.' }, 401);
  const store = getStore({ name: 'ranking', consistency: 'strong' });
  const { blobs } = await store.list();
  const hoje = diaBR(Date.now());
  const linhas = await Promise.all(
    blobs.map(async ({ key }) => {
      const r = (await store.get(key, { type: 'json' })) as Record<string, number | string> | null;
      if (!r) return null;
      // Quem não estudou hoje aparece com zero no ranking do dia.
      const outroDia = r.dia !== hoje;
      return {
        usuario: key,
        eu: key === eu,
        nome: String(r.nome),
        total: Number(r.total),
        acertos: Number(r.acertos),
        hoje: outroDia ? 0 : Number(r.hoje),
        acertosHoje: outroDia ? 0 : Number(r.acertosHoje),
        provas: Number(r.provas),
        provasHoje: outroDia ? 0 : Number(r.provasHoje),
      };
    })
  );
  return json(linhas.filter(Boolean));
};

export const config = { path: '/api/ranking' };
