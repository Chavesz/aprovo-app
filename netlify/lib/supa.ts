// Supabase do Aprovô, usado SÓ no servidor com a service role (ignora RLS). Nunca importe isto no front.
// Migração com fallback: o Netlify Blobs continua sendo a fonte de leitura; tudo que é gravado também é
// espelhado no Supabase. Cada aluno ganha um usuário no Supabase Auth no primeiro acesso (migração preguiçosa).
// Sem SUPABASE_SERVICE_ROLE_KEY, nada disso roda e o app segue só com o Blobs.
import { getStore } from '@netlify/blobs';

const URL_SB = process.env.SUPABASE_URL ?? 'https://lnudxzgqeqabvzkyqbgb.supabase.co';
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const supabaseLigado = () => !!CHAVE;

async function sb(caminho: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_SB}${caminho}`, {
    ...init,
    headers: { apikey: CHAVE, authorization: `Bearer ${CHAVE}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}

const mapa = () => getStore({ name: 'supabase-ids', consistency: 'strong' });

/** uuid do aluno no Supabase; cria o usuário no Auth e o perfil na primeira vez. */
export async function alunoId(usuario: string, nome = ''): Promise<string> {
  const salvo = await mapa().get(usuario);
  if (salvo) return salvo;
  const existente = (await sb(`/rest/v1/perfis?usuario=eq.${encodeURIComponent(usuario)}&select=id`)) as { id: string }[];
  let id = existente?.[0]?.id;
  if (!id) {
    // E-mail técnico: o login continua sendo usuário e senha do Aprovô.
    const u = (await sb('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email: `${usuario.replace(/[^a-z0-9._-]/g, '_')}@alunos.aprovo.app`, email_confirm: true, user_metadata: { usuario, nome } }),
    })) as { id: string };
    id = u.id;
    await sb('/rest/v1/perfis', { method: 'POST', body: JSON.stringify({ id, usuario, nome: nome.slice(0, 60) }), headers: { prefer: 'resolution=merge-duplicates' } });
  }
  await mapa().set(usuario, id);
  return id;
}

type Resp = { id: string; marcada?: string; certa: boolean; em: number; simulado?: boolean };
type Prova = { em: number; estilo?: boolean; semana?: number; acertos?: number; total?: number; nota: number; max?: number; ids?: string[]; materias?: unknown };

/** Espelha o progresso: perfil, respostas e simulados novos e o plano do mentor. Falha em silêncio (o Blobs já guardou). */
export async function espelharProgresso(usuario: string, nome: string, dados: Record<string, unknown>) {
  if (!supabaseLigado()) return;
  try {
    const aluno = await alunoId(usuario, nome);
    const marco = getStore({ name: 'supabase-marco', consistency: 'strong' });
    const ultimo = Number((await marco.get(usuario)) ?? 0);
    const hist = ((dados['cq:historico'] as Resp[]) ?? []).filter((h) => h.em > ultimo && /^[A-E]$/.test(h.marcada ?? ''));
    for (let i = 0; i < hist.length; i += 500) {
      await sb('/rest/v1/respostas', {
        method: 'POST',
        body: JSON.stringify(hist.slice(i, i + 500).map((h) => ({ aluno, questao: String(h.id).slice(0, 120), marcada: h.marcada, certa: !!h.certa, simulado: !!h.simulado, em: new Date(h.em).toISOString() }))),
      });
    }
    const provas = ((dados['cq:provas'] as Prova[]) ?? []).filter((p) => p.em > ultimo && (p.total ?? 0) > 0);
    if (provas.length)
      await sb('/rest/v1/simulados', {
        method: 'POST',
        body: JSON.stringify(provas.map((p) => ({ aluno, estilo: !!p.estilo, semanal: !!p.semana, acertos: p.acertos ?? 0, total: p.total, nota: p.nota, maximo: p.max ?? p.total, questoes: p.ids ?? [], materias: p.materias ?? null, em: new Date(p.em).toISOString() }))),
      });
    if (dados['cq:mentor'])
      await sb('/rest/v1/planos_mentor', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ aluno, perfil: dados['cq:mentor'], atualizado_em: new Date().toISOString() }) });
    const cargo = String(dados['cq:cargo'] ?? '').replace(/"/g, '');
    if (['ACE', 'ACS', 'OUTRO'].includes(cargo)) await sb(`/rest/v1/perfis?id=eq.${aluno}`, { method: 'PATCH', body: JSON.stringify({ cargo }) });
    const novoMarco = Math.max(ultimo, ...hist.map((h) => h.em), ...provas.map((p) => p.em));
    await marco.set(usuario, String(novoMarco));
  } catch (e) {
    console.error('espelharProgresso', e);
  }
}

export async function espelharUso(usuario: string, dia: string, chamadas: number) {
  if (!supabaseLigado()) return;
  try {
    const aluno = await alunoId(usuario);
    await sb('/rest/v1/uso_ia', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ aluno, dia, chamadas }) });
  } catch (e) {
    console.error('espelharUso', e);
  }
}

export async function espelharComentario(usuario: string, questao: string, texto: string) {
  if (!supabaseLigado()) return;
  try {
    const aluno = await alunoId(usuario);
    await sb('/rest/v1/comentarios', { method: 'POST', body: JSON.stringify({ aluno, questao, texto }) });
  } catch (e) {
    console.error('espelharComentario', e);
  }
}
