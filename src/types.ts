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
}

export interface Resposta {
  id: string;
  marcada: string;
  certa: boolean;
  em: number;
  simulado?: boolean;
}

export interface Filtros {
  banca: string;
  orgao: string;
  disciplina: string;
  assunto: string;
  ano: string;
  status: 'todas' | 'ineditas' | 'erradas' | 'revisar';
}
