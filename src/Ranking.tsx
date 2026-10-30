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
  ultimaNota?: number;
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
  const [criterio, setCriterio] = useState('geral');

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
  const todos = linhas ?? [];
  const ordenadas = todos.filter((l) => c.valor(l) >= 0).sort((a, b) => c.valor(b) - c.valor(a));
  const fora = todos.filter((l) => c.valor(l) < 0);
  const minhaPos = ordenadas.findIndex((l) => l.eu);

  const compartilhar = () => {
    const texto = 'Bora estudar pro concurso comigo no Aprovô? Tem ranking entre a galera:';
    const url = location.origin;
    if (navigator.share) navigator.share({ title: 'Aprovô', text: texto, url }).catch(() => undefined);
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`, '_blank');
  };

  return (
    <section className="coluna estreita ranking">
      <p className="sobretitulo">Ranking da galera</p>
      <h1 className="titulo">
        {minhaPos >= 0 ? (
          <>
            Você está em {minhaPos + 1}º <span className="titulo-sub">de {ordenadas.length} · {c.rotulo}</span>
          </>
        ) : (
          'Quem está na frente?'
        )}
      </h1>

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

      {erro && <p className="nota">Não foi possível carregar o ranking agora.</p>}
      {!linhas && !erro && <p className="nota">Carregando ranking…</p>}

      {linhas && ordenadas.length === 0 && <p className="ranking-vazio">Ninguém pontuou aqui ainda. Seja o primeiro!</p>}

      {ordenadas.length > 0 && (
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

      <button className="btn btn-sec ranking-convite" onClick={compartilhar}>
        Chamar a galera para o ranking
      </button>
    </section>
  );
}
