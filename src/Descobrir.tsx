// Aba "Concursos": radar de editais nos diários oficiais (API pública do Querido Diário), páginas das bancas,
// dica do dia e trilhas de aulas. Só fontes públicas e oficiais; nada de material pago copiado.
import { useEffect, useState } from 'react';
import Flashcards from './Flashcards';

const QD = 'https://api.queridodiario.org.br';
const UFS = 'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ');

type Cidade = { territory_id: string; territory_name: string; state_code: string; level: string };
type Diario = { territory_name: string; state_code: string; date: string; url: string; excerpts: string[] };

const lerLocal = <T,>(k: string, padrao: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
};

let cacheCidades: Promise<Cidade[]> | null = null;
const cidades = () =>
  (cacheCidades ??= fetch(`${QD}/cities?city_name=`)
    .then((r) => r.json())
    .then((d) => d.cities as Cidade[]));

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Radar() {
  const [uf, setUf] = useState(() => lerLocal('cq:radar-uf', 'PB'));
  const [cidade, setCidade] = useState(() => lerLocal('cq:radar-cidade', ''));
  const [lista, setLista] = useState<Cidade[]>([]);
  const [res, setRes] = useState<{ total: number; itens: Diario[] } | null>(null);
  const [estado, setEstado] = useState<'' | 'buscando' | 'erro'>('');

  useEffect(() => {
    cidades().then(setLista).catch(() => setEstado('erro'));
  }, []);

  const doEstado = lista.filter((c) => c.state_code === uf);
  const cobertas = doEstado.filter((c) => c.level !== '0');

  async function buscar() {
    try {
      localStorage.setItem('cq:radar-uf', JSON.stringify(uf));
      localStorage.setItem('cq:radar-cidade', JSON.stringify(cidade));
    } catch {
      /* sem armazenamento */
    }
    const alvo = cidade ? doEstado.filter((c) => semAcento(c.territory_name) === semAcento(cidade)) : cobertas;
    if (!alvo.length) {
      setRes({ total: 0, itens: [] });
      return;
    }
    setEstado('buscando');
    setRes(null);
    const desde = new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);
    const q = new URLSearchParams({
      querystring: 'concurso + edital',
      published_since: desde,
      size: '20',
      excerpt_size: '400',
      number_of_excerpts: '1',
      sort_by: 'descending_date',
    });
    alvo.slice(0, 60).forEach((c) => q.append('territory_ids', c.territory_id));
    try {
      const d = await fetch(`${QD}/gazettes?${q}`).then((r) => r.json());
      setRes({ total: d.total_gazettes ?? 0, itens: d.gazettes ?? [] });
      setEstado('');
    } catch {
      setEstado('erro');
    }
  }

  const escolhida = cidade && doEstado.find((c) => semAcento(c.territory_name) === semAcento(cidade));

  return (
    <section className="cartao">
      <h2>Concursos abertos perto de você</h2>
      <p className="mudo">
        Buscamos "concurso" e "edital" nos diários oficiais dos últimos 12 meses (mais recentes primeiro), usando a API pública do{' '}
        <a href="https://queridodiario.ok.org.br" target="_blank" rel="noreferrer">Querido Diário</a> (Open Knowledge Brasil).
        Sempre confira o edital no link do diário.
      </p>
      <div className="radar-form">
        <label>
          Estado
          <select value={uf} onChange={(e) => { setUf(e.target.value); setCidade(''); }}>
            {UFS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </label>
        <label>
          Cidade (opcional)
          <input list="radar-cidades" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Todas as cobertas" />
          <datalist id="radar-cidades">
            {doEstado.map((c) => <option key={c.territory_id} value={c.territory_name} />)}
          </datalist>
        </label>
        <button className="btn" onClick={buscar} disabled={!lista.length || estado === 'buscando'}>
          {estado === 'buscando' ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {lista.length > 0 && (
        <p className="mudo pequeno">
          {cobertas.length} cidades de {uf} têm diário no Querido Diário.
          {escolhida && escolhida.level === '0' && ' Essa cidade ainda não é coberta: veja o diário no site da prefeitura ou da FAMUP/AMM do estado.'}
        </p>
      )}
      {estado === 'erro' && <p className="aviso">Não foi possível falar com o Querido Diário agora. Tente de novo em instantes.</p>}
      {res && (
        <ul className="radar-lista">
          {!res.itens.length && <li className="mudo">Nada encontrado nesse período. Tente outra cidade ou só o estado.</li>}
          {res.itens.map((g) => (
            <li key={g.url + g.date}>
              <strong>{g.territory_name}/{g.state_code}</strong> · {g.date.split('-').reverse().join('/')}
              <p>{(g.excerpts[0] ?? '').replace(/\s+/g, ' ').slice(0, 300)}…</p>
              <a href={g.url.replace(/^s3:\/\/[^/]+\/+/, 'https://data.queridodiario.ok.org.br/')} target="_blank" rel="noreferrer">Abrir o diário oficial (PDF)</a>
              <span className="mudo pequeno"> · Fonte: Querido Diário</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mudo pequeno">
        Concursos federais: <a href="https://www.in.gov.br/consulta/-/buscar/dou?q=%22edital%20de%20abertura%22%20concurso" target="_blank" rel="noreferrer">buscar no Diário Oficial da União</a>.
      </p>
    </section>
  );
}

type Banca = { nome: string; site: string; provas: string; estilo: string; dicas: string[] };
const BANCAS: Banca[] = [
  { nome: 'EDUCA PB', site: 'https://www.educapb.com.br', provas: 'https://www.educapb.com.br', estilo: 'Banca regional da Paraíba. Questões diretas, muito texto de lei (Lei 8.080, 11.350, PNAB) e Português com gramática tradicional.', dicas: ['Decore números das leis do SUS e do ACS/ACE.', 'Português: crase, concordância e colocação pronominal caem sempre.', 'Conhecimentos Gerais cobra história e geografia do município.'] },
  { nome: 'Cebraspe (Cespe)', site: 'https://www.cebraspe.org.br', provas: 'https://www.cebraspe.org.br/concursos', estilo: 'Certo ou Errado: uma errada anula uma certa. Itens longos com troca de uma palavra.', dicas: ['Deixe em branco quando não tiver certeza.', 'Palavras como "sempre", "exclusivamente" e "apenas" costumam errar o item.', 'Leia a jurisprudência do STF e do STJ.'] },
  { nome: 'FGV', site: 'https://conhecimento.fgv.br/concursos', provas: 'https://conhecimento.fgv.br/concursos', estilo: 'Textos longos, interpretação pesada e casos práticos. Cinco alternativas.', dicas: ['Treine interpretação com textos grandes.', 'Em Direito, foque no caso concreto, não só na lei seca.', 'Administre o tempo: provas extensas.'] },
  { nome: 'FCC', site: 'https://www.concursosfcc.com.br', provas: 'https://www.concursosfcc.com.br', estilo: 'Lei seca e literalidade. Português gramatical e raciocínio lógico clássico.', dicas: ['Leia a lei como está escrita.', 'Treine questões de troca de prazos e números.', 'Regência e crase são frequentes.'] },
  { nome: 'Vunesp', site: 'https://www.vunesp.com.br', provas: 'https://www.vunesp.com.br', estilo: 'Muito forte em São Paulo. Português com interpretação e gramática equilibradas.', dicas: ['Estude a legislação estadual de SP quando cair.', 'Matemática básica aparece bastante.', 'Questões curtas e objetivas.'] },
  { nome: 'IBFC / IDECAN / AOCP', site: 'https://www.ibfc.org.br', provas: 'https://www.ibfc.org.br', estilo: 'Bancas médias, muito usadas em prefeituras e saúde. Cobrança próxima da lei seca.', dicas: ['SUS e Constituição caem quase sempre em saúde.', 'Revise informática básica: Word, Excel, segurança.', 'Faça provas anteriores do mesmo cargo.'] },
];

function Bancas() {
  const [aberta, setAberta] = useState('EDUCA PB');
  return (
    <section className="cartao">
      <h2>Página por banca</h2>
      <p className="mudo">Estilo, dicas e onde baixar as provas anteriores no site oficial de cada banca.</p>
      <div className="bancas">
        {BANCAS.map((b) => (
          <details key={b.nome} open={aberta === b.nome} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && setAberta(b.nome)}>
            <summary><strong>{b.nome}</strong></summary>
            <p>{b.estilo}</p>
            <ul>{b.dicas.map((d) => <li key={d}>{d}</li>)}</ul>
            <p>
              <a href={b.provas} target="_blank" rel="noreferrer">Provas e gabaritos oficiais</a> ·{' '}
              <a href={b.site} target="_blank" rel="noreferrer">Site da banca</a>
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

const DICAS = [
  'Faça questões antes de ler a teoria: o erro mostra o que estudar.',
  'Revise hoje o que errou ontem. Revisão em 1, 3, 7 e 30 dias fixa o conteúdo.',
  'Estude a matéria de maior peso primeiro, quando a cabeça está descansada.',
  'Leia o edital inteiro: o conteúdo programático é o seu mapa.',
  '25 minutos focado e 5 de pausa rendem mais que 3 horas distraído.',
  'Na prova, pule a questão difícil e volte depois. Ponto fácil vale igual.',
  'Lei seca: leia o artigo em voz alta e faça uma questão logo depois.',
  'Durma bem na semana da prova. Memória se consolida dormindo.',
  'Faça um simulado por semana no tempo real da prova.',
  'Anote o porquê de cada erro, não só a resposta certa.',
  'Português cai em todo concurso: 20 minutos por dia fazem diferença.',
  'Em "Certo ou Errado", palavras absolutas (sempre, nunca) pedem atenção.',
  'Explique o assunto para alguém (ou para o Mentor). Se travar, revise.',
  'Constância vence intensidade: estude todo dia, mesmo que pouco.',
];

type Trilha = { materia: string; passos: { assunto: string; fonte: string; url: string }[] };
const TRILHAS: Trilha[] = [
  { materia: 'Português', passos: [
    { assunto: 'Classes de palavras', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Concordância verbal', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Regência verbal', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Crase', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Colocação pronominal', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Pontuação', fonte: 'Aula no YouTube', url: '' },
  ] },
  { materia: 'Raciocínio Lógico', passos: [
    { assunto: 'Lógica proposicional', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Condicional', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Porcentagem', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Regra de três', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Probabilidade', fonte: 'Aula no YouTube', url: '' },
  ] },
  { materia: 'Direito Constitucional', passos: [
    { assunto: 'Fundamentos da República', fonte: 'CF/88, arts. 1º a 4º', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
    { assunto: 'Remédios constitucionais', fonte: 'CF/88, art. 5º', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
    { assunto: 'Direitos sociais', fonte: 'CF/88, art. 6º', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
    { assunto: 'Administração Pública', fonte: 'CF/88, art. 37', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
  ] },
  { materia: 'Direito Administrativo', passos: [
    { assunto: 'Organização administrativa', fonte: 'Decreto-Lei 200/67', url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del0200.htm' },
    { assunto: 'Poderes administrativos', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Atos administrativos', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Licitações', fonte: 'Lei 14.133/2021', url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm' },
    { assunto: 'Improbidade administrativa', fonte: 'Lei 8.429/1992', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8429.htm' },
  ] },
  { materia: 'Informática', passos: [
    { assunto: 'Hardware', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Atalhos', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Planilhas', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Internet', fonte: 'Aula no YouTube', url: '' },
    { assunto: 'Segurança da informação', fonte: 'Cartilha CERT.br', url: 'https://cartilha.cert.br' },
  ] },
];

function Trilhas({ onPraticar }: { onPraticar: (d: string, a: string) => void }) {
  const hoje = Math.floor((Date.now() - 3 * 3600_000) / 86400_000);
  const [feitos, setFeitos] = useState<string[]>(() => lerLocal('cq:trilhas', []));
  const marcar = (k: string) =>
    setFeitos((l) => {
      const n = l.includes(k) ? l.filter((x) => x !== k) : [...l, k];
      try { localStorage.setItem('cq:trilhas', JSON.stringify(n)); } catch { /* ok */ }
      return n;
    });
  return (
    <>
      <section className="cartao dica-dia">
        <h2>Dica do mentor de hoje</h2>
        <p>{DICAS[hoje % DICAS.length]}</p>
      </section>
      <section className="cartao">
        <h2>Trilhas de aulas</h2>
        <p className="mudo">Siga na ordem: aula, fonte oficial e questões. Marque o passo quando terminar.</p>
        {TRILHAS.map((t) => {
          const n = t.passos.filter((p) => feitos.includes(t.materia + '|' + p.assunto)).length;
          return (
            <details key={t.materia} className="trilha">
              <summary><strong>{t.materia}</strong> <span className="mudo">{n}/{t.passos.length}</span></summary>
              <ol>
                {t.passos.map((p) => {
                  const k = t.materia + '|' + p.assunto;
                  const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${p.assunto} ${t.materia} concurso aula`)}`;
                  return (
                    <li key={k} className={feitos.includes(k) ? 'feito' : ''}>
                      <label><input type="checkbox" checked={feitos.includes(k)} onChange={() => marcar(k)} /> {p.assunto}</label>
                      <span className="trilha-links">
                        <a href={yt} target="_blank" rel="noreferrer">Aula</a>
                        {p.url && <a href={p.url} target="_blank" rel="noreferrer">{p.fonte}</a>}
                        <button className="link" onClick={() => onPraticar(t.materia, p.assunto)}>Questões</button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </section>
    </>
  );
}

export default function Descobrir({ onPraticar }: { onPraticar: (d: string, a: string) => void }) {
  const [sub, setSub] = useState<'radar' | 'bancas' | 'trilhas' | 'flash'>('trilhas');
  return (
    <div className="descobrir">
      <div className="sub-abas">
        {([['trilhas', 'Dicas e trilhas'], ['flash', 'Flashcards'], ['radar', 'Concursos abertos'], ['bancas', 'Bancas']] as const).map(([id, r]) => (
          <button key={id} className={sub === id ? 'btn' : 'btn btn-sec'} onClick={() => setSub(id)}>{r}</button>
        ))}
      </div>
      {sub === 'radar' && <Radar />}
      {sub === 'bancas' && <Bancas />}
      {sub === 'flash' && <Flashcards />}
      {sub === 'trilhas' && <Trilhas onPraticar={onPraticar} />}
    </div>
  );
}
