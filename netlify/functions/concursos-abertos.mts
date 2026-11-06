// /api/concursos-abertos?uf=PB: concursos e seleções abertas, lidos do feed RSS público do Concursos no Brasil
// (nacional e por estado). Só título, estado, data e o link para a notícia original; nada do texto é copiado.
// Cache de 1 h no Blobs para não sobrecarregar a fonte.
import { getStore } from '@netlify/blobs';

const UFS = 'ac al am ap ba ce df es go ma mg ms mt pa pb pe pi pr rj rn ro rr rs sc se sp to'.split(' ');
const FONTE = 'https://concursosnobrasil.com';
const HORA = 3600_000;

export interface Aberto { titulo: string; link: string; uf: string; data: string; tipo: 'concurso' | 'selecao'; area: string }

const limpa = (s: string) =>
  s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').trim();

function area(t: string) {
  const s = t.toLowerCase();
  if (/sa[uú]de|enferm|m[eé]dic|agente comunit|endemia|hospital/.test(s)) return 'Saúde';
  if (/educa|professor|escola|ensino/.test(s)) return 'Educação';
  if (/pol[ií]cia|guarda|bombeiro|penal|seguran/.test(s)) return 'Segurança';
  if (/tribunal|tj|trt|tre|minist[eé]rio p[uú]blico|defensoria|justi/.test(s)) return 'Tribunais';
  if (/banco|caixa|inss|receita|federal|ibge|correios/.test(s)) return 'Federais';
  return 'Administrativo';
}

function ler(xml: string): Aberto[] {
  const itens = xml.split('<item>').slice(1);
  return itens
    .map((it) => {
      const titulo = limpa(it.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
      const link = limpa(it.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '');
      const t = Date.parse(limpa(it.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''));
      const data = Number.isFinite(t) ? new Date(t).toISOString() : '';
      const uf = link.match(/\/concursos\/([a-z]{2})\//)?.[1] ?? '';
      return { titulo, link, uf: uf.toUpperCase(), data, tipo: /sele[cç][aã]o|processo seletivo|cadastro|chamada/i.test(titulo) ? 'selecao' : 'concurso', area: area(titulo) } as Aberto;
    })
    .filter((a) => a.titulo && a.uf && a.link.startsWith(FONTE));
}

async function feed(caminho: string) {
  const r = await fetch(`${FONTE}${caminho}`, { headers: { 'user-agent': 'Aprovo/1.0 (+https://aprovoapp.netlify.app)' }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) return [];
  return ler(await r.text());
}

export default async (req: Request) => {
  const uf = (new URL(req.url).searchParams.get('uf') ?? '').toLowerCase();
  const chave = UFS.includes(uf) ? uf : 'br';
  const cache = getStore({ name: 'concursos-abertos' });
  const salvo = (await cache.get(chave, { type: 'json' }).catch(() => null)) as { em: number; lista: Aberto[] } | null;
  let lista = salvo?.lista ?? [];
  if (!salvo || Date.now() - salvo.em > HORA) {
    try {
      const partes = chave === 'br'
        ? await Promise.all(['/feed/', '/feed/?paged=2', '/feed/?paged=3'].map(feed))
        : await Promise.all([`/concursos/${chave}/feed/`, `/concursos/${chave}/feed/?paged=2`].map(feed));
      const vistos = new Set<string>();
      const novos = partes.flat().filter((a) => !vistos.has(a.link) && vistos.add(a.link));
      if (novos.length) {
        lista = novos;
        await cache.setJSON(chave, { em: Date.now(), lista }).catch(() => undefined);
      }
    } catch {
      /* fonte fora do ar: devolve o último cache */
    }
  }
  return new Response(JSON.stringify({ fonte: 'Concursos no Brasil (concursosnobrasil.com)', lista }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=600' },
  });
};

export const config = { path: '/api/concursos-abertos' };
