// Junta conteudo/ace-cuite/*.json (questões autorais, formato compacto) em public/data/ace-cuite.json.
// Formato de cada item: { d: disciplina, a: assunto, t?: texto-base, c: comando, o: [4 alternativas], g: 'A'..'D',
//   x: explicação, r?: o que revisar, m?: macete, e?: true = questão elaborada no estilo EDUCA }
// Uso: node scripts/build-ace.cjs
const fs = require('fs');
const path = require('path');

const pasta = path.join(__dirname, '..', 'conteudo', 'ace-cuite');
const saida = [];
for (const arquivo of fs.readdirSync(pasta).filter((f) => f.endsWith('.json')).sort()) {
  const lote = JSON.parse(fs.readFileSync(path.join(pasta, arquivo), 'utf8'));
  lote.forEach((q, i) => {
    const erro = (msg) => {
      throw new Error(`${arquivo} #${i + 1}: ${msg}`);
    };
    if (!q.d || !q.a || !q.c || !q.x) erro('faltam campos');
    if (!Array.isArray(q.o) || q.o.length !== 4) erro('precisa de 4 alternativas');
    if (!'ABCD'.includes(q.g) || q.g.length !== 1) erro('gabarito inválido');
    saida.push({
      id: `ace-${arquivo.replace('.json', '')}-${i + 1}`,
      banca: q.e ? 'Estilo EDUCA · elaborada' : 'Autoral · estilo EDUCA',
      orgao: 'Prefeitura de Cuité de Mamanguape (PB)',
      prova: q.e ? 'Treino ACE Cuité · elaboradas' : 'Treino ACE Cuité',
      ano: 2026,
      numero: saida.length + 1,
      disciplina: q.d,
      assunto: q.a,
      enunciado: q.t ?? '',
      comando: q.c,
      alternativas: q.o.map((texto, j) => ({ letra: 'ABCD'[j], texto })),
      gabarito: q.g,
      comentario: q.x,
      revisar: q.r,
      macete: q.m,
    });
  });
}
fs.writeFileSync(path.join(__dirname, '..', 'public', 'data', 'ace-cuite.json'), JSON.stringify(saida));
const por = {};
saida.forEach((q) => (por[q.disciplina] = (por[q.disciplina] ?? 0) + 1));
console.log(`${saida.length} questões`, por);
