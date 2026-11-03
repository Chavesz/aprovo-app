// /api/mentor: o "mentor com IA" do Aprovô. Conversa, resumo por assunto e leitura do edital (texto, link ou PDF).
// Usa a ANTHROPIC_API_KEY da Netlify e conta as mensagens do dia por conta (plano grátis x pago).
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';
import { json, usuarioDaRequisicao } from '../lib/contas';

// Modelo mais barato que dá conta de explicar questão e montar resumo.
const MODELO = 'claude-haiku-5-5';
const LIMITES = { gratis: 15, pro: 300 } as const;
type Plano = keyof typeof LIMITES;
// Contas com o plano pago liberado à mão enquanto não existe cobrança.
const PRO = new Set(['chavin', 'kaua', 'kaua.chaves']);

const diaBR = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
const uso = () => getStore({ name: 'uso-ia', consistency: 'strong' });

async function planoDe(usuario: string): Promise<Plano> {
  const p = (await getStore({ name: 'planos', consistency: 'strong' }).get(usuario, { type: 'json' })) as { plano?: Plano } | null;
  return p?.plano ?? (PRO.has(usuario) ? 'pro' : 'gratis');
}

async function situacao(usuario: string) {
  const plano = await planoDe(usuario);
  const usadas = Number((await uso().get(`${usuario}:${diaBR()}`)) ?? 0);
  return { plano, usadas, limite: LIMITES[plano] };
}

const SISTEMA = `Você é o Mentor do Aprovô, um professor e coach de concursos públicos brasileiros.
Escreva em português do Brasil, direto e motivador, com frases curtas. Use listas e negrito quando ajudar.
Baseie-se na legislação e doutrina vigentes e cite artigo e número da lei quando houver.
Use o CONTEXTO DO ALUNO (perfil, edital, desempenho e erros recentes) para personalizar: aponte o que ele mais erra,
explique o conceito por trás do erro e termine sempre com um próximo passo concreto no app (ex.: "faça 10 questões de Crase").
Se não souber algo do edital, diga que não sabe em vez de inventar.`;

const SCHEMA_EDITAL = {
  type: 'object',
  additionalProperties: false,
  required: ['concurso', 'cargo', 'banca', 'dataProva', 'disciplinas'],
  properties: {
    concurso: { type: 'string' },
    cargo: { type: 'string' },
    banca: { type: 'string' },
    dataProva: { type: 'string', description: 'AAAA-MM-DD ou vazio se o edital não informar' },
    disciplinas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nome', 'questoes', 'peso', 'assuntos'],
        properties: {
          nome: { type: 'string' },
          questoes: { type: 'number', description: 'quantidade de questões na prova; 0 se não informado' },
          peso: { type: 'number', description: 'peso de cada questão; 1 se não informado' },
          assuntos: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

type Msg = { role: 'user' | 'assistant'; content: string };
type Pedido =
  | { acao: 'uso' }
  | { acao: 'chat'; mensagens: Msg[]; contexto: string }
  | { acao: 'resumo'; disciplina: string; assunto: string; cargo: string; banca: string }
  | { acao: 'edital'; texto?: string; url?: string; pdf?: string };

/** Conteúdo do edital para a IA: texto colado, página/PDF de um link, ou PDF enviado (base64). */
async function conteudoEdital(p: Extract<Pedido, { acao: 'edital' }>): Promise<Anthropic.ContentBlockParam[]> {
  if (p.pdf) return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: p.pdf } }];
  if (p.url) {
    const r = await fetch(p.url, { redirect: 'follow' });
    if (!r.ok) throw new Error(`O link do edital não abriu (${r.status}).`);
    if (r.headers.get('content-type')?.includes('pdf') || /\.pdf($|\?)/i.test(p.url)) {
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length > 25_000_000) throw new Error('O PDF do edital é grande demais. Cole só o conteúdo programático.');
      return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b.toString('base64') } }];
    }
    const html = await r.text();
    return [{ type: 'text', text: html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 80000) }];
  }
  return [{ type: 'text', text: (p.texto ?? '').slice(0, 80000) }];
}

export default async (req: Request) => {
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Sessão expirada. Entre de novo.' }, 401);
  let p: Pedido;
  try {
    p = await req.json();
  } catch {
    return json({ erro: 'Pedido inválido.' }, 400);
  }
  const s = await situacao(usuario);
  if (p.acao === 'uso') return json({ ...s, configurada: !!process.env.ANTHROPIC_API_KEY });
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ erro: 'O Mentor ainda não foi ligado: falta a variável ANTHROPIC_API_KEY na Netlify.', semChave: true }, 501);
  }
  if (s.usadas >= s.limite) {
    return json({ erro: `Você usou as ${s.limite} mensagens do Mentor de hoje. Amanhã libera de novo${s.plano === 'gratis' ? ', ou conheça o plano Pro' : ''}.`, limite: true }, 429);
  }

  const client = new Anthropic();
  try {
    let resposta: Anthropic.Message;
    if (p.acao === 'chat') {
      const mensagens = (p.mensagens ?? []).slice(-12).map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
      if (!mensagens.length || mensagens[mensagens.length - 1].role !== 'user') return json({ erro: 'Escreva sua dúvida.' }, 400);
      resposta = await client.messages.create({
        model: MODELO,
        max_tokens: 1500,
        system: [
          { type: 'text', text: SISTEMA },
          { type: 'text', text: `CONTEXTO DO ALUNO\n${String(p.contexto ?? '').slice(0, 12000)}` },
        ],
        messages: mensagens,
      });
    } else if (p.acao === 'resumo') {
      resposta = await client.messages.create({
        model: MODELO,
        max_tokens: 3000,
        system: SISTEMA,
        messages: [
          {
            role: 'user',
            content: `Faça um resumo de revisão de "${p.assunto}" (${p.disciplina}) para a prova de ${p.cargo} da banca ${p.banca}.
Formato em Markdown: título, os conceitos essenciais em tópicos, uma tabela ou esquema quando couber, as pegadinhas mais cobradas pela banca,
um macete para memorizar e 3 exemplos rápidos com resposta. No máximo 1 página e meia.`,
          },
        ],
      });
    } else if (p.acao === 'edital') {
      const conteudo = await conteudoEdital(p);
      resposta = (await client.messages.create({
        model: MODELO,
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              ...conteudo,
              {
                type: 'text',
                text: `Isto é um edital de concurso (ou parte dele). Extraia o concurso, o cargo, a banca, a data da prova e,
para o cargo, cada disciplina com a quantidade de questões, o peso e os assuntos do conteúdo programático (curtos, no máximo 15 por disciplina).
Se houver vários cargos, use o de nível médio de saúde ou o primeiro listado.`,
              },
            ],
          },
        ],
        output_config: { format: { type: 'json_schema', schema: SCHEMA_EDITAL } },
      } as never)) as Anthropic.Message;
    } else {
      return json({ erro: 'Ação desconhecida.' }, 400);
    }

    if (resposta.stop_reason === 'refusal') return json({ erro: 'O Mentor não pode responder isso. Reformule.' }, 422);
    await uso().set(`${usuario}:${diaBR()}`, String(s.usadas + 1));
    const texto = resposta.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';
    const restante = { usadas: s.usadas + 1, limite: s.limite, plano: s.plano };
    return json(p.acao === 'edital' ? { edital: JSON.parse(texto), ...restante } : { texto, ...restante });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ erro: 'Muitos pedidos agora. Tente em um minuto.' }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ erro: 'A chave da IA na Netlify é inválida.' }, 500);
    if (e instanceof Anthropic.APIError) return json({ erro: `Falha na IA (${e.status}).` }, 502);
    return json({ erro: e instanceof Error ? e.message : 'Não foi possível falar com o Mentor.' }, 502);
  }
};

export const config = { path: '/api/mentor' };
