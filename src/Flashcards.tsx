// Flashcards de lei seca com revisão espaçada (Leitner simples: acertou sobe de caixa, errou volta para a 1).
import { useMemo, useState } from 'react';
import { usePersist } from './store';

type Card = { lei: string; frente: string; verso: string };
const CARDS: Card[] = [
  { lei: 'CF/88', frente: 'Fundamentos da República (art. 1º)', verso: 'Soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa, pluralismo político (SO-CI-DI-VA-PLU).' },
  { lei: 'CF/88', frente: 'Objetivos fundamentais (art. 3º)', verso: 'Construir sociedade livre, justa e solidária; garantir o desenvolvimento nacional; erradicar a pobreza e reduzir desigualdades; promover o bem de todos sem preconceito.' },
  { lei: 'CF/88', frente: 'Princípios da Administração Pública (art. 37)', verso: 'Legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).' },
  { lei: 'CF/88', frente: 'Validade do concurso público (art. 37, III)', verso: 'Até 2 anos, prorrogável uma vez por igual período.' },
  { lei: 'CF/88', frente: 'Estabilidade do servidor (art. 41)', verso: 'Após 3 anos de efetivo exercício, com avaliação especial de desempenho.' },
  { lei: 'CF/88', frente: 'Habeas corpus (art. 5º, LXVIII)', verso: 'Protege a liberdade de locomoção contra violência ou coação ilegal.' },
  { lei: 'CF/88', frente: 'Habeas data (art. 5º, LXXII)', verso: 'Conhecer ou retificar informações da própria pessoa em bancos de dados públicos.' },
  { lei: 'CF/88', frente: 'Mandado de injunção (art. 5º, LXXI)', verso: 'Quando falta norma regulamentadora que torne inviável um direito constitucional.' },
  { lei: 'CF/88', frente: 'Direitos sociais (art. 6º)', verso: 'Educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência, proteção à maternidade e à infância, assistência aos desamparados.' },
  { lei: 'CF/88', frente: 'Saúde na CF (art. 196)', verso: 'Direito de todos e dever do Estado, com acesso universal e igualitário.' },
  { lei: 'CF/88', frente: 'Diretrizes do SUS (art. 198)', verso: 'Descentralização (direção única em cada esfera), atendimento integral e participação da comunidade.' },
  { lei: 'Lei 8.080/90', frente: 'Do que trata a Lei 8.080/1990?', verso: 'Lei Orgânica da Saúde: condições para promoção, proteção e recuperação da saúde e organização do SUS.' },
  { lei: 'Lei 8.080/90', frente: 'Princípios do SUS (art. 7º, principais)', verso: 'Universalidade, integralidade, igualdade, participação da comunidade, descentralização com direção única, regionalização e hierarquização.' },
  { lei: 'Lei 8.142/90', frente: 'Instâncias colegiadas do SUS (Lei 8.142)', verso: 'Conferência de Saúde (a cada 4 anos) e Conselho de Saúde (permanente e deliberativo).' },
  { lei: 'Lei 8.142/90', frente: 'Composição dos Conselhos de Saúde', verso: 'Paritária: 50% usuários e 50% demais segmentos (governo, prestadores e trabalhadores).' },
  { lei: 'Lei 11.350/06', frente: 'Do que trata a Lei 11.350/2006?', verso: 'Atividades de Agente Comunitário de Saúde (ACS) e Agente de Combate às Endemias (ACE).' },
  { lei: 'Lei 11.350/06', frente: 'Requisito de residência do ACS', verso: 'Residir na área da comunidade em que atuar desde a data de publicação do edital.' },
  { lei: 'Lei 11.350/06', frente: 'Escolaridade exigida de ACS e ACE', verso: 'Ensino médio completo (regra após a Lei 13.595/2018).' },
  { lei: 'Lei 11.350/06', frente: 'Forma de admissão de ACS e ACE', verso: 'Processo seletivo público de provas ou de provas e títulos.' },
  { lei: 'Lei 8.429/92', frente: 'Lei de Improbidade exige dolo?', verso: 'Sim. Após a Lei 14.230/2021, só há improbidade com dolo (não existe mais modalidade culposa).' },
  { lei: 'Lei 14.133/21', frente: 'Modalidades da Lei 14.133/2021', verso: 'Pregão, concorrência, concurso, leilão e diálogo competitivo.' },
  { lei: 'Lei 9.784/99', frente: 'Prazo para a Administração anular atos favoráveis (Lei 9.784)', verso: '5 anos, salvo comprovada má-fé.' },
  { lei: 'Súmula 473 STF', frente: 'Anulação × revogação (Súmula 473)', verso: 'Anula atos ilegais; revoga atos legais por conveniência e oportunidade, respeitados os direitos adquiridos.' },
  { lei: 'Lei 13.709/18', frente: 'LGPD: base para tratar dados de saúde?', verso: 'Dado sensível: exige consentimento específico ou hipóteses legais (ex.: tutela da saúde por profissionais ou serviços de saúde).' },
];
const DIAS = [0, 1, 3, 7, 15, 30];

export default function Flashcards() {
  const [estado, setEstado] = usePersist<Record<string, { caixa: number; quando: number }>>('cq:flash', {});
  const [virado, setVirado] = useState(false);
  const [lei, setLei] = useState('');
  const devidos = useMemo(
    () => CARDS.filter((c) => (!lei || c.lei === lei) && (estado[c.frente]?.quando ?? 0) <= Date.now()),
    [estado, lei],
  );
  const c = devidos[0];
  const responder = (acertou: boolean) => {
    const caixa = acertou ? Math.min(DIAS.length - 1, (estado[c.frente]?.caixa ?? 0) + 1) : 1;
    setEstado({ ...estado, [c.frente]: { caixa, quando: Date.now() + DIAS[caixa] * 86400000 } });
    setVirado(false);
  };
  const leis = [...new Set(CARDS.map((x) => x.lei))];
  return (
    <section className="cartao">
      <h2>Flashcards de lei seca</h2>
      <p className="mudo">Leia a frente, tente lembrar e vire. O que você erra volta amanhã; o que acerta volta em 3, 7, 15 e 30 dias.</p>
      <select value={lei} onChange={(e) => setLei(e.target.value)} className="flash-filtro">
        <option value="">Todas as leis ({CARDS.length})</option>
        {leis.map((l) => <option key={l}>{l}</option>)}
      </select>
      {!c ? (
        <p>Tudo revisado por hoje. 🎉 Volte amanhã.</p>
      ) : (
        <div className="flash" onClick={() => setVirado(true)}>
          <p className="rotulo">{c.lei} · faltam {devidos.length}</p>
          <p className="flash-frente">{c.frente}</p>
          {virado ? (
            <>
              <p className="flash-verso">{c.verso}</p>
              <div className="flash-botoes">
                <button className="btn btn-sec" onClick={(e) => { e.stopPropagation(); responder(false); }}>Errei</button>
                <button className="btn" onClick={(e) => { e.stopPropagation(); responder(true); }}>Lembrei</button>
              </div>
            </>
          ) : (
            <button className="btn btn-sec">Virar</button>
          )}
        </div>
      )}
    </section>
  );
}
