// Boas-vindas em forma de conversa com o Mentor (robô): perguntas com respostas em botões, simulado diagnóstico de 10 questões
// do concurso escolhido e, no fim, o plano até a prova. O perfil vai para cq:mentor (sincronizado e espelhado em planos_mentor.perfil),
// filtra as questões e os simulados ("Meu concurso") e dá contexto ao Mentor com IA.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Questao, Resposta } from './types';
import { MODELOS, type PerfilMentor } from './Mentor';

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const d = (nome: string, questoes: number, peso = 1) => ({ nome, questoes, peso, assuntos: [] as string[] });
const PADRAO = [d('Português', 15, 2), d('Raciocínio Lógico', 10), d('Informática', 5), d('Direito Constitucional', 10), d('Direito Administrativo', 10)];
const AREAS: [string, string][] = [
  ['Prefeituras (administrativo)', 'Prefeitura (nível médio)'],
  ['Saúde (ACS, ACE, enfermagem)', 'Agente de Saúde (ACS)'],
  ['Federais (INSS e similares)', 'INSS (Técnico do Seguro Social)'],
  ['Policial e bombeiros', 'Polícia e Bombeiros (FGV)'],
  ['Tribunais e órgãos (Cebraspe)', 'Técnico nível médio (Cebraspe)'],
];
const BANCAS = ['Cebraspe', 'FGV', 'Consulplan', 'EDUCA', 'IBFC', 'Vunesp'];
const NIVEIS: [NonNullable<PerfilMentor['nivel']>, string][] = [
  ['iniciante', 'Começando do zero'],
  ['intermediario', 'Já estudei um pouco'],
  ['avancado', 'Estou na reta final'],
];

type Passo = 'abertos' | 'alvo' | 'qual' | 'banca' | 'edital' | 'data' | 'nivel' | 'horas' | 'faceis' | 'dificeis' | 'local' | 'convite' | 'diag' | 'plano';
type Msg = { de: 'mentor' | 'eu'; texto: string };

export type Aberto = { titulo: string; link: string; uf: string; data: string; tipo: string; area: string };
const MODELO_DA_AREA: Record<string, string> = {
  Saúde: 'Agente de Saúde (ACS)', Federais: 'INSS (Técnico do Seguro Social)', Segurança: 'Polícia e Bombeiros (FGV)',
  Tribunais: 'Técnico nível médio (Cebraspe)', Educação: 'Prefeitura (nível médio)', Administrativo: 'Prefeitura (nível médio)',
};

/** Lista de concursos e seleções abertas (feed público), com filtro por estado. */
export function ListaAbertos({ ufInicial, onEscolher }: { ufInicial?: string; onEscolher: (a: Aberto) => void }) {
  const [uf, setUf] = useState(ufInicial ?? '');
  const [lista, setLista] = useState<Aberto[] | null>(null);
  const [busca, setBusca] = useState('');
  // Favoritos ficam no aparelho e sincronizam com a conta (chave cq:).
  const [favs, setFavs] = useState<Aberto[]>(() => { try { return JSON.parse(localStorage.getItem('cq:abertos-favoritos') ?? '[]'); } catch { return []; } });
  const alternarFav = (a: Aberto) => setFavs((l) => {
    const novo = l.some((x) => x.link === a.link) ? l.filter((x) => x.link !== a.link) : [a, ...l].slice(0, 30);
    try { localStorage.setItem('cq:abertos-favoritos', JSON.stringify(novo)); } catch { /* sem armazenamento */ }
    return novo;
  });
  const [soFavs, setSoFavs] = useState(false);
  useEffect(() => {
    setLista(null);
    fetch(`/api/concursos-abertos${uf ? `?uf=${uf}` : ''}`).then((r) => r.json()).then((d) => setLista(d.lista ?? [])).catch(() => setLista([]));
  }, [uf]);
  const filtrada = (soFavs ? favs : lista ?? []).filter((a) => !busca || a.titulo.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="abertos">
      <div className="bot-texto">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cargo ou cidade" aria-label="Buscar concurso" />
        <select value={uf} onChange={(e) => setUf(e.target.value)} aria-label="Estado">
          <option value="">Brasil</option>
          {UFS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </div>
      {favs.length > 0 && <button className="link" onClick={() => setSoFavs((v) => !v)}>{soFavs ? 'Ver todos' : `⭐ Meus salvos (${favs.length})`}</button>}
      {!lista && <p className="nota">Buscando concursos abertos…</p>}
      {lista && !filtrada.length && <p className="nota">Nada encontrado agora. Tente outro estado ou escreva o seu concurso.</p>}
      <ul className="abertos-lista">
        {filtrada.slice(0, 30).map((a) => (
          <li key={a.link} className="abertos-li">
            <button className="abertos-fav" aria-pressed={favs.some((x) => x.link === a.link)} aria-label="Salvar concurso" onClick={() => alternarFav(a)}>{favs.some((x) => x.link === a.link) ? '⭐' : '☆'}</button>
            <button className="abertos-item" onClick={() => onEscolher(a)}>
              <span className="abertos-tit">{a.titulo}</span>
              <span className="nota">{a.uf} · {a.area} · {a.tipo === 'selecao' ? 'seleção' : 'concurso'}{a.data ? ` · ${new Date(a.data).toLocaleDateString('pt-BR')}` : ''}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="nota abertos-fonte">Fonte: Concursos no Brasil. Confira sempre o edital oficial.</p>
    </div>
  );
}

const diasAte = (iso: string) => (iso ? Math.ceil((Date.parse(iso + 'T12:00:00') - Date.now()) / 86400000) : null);

export default function Comecar({ questoes, selecionar, onResponder, onPronto, onPular, onIr, inicial }: {
  questoes: Questao[];
  /** Perfil já feito: abre direto no convite do simulado diagnóstico (opção do Simulado). */
  inicial?: PerfilMentor | null;
  /** Questões do concurso do perfil (as mesmas do filtro "Meu concurso"). */
  selecionar: (p: PerfilMentor) => Questao[];
  onResponder: (r: Resposta) => void;
  onPronto: (p: PerfilMentor) => void;
  onPular: () => void;
  onIr: (aba: 'mentor' | 'praticar' | 'simulado') => void;
}) {
  const [passo, setPasso] = useState<Passo>(inicial ? 'convite' : 'alvo');
  const [msgs, setMsgs] = useState<Msg[]>(inicial ? [
    { de: 'mentor', texto: `Vamos ver como você está em ${inicial.cargo || inicial.concurso}? São 10 questões do seu concurso, uma ou duas de cada matéria. No fim, eu ajusto o seu plano.` },
  ] : [
    { de: 'mentor', texto: 'Oi! Eu sou o seu Mentor. Vou te fazer umas perguntas rápidas e montar um plano para você passar na sua prova.' },
    { de: 'mentor', texto: 'Você já sabe qual concurso vai fazer? Se não, eu te mostro os que estão com inscrição aberta agora.' },
  ]);
  const [p, setP] = useState<PerfilMentor>(inicial ?? { concurso: '', cargo: '', banca: '', editalAberto: false, dataProva: '', horasDia: 2, disciplinas: PADRAO, faceis: [], dificeis: [], cidade: '', uf: '', nivel: 'iniciante' });
  const [texto, setTexto] = useState('');
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => { fim.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [msgs, passo]);

  const bancasBanco = useMemo(() => new Set(questoes.map((q) => q.banca)), [questoes]);
  const nomes = p.disciplinas.map((x) => x.nome);

  /** Registra a resposta do aluno e a próxima pergunta do Mentor. */
  function responder(eu: string, prox: Passo, pergunta: string, mudar: Partial<PerfilMentor> = {}) {
    setP((v) => ({ ...v, ...mudar }));
    setMsgs((m) => [...m, { de: 'eu', texto: eu }, ...(pergunta ? [{ de: 'mentor' as const, texto: pergunta }] : [])]);
    setTexto('');
    setMarcadas([]);
    setPasso(prox);
  }
  const escolherModelo = (rotulo: string, eu = rotulo) => {
    const m = MODELOS.find((x) => x.rotulo === rotulo)!;
    responder(eu, 'banca', `Boa! ${m.rotulo}: já tenho as matérias e os pesos desse tipo de prova. Sabe qual é a banca?`, { concurso: m.rotulo, cargo: m.cargo, banca: m.banca, disciplinas: m.disciplinas });
  };

  // ---------- Simulado diagnóstico ----------
  const diag = useMemo(() => {
    if (passo !== 'diag') return [] as Questao[];
    const pool = selecionar(p).filter((q) => q.alternativas.length >= 2 && q.gabarito);
    const porDisc = new Map<string, Questao[]>();
    pool.forEach((q) => porDisc.set(q.disciplina, [...(porDisc.get(q.disciplina) ?? []), q]));
    const out: Questao[] = [];
    const listas = [...porDisc.values()].map((l) => l.sort(() => Math.random() - 0.5));
    for (let r = 0; out.length < 10 && r < 10; r++) for (const l of listas) if (l[r] && out.length < 10) out.push(l[r]);
    return out;
  }, [passo]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [acertos, setAcertos] = useState<Record<string, { a: number; t: number }>>({});

  function marcar(q: Questao, letra: string) {
    const certa = letra === q.gabarito;
    onResponder({ id: q.id, marcada: letra, certa, em: Date.now() });
    const novo = { ...acertos, [q.disciplina]: { a: (acertos[q.disciplina]?.a ?? 0) + (certa ? 1 : 0), t: (acertos[q.disciplina]?.t ?? 0) + 1 } };
    setAcertos(novo);
    if (i + 1 < diag.length) setI(i + 1);
    else concluir(novo);
  }

  function concluir(res: Record<string, { a: number; t: number }>) {
    const tot = Object.values(res).reduce((s, x) => ({ a: s.a + x.a, t: s.t + x.t }), { a: 0, t: 0 });
    const fracas = Object.entries(res).filter(([, x]) => x.a / x.t < 0.5).map(([k]) => k);
    const fortes = Object.entries(res).filter(([, x]) => x.t >= 1 && x.a / x.t >= 0.75).map(([k]) => k);
    const final = { ...p, dificeis: [...new Set([...p.dificeis, ...fracas])].filter((x) => !fortes.includes(x) || p.dificeis.includes(x)), faceis: [...new Set([...p.faceis, ...fortes])].filter((x) => !fracas.includes(x)) };
    setP(final);
    onPronto(final);
    setMsgs((m) => [...m, { de: 'mentor', texto: `Você acertou ${tot.a} de ${tot.t}. ${tot.t && tot.a / tot.t >= 0.7 ? 'Começo forte!' : 'Normal no começo: é para isso que eu estou aqui.'} Montei o seu plano.` }]);
    setPasso('plano');
  }

  function semDiagnostico() {
    onPronto(p);
    responder('Depois', 'plano', 'Sem problema. Montei o seu plano com o que você me contou; o diagnóstico fica no Simulado quando quiser.');
  }

  // ---------- Plano final ----------
  const dias = diasAte(p.dataProva);
  const prioridades = [...p.disciplinas]
    .map((x) => ({ ...x, nota: x.peso * x.questoes * (p.dificeis.includes(x.nome) ? 2 : p.faceis.includes(x.nome) ? 0.6 : 1) }))
    .sort((a, b) => b.nota - a.nota);
  const somaNota = prioridades.reduce((s, x) => s + x.nota, 0) || 1;

  const opcoes = (l: [string, () => void][]) => (
    <div className="bot-opcoes">{l.map(([t, f]) => <button key={t} className="chip" onClick={f}>{t}</button>)}</div>
  );
  const multi = (prox: Passo, pergunta: string, campo: 'faceis' | 'dificeis', vazio: string) => (
    <>
      <div className="bot-opcoes">
        {nomes.filter((n) => campo === 'faceis' || !p.faceis.includes(n)).map((n) => (
          <button key={n} className={marcadas.includes(n) ? 'chip ok' : 'chip'} aria-pressed={marcadas.includes(n)} onClick={() => setMarcadas((m) => (m.includes(n) ? m.filter((x) => x !== n) : [...m, n]))}>{n}</button>
        ))}
      </div>
      <button className="btn" onClick={() => responder(marcadas.join(', ') || vazio, prox, pergunta, { [campo]: marcadas })}>{marcadas.length ? 'Continuar' : vazio}</button>
    </>
  );

  return (
    <section className="coluna estreita comecar bot" aria-labelledby="comecar-titulo">
      <p className="sobretitulo">Mentor com IA</p>
      <h1 className="titulo" id="comecar-titulo">{inicial ? 'Simulado para conhecer você' : 'Vamos montar o seu plano.'}</h1>
      <div className="bot-conversa" aria-live="polite">
        {msgs.map((m, n) => (
          <p key={n} className={`balao ${m.de === 'eu' ? 'user' : 'assistant'}`}>{m.texto}</p>
        ))}
      </div>

      <div className="bot-resposta">
        {passo === 'alvo' && msgs.length <= 2 && opcoes([
          ['Ver concursos abertos', () => responder('Quero ver os concursos abertos', 'abertos', 'Esses são os mais recentes. Filtre pelo seu estado e toque no que te interessa.')],
          ['Já sei qual', () => responder('Já sei qual', 'qual', 'Qual concurso ou cargo? Escolha um parecido ou escreva.')],
          ['Vários da mesma área', () => responder('Vários da mesma área', 'qual', 'Qual área? Eu junto as matérias que mais caem nela.')],
        ])}
        {passo === 'abertos' && (
          <ListaAbertos ufInicial={p.uf} onEscolher={(a) => {
            const m = MODELOS.find((x) => x.rotulo === MODELO_DA_AREA[a.area]) ?? MODELOS[3];
            responder(a.titulo, 'banca', `Boa escolha! Vou usar as matérias que mais caem em provas de ${a.area.toLowerCase()} até você me mandar o edital (link no Mentor). Sabe qual é a banca?`, {
              concurso: a.titulo.slice(0, 120), cargo: m.cargo, disciplinas: m.disciplinas, editalAberto: true, uf: a.uf, editalUrl: a.link,
            } as Partial<PerfilMentor>);
          }} />
        )}
        {passo === 'alvo' && msgs.length > 2 && opcoes([
          ['Um concurso específico', () => responder('Um concurso específico', 'qual', 'Qual concurso ou cargo? Escolha um parecido ou escreva.')],
          ['Vários da mesma área', () => responder('Vários da mesma área', 'qual', 'Qual área? Eu junto as matérias que mais caem nela.')],
        ])}
        {passo === 'qual' && (msgs[msgs.length - 2]?.texto.startsWith('Vários') ? opcoes(AREAS.map(([t, m]) => [t, () => escolherModelo(m, t)])) : (
          <>
            {opcoes(MODELOS.map((m) => [m.rotulo, () => escolherModelo(m.rotulo)]))}
            <form className="bot-texto" onSubmit={(e) => { e.preventDefault(); if (texto.trim()) responder(texto.trim(), 'banca', 'Anotado. Sabe qual é a banca?', { concurso: texto.trim(), cargo: texto.trim() }); }}>
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Agente Administrativo de Patos" aria-label="Concurso ou cargo" />
              <button className="btn" disabled={!texto.trim()}>Enviar</button>
            </form>
          </>
        ))}
        {passo === 'banca' && opcoes([
          ...BANCAS.map((b): [string, () => void] => [b, () => (p.editalUrl ? responder(b, 'data', 'Quando é a prova?', { banca: b }) : responder(b, 'edital', 'O edital já saiu?', { banca: b }))]),
          ['Não sei ainda', () => (p.editalUrl ? responder('Não sei ainda', 'data', 'Tudo bem, está no edital. Quando é a prova?', { banca: '' }) : responder('Não sei ainda', 'edital', 'Tudo bem. O edital já saiu?', { banca: '' }))],
        ])}
        {passo === 'edital' && opcoes([
          ['Sim, já saiu', () => responder('Sim, já saiu', 'data', 'Ótimo. Depois, no Mentor, cole o link ou o PDF do edital que eu leio as matérias e os pesos. Quando é a prova?', { editalAberto: true })],
          ['Ainda não', () => responder('Ainda não', 'data', 'Sem problema: a gente começa pelo último edital e pelo que mais cai. Quando sair, eu ajusto. Já tem data prevista para a prova?', { editalAberto: false })],
        ])}
        {passo === 'data' && (
          <form className="bot-texto" onSubmit={(e) => { e.preventDefault(); const n = diasAte(texto); responder(n !== null ? `${new Date(texto + 'T12:00:00').toLocaleDateString('pt-BR')} (faltam ${n} dias)` : 'Sem data', 'nivel', n !== null ? `Faltam ${n} dias. Dá tempo, com método. Qual é o seu nível hoje?` : 'Qual é o seu nível hoje?', { dataProva: texto }); }}>
            <input type="date" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Data da prova" />
            <button className="btn">{texto ? 'Enviar' : 'Ainda não tem data'}</button>
          </form>
        )}
        {passo === 'nivel' && opcoes(NIVEIS.map(([v, t]) => [t, () => responder(t, 'horas', 'Quantas horas por dia você consegue estudar?', { nivel: v })]))}
        {passo === 'horas' && opcoes([1, 2, 3, 4, 6].map((h) => [`${h}h por dia`, () => responder(`${h}h por dia`, 'faceis', 'Em quais matérias você se sente melhor? (pode marcar várias)', { horasDia: h })]))}
        {passo === 'faceis' && multi('dificeis', 'E em quais você tem mais dúvida?', 'faceis', 'Nenhuma ainda')}
        {passo === 'dificeis' && multi('local', 'De qual cidade e estado você é? Uso para achar concursos perto de você.', 'dificeis', 'Não sei dizer')}
        {passo === 'local' && (
          <form className="bot-texto" onSubmit={(e) => { e.preventDefault(); responder([texto.trim(), p.uf].filter(Boolean).join('/') || 'Prefiro não dizer', 'convite', 'Última coisa: bora fazer um simulado rápido de 10 questões do seu concurso? Assim eu vejo onde você está e ajusto o plano.', { cidade: texto.trim() }); }}>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cidade" aria-label="Cidade" autoComplete="address-level2" />
            <select value={p.uf} onChange={(e) => setP((v) => ({ ...v, uf: e.target.value }))} aria-label="UF">
              <option value="">UF</option>
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <button className="btn">Enviar</button>
          </form>
        )}
        {passo === 'convite' && opcoes([
          ['Bora, 10 questões', () => { onPronto(p); responder('Bora!', 'diag', 'Valendo! Sem pressa e sem consulta.'); }],
          ['Depois', semDiagnostico],
        ])}
        {passo === 'diag' && diag[i] && (
          <div className="bot-questao">
            <p className="rotulo">Questão {i + 1} de {diag.length} · {diag[i].disciplina}{bancasBanco.has(diag[i].banca) ? ` · ${diag[i].banca}` : ''}</p>
            <p className="bot-comando">{diag[i].comando.replace(/\*\*/g, '').slice(0, 900)}</p>
            <div className="bot-alts">
              {diag[i].alternativas.map((a) => (
                <button key={a.letra} className="alt" onClick={() => marcar(diag[i], a.letra)}><b>{a.letra}</b> {a.texto}</button>
              ))}
            </div>
          </div>
        )}
        {passo === 'diag' && !diag.length && opcoes([['Ver meu plano', semDiagnostico]])}
        {passo === 'plano' && (
          <div className="bot-plano">
            <p className="rotulo">Seu plano · {p.cargo || p.concurso}</p>
            <p className="bot-plano-dias">{dias !== null && dias > 0 ? <><strong>{dias}</strong> dias até a prova · {p.horasDia}h por dia ≈ <strong>{Math.round(dias * p.horasDia)}h</strong> de estudo</> : <>{p.horasDia}h por dia · prova sem data ainda</>}</p>
            <ol className="bot-prioridades">
              {prioridades.map((x) => (
                <li key={x.nome}>
                  <span>{x.nome}{p.dificeis.includes(x.nome) && <small className="nok"> reforçar</small>}{p.faceis.includes(x.nome) && <small className="ok"> manter</small>}</span>
                  <span className="mono">{Math.round((x.nota / somaNota) * p.horasDia * 60)} min/dia</span>
                </li>
              ))}
            </ol>
            <p className="nota">Toda semana eu reviso o plano pelo seu desempenho: o que você errar volta para revisão em 1, 3, 7 e 30 dias.</p>
            <div className="linha-botoes">
              <button className="btn btn-grande" onClick={() => onIr('praticar')}>Começar a treinar</button>
              <button className="btn btn-sec" onClick={() => onIr('mentor')}>Falar com o Mentor</button>
            </div>
          </div>
        )}
        <div ref={fim} />
      </div>
      {passo !== 'plano' && passo !== 'diag' && <button className="link bot-pular" onClick={onPular}>Pular por enquanto</button>}
    </section>
  );
}
