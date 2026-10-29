import { useState } from 'react';
import { autenticar, type Conta } from './nuvem';

export default function Login({ onEntrar }: { onEntrar: (c: Conta) => void }) {
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [usuario, setUsuario] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      onEntrar(await autenticar(modo, usuario, senha, nome));
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
      <h1 className="titulo">{modo === 'entrar' ? 'Bem-vindo de volta.' : 'Crie sua conta.'}</h1>
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
    </div>
  );
}
