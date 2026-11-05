import { useEffect, useState } from 'react';
import type { Questao } from './types';

/** Mini-teste sem cadastro: 5 questões comentadas para a pessoa sentir o app antes de criar a conta. */
function TesteRapido({ onFim }: { onFim: (acertos: number) => void }) {
  const [qs, setQs] = useState<Questao[] | null>(null);
  const [i, setI] = useState(0);
  const [marcada, setMarcada] = useState('');
  const [acertos, setAcertos] = useState(0);
  useEffect(() => {
    fetch('/data/comuns.json')
      .then((r) => r.json())
      .then((l: Questao[]) => setQs(l.sort(() => Math.random() - 0.5).slice(0, 5)))
      .catch(() => onFim(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!qs) {
    return <p className="nota">Carregando questões…</p>;
  }
  const q = qs[i];
  return (
    <div className="teste-rapido">
      <p className="rotulo">Questão {i + 1} de 5 · {q.disciplina}</p>
      <div className="barra" aria-hidden><span style={{ width: `${(i + (marcada ? 1 : 0)) * 20}%` }} /></div>
      <p>{q.comando}</p>
      <ol className="teste-alts">
        {q.alternativas.map((a) => (
          <li key={a.letra}>
            <button
              className={`teste-alt ${marcada && a.letra === q.gabarito ? 'ok' : ''} ${marcada === a.letra && a.letra !== q.gabarito ? 'nok' : ''}`}
              disabled={!!marcada}
              onClick={() => {
                setMarcada(a.letra);
                if (a.letra === q.gabarito) setAcertos((n) => n + 1);
              }}
            >
              <strong>{a.letra}</strong> {a.texto}
            </button>
          </li>
        ))}
      </ol>
      {marcada && (
        <>
          <p className={`teste-veredito ${marcada === q.gabarito ? 'ok' : 'nok'}`}>
            {marcada === q.gabarito ? '✓ Acertou!' : `✗ Errou. A certa é a ${q.gabarito}.`}
          </p>
          <p className="feedback-extra">{q.comentario}</p>
          {q.macete && <p className="feedback-extra macete">💡 {q.macete}</p>}
          <button
            className="btn"
            onClick={() => {
              if (i === 4) return onFim(acertos);
              setI(i + 1);
              setMarcada('');
            }}
          >
            {i === 4 ? 'Ver meu resultado' : 'Próxima'}
          </button>
          <button className="link" onClick={() => onFim(acertos)}>Pular e criar conta</button>
        </>
      )}
    </div>
  );
}

import { autenticar, type Conta } from './nuvem';

export default function Login({ onEntrar }: { onEntrar: (c: Conta) => void }) {
  // Veio do botão "Assinar" da landing: vai direto para criar a conta (sem o teste grátis no caminho).
  const querAssinar = new URLSearchParams(location.search).has('assinar');
  const [modo, setModo] = useState<'entrar' | 'criar'>(querAssinar ? 'criar' : 'entrar');
  const [usuario, setUsuario] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [teste, setTeste] = useState<'nao' | 'fazendo' | number>(() => {
    // Primeira visita (ou link ?teste): cai direto na 1ª questão, sem tela de login no caminho.
    let veio = false;
    try { veio = !!localStorage.getItem('cq:ja-entrou'); } catch { /* sem armazenamento */ }
    const q = new URLSearchParams(location.search);
    if (q.has('assinar')) return 'nao';
    return q.has('teste') || !veio ? 'fazendo' : 'nao';
  });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const c = await autenticar(modo, usuario, senha, nome, modo === 'criar' ? email : '');
      try { localStorage.setItem('cq:ja-entrou', '1'); } catch { /* sem armazenamento */ }
      onEntrar(c);
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  };

  return (
    <div className="login">
      <div className="marca login-marca">
        <span className="marca-selo" aria-hidden>
          A
        </span>
        <span className="marca-nome">Aprovô</span>
      </div>
      {teste === 'fazendo' ? (
        <>
        <p className="nota teste-topo">5 questões grátis, sem cadastro. <button className="link" onClick={() => { setTeste('nao'); setModo('entrar'); }}>Já tenho conta</button></p>
        <TesteRapido
          onFim={(n) => {
            setTeste(n);
            setModo('criar');
          }}
        />
        </>
      ) : (
        <>
      {typeof teste === 'number' ? (
        <h1 className="titulo">Você acertou {teste} de 5. Crie sua conta grátis para ganhar seu plano de estudos.</h1>
      ) : (
        <>
          <h1 className="titulo">{modo === 'entrar' ? 'Bem-vindo de volta.' : 'Crie sua conta.'}</h1>
          {querAssinar && <p className="lead">{modo === 'criar' ? 'Primeiro a conta (1 minuto). Depois você assina o Pro com Pix ou cartão.' : 'Entre para assinar o Pro.'}</p>}
          <button className="btn btn-sec teste-cta" onClick={() => setTeste('fazendo')}>
            Testar 5 questões grátis, sem cadastro
          </button>
        </>
      )}
      <p className="lead">Seu progresso fica salvo na conta: comece no celular e continue no computador.</p>
      <form className="login-form" onSubmit={enviar}>
        {modo === 'criar' && (
          <label className="campo">
            <span className="rotulo">Seu nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" maxLength={60} />
          </label>
        )}
        <label className="campo">
          <span className="rotulo">Usuário</span>
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
            placeholder="ex.: Kauã Chaves"
          />
        </label>
        {modo === 'criar' && (
          <label className="campo">
            <span className="rotulo">E-mail (opcional)</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} placeholder="para receber o lembrete de revisão" />
          </label>
        )}
        <label className="campo">
          <span className="rotulo">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            required
          />
        </label>
        {erro && (
          <p className="aviso" role="alert">
            {erro}
          </p>
        )}
        <button className="btn btn-grande" disabled={enviando}>
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
      <button
        className="link"
        onClick={() => {
          setModo(modo === 'entrar' ? 'criar' : 'entrar');
          setErro('');
        }}
      >
        {modo === 'entrar' ? 'Não tem conta? Criar agora' : 'Já tenho conta. Entrar'}
      </button>
        </>
      )}
    </div>
  );
}
