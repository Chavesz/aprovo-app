// Gera public/data/questoes.json a partir da API pública enem.dev (provas oficiais do INEP).
// Uso: node scripts/build-bank.cjs
const https = require('https');
const fs = require('fs');
const path = require('path');

const YEARS = [2019, 2020, 2021, 2022, 2023];
const DISC = {
  'ciencias-humanas': 'Ciências Humanas',
  'ciencias-natureza': 'Ciências da Natureza',
  linguagens: 'Linguagens',
  matematica: 'Matemática',
};
// Classificação automática de assunto por palavras-chave (heurística, documentada no README)
const TOPICS = {
  matematica: [
    ['Porcentagem e juros', /porcent|%|juros|desconto|acréscimo|lucro/i],
    ['Estatística', /média|mediana|moda|desvio|gráfico|tabela/i],
    ['Probabilidade e contagem', /probabilidade|chance|sorte|combina|arranjo|permuta/i],
    ['Geometria', /área|volume|ângulo|triângulo|círculo|cilindro|cubo|prisma|esfera|perímetro|cone|pirâmide/i],
    ['Funções', /função|gráfico de|parábola|exponencial|logarit/i],
    ['Razão e proporção', /escala|razão|proporç|velocidade|consumo/i],
  ],
  'ciencias-natureza': [
    ['Ecologia e meio ambiente', /ecossistema|ambient|poluiç|espécie|cadeia alimentar|bioma/i],
    ['Genética e biologia celular', /gene|dna|célula|cromoss|herança|mutação|proteína/i],
    ['Química orgânica', /carbono|orgânic|etanol|polímero|hidrocarboneto|éster/i],
    ['Química geral', /reação|mol|solução|ph|ácido|base|oxida|átomo|íon/i],
    ['Eletricidade', /elétric|corrente|resistor|tensão|circuito|lâmpada/i],
    ['Mecânica e energia', /velocidade|força|energia|aceleração|movimento|massa|pressão/i],
    ['Ondas e óptica', /onda|som|luz|lente|espelho|frequência/i],
    ['Saúde humana', /doença|vírus|bactéria|vacina|saúde|hormônio/i],
  ],
  'ciencias-humanas': [
    ['Geografia', /clima|relevo|urban|território|agricult|população|migraç|cartogra|globaliza/i],
    ['Filosofia e sociologia', /filósof|filosof|sociedade|kant|platão|aristóteles|marx|weber|durkheim|ética/i],
    ['Brasil Colônia e Império', /colôni|escravi|império|sesmaria|bandeirante/i],
    ['Brasil República', /república|vargas|ditadura|constituição|militar/i],
    ['História geral', /idade média|feudal|revolução|guerra|grécia|roma|iluminismo/i],
  ],
  linguagens: [
    ['Língua estrangeira', /./, (q) => !!q.language],
    ['Literatura', /poema|poeta|romance|literári|verso|narrador|conto/i],
    ['Artes e cultura corporal', /arte|pintura|música|dança|esporte|corpo|teatro/i],
    ['Gramática e linguística', /variação|norma|linguístic|gramática|pronome|verbo/i],
    ['Interpretação de texto', /./],
  ],
};

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function topicFor(q) {
  const text = `${q.context || ''} ${q.alternativesIntroduction || ''}`;
  for (const [name, re, fn] of TOPICS[q.discipline] || []) {
    if (fn ? fn(q) : re.test(text)) return name;
  }
  return 'Geral';
}

const clean = (s) => (s || '').replace(/!\[\]\(https:\/\/enem\.dev\/broken-image\.svg\)/g, '').trim();

(async () => {
  const out = [];
  for (const year of YEARS) {
    let offset = 0;
    for (;;) {
      let r;
      for (let tent = 0; tent < 6; tent++) {
        r = await get(`https://api.enem.dev/v1/exams/${year}/questions?limit=50&offset=${offset}`);
        if (Array.isArray(r.questions)) break;
        await new Promise((ok) => setTimeout(ok, 5000 * (tent + 1)));
      }
      if (!Array.isArray(r.questions)) throw new Error(JSON.stringify(r));
      await new Promise((ok) => setTimeout(ok, 800));
      for (const q of r.questions) {
        if (!q.alternatives || q.alternatives.length < 2 || !q.correctAlternative) continue;
        out.push({
          id: `enem-${year}-${q.index}${q.language ? '-' + q.language : ''}`,
          banca: 'INEP',
          orgao: 'MEC',
          prova: `ENEM ${year}`,
          ano: year,
          numero: q.index,
          disciplina: DISC[q.discipline] || q.discipline,
          assunto: topicFor(q),
          idioma: q.language || undefined,
          enunciado: clean(q.context),
          comando: clean(q.alternativesIntroduction),
          alternativas: q.alternatives.map((a) => ({ letra: a.letter, texto: clean(a.text), imagem: a.file || undefined })),
          gabarito: q.correctAlternative,
        });
      }
      if (!r.metadata.hasMore) break;
      offset += 50;
    }
    console.log(year, out.length);
  }
  const file = path.join(__dirname, '..', 'public', 'data', 'questoes.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const unicas = Array.from(new Map(out.map((q) => [q.id, q])).values());
  fs.writeFileSync(file, JSON.stringify(unicas));
  console.log('total', unicas.length);
})();
