// Conta e sincronização do progresso com o servidor (/api/conta e /api/progresso).
import type { Questao, Resposta, Edital, ProvaFeita } from './types';

export interface Conta {
  usuario: string;
  nome: string;
  token: string;
}

/** Chaves do localStorage que pertencem ao progresso da pessoa e vão para a nuvem. */
const CHAVES = [
  'cq:historico',
  'cq:revisar',
  'cq:bloco',
  'cq:geradas',
  'cq:editais',
  'cq:edital-ativo',
  'cq:provas',
  'cq:anotacoes',
] as const;

const ler = <T,>(k: string, padrao: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
};
const gravar = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sem armazenamento */
  }
};

export const contaSalva = () => ler<Conta | null>('cq:conta', null);

async function pedir<T>(url: string, init: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(dados.erro ?? 'Sem conexão com o servidor. Tente de novo.') as Error & { status?: number };
    e.status = r.status;
    throw e;
  }
  return dados as T;
}

export async function autenticar(acao: 'entrar' | 'criar', usuario: string, senha: string, nome = '') {
  const c = await pedir<Conta>('/api/conta', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ acao, usuario, senha, nome }),
  });
  // Outra pessoa usava este aparelho: não mistura o progresso dela com o da nova conta.
  const dono = ler<string>('cq:dono', '');
  if (dono && dono !== c.usuario) limparLocal();
  gravar('cq:dono', c.usuario);
  gravar('cq:conta', c);
  return c;
}

export function limparLocal() {
  CHAVES.forEach((k) => localStorage.removeItem(k));
}

export async function sairDaConta(conta: Conta) {
  try {
    await enviar(conta);
    await pedir('/api/conta', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ acao: 'sair', token: conta.token }),
    });
  } catch {
    /* sai mesmo sem rede */
  }
  limparLocal();
  localStorage.removeItem('cq:conta');
  localStorage.removeItem('cq:dono');
}

const unirPor = <T,>(a: T[], b: T[], chave: (x: T) => string) => {
  const m = new Map<string, T>();
  [...a, ...b].forEach((x) => m.set(chave(x), x));
  return Array.from(m.values());
};

/** Baixa o progresso da conta e junta com o que já está neste aparelho. */
export async function baixar(conta: Conta) {
  const r = await pedir<Record<string, unknown>>('/api/progresso', { headers: { authorization: `Bearer ${conta.token}` } });
  const remoto = <T,>(k: string, padrao: T) => (r[k] as T) ?? padrao;
  gravar(
    'cq:historico',
    unirPor(ler<Resposta[]>('cq:historico', []), remoto<Resposta[]>('cq:historico', []), (h) => `${h.id}|${h.em}`).sort(
      (x, y) => x.em - y.em
    )
  );
  gravar(
    'cq:provas',
    unirPor(ler<ProvaFeita[]>('cq:provas', []), remoto<ProvaFeita[]>('cq:provas', []), (p) => String(p.em)).sort((x, y) => x.em - y.em)
  );
  // Anotações: vale a deste aparelho quando as duas existem.
  gravar('cq:anotacoes', { ...remoto<Record<string, string>>('cq:anotacoes', {}), ...ler<Record<string, string>>('cq:anotacoes', {}) });
  gravar('cq:revisar',Array.from(new Set([...ler<string[]>('cq:revisar', []), ...remoto<string[]>('cq:revisar', [])])));
  gravar('cq:geradas', unirPor(remoto<Questao[]>('cq:geradas', []), ler<Questao[]>('cq:geradas', []), (q) => q.id));
  const editais = unirPor(remoto<Edital[]>('cq:editais', []), ler<Edital[]>('cq:editais', []), (e) => e.id);
  if (editais.length) gravar('cq:editais', editais);
  const bloco = remoto<string[]>('cq:bloco', []);
  if (bloco.length && !ler<string[]>('cq:bloco', []).length) gravar('cq:bloco', bloco);
  const ativo = remoto<string>('cq:edital-ativo', '');
  if (ativo && !ler<string>('cq:edital-ativo', '')) gravar('cq:edital-ativo', ativo);
}

/** Envia o progresso deste aparelho para a conta. */
export async function enviar(conta: Conta) {
  const dados: Record<string, unknown> = {};
  CHAVES.forEach((k) => (dados[k] = ler<unknown>(k, null)));
  await pedir('/api/progresso', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${conta.token}` },
    body: JSON.stringify(dados),
  });
}
