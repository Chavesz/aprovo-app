// Netlify Function: organiza editais e gera questões com o Claude.
// Requer a variável de ambiente ANTHROPIC_API_KEY no painel da Netlify.
import Anthropic from '@anthropic-ai/sdk';

const MODELO = 'claude-opus-5-5';
const LIMITE_TEXTO = 60000;

const SCHEMA_EDITAL = {
  type: 'object',
  additionalProperties: false,
  required: ['concurso', 'disciplinas'],
  properties: {
    concurso: {
      type: 'object',
      additionalProperties: false,
      required: ['nome', 'banca', 'orgao', 'cargo'],
      properties: {
        nome: { type: 'string' },
        banca: { type: 'string' },
        orgao: { type: 'string' },
        cargo: { type: 'string' },
      },
    },
    disciplinas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nome', 'assuntos'],
        properties: { nome: { type: 'string' }, assuntos: { type: 'array', items: { type: 'string' } } },
      },
    },
  },
};

const SCHEMA_QUESTOES = {
  type: 'object',
  additionalProperties: false,
  required: ['questoes'],
  properties: {
    questoes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['enunciado', 'comando', 'alternativas', 'gabarito', 'comentario'],
        properties: {
          enunciado: { type: 'string' },
          comando: { type: 'string' },
          alternativas: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['letra', 'texto'],
              properties: { letra: { type: 'string' }, texto: { type: 'string' } },
            },
          },
          gabarito: { type: 'string' },
          comentario: { type: 'string' },
        },
      },
    },
  },
};

const SISTEMA = `Você é um professor especialista em concursos públicos brasileiros.
Escreva sempre em português do Brasil, com linguagem de prova.
Baseie-se na legislação e doutrina vigentes; quando citar lei, cite artigo e número.
Nunca copie questões de sites como QConcursos ou TEC Concursos: crie questões originais.`;

type Pedido =
  | { acao: 'edital'; texto: string }
  | {
      acao: 'questoes';
      concurso: { banca: string; orgao: string; cargo: string };
      disciplina: string;
      assunto: string;
      quantidade: number;
      dificuldade: 'facil' | 'media' | 'dificil';
      formato: 'multipla' | 'certo-errado';
    };

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } });

function montar(p: Pedido): { prompt: string; schema: object } {
  if (p.acao === 'edital') {
    return {
      schema: SCHEMA_EDITAL,
      prompt: `O texto abaixo é um edital de concurso, um trecho do conteúdo programático ou um pedido falado pelo aluno (pode ter erros de transcrição de voz).
Identifique o concurso (nome, banca, órgão e cargo; use "Não informado" quando não houver) e organize o conteúdo em disciplinas, cada uma com assuntos curtos e específicos (no máximo 15 por disciplina).
Se for só um pedido como "quero estudar português e direito constitucional para o INSS", proponha os assuntos mais cobrados dessas disciplinas para esse concurso.

<texto>
${p.texto.slice(0, LIMITE_TEXTO)}
</texto>`,
    };
  }
  const n = Math.max(1, Math.min(10, Math.round(p.quantidade)));
  const nivel = { facil: 'fácil', media: 'média', dificil: 'difícil' }[p.dificuldade] ?? 'média';
  const formato =
    p.formato === 'certo-errado'
      ? 'no estilo certo ou errado (alternativas "C" com texto "Certo" e "E" com texto "Errado")'
      : 'de múltipla escolha com 5 alternativas (A a E) e só uma correta';
  return {
    schema: SCHEMA_QUESTOES,
    prompt: `Crie ${n} questões inéditas ${formato}, de dificuldade ${nivel}, no estilo da banca ${p.concurso.banca}, para o cargo de ${p.concurso.cargo} (${p.concurso.orgao}).
Disciplina: ${p.disciplina}
Assunto: ${p.assunto}

Regras:
- "enunciado" traz o contexto (texto-base, caso ou situação); pode ser curto quando a questão for direta.
- "comando" é a pergunta ou a afirmação a julgar.
- Varie a letra do gabarito entre as questões.
- "comentario" explica por que a correta está certa e por que cada errada está errada, citando a base legal quando houver.`,
  };
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ erro: 'A IA ainda não foi configurada: falta a variável ANTHROPIC_API_KEY na Netlify.' }, 501);
  }

  let pedido: Pedido;
  try {
    pedido = await req.json();
  } catch {
    return json({ erro: 'Pedido inválido.' }, 400);
  }
  if (pedido.acao === 'edital' && !pedido.texto?.trim()) return json({ erro: 'Escreva ou dite o edital primeiro.' }, 400);
  if (pedido.acao !== 'edital' && pedido.acao !== 'questoes') return json({ erro: 'Ação desconhecida.' }, 400);

  const { prompt, schema } = montar(pedido);
  const client = new Anthropic();

  try {
    const resposta = await client.beta.messages.create({
      model: MODELO,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      // Se o modelo recusar, a API refaz o pedido num modelo alternativo.
      fallbacks: 'default',
      system: SISTEMA,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: prompt }],
    } as never);

    const msg = resposta as unknown as Anthropic.Message;
    if (msg.stop_reason === 'refusal') return json({ erro: 'A IA recusou esse pedido. Reformule o texto.' }, 422);
    if (msg.stop_reason === 'max_tokens') return json({ erro: 'Resposta longa demais. Peça menos questões.' }, 422);
    const texto = msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';
    return json(JSON.parse(texto));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ erro: 'Muitos pedidos agora. Tente em um minuto.' }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ erro: 'Chave da IA inválida.' }, 500);
    if (e instanceof Anthropic.APIError) return json({ erro: `Falha na IA (${e.status}).` }, 502);
    return json({ erro: 'Não foi possível ler a resposta da IA.' }, 502);
  }
};

export const config = { path: '/api/ia' };
