// Boas-vindas: 1 tela logo depois do cadastro. O perfil vai para cq:mentor (sincronizado e espelhado em planos_mentor.perfil),
// filtra as questões e os simulados ("Meu concurso") e dá contexto ao Mentor com IA.
import { useMemo, useState } from 'react';
import type { Questao } from './types';
import { MODELOS, type PerfilMentor } from './Mentor';

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const NIVEIS: [NonNullable<PerfilMentor['nivel']>, string, string][] = [
  ['iniciante', 'Começando agora', 'Explicações do zero'],
  ['intermediario', 'Já estudei', 'Foco no que mais cai'],
  ['avancado', 'Reta final', 'Questões difíceis e revisão'],
];
const d = (nome: string, questoes: number, peso = 1) => ({ nome, questoes, peso, assuntos: [] as string[] });
const PADRAO = [d('Português', 15, 2), d('Raciocínio Lógico', 10), d('Informática', 5), d('Direito Constitucional', 10), d('Direito Administrativo', 10)];

export default function Comecar({ questoes, onPronto, onPular }: { questoes: Questao[]; onPronto: (p: PerfilMentor) => void; onPular: () => void }) {
  const [modelo, setModelo] = useState('');
  const [cargo, setCargo] = useState('');
  const [banca, setBanca] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [dataProva, setDataProva] = useState('');
  const [nivel, setNivel] = useState<PerfilMentor['nivel']>('iniciante');
  const [horas, setHoras] = useState(2);
  const bancas = useMemo(
    () => [...new Set(questoes.map((q) => q.banca).filter((b) => b && !/aprov|autoral|estilo|elaborad/i.test(b)))].sort(),
    [questoes]
  );

  function pronto() {
    const m = MODELOS.find((x) => x.rotulo === modelo);
    onPronto({
      concurso: m?.rotulo ?? cargo,
      cargo: cargo || m?.cargo || '',
      banca: banca || m?.banca || '',
      editalAberto: false,
      dataProva,
      horasDia: horas,
      disciplinas: m?.disciplinas ?? PADRAO,
      faceis: [],
      dificeis: [],
      cidade: cidade.trim(),
      uf,
      nivel,
    });
  }

  return (
    <section className="coluna estreita comecar" aria-labelledby="comecar-titulo">
      <p className="sobretitulo">1 minuto · dá para mudar depois</p>
      <h1 className="titulo" id="comecar-titulo">Para qual concurso você estuda?</h1>
      <p className="lead">Com isso, o Aprovô mostra só as questões do seu concurso e o Mentor monta o plano até o dia da prova.</p>

      <div className="mentor-form">
        <div>
          <p className="rotulo">Escolha um, se for parecido</p>
          <div className="mentor-chips">
            {MODELOS.map((m) => (
              <button key={m.rotulo} className={modelo === m.rotulo ? 'chip ok' : 'chip'} aria-pressed={modelo === m.rotulo} onClick={() => { setModelo(modelo === m.rotulo ? '' : m.rotulo); if (!banca && m.banca) setBanca(m.banca); }}>
                {m.rotulo}
              </button>
            ))}
          </div>
        </div>
        <label>
          Concurso ou cargo
          <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Técnico do INSS, Agente de Saúde de Patos" />
        </label>
        <label>
          Banca <span className="nota">(se souber)</span>
          <input list="comecar-bancas" value={banca} onChange={(e) => setBanca(e.target.value)} placeholder="Ex.: Cebraspe, FGV, EDUCA" />
          <datalist id="comecar-bancas">{bancas.map((b) => <option key={b} value={b} />)}</datalist>
        </label>
        <div className="comecar-local">
          <label>
            Cidade
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: Campina Grande" autoComplete="address-level2" />
          </label>
          <label>
            UF
            <select value={uf} onChange={(e) => setUf(e.target.value)}>
              <option value="">—</option>
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </label>
        </div>
        <label>
          Data da prova <span className="nota">(deixe em branco se não saiu)</span>
          <input type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)} />
        </label>
        <fieldset>
          <legend>Seu nível</legend>
          <div className="segmentado comecar-nivel">
            {NIVEIS.map(([v, t, s]) => (
              <button key={v} aria-pressed={nivel === v} onClick={() => setNivel(v)}>
                {t}<small>{s}</small>
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Horas por dia para estudar: <strong>{horas}h</strong>
          <input type="range" min={0.5} max={10} step={0.5} value={horas} onChange={(e) => setHoras(+e.target.value)} />
        </label>
        <button className="btn btn-grande" disabled={!cargo.trim() && !modelo} onClick={pronto}>Começar a estudar</button>
        <button className="link" onClick={onPular}>Pular por enquanto</button>
      </div>
    </section>
  );
}
