export interface Alternativa {
  letra: string;
  texto: string;
  imagem?: string;
}

export interface Questao {
  id: string;
  banca: string;
  orgao: string;
  prova: string;
  ano: number;
  numero: number;
  disciplina: string;
  assunto: string;
  idioma?: string;
  enunciado: string;
  comando: string;
  alternativas: Alternativa[];
  gabarito: string;
  comentario?: string;
  /** Questão criada pela IA a partir de um edital do aluno. */
  ia?: boolean;
  /** O ponto a revisar quando a pessoa erra. */
  revisar?: string;
  /** Dica curta para memorizar. */
  macete?: string;
}

export interface Resposta {
  id: string;
  marcada: string;
  certa: boolean;
  em: number;
  simulado?: boolean;
}

/** Resultado de um simulado entregue. */
export interface ProvaFeita {
  em: number;
  /** Questões anuladas (enunciado incompleto) que já valeram ponto nesta prova. */
  anuladas?: string[];
  /** Prova no estilo da banca (nota de 0 a 100) ou simulado livre. */
  estilo: boolean;
  acertos: number;
  total: number;
  respondidas: number;
  nota: number;
  max: number;
  materias?: { nome: string; a: number; total: number; pontos: number; max: number }[];
}

export interface Filtros {
  banca: string;
  orgao: string;
  disciplina: string;
  assunto: string;
  ano: string;
  status: 'todas' | 'ineditas' | 'erradas' | 'revisar' | 'bloco' | 'inteligente';
}

export interface Edital {
  id: string;
  nome: string;
  banca: string;
  orgao: string;
  cargo: string;
  disciplinas: { nome: string; assuntos: string[] }[];
  criadoEm: number;
}
