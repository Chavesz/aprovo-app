// Batalha entre amigos: as mesmas 10 ou 20 questões para todos, link pelo WhatsApp e placar ao vivo.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Questao, Resposta } from './types';
import { contaSalva } from './nuvem';
import { comandoExibido } from './md';

type Jogador = { nome: string; respostas: (boolean | null)[]; inicio: number; fim?: number };
type Dados = { codigo: string; titulo: string; ids: string[]; criador: string; jogadores: Record<string, Jogador>; eu: string };

const api = async <T,>(metodo: 'GET' | 'POST', corpo?: object, query = ''): Promise<T> => {
  const r = await fetch(`/api/batalha${query}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${contaSalva()?.token ?? ''}` },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erro ?? 'Não foi possível falar com o servidor.');
  return d as T;
};
const feitas = (j: Jogador) => j.respostas.filter((r) => r !== null).length;
const acertos = (j: Jogador) => j.respostas.filter((r) => r === true).length;
const tempo = (j: Jogador) => ((j.fim ?? Date.now()) - j.inicio) / 1000;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const embaralhar = <T,>(l: T[]) => [...l].sort(() => Math.random() - 0.5);

export default function Batalha({ questoes, codigoInicial, titulo, onResponder }: { questoes: Questao[]; codigoInicial?: string; titulo: string; onResponder: (r: Resposta) => void }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState('');
  const [criando, setCriando] = useState(false);
  const [jogando, setJogando] = useState(false);
  const [marcada, setMarcada] = useState<string | null>(null);
  const [historico, setHistorico] = useState<{ vitorias: number; lista: { codigo: string; titulo: string; n: number; criadaEm: number; jogadores: number }[] } | null>(null);
  const [codigoDigitado, setCodigoDigitado] = useState('');
  const porId = useMemo(() => new Map(questoes.map((q) => [q.id, q])), [questoes]);
  const timer = useRef<number>();

  useEffect(() => { api<NonNullable<typeof historico>>('GET', undefined, '?minhas=1').then(setHistorico).catch(() => undefined); }, [dados?.codigo]);
  useEffect(() => { if (codigoInicial) entrar(codigoInicial); }, [codigoInicial]); // eslint-disable-line react-hooks/exhaustive-deps
  // Placar ao vivo: atualiza a cada 4 s enquanto a batalha está aberta.
  useEffect(() => {
    if (!dados) return;
    timer.current = window.setInterval(() => api<Dados>('GET', undefined, `?codigo=${dados.codigo}`).then((d) => setDados((v) => (v ? { ...d, jogadores: { ...d.jogadores, [d.eu]: v.jogadores[d.eu] ?? d.jogadores[d.eu] } } : d))).catch(() => undefined), 4000);
    return () => window.clearInterval(timer.current);
  }, [dados?.codigo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function criar(n: number) {
    setErro(''); setCriando(true);
    try {
      const pool = questoes.filter((q) => !q.ia && q.alternativas.length >= 2 && q.gabarito);
      const ids = embaralhar(pool).slice(0, n).map((q) => q.id);
      const { codigo } = await api<{ codigo: string }>('POST', { acao: 'criar', ids, titulo: `${titulo} · ${n} questões` });
      await entrar(codigo);
    } catch (e) { setErro((e as Error).message); }
    setCriando(false);
  }
  // Desafio do dia: 5 questões oficiais sorteadas pela data (iguais para todos), placar de todo mundo.
  async function diario() {
    setErro(''); setCriando(true);
    try {
      const dia = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
      let semente = [...dia].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
      const rnd = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 2 ** 32);
      const pool = questoes.filter((q) => !q.ia && q.alternativas.length >= 2 && q.gabarito).sort((a, b) => a.id.localeCompare(b.id));
      const ids: string[] = [];
      while (ids.length < 5 && ids.length < pool.length) { const q = pool[Math.floor(rnd() * pool.length)]; if (!ids.includes(q.id)) ids.push(q.id); }
      setDados(await api<Dados>('POST', { acao: 'diario', ids }));
    } catch (e) { setErro((e as Error).message); }
    setCriando(false);
  }
  async function entrar(codigo: string) {
    setErro('');
    try { setDados(await api<Dados>('POST', { acao: 'entrar', codigo: codigo.trim().toUpperCase() })); } catch (e) { setErro((e as Error).message); }
  }

  const meu = dados?.jogadores[dados.eu];
  const i = meu ? meu.respostas.findIndex((r) => r === null) : -1;
  const q = dados && i >= 0 ? porId.get(dados.ids[i]) : undefined;

  async function responder(letra: string) {
    if (!dados || !q || marcada) return;
    setMarcada(letra);
    const certa = letra === q.gabarito;
    onResponder({ id: q.id, marcada: letra, certa, em: Date.now() });
    setTimeout(async () => {
      try { setDados(await api<Dados>('POST', { acao: 'responder', codigo: dados.codigo, i, certa })); } catch (e) { setErro((e as Error).message); }
      setMarcada(null);
    }, 700);
  }

  const link = dados ? `${location.origin}/?batalha=${dados.codigo}` : '';
  const convidar = () => {
    const texto = `Te desafio no Aprovô: ${dados?.ids.length} questões de ${titulo}. Quem acertar mais vence!`;
    if (navigator.share) navigator.share({ title: 'Batalha no Aprovô', text: texto, url: link }).catch(() => undefined);
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${link}`)}`, '_blank');
  };

  const placar = dados ? Object.entries(dados.jogadores).sort(([, a], [, b]) => acertos(b) - acertos(a) || tempo(a) - tempo(b)) : [];
  const todosTerminaram = placar.length > 1 && placar.every(([, j]) => j.fim);

  if (!dados) {
    return (
      <section className="coluna estreita batalha">
        <p className="sobretitulo">Batalha</p>
        <h1 className="titulo">Desafie um amigo.</h1>
        <p className="lead">Mesmas questões para os dois, placar ao vivo. Quem acertar mais vence; no empate, quem foi mais rápido.</p>
        <button className="btn btn-grande batalha-diario" disabled={criando} onClick={diario}>☀️ Desafio do dia · 5 questões contra todo mundo</button>
        <div className="batalha-criar">
          <button className="btn btn-grande" disabled={criando} onClick={() => criar(10)}>{criando ? 'Montando…' : 'Batalha de 10 questões'}</button>
          <button className="btn btn-sec btn-grande" disabled={criando} onClick={() => criar(20)}>20 questões</button>
        </div>
        <form className="batalha-codigo" onSubmit={(e) => { e.preventDefault(); if (codigoDigitado.trim()) entrar(codigoDigitado); }}>
          <input value={codigoDigitado} onChange={(e) => setCodigoDigitado(e.target.value)} placeholder="Recebeu um código? Ex.: K7Q2MX" aria-label="Código da batalha" maxLength={8} />
          <button className="btn btn-sec">Entrar</button>
        </form>
        {erro && <p className="aviso" role="alert">{erro}</p>}
        {historico && historico.lista.length > 0 && (
          <div className="batalha-historico">
            <p className="rotulo">Suas batalhas · {historico.vitorias} {historico.vitorias === 1 ? 'vitória' : 'vitórias'}</p>
            <ul>{historico.lista.slice(0, 6).map((b) => (
              <li key={b.codigo}><button className="link" onClick={() => entrar(b.codigo)}>{b.titulo}</button> <span className="nota">{b.jogadores} {b.jogadores === 1 ? 'pessoa' : 'pessoas'} · {new Date(b.criadaEm).toLocaleDateString('pt-BR')}</span></li>
            ))}</ul>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="coluna estreita batalha">
      <p className="sobretitulo">Batalha · código {dados.codigo}</p>
      <h1 className="titulo">{dados.titulo}</h1>

      <ol className="placar" aria-label="Placar ao vivo">
        {placar.map(([u, j], pos) => (
          <li key={u} className={u === dados.eu ? 'eu' : ''}>
            <span className="placar-pos">{todosTerminaram && pos === 0 ? '🏆' : `${pos + 1}º`}</span>
            <span className="placar-nome">{u === dados.eu ? 'Você' : j.nome}<small>{j.fim ? `terminou em ${mmss(tempo(j))}` : `${feitas(j)}/${dados.ids.length} respondidas`}</small></span>
            <span className="placar-barra" aria-hidden><span style={{ width: `${(feitas(j) / dados.ids.length) * 100}%` }} /></span>
            <strong className="mono">{acertos(j)}</strong>
          </li>
        ))}
      </ol>
      {placar.length < 2 && <p className="aviso-nota">Ainda só você aqui. Mande o link para alguém entrar na batalha.</p>}
      <div className="linha-botoes">
        <button className="btn" onClick={convidar}>Chamar no WhatsApp</button>
        <button className="btn btn-sec" onClick={() => navigator.clipboard?.writeText(link)}>Copiar link</button>
        <button className="link" onClick={() => { setDados(null); setJogando(false); }}>Voltar</button>
      </div>

      {meu && i >= 0 && !jogando && <button className="btn btn-grande batalha-go" onClick={() => setJogando(true)}>{feitas(meu) ? 'Continuar respondendo' : 'Começar agora'}</button>}
      {jogando && q && (
        <article className="batalha-questao">
          <p className="rotulo">Questão {i + 1} de {dados.ids.length} · {q.disciplina} · {q.banca}</p>
          <p className="batalha-comando">{comandoExibido(q.comando).replace(/\*\*/g, '').slice(0, 1200)}</p>
          <div className="bot-alts">
            {q.alternativas.map((a) => (
              <button key={a.letra} className={`alt ${marcada ? (a.letra === q.gabarito ? 'ok' : a.letra === marcada ? 'nok' : '') : ''}`} disabled={!!marcada} onClick={() => responder(a.letra)}>
                <b>{a.letra}</b> {a.texto}
              </button>
            ))}
          </div>
        </article>
      )}
      {jogando && !q && i >= 0 && <p className="aviso">Esta questão não está no seu banco. Atualize o app e tente de novo.</p>}
      {meu?.fim && (
        <div className="batalha-fim">
          <p><strong>Você fez {acertos(meu)} de {dados.ids.length}</strong> em {mmss(tempo(meu))}.</p>
          {todosTerminaram ? <p>{placar[0][0] === dados.eu ? 'Vitória! 🏆' : `${placar[0][1].nome} venceu. Bora a revanche?`}</p> : <p className="nota">Esperando os outros terminarem. O placar atualiza sozinho.</p>}
          <div className="linha-botoes">
            <button className="btn" onClick={() => {
              // Resultado em quadradinhos (🟩 acerto, 🟥 erro), sem revelar as questões.
              const grade = meu.respostas.map((r) => (r ? '🟩' : '🟥')).join('');
              const pos = placar.findIndex(([u]) => u === dados.eu) + 1;
              const texto = `${dados.titulo} no Aprovô
${grade} ${acertos(meu)}/${dados.ids.length} em ${mmss(tempo(meu))} · ${pos}º de ${placar.length}
Consegue me passar?`;
              if (navigator.share) navigator.share({ text: texto, url: link }).catch(() => undefined);
              else window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${link}`)}`, '_blank');
            }}>Compartilhar resultado</button>
            <button className="btn btn-sec" onClick={() => { setDados(null); setJogando(false); }}>Nova batalha</button>
          </div>
        </div>
      )}
      {erro && <p className="aviso" role="alert">{erro}</p>}
    </section>
  );
}
