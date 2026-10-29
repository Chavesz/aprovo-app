import { useEffect, useRef, useState } from 'react';
import type { Edital as TEdital, Filtros, Questao } from './types';
import { usePersist } from './store';

interface Props {
  questoes: Questao[];
  geradas: Questao[];
  onBloco: (ids: string[]) => void;
  onNovas: (qs: Questao[]) => void;
  onPraticar: (f: Partial<Filtros>) => void;
}

async function chamarIA<T>(corpo: object): Promise<T> {
  const r = await fetch('/api/ia', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dados.erro ?? 'A IA não respondeu. Tente de novo.');
  return dados as T;
}

/* ---------- Ditado por voz (Web Speech API) ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reconhecedor = any;

function useDitado(onTexto: (t: string) => void) {
  const ref = useRef<Reconhecedor>(null);
  const [ouvindo, setOuvindo] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition;

  useEffect(() => () => ref.current?.stop(), []);

  const alternar = () => {
    if (ouvindo) {
      ref.current?.stop();
      return;
    }
    const rec: Reconhecedor = new Classe();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onTexto(e.results[i][0].transcript.trim());
      }
    };
    rec.onend = () => setOuvindo(false);
    rec.onerror = () => setOuvindo(false);
    ref.current = rec;
    rec.start();
    setOuvindo(true);
  };

  return { suportado: !!Classe, ouvindo, alternar };
}

/* ---------- Bloco de estudos ---------- */

const sem = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Liga o nome da disciplina no edital às disciplinas (e assuntos) dos bancos abertos.
const EQUIVALENCIAS: [RegExp, (q: Questao) => boolean][] = [
  [/portugues|lingua materna|interpretacao|redacao/, (q) => q.disciplina === 'Linguagens' && q.assunto !== 'Língua estrangeira'],
  [/matematica|raciocinio|logic/, (q) => q.disciplina === 'Matemática'],
  [/historia|geografia|atualidades|conhecimentos gerais|realidade|sociologia|filosofia(?! do direito)/, (q) => q.disciplina === 'Ciências Humanas'],
  [/ciencias|biologia|quimica|fisica|saude|meio ambiente/, (q) => q.disciplina === 'Ciências da Natureza'],
  [/ingles|espanhol|lingua estrangeira/, (q) => q.assunto === 'Língua estrangeira'],
  [/constitucional/, (q) => q.disciplina === 'Direito Constitucional'],
  [/administrativ/, (q) => q.disciplina === 'Direito Administrativo'],
  [/processual penal|processo penal/, (q) => q.disciplina === 'Direito Processual Penal'],
  [/penal/, (q) => q.disciplina === 'Direito Penal'],
  [/processual civil|processo civil/, (q) => q.disciplina === 'Direito Processual Civil'],
  [/civil/, (q) => q.disciplina === 'Direito Civil'],
  [/tributari/, (q) => q.disciplina === 'Direito Tributário'],
  [/processual do trabalho|processo do trabalho/, (q) => q.disciplina === 'Direito Processual do Trabalho'],
  [/trabalh/, (q) => q.disciplina === 'Direito do Trabalho'],
  [/ambiental/, (q) => q.disciplina === 'Direito Ambiental'],
  [/consumidor/, (q) => q.disciplina === 'Direito do Consumidor'],
  [/crianca|adolescente|eca/, (q) => q.disciplina === 'Direito da Criança e do Adolescente'],
  [/direitos humanos/, (q) => q.disciplina === 'Direitos Humanos'],
  [/etica/, (q) => q.disciplina === 'Ética Profissional'],
  [/empresarial|comercial/, (q) => q.disciplina === 'Direito Empresarial'],
];

function montarBloco(edital: TEdital, questoes: Questao[]) {
  const banca = sem(edital.banca);
  const porDisciplina = edital.disciplinas.map((d) => {
    const nome = sem(d.nome);
    const regra = EQUIVALENCIAS.find(([re]) => re.test(nome));
    const qs = questoes.filter(
      (q) => (q.ia && q.orgao === edital.orgao && q.disciplina === d.nome) || (!q.ia && regra !== undefined && regra[1](q))
    );
    // Primeiro as da mesma banca do edital, depois as geradas para ele, depois as demais.
    const peso = (q: Questao) => (sem(q.banca) === banca ? 0 : q.ia ? 1 : 2);
    qs.sort((x, y) => peso(x) - peso(y));
    return { nome: d.nome, qs, daBanca: qs.filter((q) => sem(q.banca) === banca).length, ia: qs.filter((q) => q.ia).length };
  });
  // Intercala as disciplinas para o bloco não virar uma sequência de uma matéria só.
  const ids: string[] = [];
  const max = Math.max(0, ...porDisciplina.map((d) => d.qs.length));
  for (let i = 0; i < max; i++) for (const d of porDisciplina) if (d.qs[i]) ids.push(d.qs[i].id);
  return { porDisciplina, ids };
}

function Bloco({ edital, questoes, onBloco }: { edital: TEdital; questoes: Questao[]; onBloco: (ids: string[]) => void }) {
  const { porDisciplina, ids } = montarBloco(edital, questoes);
  const semQuestoes = porDisciplina.filter((d) => d.qs.length === 0);
  return (
    <div className="bloco">
      <div className="bloco-topo">
        <div>
          <p className="rotulo">Bloco de estudos</p>
          <p className="bloco-total">
            {ids.length} <span>questões ligadas a este edital</span>
          </p>
        </div>
        <button className="btn" onClick={() => onBloco(ids)} disabled={!ids.length}>
          Estudar o bloco
        </button>
      </div>
      <ul className="bloco-lista">
        {porDisciplina.map((d) => (
          <li key={d.nome}>
            <span>{d.nome}</span>
            <span className="mono nota">
              {d.qs.length ? `${d.qs.length}${d.daBanca ? ` · ${d.daBanca} ${edital.banca}` : ''}${d.ia ? ` · ${d.ia} IA` : ''}` : 'gere com IA'}
            </span>
          </li>
        ))}
      </ul>
      {semQuestoes.length > 0 && (
        <p className="nota">
          Sem questões abertas para {semQuestoes.map((d) => d.nome).join(', ')}. Toque nos assuntos abaixo para gerar
          questões no estilo da {edital.banca}.
        </p>
      )}
    </div>
  );
}

/* ---------- Tela ---------- */

export default function Edital({ questoes, geradas, onNovas, onPraticar, onBloco }: Props) {
  const [editais, setEditais] = usePersist<TEdital[]>('cq:editais', []);
  const [ativoId, setAtivoId] = usePersist<string>('cq:edital-ativo', '');
  const [novo, setNovo] = useState(false);
  const ativo = editais.find((e) => e.id === ativoId) ?? editais[0];

  const salvar = (e: TEdital) => setEditais((l) => (l.some((x) => x.id === e.id) ? l.map((x) => (x.id === e.id ? e : x)) : [e, ...l]));

  if (!ativo || novo) {
    return (
      <NovoEdital
        temOutros={editais.length > 0}
        onCancelar={() => setNovo(false)}
        onPronto={(e) => {
          salvar(e);
          setAtivoId(e.id);
          setNovo(false);
        }}
      />
    );
  }

  return (
    <section className="coluna estreita">
      <div className="edital-topo">
        <p className="sobretitulo">Meu edital</p>
        <div className="edital-acoes">
          {editais.length > 1 && (
            <select value={ativo.id} onChange={(e) => setAtivoId(e.target.value)} aria-label="Trocar de edital">
              {editais.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-sec" onClick={() => setNovo(true)}>
            Novo edital
          </button>
        </div>
      </div>
      <h1 className="titulo">{ativo.nome}</h1>
      <dl className="ficha">
        <div><dt className="rotulo">Banca</dt><dd>{ativo.banca}</dd></div>
        <div><dt className="rotulo">Órgão</dt><dd>{ativo.orgao}</dd></div>
        <div><dt className="rotulo">Cargo</dt><dd>{ativo.cargo}</dd></div>
      </dl>

      <Bloco edital={ativo} questoes={questoes} onBloco={onBloco} />

      <Gerador edital={ativo} geradas={geradas} onNovas={onNovas} onPraticar={onPraticar} onSalvar={salvar} />

      <button
        className="link perigo"
        onClick={() => {
          if (!confirm(`Apagar o edital "${ativo.nome}"? As questões já geradas continuam no banco.`)) return;
          setEditais((l) => l.filter((e) => e.id !== ativo.id));
          setAtivoId('');
        }}
      >
        Apagar este edital
      </button>
    </section>
  );
}

function NovoEdital({ temOutros, onCancelar, onPronto }: { temOutros: boolean; onCancelar: () => void; onPronto: (e: TEdital) => void }) {
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const ditado = useDitado((t) => setTexto((v) => (v ? `${v} ${t}` : t)));

  const organizar = async () => {
    setErro('');
    setCarregando(true);
    try {
      const r = await chamarIA<{ concurso: Omit<TEdital, 'id' | 'disciplinas' | 'criadoEm'>; disciplinas: TEdital['disciplinas'] }>({
        acao: 'edital',
        texto,
      });
      onPronto({ ...r.concurso, disciplinas: r.disciplinas, id: `ed-${Date.now()}`, criadoEm: Date.now() });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <section className="coluna estreita">
      <p className="sobretitulo">Meu edital</p>
      <h1 className="titulo">Questões feitas para o seu concurso.</h1>
      <p className="lead">
        Cole o conteúdo programático do edital ou fale o que você vai prestar. A IA separa as disciplinas e os
        assuntos, e depois cria questões comentadas para cada um.
      </p>

      <label className="campo">
        <span className="rotulo">Edital ou pedido</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={8}
          placeholder="Ex.: Vou prestar o INSS, banca Cebraspe, cargo técnico. Quero estudar português, direito constitucional e previdenciário."
        />
      </label>

      <div className="edital-botoes">
        {ditado.suportado && (
          <button className={`btn btn-sec microfone ${ditado.ouvindo ? 'gravando' : ''}`} onClick={ditado.alternar} aria-pressed={ditado.ouvindo}>
            <IconMic /> {ditado.ouvindo ? 'Parar de ouvir' : 'Falar'}
          </button>
        )}
        <button className="btn" onClick={organizar} disabled={carregando || !texto.trim()}>
          {carregando ? 'Organizando…' : 'Organizar com IA'}
        </button>
      </div>
      {!ditado.suportado && <p className="nota">Para ditar por voz, use o Chrome ou o Edge.</p>}
      {ditado.ouvindo && <p className="nota" role="status">Ouvindo… fale com calma, o texto aparece acima.</p>}
      {erro && <p className="aviso" role="alert">{erro}</p>}
      {temOutros && (
        <button className="link" onClick={onCancelar}>
          Voltar ao edital atual
        </button>
      )}
    </section>
  );
}

function Gerador({
  edital,
  geradas,
  onNovas,
  onPraticar,
  onSalvar,
}: {
  edital: TEdital;
  geradas: Questao[];
  onNovas: (qs: Questao[]) => void;
  onPraticar: (f: Partial<Filtros>) => void;
  onSalvar: (e: TEdital) => void;
}) {
  const [sel, setSel] = useState<{ disciplina: string; assunto: string } | null>(null);
  const [opc, setOpc] = useState({ quantidade: 5, dificuldade: 'media', formato: 'multipla' });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [feitas, setFeitas] = useState(0);
  const [novoAssunto, setNovoAssunto] = useState<Record<string, string>>({});

  const contar = (d: string, a: string) =>
    geradas.filter((q) => q.orgao === edital.orgao && q.disciplina === d && q.assunto === a).length;

  const gerar = async () => {
    if (!sel) return;
    setErro('');
    setCarregando(true);
    try {
      const r = await chamarIA<{ questoes: Omit<Questao, 'id' | 'banca' | 'orgao' | 'prova' | 'ano' | 'numero' | 'disciplina' | 'assunto'>[] }>({
        acao: 'questoes',
        concurso: { banca: edital.banca, orgao: edital.orgao, cargo: edital.cargo },
        ...sel,
        ...opc,
      });
      const agora = Date.now();
      const qs: Questao[] = r.questoes.map((q, i) => ({
        ...q,
        id: `ia-${agora}-${i}`,
        banca: edital.banca,
        orgao: edital.orgao,
        prova: `IA · ${edital.nome}`,
        ano: new Date().getFullYear(),
        numero: i + 1,
        disciplina: sel.disciplina,
        assunto: sel.assunto,
        ia: true,
      }));
      onNovas(qs);
      setFeitas(qs.length);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  };

  const mudarAssuntos = (disciplina: string, f: (a: string[]) => string[]) =>
    onSalvar({ ...edital, disciplinas: edital.disciplinas.map((d) => (d.nome === disciplina ? { ...d, assuntos: f(d.assuntos) } : d)) });

  return (
    <>
      <h2 className="subtitulo">
        Conteúdo programático <span className="nota">toque num assunto para gerar questões</span>
      </h2>
      <ol className="disciplinas">
        {edital.disciplinas.map((d, n) => (
          <li key={d.nome}>
            <h3 className="disciplina-nome">
              <span className="mono nota">{String(n + 1).padStart(2, '0')}</span> {d.nome}
            </h3>
            <div className="assunto-chips">
              {d.assuntos.map((a) => {
                const qtd = contar(d.nome, a);
                const ativo = sel?.disciplina === d.nome && sel.assunto === a;
                return (
                  <span key={a} className={`assunto-chip ${ativo ? 'ativo' : ''}`}>
                    <button
                      onClick={() => {
                        setSel(ativo ? null : { disciplina: d.nome, assunto: a });
                        setFeitas(0);
                        setErro('');
                      }}
                      aria-pressed={ativo}
                    >
                      {a}
                      {qtd > 0 && <span className="mono assunto-qtd">{qtd}</span>}
                    </button>
                    <button className="remover" onClick={() => mudarAssuntos(d.nome, (l) => l.filter((x) => x !== a))} aria-label={`Remover ${a}`}>
                      ×
                    </button>
                  </span>
                );
              })}
              <form
                className="assunto-novo"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (novoAssunto[d.nome] ?? '').trim();
                  if (v) mudarAssuntos(d.nome, (l) => (l.includes(v) ? l : [...l, v]));
                  setNovoAssunto({ ...novoAssunto, [d.nome]: '' });
                }}
              >
                <input
                  value={novoAssunto[d.nome] ?? ''}
                  onChange={(e) => setNovoAssunto({ ...novoAssunto, [d.nome]: e.target.value })}
                  placeholder="+ assunto"
                  aria-label={`Adicionar assunto em ${d.nome}`}
                />
              </form>
            </div>

            {sel?.disciplina === d.nome && (
              <div className="painel-gerar" aria-live="polite">
                <p className="painel-titulo">{sel.assunto}</p>
                <div className="painel-opcoes">
                  <Escolha rotulo="Quantidade" valor={String(opc.quantidade)} opcoes={[['3', '3'], ['5', '5'], ['10', '10']]} onChange={(v) => setOpc({ ...opc, quantidade: Number(v) })} />
                  <Escolha rotulo="Dificuldade" valor={opc.dificuldade} opcoes={[['facil', 'Fácil'], ['media', 'Média'], ['dificil', 'Difícil']]} onChange={(v) => setOpc({ ...opc, dificuldade: v })} />
                  <Escolha rotulo="Formato" valor={opc.formato} opcoes={[['multipla', 'A a E'], ['certo-errado', 'Certo/Errado']]} onChange={(v) => setOpc({ ...opc, formato: v })} />
                </div>
                <div className="edital-botoes">
                  <button className="btn" onClick={gerar} disabled={carregando}>
                    {carregando ? 'Criando questões…' : 'Gerar questões'}
                  </button>
                  {contar(sel.disciplina, sel.assunto) > 0 && (
                    <button
                      className="btn btn-sec"
                      onClick={() => onPraticar({ orgao: edital.orgao, banca: edital.banca, disciplina: sel.disciplina, assunto: sel.assunto })}
                    >
                      Praticar {contar(sel.disciplina, sel.assunto)}
                    </button>
                  )}
                </div>
                {feitas > 0 && <p className="nota ok-texto" role="status">{feitas} questões novas no seu banco.</p>}
                {erro && <p className="aviso" role="alert">{erro}</p>}
              </div>
            )}
          </li>
        ))}
      </ol>
      {geradas.some((q) => q.orgao === edital.orgao) && (
        <button className="btn btn-grande" onClick={() => onPraticar({ orgao: edital.orgao, banca: edital.banca })}>
          Praticar todo o edital
        </button>
      )}
    </>
  );
}

function Escolha(props: { rotulo: string; valor: string; opcoes: [string, string][]; onChange: (v: string) => void }) {
  return (
    <fieldset className="campo">
      <legend className="rotulo">{props.rotulo}</legend>
      <div className="segmentado">
        {props.opcoes.map(([v, r]) => (
          <label key={v} className="chip">
            <input type="radio" name={props.rotulo} checked={props.valor === v} onChange={() => props.onChange(v)} />
            {r}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const IconMic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
