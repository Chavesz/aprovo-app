// Função agendada (segundas, 8h de Brasília): avisa por e-mail quem escolheu uma cidade no radar de concursos
// quando o diário oficial dela publicou algo com "concurso" e "edital" desde o último aviso (API pública do Querido Diário).
// Não faz nada enquanto o e-mail estiver desligado (ver netlify/lib/email.ts).
import { getStore } from '@netlify/blobs';
import { alertaConcursos, emailLigado, emails, enviarEmail, type Contato } from '../lib/email';

const QD = 'https://api.queridodiario.org.br';
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const diaBR = (t = Date.now()) => new Date(t - 3 * 3600_000).toISOString().slice(0, 10);
const lerJSON = (v: unknown) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };

async function territorio(cidade: string, uf: string) {
  const r = await fetch(`${QD}/cities?city_name=${encodeURIComponent(cidade)}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) return null;
  const d = (await r.json()) as { cities?: { territory_id: string; territory_name: string; state_code: string }[] };
  return d.cities?.find((c) => c.state_code === uf && semAcento(c.territory_name) === semAcento(cidade)) ?? null;
}

export default async () => {
  if (!emailLigado()) return new Response('e-mail desligado');
  const progresso = getStore({ name: 'progresso', consistency: 'strong' });
  const usuarios = getStore({ name: 'usuarios', consistency: 'strong' });
  const cache = new Map<string, { data: string; url: string; trecho: string }[]>();
  const { blobs } = await emails().list();
  let enviados = 0;
  for (const b of blobs) {
    const c = (await emails().get(b.key, { type: 'json' })) as Contato | null;
    if (!c?.optin) continue;
    const dados = ((await progresso.get(b.key, { type: 'json' })) ?? {}) as Record<string, unknown>;
    const cidade = String(lerJSON(dados['cq:radar-cidade']) ?? ''), uf = String(lerJSON(dados['cq:radar-uf']) ?? '');
    if (!cidade || !uf) continue;
    const desde = c.ultimoAlerta ?? diaBR(Date.now() - 7 * 86400_000);
    const chave = `${uf}|${semAcento(cidade)}|${desde}`;
    if (!cache.has(chave)) {
      const t = await territorio(cidade, uf).catch(() => null);
      let itens: { data: string; url: string; trecho: string }[] = [];
      if (t) {
        const q = new URLSearchParams({ querystring: 'concurso + edital', published_since: desde, size: '5', excerpt_size: '300', number_of_excerpts: '1', sort_by: 'descending_date', territory_ids: t.territory_id });
        const d = (await fetch(`${QD}/gazettes?${q}`, { signal: AbortSignal.timeout(20000) }).then((r) => r.json()).catch(() => ({}))) as { gazettes?: { date: string; url: string; excerpts?: string[] }[] };
        itens = (d.gazettes ?? []).map((g) => ({ data: g.date.split('-').reverse().join('/'), url: g.url.replace(/^s3:\/\/[^/]+\/+/, 'https://data.queridodiario.ok.org.br/'), trecho: (g.excerpts?.[0] ?? '').replace(/\s+/g, ' ') }));
      }
      cache.set(chave, itens);
    }
    const itens = cache.get(chave)!;
    if (!itens.length) continue;
    const nome = ((await usuarios.get(b.key, { type: 'json' })) as { nome?: string } | null)?.nome ?? 'Oi';
    if (await enviarEmail(c.email, `📢 Concurso no diário oficial de ${cidade}`, alertaConcursos(b.key, nome, `${cidade}/${uf}`, itens))) {
      await emails().setJSON(b.key, { ...c, ultimoAlerta: diaBR() });
      enviados++;
    }
  }
  return new Response(`${enviados} alertas`);
};

export const config = { schedule: '0 11 * * 1' };
