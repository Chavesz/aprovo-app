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
}

type Criterio = 'hoje' | 'acertos' | 'taxa' | 'provas';

const CRITERIOS: { id: Criterio; rotulo: string; valor: (l: Linha) => number; texto: (l: Linha) => string }[] = [
  { id: 'hoje', rotulo: 'Hoje', valor: (l) => l.hoje, texto: (l) => `${l.hoje} questões · ${l.acertosHoje} certas` },
  { id: 'acertos', rotulo: 'Acertos', valor: (l) => l.acertos, texto: (l) => `${l.acertos} de ${l.total}` },
  {
    id: 'taxa',
    rotulo: '% de acerto',
    // Só entra quem já respondeu 20 questões, para o ranking não premiar sorte.
    valor: (l) => (l.total >= 20 ? l.acertos / l.total : -1),
    texto: (l) => (l.total >= 20 ? `${Math.round((l.acertos / l.total) * 100)}% em ${l.total}` : 'menos de 20 questões'),
  },
  { id: 'provas', rotulo: 'Provas', valor: (l) => l.provas, texto: (l) => `${l.provas} provas · ${l.provasHoje} hoje` },
];

export default function Ranking({ conta }: { conta: Conta }) {
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState(false);
  const [criterio, setCriterio] = useState<Criterio>('hoje');

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
  const ordenadas = (linhas ?? []).slice().sort((a, b) => c.valor(b) - c.valor(a));

  return (
    <section className="coluna estreita ranking">
      <div className="edital-topo">
        <p className="sobretitulo">Ranking</p>
        <div className="segmentado periodo" role="radiogroup" aria-label="Critério do ranking">
          {CRITERIOS.map((x) => (
            <label key={x.id} className="chip">
              <input type="radio" name="criterio" checked={criterio === x.id} onChange={() => setCriterio(x.id)} />
              {x.rotulo}
            </label>
          ))}
        </div>
      </div>
      {erro && <p className="nota">Não foi possível carregar o ranking agora.</p>}
      {!linhas && !erro && <p className="nota">Carregando ranking…</p>}
      {linhas && (
        <ol className="ranking-lista">
          {ordenadas.map((l, i) => (
            <li key={l.usuario} className={l.eu ? 'eu' : ''}>
              <span className="ranking-pos mono">{i + 1}º</span>
              <span className="ranking-nome">
                {l.nome}
                {l.eu && <span className="nota"> (você)</span>}
              </span>
              <span className="mono nota">{c.texto(l)}</span>
            </li>
          ))}
        </ol>
      )}
      {linhas && linhas.length < 2 && (
        <p className="nota">Mande o link para os amigos: cada um que criar conta entra no ranking.</p>
      )}
    </section>
  );
}
