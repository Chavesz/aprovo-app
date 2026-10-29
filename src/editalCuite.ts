import type { Edital } from './types';

/** Edital de Agente de Combate às Endemias de Cuité de Mamanguape (EDUCA PB, prova em 01/11/2026). */
export const EDITAL_CUITE: Edital = {
  id: 'ed-ace-cuite-2026',
  nome: 'ACE Cuité de Mamanguape 2026',
  banca: 'EDUCA PB',
  orgao: 'Prefeitura de Cuité de Mamanguape (PB)',
  cargo: 'Agente de Combate às Endemias',
  criadoEm: Date.UTC(2026, 9, 29),
  disciplinas: [
    {
      nome: 'Português',
      assuntos: [
        'Interpretação de texto', 'Inferência', 'Argumentação', 'Tipologia textual', 'Gêneros textuais', 'Coesão',
        'Conectores', 'Pronomes demonstrativos', 'Figuras de linguagem', 'Sinônimos e antônimos', 'Homônimos e parônimos',
        'Classes de palavras', 'Formação de palavras', 'Termos da oração', 'Tipos de predicado', 'Coordenação',
        'Subordinação', 'Funções do QUE', 'Funções do SE', 'Concordância verbal', 'Concordância nominal', 'Regência',
        'Crase', 'Pontuação', 'Ortografia', 'Acentuação', 'Ortoépia e prosódia', 'Tempos e modos verbais',
        'Tempos compostos', 'Colocação pronominal', 'Reescrita', 'Variação linguística',
      ],
    },
    {
      nome: 'Informática',
      assuntos: [
        'Hardware', 'Periféricos', 'Software', 'Sistemas operacionais', 'Atalhos do Windows', 'Topologias de rede',
        'Ethernet e Wi-Fi', 'OSI, TCP/IP e IP', 'Protocolos', 'Firewall, antivírus e VPN', 'Malware e golpes', 'Word',
        'Excel', 'PowerPoint', 'Nuvem', 'Navegadores e busca', 'Banco de dados', 'LGPD', 'Licenças de software',
      ],
    },
    {
      nome: 'Conhecimentos Gerais',
      assuntos: [
        'Dados de Cuité', 'Histórico de Cuité', 'Lei Orgânica de Cuité', 'História da Paraíba', 'Geografia da Paraíba',
        'Autores paraibanos', 'Brasil', 'Economia', 'Política monetária', 'Globalização e Mercosul', 'ODS e Agenda 2030',
        'Clima e desertificação', 'Leis ambientais', 'Atualidades', 'Previdência e programas sociais',
        'Tecnologia e fake news', 'Diversidade e inclusão',
      ],
    },
    {
      nome: 'Saúde Pública',
      assuntos: [
        'CF: Saúde', 'Lei 8.080', 'Lei 8.142', 'Princípios do SUS', 'Decreto 7.508', 'NOB 96', 'Pacto pela Saúde',
        'Lei 14.129', 'Portaria 1.604 (PNAES)', 'CNS 553', 'Portaria 104 (notificação)', 'Sistemas de informação',
        'Vigilâncias', 'Epidemiologia', 'Níveis de prevenção', 'Indicadores', 'Endemia, epidemia e surto',
      ],
    },
    {
      nome: 'Específicos ACE',
      assuntos: [
        'Lei 11.350', 'Lei 13.301', 'Lei 15.211 (ECA Digital)', 'Ética e sigilo', 'Manejo integrado de vetores',
        'Visita domiciliar', 'Reconhecimento geográfico', 'LIRAa, IIP e Breteau', 'Ponto estratégico', 'Tipos de depósito',
        'Entomologia', 'Captura de vetores', 'Aedes aegypti', 'Anopheles', 'Flebotomíneo', 'Barbeiro', 'Culex', 'Dengue',
        'Zika', 'Chikungunya', 'Febre amarela', 'Malária', 'Leishmanioses', 'Doença de Chagas', 'Tuberculose',
        'Hanseníase', 'Leptospirose', 'Esquistossomose', 'Filariose', 'Roedores e reservatórios', 'Métodos de controle',
        'Larvicidas e adulticidas', 'Focal, perifocal e UBV', 'Toxicologia e EPI', 'Tratamento da água',
        'Esgoto e resíduos', 'Promoção e prevenção', 'Vacinação', 'Educação em saúde', 'Primeiros socorros',
        'Animais peçonhentos',
      ],
    },
  ],
};
