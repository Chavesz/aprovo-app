import { useEffect, useMemo, useState } from 'react';
import type { Filtros, ProvaFeita, Questao, Resposta } from './types';
import { usePersist } from './store';
import { md } from './md';
import Edital from './Edital';
import Login from './Login';
import Ranking from './Ranking';
import { baixar, contaSalva, enviar, sairDaConta, type Conta } from './nuvem';

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
  const [conta, setConta] = useState<Conta | null>(() => contaSalva());
  const [pronto, setPronto] = useState(false);

  // Antes de abrir o app, traz o progresso salvo na conta (se a rede falhar, segue com o que há no aparelho).
  useEffect(() => {
    if (!conta) return;
    setPronto(false);
    baixar(conta)
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401) {
          localStorage.removeItem('cq:conta');
          setConta(null);
        }
      })
      .finally(() => setPronto(true));
  }, [conta]);

  if (!conta) return <Login onEntrar={setConta} />;
  if (!pronto) return <Carregando />;
  return (
    <Painel
      conta={conta}
      onSair={async () => {
        await sairDaConta(conta);
        setConta(null);
      }}
    />
  );
}

function Painel({ conta, onSair }: { conta: Conta; onSair: () => void }) {
  const [oficiais, setOficiais] = useState<Questao[] | null>(null);
  const [geradas, setGeradas] = usePersist<Questao[]>('cq:geradas', []);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = usePersist<Aba>('cq:aba', 'praticar');
  const [tema, setTema] = usePersist<'claro' | 'escuro' | ''>('cq:tema-pref', '');
  const [historico, setHistorico] = usePersist<Resposta[]>('cq:historico', []);
  const [revisar, setRevisar] = usePersist<string[]>('cq:revisar', []);
  const [bloco, setBloco] = usePersist<string[]>('cq:bloco', []);
  const [filtros, setFiltros] = usePersist<Filtros>('cq:filtros', FILTROS_VAZIOS);
  const [provas, setProvas] = usePersist<ProvaFeita[]>('cq:provas', []);
  const [meta, setMeta] = usePersist<{ data: string; porDia: number }>('cq:meta', { data: '', porDia: 40 });
  const [anotacoes, setAnotacoes] = usePersist<Record<string, string>>('cq:anotacoes', {});

  useEffect(() => {
    // Os arquivos de privado/ só existem na máquina de quem importou as provas (ficam fora do Git).
    const opcional = (u: string) =>
      fetch(u)
        .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? (r.json() as Promise<Questao[]>) : []))
        .catch(() => [] as Questao[]);
    Promise.all([
      opcional('/data/educa-ace.json'),
      opcional('/data/educa-site.json'),
      opcional('/data/privado/educa.json'),
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

  // Envia o progresso para a conta pouco depois de cada mudança e quando o app vai para segundo plano.
  const [sync, setSync] = useState<'ok' | 'salvando' | 'offline'>('ok');
  useEffect(() => {
    setSync('salvando');
    const t = setTimeout(() => {
      enviar(conta)
        .then(() => setSync('ok'))
        .catch(() => setSync('offline'));
    }, 1500);
    return () => clearTimeout(t);
  }, [conta, historico, revisar, bloco, geradas, provas, anotacoes, meta, aba]);
  useEffect(() => {
    const aoSair = () => document.visibilityState === 'hidden' && enviar(conta).catch(() => undefined);
    document.addEventListener('visibilitychange', aoSair);
    return () => document.removeEventListener('visibilitychange', aoSair);
  }, [conta]);

  // Provas entregues antes de o app guardar o resultado: refaz a nota a partir das respostas do histórico.
  useEffect(() => {
    if (!questoes) return;
    const porId = new Map(questoes.map((q) => [q.id, q]));
    const sessoes = new Map<number, Resposta[]>();
    historico.filter((h) => h.simulado).forEach((h) => sessoes.set(h.em, [...(sessoes.get(h.em) ?? []), h]));
    const novas: ProvaFeita[] = [];
    sessoes.forEach((rs, em) => {
      if (provas.some((p) => p.em === em)) return;
      const qs = rs.map((r) => porId.get(r.id)).filter((q): q is Questao => !!q);
      const respostas = Object.fromEntries(rs.map((r) => [r.id, r.marcada]));
      const estilo = rs.length >= 30 && qs.every((q) => blocoDe(q));
      const r = resultado(qs, respostas);
      novas.push({
        em,
        estilo,
        acertos: r.acertos,
        total: estilo ? 40 : rs.length,
        respondidas: rs.length,
        nota: estilo ? r.nota : r.acertos,
        max: estilo ? 100 : rs.length,
        materias: estilo ? r.notas.map(({ nome, a, n, pontos, peso }) => ({ nome, a, total: n, pontos, max: n * peso })) : undefined,
      });
    });
    if (novas.length) setProvas((l) => [...l, ...novas].sort((x, y) => x.em - y.em));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questoes, historico]);

  const registrar = (r: Resposta) =>setHistorico((h) => [...h, r]);
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
        <button
          className="conta-btn"
          onClick={() => confirm(`Sair da conta ${conta.usuario}? Seu progresso fica salvo.`) && onSair()}
          title={sync === 'offline' ? 'Sem conexão: o progresso será enviado quando voltar a internet' : 'Progresso salvo na conta'}
        >
          {conta.nome.split(' ')[0]} <span className={`sync ${sync}`}>{sync === 'ok' ? '✓' : sync === 'salvando' ? '…' : '!'}</span>
        </button>
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
        {questoes && aba === 'praticar' && <Meta meta={meta} onMeta={setMeta} historico={historico} />}
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
          <Simulado
            questoes={questoes}
            historico={historico}
            onResponder={registrar}
            onProva={(p) => setProvas((l) => [...l, p])}
            revisar={revisar}
            onRevisar={alternarRevisar}
          />
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
          <>
            <Ranking conta={conta} />
            <Desempenho questoes={questoes} historico={historico} provas={provas} onLimpar={() => setHistorico([])} />
          </>
        )}
        {questoes && aba === 'revisar' && (
          <Revisar
            questoes={questoes}
            historico={historico}
            anotacoes={anotacoes}
            onAnotar={(assunto, texto) => setAnotacoes((a) => ({ ...a, [assunto]: texto }))}
            onTreinar={(assunto) => {
              setFiltros({ ...FILTROS_VAZIOS, assunto });
              setAba('praticar');
            }}
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

/* ---------- Contagem e meta do dia ---------- */

function Meta({
  meta,
  onMeta,
  historico,
}: {
  meta: { data: string; porDia: number };
  onMeta: (m: { data: string; porDia: number }) => void;
  historico: Resposta[];
}) {
  const [editando, setEditando] = useState(!meta.data);
  const hojeK = diaChave(Date.now());
  const doDia = historico.filter((h) => diaChave(h.em) === hojeK);
  const feitas = doDia.length;
  const certas = doDia.filter((h) => h.certa).length;
  const hoje0 = new Date();
  hoje0.setHours(0, 0, 0, 0);
  const dias = meta.data ? Math.round((new Date(`${meta.data}T00:00:00`).getTime() - hoje0.getTime()) / 86400000) : null;
  const batida = feitas >= meta.porDia;

  return (
    <section className="coluna meta-dia">
      <div className="meta-contagem">
        {dias === null ? (
          <span className="nota">Coloque a data da sua prova</span>
        ) : dias > 0 ? (
          <>
            <span className="meta-numero">{dias}</span>
            <span className="nota">{dias === 1 ? 'dia para a prova' : 'dias para a prova'}</span>
          </>
        ) : dias === 0 ? (
          <span className="meta-numero meta-hoje">É hoje! Boa prova 🍀</span>
        ) : (
          <span className="nota">A prova já passou. Atualize a data.</span>
        )}
      </div>
      <div className="meta-progresso">
        <div className="assunto-linha">
          <span>{batida ? 'Meta de hoje batida! 🔥' : `Meta de hoje: ${meta.porDia} questões`}</span>
          <span className="mono">
            {feitas}/{meta.porDia}
            {feitas > 0 && ` · ${pct(certas, feitas)}%`}
          </span>
        </div>
        <div className="barra" aria-hidden>
          <span style={{ width: `${Math.min(100, pct(feitas, meta.porDia))}%` }} />
        </div>
      </div>
      {editando ? (
        <div className="meta-form">
          <label className="campo">
            <span className="rotulo">Data da prova</span>
            <input type="date" value={meta.data} onChange={(e) => onMeta({ ...meta, data: e.target.value })} />
          </label>
          <Segmentado rotulo="Questões por dia" valores={[20, 40, 60, 100]} valor={meta.porDia} onChange={(v) => onMeta({ ...meta, porDia: v })} />
          <button className="btn btn-sec" onClick={() => setEditando(false)}>
            Pronto
          </button>
        </div>
      ) : (
        <button className="link meta-editar" onClick={() => setEditando(true)}>
          Mudar data ou meta
        </button>
      )}
    </section>
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
    // Questões comentadas (autorais) e da EDUCA vêm antes das de outras bancas.
    const fonte = q.comentario ? 0.8 : /educa/i.test(q.banca) ? 0.5 : 0;
    return taxaErro * 2 + (u === false ? 1.5 : u === undefined ? 0.5 : -2) + fonte;
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

/** Formato da prova de ACE de Cuité de Mamanguape (EDUCA PB): 40 questões, 3 horas, nota de 0 a 100. */
const FORMATO_ACE: { nome: string; n: number; peso: number; filtro: (q: Questao) => boolean }[] = [
  { nome: 'Português', n: 15, peso: 2, filtro: (q) => q.disciplina === 'Português' || q.disciplina === 'Língua Portuguesa' },
  { nome: 'Informática', n: 5, peso: 1, filtro: (q) => q.disciplina === 'Informática' },
  { nome: 'Conhecimentos Gerais', n: 5, peso: 1, filtro: (q) => q.disciplina === 'Conhecimentos Gerais' },
  { nome: 'Específicos', n: 15, peso: 4, filtro: (q) => q.disciplina === 'Específicos ACE' || q.disciplina === 'Saúde Pública' },
];

/** Monta a prova no formato da banca: só questões no estilo da prova (autorais comentadas e EDUCA), priorizando os erros. */
type Origem = 'misturado' | 'feitas' | 'ineditas';

const eEduca = (q: Questao) => /educa/i.test(q.banca) && !/^Autoral/.test(q.banca);

function montarProvaEstilo(questoes: Questao[], historico: Resposta[], origem: Origem = 'misturado', soEduca = false) {
  const feitas = new Set(historico.map((h) => h.id));
  const vistos = new Set<string>();
  // Sem repetir: nem o mesmo id, nem o mesmo enunciado vindo de fontes diferentes.
  const unica = (q: Questao) => {
    // Questões de Português dividem o mesmo texto base: compara o fim do enunciado, o comando e as alternativas.
    const k = `${q.enunciado.slice(-160)}|${q.comando}|${q.alternativas.map((x) => x.texto).join('|')}`;
    if (vistos.has(q.id) || vistos.has(k)) return false;
    vistos.add(q.id);
    vistos.add(k);
    return true;
  };
  const estilo = questoes.filter((q) => q.comentario || /educa/i.test(q.banca));
  const preferida = (q: Questao) =>
    (!soEduca || eEduca(q)) && (origem === 'misturado' || (origem === 'feitas' ? feitas.has(q.id) : !feitas.has(q.id)));
  return FORMATO_ACE.flatMap((b) => {
    const doBloco = ordemInteligente(estilo.filter(b.filtro), historico);
    // Primeiro as da origem escolhida; se faltar questão, completa com as outras para fechar as 40.
    const ordem = [...doBloco.filter(preferida), ...doBloco.filter((q) => !preferida(q))];
    return ordem.filter(unica).slice(0, b.n);
  });
}

/** Provas aplicadas pela EDUCA já usadas no treino. Os links buscam o PDF original (site da banca ou da prefeitura). */
const PROVAS_EDUCA = [
  { nome: 'Ibiara (PB) 2025', cargo: 'Agente de Combate às Endemias' },
  { nome: 'Brejo do Cruz (PB) 2025', cargo: 'Agente de Combate às Endemias' },
  { nome: 'Juripiranga (PB) 2024', cargo: 'Agente de Combate às Endemias' },
  { nome: 'Alhandra (PB) 2024', cargo: 'nível médio' },
  { nome: 'Santa Cecília (PB) 2025', cargo: 'nível médio' },
  { nome: 'Umbuzeiro (PB) 2025', cargo: 'nível médio' },
];

function ProvasEduca() {
  return (
    <details className="provas-educa">
      <summary>
        <span className="rotulo">Provas EDUCA</span> <span className="nota">provas reais da banca para baixar</span>
      </summary>
      <p className="nota">
        Os PDFs oficiais ficam no site da EDUCA e no Diário Oficial de cada prefeitura. Cada link busca a prova e o gabarito:
        prefira o arquivo da banca ou da prefeitura.
      </p>
      <ul>
        {PROVAS_EDUCA.map((p) => (
          <li key={p.nome}>
            <span>
              {p.nome} <span className="nota">· {p.cargo}</span>
            </span>
            <a
              className="link"
              target="_blank"
              rel="noopener"
              href={`https://www.google.com/search?q=${encodeURIComponent(`EDUCA prova ${p.cargo} ${p.nome} pdf gabarito`)}`}
            >
              Buscar PDF
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function blocoDe(q: Questao) {
  return FORMATO_ACE.find((b) => b.filtro(q));
}

function resultado(prova: Questao[], respostas: Record<string, string>) {
  const acertos = prova.filter((q) => respostas[q.id] === q.gabarito).length;
  const notas = FORMATO_ACE.map((b) => {
    const qs = prova.filter((q) => blocoDe(q) === b);
    const a = qs.filter((q) => respostas[q.id] === q.gabarito).length;
    return { ...b, total: qs.length, a, pontos: a * b.peso, max: qs.length * b.peso };
  });
  return {
    acertos,
    notas,
    nota: notas.reduce((s, b) => s + b.pontos, 0),
    max: notas.reduce((s, b) => s + b.max, 0),
  };
}

function Simulado(props: {
  historico: Resposta[];
  questoes: Questao[];
  onResponder: (r: Resposta) => void;
  onProva: (p: ProvaFeita) => void;
  revisar: string[];
  onRevisar: (id: string) => void;
}) {
  const [config, setConfig] = useState({ total: 10, minutos: 30, disciplina: '' });
  // A prova em andamento fica salva no aparelho: se o celular recarregar a página, nada se perde.
  const [prova, setProva] = usePersist<Questao[] | null>('cq:sim-prova', null);
  const [respostas, setRespostas] = usePersist<Record<string, string>>('cq:sim-respostas', {});
  const [i, setI] = usePersist('cq:sim-i', 0);
  const [fim, setFim] = usePersist<number>('cq:sim-fim', 0);
  const [agora, setAgora] = useState(Date.now());
  const [encerrado, setEncerrado] = usePersist('cq:sim-encerrado', false);
  const [estiloProva, setEstiloProva] = usePersist('cq:sim-estilo', false);
  const [origem, setOrigem] = usePersist<Origem>('cq:sim-origem', 'misturado');
  const [soEduca, setSoEduca] = usePersist('cq:sim-so-educa', false);

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

  const iniciarProva = () => {
    setProva(montarProvaEstilo(props.questoes, props.historico, origem, soEduca));
    setEstiloProva(true);
    setRespostas({});
    setI(0);
    setEncerrado(false);
    setFim(Date.now() + 180 * 60000);
    setAgora(Date.now());
  };

  function encerrar() {
    if (!prova) return;
    const em = Date.now();
    prova.forEach((q) => {
      const m = respostas[q.id];
      if (m) props.onResponder({ id: q.id, marcada: m, certa: m === q.gabarito, em, simulado: true });
    });
    const r = resultado(prova, respostas);
    props.onProva({
      em,
      estilo: estiloProva,
      acertos: r.acertos,
      total: prova.length,
      respondidas: prova.filter((q) => respostas[q.id]).length,
      nota: estiloProva ? r.nota : r.acertos,
      max: estiloProva ? r.max : prova.length,
      materias: estiloProva ? r.notas.map(({ nome, a, total, pontos, max }) => ({ nome, a, total, pontos, max })) : undefined,
    });
    setEncerrado(true);
  }

  if (!prova) {
    return (
      <section className="coluna estreita">
        <p className="sobretitulo">Simulado</p>
        <h1 className="titulo">Treine com o relógio correndo.</h1>
        <p className="lead">Questões sorteadas, sem gabarito até o fim. O resultado entra no seu desempenho.</p>
        <div className="prova-estilo">
          <p className="rotulo">Prova no estilo da banca</p>
          <p className="prova-estilo-titulo">ACE Cuité de Mamanguape · EDUCA PB</p>
          <p className="nota">
            40 questões em 3 horas: 15 de Português (peso 2), 5 de Informática, 5 de Gerais e 15 de Específicos (peso 4).
            Nota de 0 a 100, começando pelos assuntos em que você mais erra.
          </p>
          <div className="segmentado origem" role="radiogroup" aria-label="Quais questões">
            {(
              [
                ['misturado', 'Misturado'],
                ['feitas', 'Só as que já fiz'],
                ['ineditas', 'Só inéditas'],
              ] as const
            ).map(([v, r]) => (
              <label key={v} className="chip">
                <input type="radio" name="origem" checked={origem === v} onChange={() => setOrigem(v)} />
                {r}
              </label>
            ))}
          </div>
          <label className="check-educa">
            <input type="checkbox" checked={soEduca} onChange={(e) => setSoEduca(e.target.checked)} />
            <span>
              <strong>Estilo EDUCA</strong>: priorizar as questões elaboradas (textos longos, V ou F, EXCETO) e as das provas reais
              da banca
            </span>
          </label>
          <button className="btn btn-grande" onClick={iniciarProva}>
            Gerar prova no estilo da banca
          </button>
        </div>
        <ProvasEduca />
        <p className="rotulo simulado-livre">Ou monte um simulado livre</p>
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
          <button className="btn btn-sec btn-grande" onClick={() => { setEstiloProva(false); iniciar(); }}>
            Começar simulado
          </button>
        </div>
      </section>
    );
  }

  if (encerrado) {
    const { acertos, notas, nota } = resultado(prova, respostas);
    const zerou = notas.filter((b) => b.total > 0 && b.a === 0);
    return (
      <section className="coluna estreita">
        <p className="sobretitulo">Resultado</p>
        {estiloProva ? (
          <>
            <h1 className="titulo">
              {nota} <span className="titulo-sub">de 100 pontos · {acertos}/{prova.length} acertos</span>
            </h1>
            <table className="tabela-nota">
              <thead>
                <tr><th>Matéria</th><th>Acertos</th><th>Pontos</th></tr>
              </thead>
              <tbody>
                {notas.map((b) => (
                  <tr key={b.nome} className={b.a === 0 ? 'zerou' : ''}>
                    <td>{b.nome} <span className="nota">×{b.peso}</span></td>
                    <td className="mono">{b.a}/{b.total}</td>
                    <td className="mono">{b.pontos}/{b.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`aviso-nota ${nota >= 50 && !zerou.length ? 'ok' : 'nok'}`}>
              {zerou.length
                ? `Zerou ${zerou.map((b) => b.nome).join(', ')}: na prova real, nota zero em uma matéria elimina.`
                : nota >= 50
                ? 'Acima da nota mínima (50). Meta: 90+ para brigar pelas 3 vagas.'
                : 'Abaixo da nota mínima de 50 pontos.'}
            </p>
          </>
        ) : (
          <h1 className="titulo">
            {acertos} de {prova.length} <span className="titulo-sub">({pct(acertos, prova.length)}%)</span>
          </h1>
        )}
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

function Desempenho({
  questoes,
  historico,
  provas,
  onLimpar,
}: {
  questoes: Questao[];
  historico: Resposta[];
  provas: ProvaFeita[];
  onLimpar: () => void;
}) {
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

      <div className="pizzas">
        <Pizza
          titulo="Acertos x erros"
          fatias={[
            { nome: 'Certas', valor: acertos, cor: 'var(--ok)' },
            { nome: 'Erradas', valor: hist.length - acertos, cor: 'var(--nok)' },
          ]}
          centro={`${pct(acertos, hist.length)}%`}
          sub="de acerto"
        />
        <Pizza
          titulo="Onde você estudou"
          fatias={disciplinas.slice(0, 5).map((g, i) => ({ nome: g.nome, valor: g.t, cor: CORES_PIZZA[i] }))
            .concat(disciplinas.length > 5 ? [{ nome: 'Outras', valor: disciplinas.slice(5).reduce((s, g) => s + g.t, 0), cor: CORES_PIZZA[5] }] : [])}
          centro={String(hist.length)}
          sub="questões"
        />
      </div>

      <h2 className="subtitulo">
        Acerto por matéria <span className="nota">verde 70%+, amarelo 50–69%, vermelho abaixo de 50%</span>
      </h2>
      <div className="aneis">
        {disciplinas.map((g) => (
          <Anel key={g.nome} nome={g.nome} a={g.a} t={g.t} />
        ))}
      </div>

      {provas.length > 0 && (
        <>
          <h2 className="subtitulo">
            Provas e simulados <span className="nota">{provas.length} entregues</span>
          </h2>
          <ol className="historico">
            {provas
              .slice()
              .reverse()
              .map((p) => (
                <li key={p.em} className={p.nota * 2 >= p.max ? 'ok' : 'nok'}>
                  <span className="mono">{p.estilo ? `${p.nota} pts` : `${pct(p.acertos, p.total)}%`}</span>
                  <span className="historico-texto">
                    {p.estilo ? 'Prova no estilo da banca' : 'Simulado livre'} · {p.acertos}/{p.total} acertos
                    {p.respondidas < p.total && ` · ${p.total - p.respondidas} em branco`}
                    {p.materias && (
                      <span className="nota prova-materias">
                        {p.materias.map((m) => `${m.nome} ${m.a}/${m.total}`).join(' · ')}
                      </span>
                    )}
                  </span>
                  <time className="nota">{new Date(p.em).toLocaleDateString('pt-BR')}</time>
                </li>
              ))}
          </ol>
        </>
      )}

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

const CORES_PIZZA = ['#2f7d5b', '#c9822b', '#3b6ea8', '#b04a4a', '#7a5ba8', '#8a8478'];

/** Gráfico de pizza (rosca) em SVG, com legenda. */
function Pizza({
  titulo,
  fatias,
  centro,
  sub,
}: {
  titulo: string;
  fatias: { nome: string; valor: number; cor: string }[];
  centro: string;
  sub: string;
}) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  const r = 15.9155; // circunferência 100
  let acumulado = 0;
  return (
    <figure className="pizza">
      <figcaption className="rotulo">{titulo}</figcaption>
      <svg viewBox="0 0 42 42" role="img" aria-label={fatias.map((f) => `${f.nome}: ${pct(f.valor, total)}%`).join(', ')}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--linha)" strokeWidth="7" />
        {fatias.map((f) => {
          const p = (f.valor / total) * 100;
          const el = (
            <circle
              key={f.nome}
              cx="21"
              cy="21"
              r={r}
              fill="none"
              stroke={f.cor}
              strokeWidth="7"
              strokeDasharray={`${Math.max(0, p - (fatias.filter((x) => x.valor).length > 1 ? 1 : 0))} ${100 - p + (fatias.filter((x) => x.valor).length > 1 ? 1 : 0)}`}
              strokeDashoffset={25 - acumulado}
            />
          );
          acumulado += p;
          return el;
        })}
        <text x="21" y="22" textAnchor="middle" className="pizza-centro">
          {centro}
        </text>
        <text x="21" y="27" textAnchor="middle" className="pizza-sub">
          {sub}
        </text>
      </svg>
      <ul className="pizza-legenda">
        {fatias.map((f) => (
          <li key={f.nome}>
            <span className="legenda-cor" style={{ background: f.cor }} />
            <span className="pizza-nome">{f.nome}</span>
            <span className="mono nota">{f.valor} · {pct(f.valor, total)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

const corTaxa = (p: number) => (p >= 70 ? 'var(--ok)' : p >= 50 ? '#d19a2a' : 'var(--nok)');

/** Anel de porcentagem de acerto de uma matéria. */
function Anel({ nome, a, t }: { nome: string; a: number; t: number }) {
  const p = pct(a, t);
  return (
    <figure className="anel">
      <svg viewBox="0 0 42 42" role="img" aria-label={`${nome}: ${p}% de acerto`}>
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--linha)" strokeWidth="4" />
        <circle
          cx="21"
          cy="21"
          r="15.9155"
          fill="none"
          stroke={corTaxa(p)}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${p} ${100 - p}`}
          strokeDashoffset="25"
          className="anel-arco"
        />
        <text x="21" y="23.6" textAnchor="middle" className="anel-pct">
          {p}%
        </text>
      </svg>
      <figcaption>
        <span className="anel-nome">{nome}</span>
        <span className="nota mono">
          {a}/{t} certas
        </span>
      </figcaption>
    </figure>
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

/** Só a conta do Kauã (dono das anotações no Trello) vê essas dúvidas. */
const duvidasDaConta = () => (/^kaua/.test(contaSalva()?.usuario ?? '') ? DUVIDAS_TRELLO : []);

/** Pontos marcados como dúvida no Trello "Aulas: Planejamento ace" (lista REVISÃO DIÁRIA), lidos em 30/10/2026. */
const DUVIDAS_TRELLO = [
  { assunto: 'Focal, perifocal e UBV', disciplina: 'Específicos ACE', nota: 'errou 4x. UBV fica no ar, sem efeito residual.' },
  { assunto: 'Indicadores', disciplina: 'Saúde Pública', nota: 'letalidade × mortalidade, coorte × caso-controle (errou 3x).' },
  { assunto: 'LIRAa, IIP e Breteau', disciplina: 'Específicos ACE', nota: 'faixas do IIP: <1 satisfatório, 1–3,9 alerta, ≥4 risco.' },
  { assunto: 'Subordinação', disciplina: 'Português', nota: 'pendente: deixou as subordinadas em branco no Bloco 3.' },
  { assunto: 'Concordância nominal', disciplina: 'Português', nota: 'ANEXO / MEIO / MEIA / MESMO (errou 4x).' },
  { assunto: 'Concordância verbal', disciplina: 'Português', nota: 'núcleo do sujeito: "A equipe de agentes REALIZOU" (errou 3x).' },
  { assunto: 'Colocação pronominal', disciplina: 'Português', nota: 'palavra atrativa puxa o pronome (errou 3x).' },
  { assunto: 'Regência', disciplina: 'Português', nota: 'assistir, preferir, aspirar, chegar, obedecer (errou 3x).' },
  { assunto: 'Interpretação de texto', disciplina: 'Português', nota: 'LER O COMANDO: correta × falsa × EXCETO (custou 6 questões).' },
  { assunto: 'Topologias de rede', disciplina: 'Informática', nota: 'estrela = switch no centro (errou 3x).' },
  { assunto: 'Autores paraibanos', disciplina: 'Conhecimentos Gerais', nota: 'Lins, Américo, Augusto, Ariano (errou 3x).' },
  { assunto: 'Dados de Cuité', disciplina: 'Conhecimentos Gerais', nota: 'cerca de 3 das 5 questões de Gerais caem sobre o município (IBGE).' },
];

function Revisar(props: {
  questoes: Questao[];
  historico: Resposta[];
  anotacoes: Record<string, string>;
  onAnotar: (assunto: string, texto: string) => void;
  onTreinar: (assunto: string) => void;
  revisar: string[];
  onRevisar: (id: string) => void;
  onPraticar: () => void;
}) {
  const lista = props.questoes.filter((q) => props.revisar.includes(q.id));
  const porId = useMemo(() => new Map(props.questoes.map((q) => [q.id, q])), [props.questoes]);

  // Assuntos com erro, do pior para o melhor, com o "o que revisar" e o macete das questões erradas.
  const fracos = useMemo(() => {
    const m = new Map<string, { assunto: string; disciplina: string; t: number; e: number; dicas: Set<string>; resumo: string }>();
    props.historico.forEach((h) => {
      const q = porId.get(h.id);
      if (!q) return;
      const g = m.get(q.assunto) ?? { assunto: q.assunto, disciplina: q.disciplina, t: 0, e: 0, dicas: new Set<string>(), resumo: '' };
      g.t++;
      if (!h.certa) {
        g.e++;
        if (q.revisar) g.dicas.add(q.revisar);
        if (q.macete) g.dicas.add(`Macete: ${q.macete}`);
        if (!g.resumo && q.comentario) g.resumo = q.comentario.replace(/[*_#>`]/g, '').slice(0, 320);
      }
      m.set(q.assunto, g);
    });
    const duvida = (a: string) => duvidasDaConta().some((d) => d.assunto === a);
    duvidasDaConta().forEach((d) => {
      if (!m.has(d.assunto)) m.set(d.assunto, { assunto: d.assunto, disciplina: d.disciplina, t: 0, e: 0, dicas: new Set<string>(), resumo: '' });
      m.get(d.assunto)!.dicas.add(`Do seu Trello: ${d.nota}`);
    });
    // Dúvidas do Trello valem como 2 erros a mais na ordem.
    const peso = (g: { assunto: string; e: number }) => g.e + (duvida(g.assunto) ? 2 : 0);
    return Array.from(m.values())
      .filter((g) => g.e > 0 || duvida(g.assunto))
      .sort((x, y) => peso(y) - peso(x) || y.e / (y.t || 1) - x.e / (x.t || 1));
  }, [props.historico, porId]);

  if (!lista.length && !fracos.length) {
    return (
      <Vazio
        titulo="Nada para revisar ainda"
        texto="Os assuntos em que você errar aparecem aqui, com o que revisar e espaço para suas anotações. Use também a bandeira da questão para guardá-la."
      />
    );
  }
  return (
    <section className="coluna estreita">
      <p className="sobretitulo">Revisar</p>
      {fracos.length > 0 && (
        <>
          <h1 className="titulo">Estudar meus erros</h1>
          <p className="lead">Do assunto que você mais erra para o que menos erra. Leia o resumo, veja uma aula e anote: fica salvo na sua conta.</p>
          <ul className="lista-fracos">
            {fracos.map((g) => (
              <li key={g.assunto}>
                <details>
                  <summary>
                    <span>
                      <span className="lista-titulo">{g.assunto}</span> <span className="nota">{g.disciplina}</span>
                    </span>
                    <span className="mono nota">
                      {duvidasDaConta().some((d) => d.assunto === g.assunto) && <span className="tag tag-fraca">dúvida</span>}{' '}
                      {g.t ? `${g.e} ${g.e === 1 ? 'erro' : 'erros'} · ${pct(g.t - g.e, g.t)}%` : 'ainda sem questões'}
                    </span>
                  </summary>
                  {g.dicas.size > 0 && (
                    <ul className="dicas">
                      {Array.from(g.dicas)
                        .slice(0, 6)
                        .map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                    </ul>
                  )}
                  {g.resumo && (
                    <p className="resumo-assunto">
                      <span className="rotulo">Resumo</span> {g.resumo}
                      {g.resumo.length >= 320 && '…'}
                    </p>
                  )}
                  <div className="links-estudo">
                    <a
                      className="btn btn-sec"
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${g.assunto} ${g.disciplina} concurso aula`)}`}
                      target="_blank"
                      rel="noopener"
                    >
                      ▶ Aulas no YouTube
                    </a>
                    <a
                      className="btn btn-sec"
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${g.assunto} ${/Específicos|Saúde/.test(g.disciplina) ? 'site:gov.br' : 'resumo'}`)}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {/Específicos|Saúde/.test(g.disciplina) ? 'Fontes oficiais (gov.br)' : 'Resumos para ler'}
                    </a>
                  </div>
                  <label className="campo">
                    <span className="rotulo">Minhas anotações</span>
                    <textarea
                      rows={3}
                      value={props.anotacoes[g.assunto] ?? ''}
                      onChange={(e) => props.onAnotar(g.assunto, e.target.value)}
                      placeholder="O que você não pode esquecer deste assunto…"
                    />
                  </label>
                  <button className="btn btn-sec" onClick={() => props.onTreinar(g.assunto)}>
                    Treinar este assunto
                  </button>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
      {lista.length > 0 && (
        <>
          <h2 className="subtitulo">
            {lista.length} {lista.length === 1 ? 'questão marcada' : 'questões marcadas'}
          </h2>
          <button className="btn" onClick={props.onPraticar}>
            Refazer as marcadas
          </button>
        </>
      )}
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
