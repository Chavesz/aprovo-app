import { useEffect, useMemo, useState } from 'react';
import type { Filtros, Questao, Resposta } from './types';
import { usePersist } from './store';
import { md } from './md';
import Edital from './Edital';

type Aba = 'praticar' | 'simulado' | 'edital' | 'desempenho' | 'revisar';

const FILTROS_VAZIOS: Filtros = { banca: '', orgao: '', disciplina: '', assunto: '', ano: '', status: 'todas' };

const unicos = (qs: Questao[], k: keyof Questao) =>
  Array.from(new Set(qs.map((q) => String(q[k])))).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));

const pct = (a: number, t: number) => (t ? Math.round((a / t) * 100) : 0);

function embaralhar<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [oficiais, setOficiais] = useState<Questao[] | null>(null);
  const [geradas, setGeradas] = usePersist<Questao[]>('cq:geradas', []);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = usePersist<Aba>('cq:aba', 'praticar');
  const [tema, setTema] = usePersist<'claro' | 'escuro' | ''>('cq:tema-pref', '');
  const [historico, setHistorico] = usePersist<Resposta[]>('cq:historico', []);
  const [revisar, setRevisar] = usePersist<string[]>('cq:revisar', []);
  const [bloco, setBloco] = usePersist<string[]>('cq:bloco', []);
  const [filtros, setFiltros] = usePersist<Filtros>('cq:filtros', FILTROS_VAZIOS);

  useEffect(() => {
    // privado/educa.json só existe na máquina de quem importou as provas (fica fora do Git).
    const opcional = fetch('/data/privado/educa.json')
      .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? (r.json() as Promise<Questao[]>) : []))
      .catch(() => [] as Questao[]);
    Promise.all([
      opcional,
      ...['/data/ace-cuite.json', '/data/oab.json', '/data/questoes.json'].map((u) => fetch(u).then((r) => r.json() as Promise<Questao[]>)),
    ])
      .then((partes) => setOficiais(partes.flat()))
      .catch(() => setErro(true));
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (tema) el.dataset.theme = tema === 'escuro' ? 'dark' : 'light';
    else delete el.dataset.theme;
    try {
      if (tema) localStorage.setItem('cq:tema', el.dataset.theme!);
      else localStorage.removeItem('cq:tema');
    } catch {
      /* ignore */
    }
  }, [tema]);

  const escuroAgora = () =>
    tema ? tema === 'escuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;

  const questoes = useMemo(() => (oficiais ? [...geradas, ...oficiais] : null), [oficiais, geradas]);

  const registrar = (r: Resposta) => setHistorico((h) => [...h, r]);
  const alternarRevisar = (id: string) =>
    setRevisar((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const abas: { id: Aba; rotulo: string; icone: JSX.Element }[] = [
    { id: 'praticar', rotulo: 'Praticar', icone: <IconPen /> },
    { id: 'simulado', rotulo: 'Simulado', icone: <IconClock /> },
    { id: 'edital', rotulo: 'Edital', icone: <IconSpark /> },
    { id: 'desempenho', rotulo: 'Desempenho', icone: <IconChart /> },
    { id: 'revisar', rotulo: 'Revisar', icone: <IconFlag /> },
  ];

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <span className="marca-selo" aria-hidden>A</span>
          <span className="marca-nome">Aprovô</span>
        </div>
        <nav className="abas" aria-label="Seções">
          {abas.map((a) => (
            <button
              key={a.id}
              className="aba"
              aria-current={aba === a.id ? 'page' : undefined}
              onClick={() => setAba(a.id)}
            >
              {a.icone}
              <span>{a.rotulo}</span>
              {a.id === 'revisar' && revisar.length > 0 && <span className="contador">{revisar.length}</span>}
            </button>
          ))}
        </nav>
        <a className="icone-btn" href="/resumao.html" target="_blank" rel="noopener" aria-label="Abrir o resumão" title="Resumão">
          <IconBook />
        </a>
        <button
          className="icone-btn"
          onClick={() => setTema(escuroAgora() ? 'claro' : 'escuro')}
          aria-label="Alternar modo escuro"
          title="Alternar modo escuro"
        >
          <IconTheme />
        </button>
      </header>

      <main className="conteudo">
        {erro && <p className="aviso">Não foi possível carregar o banco de questões. Recarregue a página.</p>}
        {!questoes && !erro && <Carregando />}
        {questoes && aba === 'praticar' && (
          <Praticar
            questoes={questoes}
            filtros={filtros}
            setFiltros={setFiltros}
            historico={historico}
            revisar={revisar}
            bloco={bloco}
            onResponder={registrar}
            onRevisar={alternarRevisar}
          />
        )}
        {questoes && aba === 'simulado' && (
          <Simulado questoes={questoes} onResponder={registrar} revisar={revisar} onRevisar={alternarRevisar} />
        )}
        {questoes && aba === 'edital' && (
          <Edital
            questoes={questoes}
            geradas={geradas}
            onBloco={(ids, modo) => {
              setBloco(ids);
              setFiltros({ ...FILTROS_VAZIOS, status: modo });
              setAba('praticar');
            }}
            onNovas={(qs) => setGeradas((g) => [...qs, ...g])}
            onPraticar={(f) => {
              setFiltros({ ...FILTROS_VAZIOS, ...f });
              setAba('praticar');
            }}
          />
        )}
        {questoes && aba === 'desempenho' && (
          <Desempenho questoes={questoes} historico={historico} onLimpar={() => setHistorico([])} />
        )}
        {questoes && aba === 'revisar' && (
          <Revisar
            questoes={questoes}
            revisar={revisar}
            onRevisar={alternarRevisar}
            onPraticar={() => {
              setFiltros({ ...FILTROS_VAZIOS, status: 'revisar' });
              setAba('praticar');
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ---------- Praticar ---------- */

/**
 * Treino inteligente: primeiro os assuntos com mais erros e as questões que a pessoa errou por último;
 * assuntos nunca vistos vêm logo depois, para cobrir todo o edital; as que acertou por último vão para o fim.
 */
function ordemInteligente(lista: Questao[], historico: Resposta[]) {
  const porId = new Map(lista.map((q) => [q.id, q]));
  const assunto = new Map<string, { t: number; e: number }>();
  const ultima = new Map<string, boolean>();
  historico.forEach((h) => {
    ultima.set(h.id, h.certa);
    const q = porId.get(h.id);
    if (!q) return;
    const g = assunto.get(q.assunto) ?? { t: 0, e: 0 };
    g.t++;
    if (!h.certa) g.e++;
    assunto.set(q.assunto, g);
  });
  const nota = (q: Questao) => {
    const g = assunto.get(q.assunto);
    const taxaErro = g ? g.e / g.t : 0.6;
    const u = ultima.get(q.id);
    return taxaErro * 2 + (u === false ? 1.5 : u === undefined ? 0.5 : -2);
  };
  // Desempate aleatório para não repetir sempre a mesma sequência.
  return lista
    .map((q) => ({ q, n: nota(q) + Math.random() * 0.3 }))
    .sort((a, b) => b.n - a.n)
    .map((x) => x.q);
}

function aplicarFiltros(qs: Questao[], f: Filtros, historico: Resposta[], revisar: string[], bloco: string[]) {
  const respondidas = new Set(historico.map((h) => h.id));
  const ultimas = new Map<string, boolean>();
  historico.forEach((h) => ultimas.set(h.id, h.certa));
  const lista = qs.filter(
    (q) =>
      (!f.banca || q.banca === f.banca) &&
      (!f.orgao || q.orgao === f.orgao) &&
      (!f.disciplina || q.disciplina === f.disciplina) &&
      (!f.assunto || q.assunto === f.assunto) &&
      (!f.ano || String(q.ano) === f.ano) &&
      (f.status === 'todas' ||
        (f.status === 'ineditas' && !respondidas.has(q.id)) ||
        (f.status === 'erradas' && ultimas.get(q.id) === false) ||
        (f.status === 'revisar' && revisar.includes(q.id)) ||
        (f.status === 'bloco' && bloco.includes(q.id)) ||
        (f.status === 'inteligente' && (!bloco.length || bloco.includes(q.id))))
  );
  if (f.status === 'inteligente') return ordemInteligente(lista, historico);
  if (f.status !== 'bloco') return lista;
  const ordem = new Map(bloco.map((id, i) => [id, i]));
  return lista.sort((x, y) => (ordem.get(x.id) ?? 0) - (ordem.get(y.id) ?? 0));
}

function Praticar(props: {
  questoes: Questao[];
  filtros: Filtros;
  setFiltros: (f: Filtros) => void;
  historico: Resposta[];
  revisar: string[];
  bloco: string[];
  onResponder: (r: Resposta) => void;
  onRevisar: (id: string) => void;
}) {
  const { questoes, filtros, setFiltros, historico, revisar, bloco } = props;
  // A lista é congelada ao mudar filtros, para a questão atual não sumir ao ser respondida.
  const [lista, setLista] = useState<Questao[]>([]);
  const [i, setI] = useState(0);
  const [marcada, setMarcada] = useState<string | null>(null);
  const [abrirFiltros, setAbrirFiltros] = useState(false);

  useEffect(() => {
    setLista(aplicarFiltros(questoes, filtros, historico, revisar, bloco));
    setI(0);
    setMarcada(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questoes, filtros]);

  const base = useMemo(
    () => questoes.filter((q) => !filtros.disciplina || q.disciplina === filtros.disciplina),
    [questoes, filtros.disciplina]
  );
  const q = lista[i];
  const set = (k: keyof Filtros, v: string) =>
    setFiltros({ ...filtros, [k]: v, ...(k === 'disciplina' ? { assunto: '' } : {}) } as Filtros);
  const ativos = (['banca', 'orgao', 'disciplina', 'assunto', 'ano'] as const).filter((k) => filtros[k]).length +
    (filtros.status !== 'todas' ? 1 : 0);

  const ir = (n: number) => {
    setI(Math.max(0, Math.min(lista.length - 1, n)));
    setMarcada(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="praticar">
      <aside className={`filtros ${abrirFiltros ? 'aberto' : ''}`}>
        <button className="filtros-toggle" onClick={() => setAbrirFiltros((v) => !v)} aria-expanded={abrirFiltros}>
          <IconFilter /> Filtros {ativos > 0 && <span className="contador">{ativos}</span>}
          <span className="filtros-total">{lista.length} questões</span>
        </button>
        <div className="filtros-corpo">
          <Select rotulo="Banca" valor={filtros.banca} opcoes={unicos(questoes, 'banca')} onChange={(v) => set('banca', v)} />
          <Select rotulo="Órgão" valor={filtros.orgao} opcoes={unicos(questoes, 'orgao')} onChange={(v) => set('orgao', v)} />
          <Select rotulo="Disciplina" valor={filtros.disciplina} opcoes={unicos(questoes, 'disciplina')} onChange={(v) => set('disciplina', v)} />
          <Select rotulo="Assunto" valor={filtros.assunto} opcoes={unicos(base, 'assunto')} onChange={(v) => set('assunto', v)} />
          <Select rotulo="Ano" valor={filtros.ano} opcoes={unicos(questoes, 'ano').reverse()} onChange={(v) => set('ano', v)} />
          <fieldset className="status">
            <legend className="rotulo">Mostrar</legend>
            {(
              [
                ['todas', 'Todas'],
                ['ineditas', 'Não feitas'],
                ['erradas', 'Errei'],
                ['revisar', 'Marcadas'],
                ['bloco', 'Meu bloco'],
                ['inteligente', 'Treino inteligente'],
              ] as const
            ).map(([v, r]) => (
              <label key={v} className="chip">
                <input type="radio" name="status" checked={filtros.status === v} onChange={() => set('status', v)} />
                {r}
              </label>
            ))}
          </fieldset>
          {ativos > 0 && (
            <button className="link" onClick={() => setFiltros(FILTROS_VAZIOS)}>
              Limpar filtros
            </button>
          )}
        </div>
      </aside>

      <section className="coluna">
        {!q ? (
          <Vazio
            titulo="Nenhuma questão com esses filtros"
            texto="Tente outro ano ou assunto, ou limpe os filtros para ver o banco inteiro."
            acao={<button className="btn" onClick={() => setFiltros(FILTROS_VAZIOS)}>Limpar filtros</button>}
          />
        ) : (
          <>
            <QuestaoCard
              q={q}
              posicao={`${i + 1} de ${lista.length}`}
              marcada={marcada}
              revelar={marcada !== null}
              onMarcar={(l) => {
                if (marcada) return;
                setMarcada(l);
                props.onResponder({ id: q.id, marcada: l, certa: l === q.gabarito, em: Date.now() });
              }}
              marcadaRevisar={revisar.includes(q.id)}
              onRevisar={() => props.onRevisar(q.id)}
            />
            <div className="navegacao">
              <button className="btn btn-sec" onClick={() => ir(i - 1)} disabled={i === 0}>
                Anterior
              </button>
              <button className="btn" onClick={() => ir(i + 1)} disabled={i >= lista.length - 1}>
                {marcada ? 'Próxima questão' : 'Pular'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ---------- Questão ---------- */

function QuestaoCard(props: {
  q: Questao;
  posicao: string;
  marcada: string | null;
  revelar: boolean;
  onMarcar: (letra: string) => void;
  marcadaRevisar: boolean;
  onRevisar: () => void;
}) {
  const { q, marcada, revelar } = props;
  const certa = marcada === q.gabarito;
  return (
    <article className="questao" aria-label={`Questão ${q.numero}, ${q.prova}`}>
      <header className="questao-meta">
        <span className="mono">{props.posicao}</span>
        <span className="sep" aria-hidden />
        <span>{q.prova} · Q{q.numero}</span>
        <button
          className={`icone-btn bandeira ${props.marcadaRevisar ? 'ativo' : ''}`}
          onClick={props.onRevisar}
          aria-pressed={props.marcadaRevisar}
          title={props.marcadaRevisar ? 'Remover da revisão' : 'Marcar para revisar'}
        >
          <IconFlag />
          <span className="sr">Marcar para revisar</span>
        </button>
      </header>
      <div className="tags">
        <span className="tag">{q.disciplina}</span>
        <span className="tag">{q.assunto}</span>
        {q.ia && <span className="tag tag-ia">Gerada por IA</span>}
        {q.idioma && <span className="tag">{q.idioma === 'ingles' ? 'Inglês' : 'Espanhol'}</span>}
        <span className="tag tag-fraca">{q.banca} · {q.orgao}</span>
      </div>

      {q.enunciado && <div className="enunciado" dangerouslySetInnerHTML={{ __html: md(q.enunciado) }} />}
      {q.comando && <div className="comando" dangerouslySetInnerHTML={{ __html: md(q.comando) }} />}

      <ol className="alternativas">
        {q.alternativas.map((a) => {
          const estado = !revelar
            ? marcada === a.letra
              ? 'marcada'
              : ''
            : a.letra === q.gabarito
            ? 'correta'
            : a.letra === marcada
            ? 'errada'
            : 'apagada';
          return (
            <li key={a.letra}>
              <button
                className={`alt ${estado}`}
                onClick={() => props.onMarcar(a.letra)}
                disabled={revelar}
                aria-label={`Alternativa ${a.letra}${estado === 'correta' ? ', correta' : estado === 'errada' ? ', sua resposta, errada' : ''}`}
              >
                <span className="alt-letra">{a.letra}</span>
                <span className="alt-texto">
                  {a.texto && <span dangerouslySetInnerHTML={{ __html: md(a.texto) }} />}
                  {a.imagem && <img src={a.imagem} alt={`Imagem da alternativa ${a.letra}`} loading="lazy" />}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {revelar && marcada && (
        <div className={`feedback ${certa ? 'ok' : 'nok'}`} role="status">
          <strong>{certa ? 'Resposta certa.' : `Não foi dessa vez. Gabarito: ${q.gabarito}.`}</strong>
          <p>
            {q.comentario ??
              `Gabarito oficial (${q.banca}). Esta prova não tem comentário publicado; releia o enunciado com a alternativa correta em mente.`}
          </p>
          {!certa && q.revisar && (
            <p className="feedback-extra">
              <span className="rotulo">O que revisar</span>
              {q.revisar}
            </p>
          )}
          {q.macete && (
            <p className="feedback-extra macete">
              <span className="rotulo">Macete</span>
              {q.macete}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/* ---------- Simulado ---------- */

function Simulado(props: {
  questoes: Questao[];
  onResponder: (r: Resposta) => void;
  revisar: string[];
  onRevisar: (id: string) => void;
}) {
  const [config, setConfig] = useState({ total: 10, minutos: 30, disciplina: '' });
  const [prova, setProva] = useState<Questao[] | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [i, setI] = useState(0);
  const [fim, setFim] = useState<number>(0);
  const [agora, setAgora] = useState(Date.now());
  const [encerrado, setEncerrado] = useState(false);

  const restante = Math.max(0, Math.round((fim - agora) / 1000));

  useEffect(() => {
    if (!prova || encerrado) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [prova, encerrado]);

  useEffect(() => {
    if (prova && !encerrado && restante === 0) encerrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restante]);

  const iniciar = () => {
    const pool = props.questoes.filter((q) => !config.disciplina || q.disciplina === config.disciplina);
    setProva(embaralhar(pool).slice(0, config.total));
    setRespostas({});
    setI(0);
    setEncerrado(false);
    setFim(Date.now() + config.minutos * 60000);
    setAgora(Date.now());
  };

  function encerrar() {
    if (!prova) return;
    const em = Date.now();
    prova.forEach((q) => {
      const m = respostas[q.id];
      if (m) props.onResponder({ id: q.id, marcada: m, certa: m === q.gabarito, em, simulado: true });
    });
    setEncerrado(true);
  }

  if (!prova) {
    return (
      <section className="coluna estreita">
        <p className="sobretitulo">Simulado</p>
        <h1 className="titulo">Treine com o relógio correndo.</h1>
        <p className="lead">Questões sorteadas, sem gabarito até o fim. O resultado entra no seu desempenho.</p>
        <div className="form-simulado">
          <Select
            rotulo="Disciplina"
            valor={config.disciplina}
            opcoes={unicos(props.questoes, 'disciplina')}
            vazio="Todas as disciplinas"
            onChange={(v) => setConfig({ ...config, disciplina: v })}
          />
          <Segmentado rotulo="Questões" valores={[5, 10, 20, 45]} valor={config.total} onChange={(v) => setConfig({ ...config, total: v })} />
          <Segmentado rotulo="Tempo (min)" valores={[10, 30, 60, 90]} valor={config.minutos} onChange={(v) => setConfig({ ...config, minutos: v })} />
          <button className="btn btn-grande" onClick={iniciar}>
            Começar simulado
          </button>
        </div>
      </section>
    );
  }

  if (encerrado) {
    const acertos = prova.filter((q) => respostas[q.id] === q.gabarito).length;
    return (
      <section className="coluna estreita">
        <p className="sobretitulo">Resultado</p>
        <h1 className="titulo">
          {acertos} de {prova.length} <span className="titulo-sub">({pct(acertos, prova.length)}%)</span>
        </h1>
        <p className="lead">
          {Object.keys(respostas).length < prova.length
            ? `${prova.length - Object.keys(respostas).length} em branco. `
            : ''}
          Toque numa questão para conferir.
        </p>
        <ol className="resultado">
          {prova.map((q, n) => {
            const m = respostas[q.id];
            const st = !m ? 'branco' : m === q.gabarito ? 'ok' : 'nok';
            return (
              <li key={q.id}>
                <details>
                  <summary className={`resultado-linha ${st}`}>
                    <span className="mono">{String(n + 1).padStart(2, '0')}</span>
                    <span className="resultado-assunto">{q.assunto}</span>
                    <span className="mono">
                      {m ?? '—'} / {q.gabarito}
                    </span>
                  </summary>
                  <QuestaoCard
                    q={q}
                    posicao={q.disciplina}
                    marcada={m ?? null}
                    revelar
                    onMarcar={() => undefined}
                    marcadaRevisar={props.revisar.includes(q.id)}
                    onRevisar={() => props.onRevisar(q.id)}
                  />
                </details>
              </li>
            );
          })}
        </ol>
        <button className="btn" onClick={() => setProva(null)}>
          Novo simulado
        </button>
      </section>
    );
  }

  const q = prova[i];
  const mm = String(Math.floor(restante / 60)).padStart(2, '0');
  const ss = String(restante % 60).padStart(2, '0');
  return (
    <section className="coluna">
      <div className="barra-simulado">
        <span className={`relogio mono ${restante < 60 ? 'urgente' : ''}`} role="timer" aria-label="Tempo restante">
          {mm}:{ss}
        </span>
        <div className="mapa" aria-label="Mapa de questões">
          {prova.map((p, n) => (
            <button
              key={p.id}
              className={`mapa-item ${respostas[p.id] ? 'feita' : ''} ${n === i ? 'atual' : ''}`}
              onClick={() => setI(n)}
              aria-label={`Ir para questão ${n + 1}`}
            >
              {n + 1}
            </button>
          ))}
        </div>
        <button className="btn btn-sec" onClick={() => confirm('Entregar o simulado agora?') && encerrar()}>
          Entregar
        </button>
      </div>
      <QuestaoCard
        q={q}
        posicao={`${i + 1} de ${prova.length}`}
        marcada={respostas[q.id] ?? null}
        revelar={false}
        onMarcar={(l) => setRespostas((r) => ({ ...r, [q.id]: l }))}
        marcadaRevisar={props.revisar.includes(q.id)}
        onRevisar={() => props.onRevisar(q.id)}
      />
      <div className="navegacao">
        <button className="btn btn-sec" onClick={() => setI(i - 1)} disabled={i === 0}>
          Anterior
        </button>
        {i < prova.length - 1 ? (
          <button className="btn" onClick={() => setI(i + 1)}>
            Próxima
          </button>
        ) : (
          <button className="btn" onClick={encerrar}>
            Entregar simulado
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------- Desempenho ---------- */

function diaChave(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Dias seguidos com pelo menos uma resposta, contando até hoje (ou ontem, se hoje ainda não estudou). */
function sequencia(historico: Resposta[]) {
  const dias = new Set(historico.map((h) => diaChave(h.em)));
  const d = new Date();
  if (!dias.has(diaChave(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dias.has(diaChave(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function agrupar(historico: Resposta[], porId: Map<string, Questao>, chave: (q: Questao) => string) {
  const m = new Map<string, { nome: string; t: number; a: number }>();
  historico.forEach((h) => {
    const q = porId.get(h.id);
    if (!q) return;
    const k = chave(q);
    const g = m.get(k) ?? { nome: k, t: 0, a: 0 };
    g.t++;
    if (h.certa) g.a++;
    m.set(k, g);
  });
  return Array.from(m.values());
}

function Desempenho({ questoes, historico, onLimpar }: { questoes: Questao[]; historico: Resposta[]; onLimpar: () => void }) {
  const porId = useMemo(() => new Map(questoes.map((q) => [q.id, q])), [questoes]);
  const [periodo, setPeriodo] = useState<7 | 30 | 0>(0);
  const hist = useMemo(() => {
    const desde = periodo ? Date.now() - periodo * 86400000 : 0;
    return historico.filter((h) => h.em >= desde);
  }, [historico, periodo]);
  const acertos = hist.filter((h) => h.certa).length;
  const unicas = new Set(hist.map((h) => h.id)).size;

  const disciplinas = useMemo(() => agrupar(hist, porId, (q) => q.disciplina).sort((x, y) => y.t - x.t), [hist, porId]);
  const assuntos = useMemo(
    () => agrupar(hist, porId, (q) => `${q.assunto}|${q.disciplina}`).sort((x, y) => pct(x.a, x.t) - pct(y.a, y.t) || y.t - x.t),
    [hist, porId]
  );

  const dias = useMemo(() => {
    const lista: { rotulo: string; t: number; a: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = diaChave(d.getTime());
      const doDia = historico.filter((h) => diaChave(h.em) === k);
      lista.push({ rotulo: String(d.getDate()), t: doDia.length, a: doDia.filter((h) => h.certa).length });
    }
    return lista;
  }, [historico]);
  const maxDia = Math.max(1, ...dias.map((d) => d.t));
  const hoje = dias[dias.length - 1];

  if (!historico.length) {
    return (
      <Vazio
        titulo="Seu desempenho aparece aqui"
        texto="Responda algumas questões e você verá a taxa de acerto por disciplina e por assunto, a evolução dos últimos dias e sua sequência de estudo."
      />
    );
  }

  return (
    <section className="coluna estreita">
      <div className="edital-topo">
        <p className="sobretitulo">Desempenho</p>
        <div className="segmentado periodo" role="radiogroup" aria-label="Período">
          {(
            [
              [7, '7 dias'],
              [30, '30 dias'],
              [0, 'Tudo'],
            ] as const
          ).map(([v, r]) => (
            <label key={v} className="chip">
              <input type="radio" name="periodo" checked={periodo === v} onChange={() => setPeriodo(v)} />
              {r}
            </label>
          ))}
        </div>
      </div>

      <div className="numeros numeros-4">
        <div>
          <span className="numero">{pct(acertos, hist.length)}%</span>
          <span className="rotulo">de acerto</span>
        </div>
        <div>
          <span className="numero">{hist.length}</span>
          <span className="rotulo">resolvidas</span>
        </div>
        <div>
          <span className="numero">{acertos}</span>
          <span className="rotulo">acertos</span>
        </div>
        <div>
          <span className="numero">{sequencia(historico)}</span>
          <span className="rotulo">dias seguidos</span>
        </div>
      </div>
      <p className="nota resumo">
        {unicas} questões diferentes · {hist.length - acertos} erros · hoje: {hoje.t} {hoje.t === 1 ? 'questão' : 'questões'}
        {hoje.t > 0 && `, ${pct(hoje.a, hoje.t)}% de acerto`}
      </p>

      <h2 className="subtitulo">Últimos 14 dias</h2>
      <div className="grafico" role="img" aria-label={`Questões por dia: ${dias.map((d) => d.t).join(', ')}`}>
        {dias.map((d, i) => (
          <div key={i} className="grafico-col" title={`${d.t} questões, ${d.a} acertos`}>
            <div className="grafico-barra" style={{ height: `${(d.t / maxDia) * 100}%` }}>
              <span style={{ height: `${pct(d.a, d.t)}%` }} />
            </div>
            <span className="mono grafico-rotulo">{d.rotulo}</span>
          </div>
        ))}
      </div>
      <p className="nota legenda">
        <span className="legenda-cor certo" /> acertos <span className="legenda-cor total" /> total do dia
      </p>

      <h2 className="subtitulo">Por disciplina</h2>
      <ul className="assuntos">
        {disciplinas.map((g) => (
          <LinhaBarra key={g.nome} titulo={g.nome} a={g.a} t={g.t} />
        ))}
      </ul>

      <h2 className="subtitulo">
        Por assunto <span className="nota">do mais fraco ao mais forte</span>
      </h2>
      <ul className="assuntos">
        {assuntos.map((g) => {
          const [assunto, disciplina] = g.nome.split('|');
          return <LinhaBarra key={g.nome} titulo={assunto} sub={disciplina} a={g.a} t={g.t} />;
        })}
      </ul>

      <h2 className="subtitulo">Histórico recente</h2>
      <ol className="historico">
        {historico
          .slice(-15)
          .reverse()
          .map((h, n) => {
            const q = porId.get(h.id);
            return (
              <li key={h.em + h.id + n} className={h.certa ? 'ok' : 'nok'}>
                <span className="mono">{h.certa ? 'certa' : 'errada'}</span>
                <span className="historico-texto">
                  {q ? `${q.prova} · Q${q.numero} · ${q.assunto}` : h.id}
                  {h.simulado && <span className="tag tag-fraca">simulado</span>}
                </span>
                <time className="nota">{new Date(h.em).toLocaleDateString('pt-BR')}</time>
              </li>
            );
          })}
      </ol>
      <button className="link perigo" onClick={() => confirm('Apagar todo o histórico deste navegador?') && onLimpar()}>
        Apagar histórico
      </button>
    </section>
  );
}

function LinhaBarra({ titulo, sub, a, t }: { titulo: string; sub?: string; a: number; t: number }) {
  const p = pct(a, t);
  return (
    <li>
      <div className="assunto-linha">
        <span>
          {titulo} {sub && <span className="nota">{sub}</span>}
        </span>
        <span className="mono">
          {a}/{t} · {p}%
        </span>
      </div>
      <div className="barra" aria-hidden>
        <span style={{ width: `${p}%` }} className={p < 50 ? 'fraca' : ''} />
      </div>
    </li>
  );
}

/* ---------- Revisar ---------- */

function Revisar(props: { questoes: Questao[]; revisar: string[]; onRevisar: (id: string) => void; onPraticar: () => void }) {
  const lista = props.questoes.filter((q) => props.revisar.includes(q.id));
  if (!lista.length) {
    return (
      <Vazio
        titulo="Nada marcado para revisar"
        texto="Use a bandeira no canto da questão para guardar as que você quer refazer depois."
      />
    );
  }
  return (
    <section className="coluna estreita">
      <p className="sobretitulo">Revisar</p>
      <h1 className="titulo">{lista.length} {lista.length === 1 ? 'questão marcada' : 'questões marcadas'}</h1>
      <button className="btn" onClick={props.onPraticar}>
        Refazer as marcadas
      </button>
      <ul className="lista-revisar">
        {lista.map((q) => (
          <li key={q.id}>
            <div>
              <span className="mono nota">{q.prova} · Q{q.numero}</span>
              <p className="lista-titulo">{q.assunto}</p>
              <p className="nota">{q.disciplina}</p>
            </div>
            <button className="link" onClick={() => props.onRevisar(q.id)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Peças ---------- */

function Select(props: { rotulo: string; valor: string; opcoes: string[]; onChange: (v: string) => void; vazio?: string }) {
  return (
    <label className="campo">
      <span className="rotulo">{props.rotulo}</span>
      <select value={props.valor} onChange={(e) => props.onChange(e.target.value)}>
        <option value="">{props.vazio ?? 'Todos'}</option>
        {props.opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Segmentado(props: { rotulo: string; valores: number[]; valor: number; onChange: (v: number) => void }) {
  return (
    <fieldset className="campo">
      <legend className="rotulo">{props.rotulo}</legend>
      <div className="segmentado">
        {props.valores.map((v) => (
          <label key={v} className="chip">
            <input type="radio" name={props.rotulo} checked={props.valor === v} onChange={() => props.onChange(v)} />
            {v}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao?: JSX.Element }) {
  return (
    <section className="vazio">
      <h2 className="subtitulo">{titulo}</h2>
      <p>{texto}</p>
      {acao}
    </section>
  );
}

function Carregando() {
  return (
    <div className="carregando" aria-busy="true" aria-label="Carregando questões">
      <span />
      <span />
      <span />
    </div>
  );
}

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const IconPen = () => <svg {...svg}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg>;
const IconClock = () => <svg {...svg}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>;
const IconChart = () => <svg {...svg}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
const IconFlag = () => <svg {...svg}><path d="M5 21V4h11l-2 4 2 4H5" /></svg>;
const IconFilter = () => <svg {...svg}><path d="M3 5h18M6 12h12M10 19h4" /></svg>;
const IconSpark = () => <svg {...svg}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></svg>;
const IconBook = () => <svg {...svg}><path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" /></svg>;
const IconTheme = () => <svg {...svg}><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" /></svg>;
