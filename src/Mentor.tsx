// Mentor com IA: perfil de estudo (onboarding), plano que se reajusta com o desempenho, chat e conteúdo por assunto.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Questao, Resposta } from './types';
import { usePersist } from './store';
import { contaSalva } from './nuvem';
import { EDITAL_CUITE } from './editalCuite';

export interface DisciplinaPerfil {
  nome: string;
  questoes: number;
  peso: number;
  assuntos: string[];
}
export interface PerfilMentor {
  concurso: string;
  cargo: string;
  banca: string;
  editalAberto: boolean;
  dataProva: string;
  horasDia: number;
  disciplinas: DisciplinaPerfil[];
  faceis: string[];
  dificeis: string[];
}

type Msg = { role: 'user' | 'assistant'; content: string };
type Uso = { plano: 'gratis' | 'pro'; usadas: number; limite: number; configurada?: boolean };

async function chamar<T>(corpo: object): Promise<T> {
  const r = await fetch('/api/mentor', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${contaSalva()?.token ?? ''}` },
    body: JSON.stringify(corpo),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.erro ?? 'O Mentor não respondeu. Tente de novo.'), d);
  return d as T;
}

const pct = (a: number, t: number) => (t ? Math.round((a / t) * 100) : 0);
const PERFIL_CUITE: PerfilMentor = {
  concurso: EDITAL_CUITE.nome,
  cargo: EDITAL_CUITE.cargo,
  banca: EDITAL_CUITE.banca,
  editalAberto: true,
  dataProva: '',
  horasDia: 3,
  disciplinas: EDITAL_CUITE.disciplinas.map((d) => ({
    nome: d.nome,
    assuntos: d.assuntos,
    ...(/Portug/.test(d.nome) ? { questoes: 15, peso: 2 } : /Espec|Saúde/.test(d.nome) ? { questoes: 15, peso: 4 } : { questoes: 5, peso: 1 }),
  })),
  faceis: [],
  dificeis: [],
};

/* ---------- Desempenho por disciplina/assunto, para o plano e para o contexto da IA ---------- */

function desempenho(historico: Resposta[], questoes: Questao[]) {
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const disc = new Map<string, { a: number; t: number }>();
  const ass = new Map<string, { disciplina: string; assunto: string; a: number; t: number }>();
  historico.forEach((h) => {
    const q = porId.get(h.id);
    if (!q) return;
    const d = disc.get(q.disciplina) ?? { a: 0, t: 0 };
    d.t++;
    if (h.certa) d.a++;
    disc.set(q.disciplina, d);
    if (/Prova real/.test(q.assunto)) return;
    const k = `${q.disciplina}|${q.assunto}`;
    const x = ass.get(k) ?? { disciplina: q.disciplina, assunto: q.assunto, a: 0, t: 0 };
    x.t++;
    if (h.certa) x.a++;
    ass.set(k, x);
  });
  return { disc, ass: Array.from(ass.values()), porId };
}

/** A disciplina do perfil casa com as do banco pelo nome (ex.: "Conhecimentos Específicos" ~ "Específicos ACE"). */
const casa = (perfil: string, banco: string) => {
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const a = n(perfil), b = n(banco);
  return a === b || a.includes(b) || b.includes(a) || (a.includes('espec') && b.includes('espec')) || (a.includes('portug') && b.includes('portug'));
};

/* ---------- Plano: prioridade = peso na prova × dificuldade (declarada e real) ---------- */

function montarPlano(perfil: PerfilMentor, historico: Resposta[], questoes: Questao[]) {
  const { disc, ass } = desempenho(historico, questoes);
  const itens = perfil.disciplinas.map((d) => {
    const real = Array.from(disc.entries()).filter(([k]) => casa(d.nome, k)).reduce((s, [, v]) => ({ a: s.a + v.a, t: s.t + v.t }), { a: 0, t: 0 });
    const taxa = real.t >= 5 ? real.a / real.t : null;
    const declarada = perfil.dificeis.includes(d.nome) ? 1.4 : perfil.faceis.includes(d.nome) ? 0.7 : 1;
    const fatorReal = taxa === null ? 1 : 1.5 - taxa; // 50% de acerto = 1, 90% = 0.6
    const pontos = Math.max(1, (d.questoes || 5) * (d.peso || 1));
    const fracos = ass
      .filter((x) => casa(d.nome, x.disciplina) && x.t >= 2 && x.a / x.t < 0.7)
      .sort((x, y) => x.a / x.t - y.a / y.t)
      .map((x) => x.assunto);
    const naoVistos = d.assuntos.filter((a) => !ass.some((x) => casa(d.nome, x.disciplina) && x.assunto === a));
    return { ...d, taxa, real, prioridade: pontos * declarada * fatorReal, fila: [...fracos, ...naoVistos, ...d.assuntos] };
  });
  const total = itens.reduce((s, i) => s + i.prioridade, 0) || 1;
  const minutos = Math.max(30, perfil.horasDia * 60);
  const dias =
    perfil.dataProva && new Date(perfil.dataProva + 'T12:00') > new Date()
      ? Math.ceil((new Date(perfil.dataProva + 'T12:00').getTime() - Date.now()) / 86400000)
      : null;
  const semana = Array.from({ length: Math.min(7, dias ?? 7) }, (_, n) => {
    const data = new Date(Date.now() + n * 86400000);
    const blocos = itens
      .map((i) => ({ nome: i.nome, min: Math.round(((i.prioridade / total) * minutos) / 5) * 5, assunto: i.fila[n % Math.max(1, i.fila.length)] ?? '' }))
      .filter((b) => b.min >= 10)
      .sort((a, b) => b.min - a.min);
    const ultimoDia = dias !== null && n === dias - 1;
    return { data, blocos: ultimoDia ? [{ nome: 'Revisão geral + prova no estilo da banca', min: minutos, assunto: 'Descanse e durma cedo' }] : blocos };
  });
  return { itens: itens.sort((a, b) => b.prioridade - a.prioridade), semana, dias, respostas: historico.length };
}

/* ---------- Contexto para a IA (o "RAG simples": perfil + edital + desempenho + erros recentes) ---------- */

function contexto(perfil: PerfilMentor, historico: Resposta[], questoes: Questao[], plano: ReturnType<typeof montarPlano>) {
  const { porId, ass } = desempenho(historico, questoes);
  const fracos = ass.filter((x) => x.t >= 2).sort((x, y) => x.a / x.t - y.a / y.t).slice(0, 10);
  const erros = historico
    .filter((h) => !h.certa)
    .slice(-10)
    .map((h) => {
      const q = porId.get(h.id);
      if (!q) return '';
      const alt = (l: string) => q.alternativas.find((a) => a.letra === l)?.texto.slice(0, 140) ?? '';
      return `- [${q.disciplina} › ${q.assunto}] ${q.comando.slice(0, 260)}\n  Marcou ${h.marcada || 'nada'}: ${alt(h.marcada)}\n  Certa ${q.gabarito}: ${alt(q.gabarito)}`;
    })
    .filter(Boolean);
  return [
    `Concurso: ${perfil.concurso} · Cargo: ${perfil.cargo} · Banca: ${perfil.banca}`,
    `Prova: ${perfil.dataProva || 'data não definida'}${plano.dias !== null ? ` (faltam ${plano.dias} dias)` : ''} · Estuda ${perfil.horasDia}h por dia`,
    `Tem facilidade em: ${perfil.faceis.join(', ') || '—'} · Dificuldade em: ${perfil.dificeis.join(', ') || '—'}`,
    `Edital: ${perfil.disciplinas.map((d) => `${d.nome} (${d.questoes} questões, peso ${d.peso}): ${d.assuntos.slice(0, 15).join('; ')}`).join('\n')}`,
    `Acerto por disciplina: ${plano.itens.map((i) => `${i.nome} ${i.taxa === null ? 'sem dados' : pct(i.real.a, i.real.t) + '% de ' + i.real.t}`).join(' · ')}`,
    `Assuntos mais fracos: ${fracos.map((x) => `${x.assunto} (${x.a}/${x.t})`).join(', ') || '—'}`,
    `Plano de hoje: ${plano.semana[0]?.blocos.map((b) => `${b.nome} ${b.min}min (${b.assunto})`).join('; ')}`,
    `Últimos erros:\n${erros.join('\n') || '—'}`,
  ].join('\n');
}

/* ---------- Resumo em PDF (a IA escreve, o navegador salva como PDF) ---------- */

function mdParaHtml(md: string) {
  const esc = md.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc
    .split(/\n{2,}/)
    .map((b) => {
      if (/^\|/.test(b)) {
        const linhas = b.split('\n').filter((l) => !/^\|\s*-/.test(l));
        return `<table>${linhas.map((l, i) => `<tr>${l.split('|').slice(1, -1).map((c) => (i ? `<td>${c.trim()}</td>` : `<th>${c.trim()}</th>`)).join('')}</tr>`).join('')}</table>`;
      }
      if (/^#{1,3} /.test(b)) return b.replace(/^(#{1,3}) (.*)$/gm, (_, h, t) => `<h${h.length}>${t}</h${h.length}>`);
      if (/^\s*[-*] /m.test(b)) return `<ul>${b.split('\n').map((l) => `<li>${l.replace(/^\s*[-*] /, '')}</li>`).join('')}</ul>`;
      return `<p>${b.replace(/\n/g, '<br>')}</p>`;
    })
    .join('')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function abrirPdf(titulo: string, md: string) {
  const w = window.open('', '_blank');
  if (!w) return alert('Libere as janelas pop-up para baixar o resumo.');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo} · Aprovô</title>
<style>body{font:15px/1.55 Georgia,serif;max-width:720px;margin:32px auto;padding:0 20px;color:#1d1b16}h1,h2,h3{font-family:system-ui,sans-serif}
table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f3efe6}
.rodape{margin-top:32px;font:12px system-ui;color:#777}@media print{.rodape{position:fixed;bottom:0}}</style></head>
<body>${mdParaHtml(md)}<p class="rodape">Resumo gerado pelo Mentor do Aprovô · aprovoapp.netlify.app</p>
<script>setTimeout(()=>print(),400)</script></body></html>`);
  w.document.close();
}

/* ---------- Tela ---------- */

export default function Mentor({ questoes, historico, onPraticar }: { questoes: Questao[]; historico: Resposta[]; onPraticar: (disciplina: string, assunto: string) => void }) {
  const ehKaua = /^(kaua|chavin)/.test(contaSalva()?.usuario ?? '');
  const [perfil, setPerfil] = usePersist<PerfilMentor | null>('cq:mentor', null);
  const [editando, setEditando] = useState(false);
  const [uso, setUso] = useState<Uso | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    chamar<Uso>({ acao: 'uso' }).then(setUso).catch(() => undefined);
  }, []);

  const plano = useMemo(() => (perfil ? montarPlano(perfil, historico, questoes) : null), [perfil, historico, questoes]);

  if (!perfil || editando) {
    return (
      <Onboarding
        inicial={perfil ?? (ehKaua ? PERFIL_CUITE : null)}
        onPronto={(p) => {
          setPerfil(p);
          setEditando(false);
        }}
        onUso={setUso}
      />
    );
  }

  return (
    <section className="coluna mentor">
      <p className="sobretitulo">Mentor com IA</p>
      <h1 className="titulo">
        {plano?.dias !== null && plano?.dias !== undefined ? `Faltam ${plano.dias} dias.` : 'Seu plano de estudos.'}
      </h1>
      <p className="lead">
        {perfil.cargo} · {perfil.concurso} · {perfil.banca}.{' '}
        <button className="link" onClick={() => setEditando(true)}>
          Editar perfil
        </button>
      </p>
      {uso && uso.configurada === false && (
        <p className="aviso">O Mentor ainda não está ligado: falta configurar a ANTHROPIC_API_KEY na Netlify. O plano abaixo funciona mesmo assim.</p>
      )}
      {aviso && <p className="aviso">{aviso}</p>}

      {plano && <Plano plano={plano} perfil={perfil} onPraticar={onPraticar} onAviso={setAviso} onUso={setUso} />}
      <Chat ctx={() => (plano ? contexto(perfil, historico, questoes, plano) : '')} uso={uso} onUso={setUso} />
      <Planos uso={uso} />
    </section>
  );
}

function Onboarding({ inicial, onPronto, onUso }: { inicial: PerfilMentor | null; onPronto: (p: PerfilMentor) => void; onUso: (u: Uso) => void }) {
  const [p, setP] = useState<PerfilMentor>(
    inicial ?? { concurso: '', cargo: '', banca: '', editalAberto: true, dataProva: '', horasDia: 2, disciplinas: [], faceis: [], dificeis: [] }
  );
  const [fonte, setFonte] = useState('');
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState('');
  const arquivo = useRef<HTMLInputElement>(null);
  const set = (x: Partial<PerfilMentor>) => setP((v) => ({ ...v, ...x }));

  async function lerEdital(pdf?: File) {
    setLendo(true);
    setErro('');
    try {
      const corpo: Record<string, string> = { acao: 'edital' };
      if (pdf) {
        const b = new Uint8Array(await pdf.arrayBuffer());
        let s = '';
        for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
        corpo.pdf = btoa(s);
      } else if (/^https?:\/\//.test(fonte.trim())) corpo.url = fonte.trim();
      else corpo.texto = fonte;
      const r = await chamar<{ edital: Omit<PerfilMentor, 'editalAberto' | 'horasDia' | 'faceis' | 'dificeis'> } & Uso>(corpo);
      onUso(r);
      set({ ...r.edital, dataProva: r.edital.dataProva || p.dataProva });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLendo(false);
    }
  }

  const alternar = (lista: 'faceis' | 'dificeis', nome: string) => {
    const outra = lista === 'faceis' ? 'dificeis' : 'faceis';
    set({ [lista]: p[lista].includes(nome) ? p[lista].filter((x) => x !== nome) : [...p[lista], nome], [outra]: p[outra].filter((x) => x !== nome) });
  };

  return (
    <section className="coluna estreita mentor">
      <p className="sobretitulo">Mentor com IA</p>
      <h1 className="titulo">Vamos montar seu plano.</h1>
      <p className="lead">Responda rapidinho. O Mentor usa isso e o seu desempenho nas questões para dizer o que estudar a cada dia.</p>

      <div className="mentor-form">
        <label>
          Qual concurso?
          <input value={p.concurso} onChange={(e) => set({ concurso: e.target.value })} placeholder="Ex.: Prefeitura de Cuité de Mamanguape 2026" />
        </label>
        <label>
          Qual cargo?
          <input value={p.cargo} onChange={(e) => set({ cargo: e.target.value })} placeholder="Ex.: Agente de Combate às Endemias" />
        </label>
        <label>
          Banca
          <input value={p.banca} onChange={(e) => set({ banca: e.target.value })} placeholder="Ex.: EDUCA PB" />
        </label>

        <fieldset>
          <legend>O edital já saiu?</legend>
          <div className="segmentado">
            <button aria-pressed={p.editalAberto} onClick={() => set({ editalAberto: true })}>Sim</button>
            <button aria-pressed={!p.editalAberto} onClick={() => set({ editalAberto: false })}>Ainda não</button>
          </div>
        </fieldset>

        <div className="mentor-edital">
          <p className="rotulo">{p.editalAberto ? 'Cole o link ou o texto do edital, ou envie o PDF' : 'Cole o edital anterior ou diga as matérias que costumam cair'}</p>
          <textarea rows={4} value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="https://… ou o conteúdo programático" />
          <div className="linha-botoes">
            <button className="btn" disabled={lendo || !fonte.trim()} onClick={() => lerEdital()}>
              {lendo ? 'Lendo o edital…' : 'Ler com a IA'}
            </button>
            <button className="btn btn-sec" disabled={lendo} onClick={() => arquivo.current?.click()}>
              Enviar PDF
            </button>
            <input ref={arquivo} type="file" accept="application/pdf" hidden onChange={(e) => e.target.files?.[0] && lerEdital(e.target.files[0])} />
          </div>
          {erro && <p className="aviso">{erro}</p>}
        </div>

        {p.disciplinas.length > 0 && (
          <div className="mentor-disciplinas">
            <p className="rotulo">Matérias e pesos (dá para corrigir)</p>
            {p.disciplinas.map((d, i) => (
              <div key={d.nome + i} className="mentor-disc">
                <span>{d.nome}</span>
                <label>
                  questões
                  <input type="number" min={0} value={d.questoes} onChange={(e) => set({ disciplinas: p.disciplinas.map((x, j) => (j === i ? { ...x, questoes: +e.target.value } : x)) })} />
                </label>
                <label>
                  peso
                  <input type="number" min={0} step={0.5} value={d.peso} onChange={(e) => set({ disciplinas: p.disciplinas.map((x, j) => (j === i ? { ...x, peso: +e.target.value } : x)) })} />
                </label>
                <span className="mentor-chips">
                  <button className={p.faceis.includes(d.nome) ? 'chip ok' : 'chip'} onClick={() => alternar('faceis', d.nome)}>fácil pra mim</button>
                  <button className={p.dificeis.includes(d.nome) ? 'chip nok' : 'chip'} onClick={() => alternar('dificeis', d.nome)}>tenho dificuldade</button>
                </span>
              </div>
            ))}
          </div>
        )}

        <label>
          Data da prova
          <input type="date" value={p.dataProva} onChange={(e) => set({ dataProva: e.target.value })} />
        </label>
        <label>
          Quantas horas por dia você consegue estudar? <strong>{p.horasDia}h</strong>
          <input type="range" min={0.5} max={10} step={0.5} value={p.horasDia} onChange={(e) => set({ horasDia: +e.target.value })} />
        </label>

        <button className="btn" disabled={!p.cargo || !p.disciplinas.length} onClick={() => onPronto(p)}>
          Gerar meu plano
        </button>
        {!p.disciplinas.length && <p className="nota">Leia o edital com a IA para preencher as matérias.</p>}
      </div>
    </section>
  );
}

function Plano({ plano, perfil, onPraticar, onAviso, onUso }: {
  plano: ReturnType<typeof montarPlano>;
  perfil: PerfilMentor;
  onPraticar: (d: string, a: string) => void;
  onAviso: (t: string) => void;
  onUso: (u: Uso) => void;
}) {
  const [resumos, setResumos] = usePersist<Record<string, string>>('cq:resumos', {});
  const [gerando, setGerando] = useState('');
  async function resumo(disciplina: string, assunto: string) {
    const k = `${disciplina}|${assunto}`;
    if (resumos[k]) return abrirPdf(assunto, resumos[k]);
    setGerando(k);
    try {
      const r = await chamar<{ texto: string } & Uso>({ acao: 'resumo', disciplina, assunto, cargo: perfil.cargo, banca: perfil.banca });
      onUso(r);
      setResumos((x) => ({ ...x, [k]: r.texto }));
      abrirPdf(assunto, r.texto);
    } catch (e) {
      onAviso((e as Error).message);
    } finally {
      setGerando('');
    }
  }
  const busca = (s: string) => encodeURIComponent(`${s} ${perfil.banca} concurso`);
  return (
    <>
      <h2 className="subtitulo">
        Prioridades <span className="nota">peso na prova × dificuldade · reajustado com {plano.respostas} respostas suas</span>
      </h2>
      <ol className="mentor-prioridades">
        {plano.itens.map((i) => (
          <li key={i.nome}>
            <strong>{i.nome}</strong>
            <span className="nota">
              {i.questoes} questões × peso {i.peso} · {i.taxa === null ? 'ainda sem dados' : `${pct(i.real.a, i.real.t)}% de acerto`}
            </span>
          </li>
        ))}
      </ol>

      <h2 className="subtitulo">Esta semana</h2>
      <div className="mentor-semana">
        {plano.semana.map((d, n) => (
          <article key={n} className={n === 0 ? 'mentor-dia hoje' : 'mentor-dia'}>
            <p className="rotulo">{n === 0 ? 'Hoje' : d.data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
            {d.blocos.map((b) => {
              const k = `${b.nome}|${b.assunto}`;
              return (
                <div key={b.nome} className="mentor-bloco">
                  <span className="mono">{b.min} min</span>
                  <span>
                    <strong>{b.nome}</strong>
                    {b.assunto && <span className="nota"> · {b.assunto}</span>}
                  </span>
                  {n === 0 && b.assunto && !/Revisão geral/.test(b.nome) && (
                    <span className="mentor-links">
                      <button className="link" onClick={() => onPraticar(b.nome, b.assunto)}>Questões</button>
                      <button className="link" disabled={gerando === k} onClick={() => resumo(b.nome, b.assunto)}>
                        {gerando === k ? 'Gerando…' : 'Resumo PDF'}
                      </button>
                      <a className="link" target="_blank" rel="noopener" href={`https://www.youtube.com/results?search_query=${busca(b.assunto)}`}>Aula no YouTube</a>
                      {/Espec|Saúde|SUS/i.test(b.nome) && (
                        <a className="link" target="_blank" rel="noopener" href={`https://www.google.com/search?q=${encodeURIComponent(b.assunto + ' site:gov.br')}`}>Fonte oficial</a>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </>
  );
}

const SUGESTOES = ['Explique meus últimos erros', 'O que eu estudo hoje?', 'Me dê um macete para o assunto que mais erro', 'Como está meu desempenho?'];

function Chat({ ctx, uso, onUso }: { ctx: () => string; uso: Uso | null; onUso: (u: Uso) => void }) {
  const [msgs, setMsgs] = usePersist<Msg[]>('cq:mentor-chat', []);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, pensando]);

  async function enviar(t: string) {
    if (!t.trim() || pensando) return;
    const novas: Msg[] = [...msgs, { role: 'user', content: t.trim() }];
    setMsgs(novas);
    setTexto('');
    setPensando(true);
    try {
      const r = await chamar<{ texto: string } & Uso>({ acao: 'chat', mensagens: novas, contexto: ctx() });
      onUso(r);
      setMsgs([...novas, { role: 'assistant', content: r.texto }]);
    } catch (e) {
      setMsgs([...novas, { role: 'assistant', content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setPensando(false);
    }
  }

  return (
    <>
      <h2 className="subtitulo">
        Fale com o Mentor {uso && <span className="nota">{uso.usadas}/{uso.limite} mensagens hoje · plano {uso.plano === 'pro' ? 'Pro' : 'grátis'}</span>}
      </h2>
      <div className="mentor-chat">
        {msgs.length === 0 && <p className="nota">Pergunte qualquer dúvida. O Mentor vê seu edital, seus erros e seu plano.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`balao ${m.role}`} dangerouslySetInnerHTML={{ __html: mdParaHtml(m.content) }} />
        ))}
        {pensando && <div className="balao assistant nota">Pensando…</div>}
        <div ref={fim} />
      </div>
      <div className="mentor-sugestoes">
        {SUGESTOES.map((s) => (
          <button key={s} className="chip" onClick={() => enviar(s)} disabled={pensando}>{s}</button>
        ))}
        {msgs.length > 0 && <button className="link" onClick={() => setMsgs([])}>Limpar conversa</button>}
      </div>
      <form className="mentor-envio" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: não entendi a diferença entre IIP e Breteau" />
        <button className="btn" disabled={pensando || !texto.trim()}>Enviar</button>
      </form>
    </>
  );
}

function Planos({ uso }: { uso: Uso | null }) {
  return (
    <div className="mentor-planos">
      <article className={uso?.plano !== 'pro' ? 'atual' : ''}>
        <p className="rotulo">Grátis</p>
        <p>Plano de estudos, questões, simulados e <strong>15 mensagens</strong> do Mentor por dia.</p>
      </article>
      <article className={uso?.plano === 'pro' ? 'atual' : ''}>
        <p className="rotulo">Pro · em breve</p>
        <p>Mentor quase ilimitado (300 por dia), resumos em PDF à vontade e plano revisado toda semana.</p>
        {uso?.plano !== 'pro' && <p className="nota">A assinatura ainda não está aberta.</p>}
      </article>
    </div>
  );
}
