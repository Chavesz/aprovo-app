// Gera public/data/oab.json com as questões da 1ª fase do Exame de Ordem (OAB), 2010 a 2018.
// Fonte: dataset eduagarcia/oab_exams (Hugging Face), derivado do repositório legal-nlp/oab-exams (licença MIT).
// Uso: node scripts/build-oab.cjs
const https = require('https');
const fs = require('fs');
const path = require('path');

const URL_BASE = 'https://datasets-server.huggingface.co/rows?dataset=eduagarcia/oab_exams&config=default&split=train';

const DISCIPLINAS = {
  ETHICS: 'Ética Profissional',
  PHILOSOPHY: 'Filosofia do Direito',
  CONSTITUTIONAL: 'Direito Constitucional',
  'HUMAN-RIGHTS': 'Direitos Humanos',
  INTERNATIONAL: 'Direito Internacional',
  TAXES: 'Direito Tributário',
  ADMINISTRATIVE: 'Direito Administrativo',
  ENVIRONMENTAL: 'Direito Ambiental',
  CIVIL: 'Direito Civil',
  CHILDREN: 'Direito da Criança e do Adolescente',
  CONSUMER: 'Direito do Consumidor',
  BUSINESS: 'Direito Empresarial',
  'CIVIL-PROCEDURE': 'Direito Processual Civil',
  CRIMINAL: 'Direito Penal',
  'CRIMINAL-PROCEDURE': 'Direito Processual Penal',
  LABOUR: 'Direito do Trabalho',
  'LABOUR-PROCEDURE': 'Direito Processual do Trabalho',
};

// Palavras-chave para desempatar a disciplina das provas que vieram sem rótulo no dataset.
const PISTAS = {
  ETHICS: /advogad|\bOAB\b|Estatuto da Advocacia|Código de Ética|honorários|estagiári|Conselho Seccional/gi,
  PHILOSOPHY: /filósof|filosof|Kelsen|Aristóteles|Hart\b|Bobbio|Kant|Dworkin|Rawls|Platão|Hobbes|Rousseau/gi,
  CONSTITUTIONAL: /Constituição|constitucional|emenda|\bADI\b|ADPF|Presidente da República|Congresso Nacional|Senado|Assembleia Legislativa/gi,
  'HUMAN-RIGHTS': /direitos humanos|Convenção Americana|Corte Interamericana|Comissão Interamericana|Pacto Internacional|Declaração Universal|\bONU\b/gi,
  INTERNATIONAL: /internacional|tratado|estrangeir|LINDB|Lei de Introdução|extradição|Haia|Mercosul|carta rogatória/gi,
  TAXES: /tribut|imposto|ICMS|\bIPI\b|\bISS\b|IPTU|contribuinte|fisco|\bCTN\b|taxa|lançamento/gi,
  ADMINISTRATIVE: /administrativ|licitação|servidor público|concessão|autarquia|improbidade|agente público|desapropriação/gi,
  ENVIRONMENTAL: /ambient|licenciamento|poluição|fauna|flora|Ibama|unidade de conservação|resíduos/gi,
  CIVIL: /contrato|herança|casamento|posse|propriedade|Código Civil|usucapião|obrigaç|testamento|sucessão|locação|condomínio|divórcio/gi,
  CHILDREN: /criança|adolescente|\bECA\b|Conselho Tutelar|adoção|ato infracional/gi,
  CONSUMER: /consumidor|fornecedor|\bCDC\b|Código de Defesa do Consumidor/gi,
  BUSINESS: /sociedade|empresári|falência|recuperação judicial|título de crédito|cheque|duplicata|nota promissória|quotas|acionista|Ltda/gi,
  'CIVIL-PROCEDURE': /Código de Processo Civil|\bCPC\b|apelação|petição inicial|agravo|tutela|cumprimento de sentença|embargos|citação|contestação/gi,
  CRIMINAL: /crime|Código Penal|dolo|culpos|homicídio|furto|roubo|estelionato|reclusão|detenção|tentativa|legítima defesa/gi,
  'CRIMINAL-PROCEDURE': /Código de Processo Penal|inquérito|denúncia|prisão preventiva|flagrante|ação penal|júri|habeas corpus|queixa-crime/gi,
  LABOUR: /empregad|empregador|\bCLT\b|férias|salári|jornada|contrato de trabalho|rescisão|aviso prévio|FGTS|horas extras/gi,
  'LABOUR-PROCEDURE': /reclamação trabalhista|Vara do Trabalho|\bTST\b|\bTRT\b|recurso ordinário|reclamante|reclamad|recurso de revista|Justiça do Trabalho/gi,
};

// Assunto por palavras-chave dentro de cada disciplina (heurística, documentada no README).
const ASSUNTOS = {
  'Ética Profissional': [
    ['Honorários advocatícios', /honorári/i],
    ['Infrações e sanções disciplinares', /infraç|sanç|disciplinar|suspensão|exclusão|censura/i],
    ['Inscrição na OAB', /inscriç|estagiári/i],
    ['Sociedade de advogados', /sociedade de advogados|sociedade individual/i],
    ['Prerrogativas e mandato', /prerrogativ|mandato|procuração|sigilo|renúncia/i],
  ],
  'Direito Constitucional': [
    ['Controle de constitucionalidade', /\bADI\b|\bADC\b|ADPF|controle|inconstitucional/i],
    ['Direitos e garantias fundamentais', /fundamenta|habeas|mandado de segurança|mandado de injunção/i],
    ['Organização do Estado', /Município|Estado-membro|União|competência|Distrito Federal|intervenção/i],
    ['Poder Legislativo', /Congresso|Senado|Câmara|projeto de lei|emenda|medida provisória|CPI/i],
    ['Poder Judiciário e funções essenciais', /Judiciário|STF|STJ|juiz|Ministério Público|Defensoria/i],
  ],
  'Direito Administrativo': [
    ['Licitações e contratos', /licitaç|pregão|contrato administrativo|concorrência/i],
    ['Agentes públicos', /servidor|agente público|cargo|concurso|estabilidade/i],
    ['Improbidade administrativa', /improbidade/i],
    ['Atos administrativos', /ato administrativo|anulação|revogação|poder de polícia/i],
    ['Organização da Administração', /autarquia|empresa pública|sociedade de economia mista|fundação|consórcio/i],
    ['Responsabilidade civil do Estado', /responsabilidade|indeniz/i],
    ['Bens, intervenção e serviços públicos', /desapropria|tombamento|concessão|permissão|bem público/i],
  ],
  'Direito Civil': [
    ['Família', /casamento|divórcio|união estável|alimentos|filho|guarda/i],
    ['Sucessões', /herança|testamento|sucess|herdeir|inventário/i],
    ['Contratos', /contrato|compra e venda|locação|doação|fiança/i],
    ['Direitos reais', /posse|propriedade|usucapião|hipoteca|condomínio|servidão/i],
    ['Responsabilidade civil', /responsabilidade|dano|indeniz/i],
    ['Obrigações', /obrigaç|pagamento|credor|devedor/i],
    ['Parte geral', /prescrição|decadência|capacidade|negócio jurídico|personalidade/i],
  ],
  'Direito Processual Civil': [
    ['Recursos', /recurso|apelação|agravo|embargos de declaração/i],
    ['Execução e cumprimento de sentença', /execução|cumprimento de sentença|penhora/i],
    ['Tutelas provisórias', /tutela|liminar|urgência|evidência/i],
    ['Procedimento comum', /petição inicial|contestação|citação|audiência|prova|sentença/i],
    ['Competência e partes', /competência|litisconsórcio|intervenção de terceiros|legitimidade/i],
  ],
  'Direito Penal': [
    ['Crimes contra o patrimônio', /furto|roubo|estelionato|extorsão|receptação|apropriação/i],
    ['Crimes contra a pessoa', /homicídio|lesão corporal|aborto|infanticídio/i],
    ['Crimes contra a Administração', /peculato|corrupção|concussão|prevaricação/i],
    ['Teoria do crime', /dolo|culpa|tentativa|legítima defesa|estado de necessidade|erro|consumação/i],
    ['Teoria da pena', /pena|dosimetria|regime|prescrição|substituição|sursis|livramento/i],
  ],
  'Direito Processual Penal': [
    ['Prisões e liberdade provisória', /prisão|fiança|liberdade provisória|cautelar/i],
    ['Tribunal do Júri', /júri|jurados|pronúncia/i],
    ['Recursos e ações autônomas', /recurso|apelação|habeas corpus|revisão criminal|em sentido estrito/i],
    ['Inquérito e ação penal', /inquérito|denúncia|queixa|ação penal/i],
    ['Provas', /prova|testemunha|interrogatório|perícia/i],
  ],
  'Direito do Trabalho': [
    ['Jornada e remuneração', /jornada|horas extras|salári|adicional|intervalo|remuneração/i],
    ['Extinção do contrato', /rescisão|dispensa|justa causa|aviso prévio|FGTS/i],
    ['Férias, licenças e estabilidade', /férias|licença|afastamento|estabilidade|gestante/i],
    ['Relação de emprego', /vínculo|terceiriz|doméstic|contrato de trabalho|aprendiz/i],
  ],
  'Direito Processual do Trabalho': [
    ['Recursos trabalhistas', /recurso|agravo|revista|embargos/i],
    ['Execução trabalhista', /execução|penhora/i],
    ['Audiência e procedimento', /audiência|reclamação|revelia|rito|sumaríssimo|prova/i],
  ],
  'Direito Tributário': [
    ['Impostos em espécie', /ICMS|\bIPI\b|\bISS\b|IPTU|ITBI|ITCMD|IPVA|imposto de renda/i],
    ['Crédito tributário', /lançamento|crédito tributário|prescrição|decadência|suspensão|extinção|exclusão/i],
    ['Limitações ao poder de tributar', /imunidade|anterioridade|legalidade|isonomia|confisco/i],
    ['Espécies tributárias', /taxa|contribuição|empréstimo compulsório/i],
  ],
  'Direito Empresarial': [
    ['Falência e recuperação', /falência|recuperação/i],
    ['Títulos de crédito', /cheque|duplicata|nota promissória|letra de câmbio|título de crédito|endosso|aval/i],
    ['Direito societário', /sociedade|sócio|quotas|acionista|Ltda|assembleia/i],
  ],
};

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function baixar() {
  const linhas = [];
  for (let offset = 0; ; offset += 100) {
    let r = {};
    for (let tent = 0; tent < 6 && !Array.isArray(r.rows); tent++) {
      if (tent) await new Promise((ok) => setTimeout(ok, 3000 * tent));
      r = await get(`${URL_BASE}&offset=${offset}&length=100`).catch(() => ({}));
    }
    if (!Array.isArray(r.rows)) throw new Error('Falha ao baixar o dataset da OAB');
    linhas.push(...r.rows.map((x) => x.row));
    if (r.rows.length < 100) break;
  }
  return linhas;
}

const norm = (t) => (t === 'PHILOSHOPY' ? 'PHILOSOPHY' : t);

/** Para cada número de questão, as disciplinas que aparecem nessa posição nas provas rotuladas de 80 questões. */
function mapaDePosicoes(linhas) {
  const m = new Map();
  for (const q of linhas) {
    if (!q.question_type || q.exam_id < '2013-10') continue;
    const c = m.get(q.question_number) ?? new Map();
    const t = norm(q.question_type);
    c.set(t, (c.get(t) ?? 0) + 1);
    m.set(q.question_number, c);
  }
  return m;
}

function classificar(q, posicoes) {
  const cand = posicoes.get(q.question_number);
  if (!cand) return null;
  const texto = `${q.question} ${q.choices.text.join(' ')}`;
  let melhor = null;
  let nota = -1;
  for (const [tipo, freq] of cand) {
    const n = (texto.match(PISTAS[tipo]) ?? []).length * 10 + freq;
    if (n > nota) {
      nota = n;
      melhor = tipo;
    }
  }
  return melhor;
}

function assuntoDe(disciplina, texto) {
  for (const [nome, re] of ASSUNTOS[disciplina] ?? []) if (re.test(texto)) return nome;
  return 'Geral';
}

const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV'];

function rotuloExame(examId) {
  // exam_id = "AAAA-NN" (número do Exame Unificado); o sufixo "a" marca a reaplicação.
  const numero = examId.split('-')[1];
  return `OAB ${ROMANOS[parseInt(numero, 10)]} Exame${numero.endsWith('a') ? ' (reaplicação)' : ''}`;
}

(async () => {
  const linhas = await baixar();
  const posicoes = mapaDePosicoes(linhas);

  // Validação: classifica as questões rotuladas como se não tivessem rótulo e mede o acerto.
  const rotuladas = linhas.filter((q) => q.question_type && q.exam_id >= '2013-10');
  const certas = rotuladas.filter((q) => classificar(q, posicoes) === norm(q.question_type)).length;
  console.log(`validação da classificação: ${certas}/${rotuladas.length}`);

  let inferidas = 0;
  const saida = linhas
    .filter((q) => !q.nullified && q.choices.text.length >= 2 && q.answerKey)
    .map((q) => {
      let tipo = q.question_type && norm(q.question_type);
      if (!tipo) {
        tipo = classificar(q, posicoes);
        inferidas++;
      }
      const disciplina = DISCIPLINAS[tipo] ?? 'Direito (geral)';
      const texto = q.question.trim();
      return {
        id: `oab-${q.id}`,
        // O I Exame Unificado (2010.1) foi aplicado pelo CESPE; a FGV assumiu a partir do II Exame (2010.2).
        banca: q.exam_id === '2010-01' ? 'Cebraspe' : 'FGV',
        orgao: 'OAB',
        prova: rotuloExame(q.exam_id),
        ano: parseInt(q.exam_year, 10),
        numero: q.question_number,
        disciplina,
        assunto: assuntoDe(disciplina, texto),
        enunciado: texto,
        comando: '',
        alternativas: q.choices.label.map((letra, i) => ({ letra, texto: q.choices.text[i].trim() })),
        gabarito: q.answerKey,
      };
    });

  fs.writeFileSync(path.join(__dirname, '..', 'public', 'data', 'oab.json'), JSON.stringify(saida));
  console.log(`total ${saida.length} questões (${inferidas} com disciplina inferida)`);
})();
