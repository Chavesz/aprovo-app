// Netlify Function: organiza editais e gera questões com o Claude.
// Requer a variável de ambiente ANTHROPIC_API_KEY no painel da Netlify.
import Anthropic from '@anthropic-ai/sdk';
import { usuarioDaRequisicao } from '../lib/contas';
import { registrarUso, situacao } from '../lib/uso';

// Modelo barato: gerar questão e organizar edital não precisam do maior modelo.
const MODELO = 'claude-haiku-5-5';
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

const SCHEMA_COMENTARIO = {
  type: 'object', additionalProperties: false, required: ['comentario', 'baseLegal'],
  properties: { comentario: { type: 'string' }, baseLegal: { type: 'array', items: { type: 'string' } } },
};

type Pedido =
  | { acao: 'edital'; texto: string }
  | { acao: 'comentar'; banca: string; disciplina: string; enunciado: string; alternativas: string; gabarito: string }
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
  if (p.acao === 'comentar') {
    return {
      schema: SCHEMA_COMENTARIO,
      prompt: `Comente esta questão de concurso (${p.banca}, ${p.disciplina}). O gabarito oficial é ${p.gabarito}; não o contradiga.
Explique em até 180 palavras por que a correta está certa e o erro de cada alternativa errada. Termine com uma dica para não errar de novo.
Em "baseLegal", liste os dispositivos que fundamentam a resposta (ex.: "CF/88, art. 37, II"; "Lei 8.112/90, art. 20"). Lista vazia se não houver base legal; nunca invente artigo.

<questao>
${p.enunciado.slice(0, 4000)}
${p.alternativas.slice(0, 3000)}
</questao>`,
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
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Sessão expirada. Entre de novo.' }, 401);
  const uso = await situacao(usuario);
  if (uso.usadas >= uso.limite) return json({ erro: `Você usou as ${uso.limite} chamadas de IA de hoje. Amanhã libera de novo.` }, 429);
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
  if (pedido.acao === 'comentar' && !pedido.enunciado?.trim()) return json({ erro: 'Questão vazia.' }, 400);
  if (pedido.acao !== 'edital' && pedido.acao !== 'questoes' && pedido.acao !== 'comentar') return json({ erro: 'Ação desconhecida.' }, 400);

  const { prompt, schema } = montar(pedido);
  const client = new Anthropic();

  try {
    const resposta = await client.messages.create({
      model: MODELO,
      max_tokens: 16000,
      system: SISTEMA,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: prompt }],
    } as never);

    const msg = resposta as unknown as Anthropic.Message;
    await registrarUso(usuario, uso.usadas, pedido.acao === 'comentar' ? 1 : 2);
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
