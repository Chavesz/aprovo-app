// Questões autorais do concurso do aluno: a IA escreve 5 questões no estilo da banca do perfil, na matéria que ele mais precisa
// (marcada como "reforçar" no diagnóstico, senão a de maior peso) e no assunto que mais cai no banco. Ficam marcadas como autorais.
import { useMemo, useState } from 'react';
import type { Questao } from './types';
import type { PerfilMentor } from './Mentor';
import { contaSalva } from './nuvem';

export default function Autorais({ perfil, questoes, onNovas }: { perfil: PerfilMentor; questoes: Questao[]; onNovas: (qs: Questao[]) => void }) {
  const ordem = useMemo(
    () => [...perfil.disciplinas].sort((a, b) => Number(perfil.dificeis.includes(b.nome)) - Number(perfil.dificeis.includes(a.nome)) || b.peso * b.questoes - a.peso * a.questoes).map((d) => d.nome),
    [perfil]
  );
  const [disciplina, setDisciplina] = useState(ordem[0] ?? '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Assunto que mais aparece no banco para essa matéria (o que mais cai), ou o primeiro do edital.
  const assunto = useMemo(() => {
    const cont = new Map<string, number>();
    questoes.filter((q) => q.disciplina === disciplina && q.assunto).forEach((q) => cont.set(q.assunto, (cont.get(q.assunto) ?? 0) + 1));
    const top = [...cont.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const doEdital = perfil.disciplinas.find((d) => d.nome === disciplina)?.assuntos ?? [];
    return doEdital[0] ?? top[Math.floor(Math.random() * Math.min(5, top.length || 1))] ?? disciplina;
  }, [disciplina, questoes, perfil]);

  async function gerar() {
    setErro('');
    setCarregando(true);
    try {
      const banca = perfil.banca || 'banca do concurso';
      const r = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${contaSalva()?.token ?? ''}` },
        body: JSON.stringify({
          acao: 'questoes',
          concurso: { banca, orgao: perfil.concurso || perfil.cargo, cargo: perfil.cargo },
          disciplina,
          assunto,
          quantidade: 5,
          dificuldade: perfil.nivel === 'avancado' ? 'dificil' : perfil.nivel === 'intermediario' ? 'media' : 'facil',
          formato: /cebraspe|cespe/i.test(banca) ? 'certo-errado' : 'multipla',
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro ?? 'A IA não respondeu. Tente de novo.');
      const agora = Date.now();
      const qs: Questao[] = (d.questoes as Omit<Questao, 'id' | 'banca' | 'orgao' | 'prova' | 'ano' | 'numero' | 'disciplina' | 'assunto'>[]).map((q, i) => ({
        ...q,
        id: `ia-${agora}-${i}`,
        banca: `Autoral · estilo ${banca}`,
        orgao: perfil.cargo || perfil.concurso,
        prova: `Autoral · ${perfil.cargo || perfil.concurso}`,
        ano: new Date().getFullYear(),
        numero: i + 1,
        disciplina,
        assunto,
        ia: true,
      }));
      onNovas(qs);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <details className="coluna autorais">
      <summary className="rotulo">✦ Questões autorais do seu concurso</summary>
      <p className="nota">A IA escreve 5 questões inéditas no estilo {perfil.banca ? `da ${perfil.banca}` : 'da sua banca'}, no assunto que mais cai.</p>
      <div className="autorais-linha">
        <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} aria-label="Matéria">
          {ordem.map((n) => <option key={n} value={n}>{n}{perfil.dificeis.includes(n) ? ' (reforçar)' : ''}</option>)}
        </select>
        <button className="btn" disabled={carregando || !disciplina} onClick={gerar}>{carregando ? 'Escrevendo…' : 'Gerar 5 questões'}</button>
      </div>
      <p className="nota">Assunto: {assunto}</p>
      {erro && <p className="aviso" role="alert">{erro}</p>}
    </details>
  );
}
