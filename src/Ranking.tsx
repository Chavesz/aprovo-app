import { useEffect, useState } from 'react';
import type { Conta } from './nuvem';

interface Linha {
  usuario: string;
  eu: boolean;
  nome: string;
  total: number;
  acertos: number;
  hoje: number;
  acertosHoje: number;
  provas: number;
  provasHoje: number;
  avulsas?: number;
  acertosAvulsas?: number;
  provasEstilo?: number;
  melhorNota?: number;
  semana?: number;
  notaSemana?: number;
  ultimaNota?: number;
  concurso?: string;
  uf?: string;
  semanaQ?: number;
  semanaA?: number;
}

interface Criterio {
  id: string;
  rotulo: string;
  explica: string;
  unidade: string;
  /** Valor que ordena o ranking; negativo = fica fora. */
  valor: (l: Linha) => number;
  /** Número grande mostrado na linha. */
  destaque: (l: Linha) => string;
  detalhe: (l: Linha) => string;
}

const taxa = (a: number, t: number) => (t ? Math.round((a / t) * 100) : 0);

const CRITERIOS: Criterio[] = [
  {
    id: 'semana7',
    rotulo: 'Últimos 7 dias',
    explica: 'Acertos nos últimos 7 dias. Zera aos poucos: quem estuda toda semana fica no topo.',
    unidade: 'acertos',
    valor: (l) => (l.semanaQ ? l.semanaA ?? 0 : -1),
    destaque: (l) => String(l.semanaA ?? 0),
    detalhe: (l) => `${l.semanaQ ?? 0} respondidas na semana · ${taxa(l.semanaA ?? 0, l.semanaQ ?? 0)}%`,
  },
  {
    id: 'geral',
    rotulo: 'Geral',
    explica: 'Total de acertos desde o começo, somando questões avulsas e provas.',
    unidade: 'acertos',
    valor: (l) => l.acertos,
    destaque: (l) => String(l.acertos),
    detalhe: (l) => `${l.total} respondidas · ${taxa(l.acertos, l.total)}% de acerto`,
  },
  {
    id: 'prova',
    rotulo: 'Prova EDUCA PB',
    explica: 'Maior nota na prova no estilo da banca: 40 questões, nota de 0 a 100.',
    unidade: 'pontos',
    valor: (l) => (l.melhorNota ? l.melhorNota : -1),
    destaque: (l) => String(l.melhorNota ?? 0),
    detalhe: (l) => `${l.provasEstilo ?? 0} ${l.provasEstilo === 1 ? 'prova feita' : 'provas feitas'} · última ${l.ultimaNota ?? 0}`,
  },
  {
    id: 'semana',
    rotulo: 'Simulado da semana',
    explica: 'Melhor nota no simulado da semana: as mesmas 40 questões para todos. Zera no domingo.',
    unidade: 'pontos',
    valor: (l) => (l.notaSemana && l.semana === Math.floor((Date.now() - 3 * 3600_000 + 3 * 86400_000) / (7 * 86400_000)) ? l.notaSemana : -1),
    destaque: (l) => String(l.notaSemana ?? 0),
    detalhe: () => 'mesma prova para todos',
  },
  {
    id: 'hoje',
    rotulo: 'Hoje',
    explica: 'Quem mais respondeu questões hoje. Zera à meia-noite.',
    unidade: 'questões',
    valor: (l) => (l.hoje ? l.hoje : -1),
    destaque: (l) => String(l.hoje),
    detalhe: (l) => `${l.acertosHoje} certas · ${taxa(l.acertosHoje, l.hoje)}%`,
  },
  {
    id: 'avulsas',
    rotulo: 'Questões avulsas',
    explica: 'Questões respondidas no treino, fora dos simulados.',
    unidade: 'questões',
    valor: (l) => l.avulsas ?? l.total,
    destaque: (l) => String(l.avulsas ?? l.total),
    detalhe: (l) => `${l.acertosAvulsas ?? l.acertos} certas · ${taxa(l.acertosAvulsas ?? l.acertos, l.avulsas ?? l.total)}%`,
  },
  {
    id: 'taxa',
    rotulo: '% de acerto',
    explica: 'Aproveitamento geral. Entra quem já respondeu pelo menos 20 questões.',
    unidade: 'de acerto',
    valor: (l) => (l.total >= 20 ? l.acertos / l.total : -1),
    destaque: (l) => `${taxa(l.acertos, l.total)}%`,
    detalhe: (l) => `${l.acertos} de ${l.total}`,
  },
  {
    id: 'provas',
    rotulo: 'Simulados',
    explica: 'Quantos simulados e provas cada um entregou.',
    unidade: 'entregues',
    valor: (l) => (l.provas ? l.provas : -1),
    destaque: (l) => String(l.provas),
    detalhe: (l) => `${l.provasHoje} hoje`,
  },
];

const MEDALHA = ['🥇', '🥈', '🥉'];
const inicial = (nome: string) => nome.trim().charAt(0).toUpperCase() || '?';

export default function Ranking({ conta }: { conta: Conta }) {
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState(false);
  const [criterio, setCriterio] = useState('semana7');
  // Recorte do ranking geral: todo mundo, quem estuda para o mesmo cargo ou quem é do mesmo estado.
  const perfil = (() => { try { return JSON.parse(localStorage.getItem('cq:mentor') ?? 'null') as { cargo?: string; concurso?: string; uf?: string } | null; } catch { return null; } })();
  const meuConcurso = (perfil?.cargo || perfil?.concurso || '').trim();
  const [recorte, setRecorte] = useState<'brasil' | 'concurso' | 'uf'>('brasil');

  useEffect(() => {
    // Espera o envio do progresso mais recente antes de buscar.
    const t = setTimeout(() => {
      fetch('/api/ranking', { headers: { authorization: `Bearer ${conta.token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setLinhas)
        .catch(() => setErro(true));
    }, 1800);
    return () => clearTimeout(t);
  }, [conta]);

  const c = CRITERIOS.find((x) => x.id === criterio)!;
  const norm = (x = '') => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const todos = (linhas ?? []).filter((l) =>
    recorte === 'concurso' ? l.eu || (!!meuConcurso && norm(l.concurso) === norm(meuConcurso)) : recorte === 'uf' ? l.eu || (!!perfil?.uf && l.uf === perfil.uf) : true
  );
  const ordenadas = todos.filter((l) => c.valor(l) >= 0).sort((a, b) => c.valor(b) - c.valor(a));
  const fora = todos.filter((l) => c.valor(l) < 0);
  const minhaPos = ordenadas.findIndex((l) => l.eu);

  const [convite, setConvite] = useState<{ amigos: number; premios: number; faltam: number } | null>(null);
  useEffect(() => { fetch('/api/convites', { headers: { authorization: `Bearer ${conta.token}` } }).then((r) => (r.ok ? r.json() : null)).then(setConvite).catch(() => undefined); }, [conta]);
  const compartilhar = () => {
    const texto = 'Bora estudar pro concurso comigo no Aprovô? O mentor com IA monta seu plano e tem ranking e batalha entre a galera:';
    const url = `${location.origin}/?convite=${encodeURIComponent(conta.usuario)}`;
    if (navigator.share) navigator.share({ title: 'Aprovô', text: texto, url }).catch(() => undefined);
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`, '_blank');
  };

  const sozinho = ordenadas.length === 1 && !!ordenadas[0].eu;

  return (
    <section className="coluna estreita ranking">
      <p className="sobretitulo">Ranking da galera</p>
      <h1 className="titulo">
        {sozinho ? (
          'Só você por aqui, por enquanto'
        ) : minhaPos >= 0 ? (
          <>
            Você está em {minhaPos + 1}º <span className="titulo-sub">de {ordenadas.length} · {c.rotulo}</span>
          </>
        ) : (
          'Quem está na frente?'
        )}
      </h1>

      {(() => {
        // Melhor do dia: quem mais acertou hoje (no recorte escolhido).
        const top = [...todos].filter((l) => l.acertosHoje > 0).sort((a, b) => b.acertosHoje - a.acertosHoje)[0];
        if (!top) return <p className="melhor-dia vazio">🏅 Ninguém pontuou hoje ainda. O primeiro acerto do dia já te coloca em destaque.</p>;
        return (
          <p className="melhor-dia">
            <span className="melhor-dia-medalha" aria-hidden>🏅</span>
            <span><small>Melhor do dia</small><strong>{top.eu ? 'Você!' : top.nome}</strong> {top.acertosHoje} acertos em {top.hoje} questões hoje</span>
          </p>
        );
      })()}
      <div className="ranking-abas ranking-recorte" role="group" aria-label="Quem entra no ranking">
        <button className="ranking-aba" aria-pressed={recorte === 'brasil'} onClick={() => setRecorte('brasil')}>Brasil</button>
        {meuConcurso && <button className="ranking-aba" aria-pressed={recorte === 'concurso'} onClick={() => setRecorte('concurso')}>{meuConcurso.length > 22 ? meuConcurso.slice(0, 21) + '…' : meuConcurso}</button>}
        {perfil?.uf && <button className="ranking-aba" aria-pressed={recorte === 'uf'} onClick={() => setRecorte('uf')}>{perfil.uf}</button>}
      </div>
      <div className="ranking-abas" role="tablist" aria-label="Tipo de ranking">
        {CRITERIOS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={criterio === x.id}
            className="ranking-aba"
            onClick={() => setCriterio(x.id)}
          >
            {x.rotulo}
          </button>
        ))}
      </div>
      <p className="nota ranking-explica">{c.explica}</p>
      {(() => {
        const eu = todos.find((l) => l.eu), outros = todos.filter((l) => !l.eu && l.total >= 10);
        if (!eu || eu.total < 1 || outros.length < 1) return null;
        const meu = Math.round((eu.acertos / eu.total) * 100);
        const media = Math.round(outros.reduce((s, l) => s + l.acertos / l.total, 0) / outros.length * 100);
        return (
          <p className="ranking-media">
            Seu acerto <strong className="mono">{meu}%</strong> · média dos alunos <strong className="mono">{media}%</strong>{' '}
            {meu >= media ? '— acima da média 👏' : `— faltam ${media - meu} pontos`}
          </p>
        );
      })()}

      {erro && <p className="nota">Não foi possível carregar o ranking agora.</p>}
      {!linhas && !erro && <p className="nota">Carregando ranking…</p>}

      {linhas && ordenadas.length === 0 && <p className="ranking-vazio">Ninguém pontuou aqui ainda. Seja o primeiro!</p>}

      {sozinho && (
        <p className="ranking-solo">
          <span className="avatar pequeno">{inicial(ordenadas[0].nome)}</span>
          <span>
            <strong className="mono">{c.destaque(ordenadas[0])}</strong> {c.unidade}
            <span className="nota ranking-detalhe">{c.detalhe(ordenadas[0])}</span>
          </span>
        </p>
      )}

      {ordenadas.length > 0 && !sozinho && (
        <ol className="podio">
          {ordenadas.slice(0, 3).map((l, i) => (
            <li key={l.usuario} className={`podio-${i + 1} ${l.eu ? 'eu' : ''}`}>
              <span className="podio-medalha" aria-label={`${i + 1}º lugar`}>
                {MEDALHA[i]}
              </span>
              <span className="avatar">{inicial(l.nome)}</span>
              <span className="podio-nome">{l.eu ? 'Você' : l.nome}</span>
              <span className="podio-valor mono">{c.destaque(l)}</span>
              <span className="nota podio-unidade">{c.unidade}</span>
              <span className="nota podio-detalhe">{c.detalhe(l)}</span>
            </li>
          ))}
        </ol>
      )}

      {ordenadas.length > 3 && (
        <ol className="ranking-lista">
          {ordenadas.slice(3).map((l, i) => (
            <li key={l.usuario} className={l.eu ? 'eu' : ''}>
              <span className="ranking-pos mono">{i + 4}º</span>
              <span className="avatar pequeno">{inicial(l.nome)}</span>
              <span className="ranking-nome">
                {l.nome}
                {l.eu && <span className="nota"> (você)</span>}
                <span className="nota ranking-detalhe">{c.detalhe(l)}</span>
              </span>
              <span className="ranking-valor mono">{c.destaque(l)}</span>
            </li>
          ))}
        </ol>
      )}

      {fora.length > 0 && (
        <p className="nota">Ainda sem pontuar aqui: {fora.map((l) => (l.eu ? 'você' : l.nome)).join(', ')}.</p>
      )}

      <div className="convite-card">
        <p><strong>Convide 3 amigos e ganhe 7 dias de Pro.</strong> {convite ? `${convite.amigos} ${convite.amigos === 1 ? 'amigo entrou' : 'amigos entraram'} pelo seu link · faltam ${convite.faltam} para o próximo prêmio.` : 'A cada 3 amigos que criarem conta pelo seu link.'}</p>
        <div className="convite-barra" aria-hidden><span style={{ width: `${convite ? ((3 - convite.faltam) / 3) * 100 : 0}%` }} /></div>
        <button className="btn" onClick={compartilhar}>Convidar pelo WhatsApp</button>
      </div>
    </section>
  );
}
