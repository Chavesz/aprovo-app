// /api/email: cadastrar/trocar o e-mail da conta (POST logado {email, optin}) e descadastro pelo link do e-mail (GET ?sair=&t=).
import { timingSafeEqual } from 'node:crypto';
import { json, usuarioDaRequisicao } from '../lib/contas';
import { assinaturaDescadastro, emails, emailValido, type Contato } from '../lib/email';

const pagina = (msg: string) =>
  new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aprovô</title><body style="font-family:Arial,sans-serif;max-width:480px;margin:48px auto;padding:0 16px;color:#2a1f3d"><p style="font-weight:800;color:#4a2f7a">Aprovô</p><h1 style="font-size:22px">${msg}</h1><p><a href="/" style="color:#4a2f7a">Voltar ao app</a></p></body>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });

export default async (req: Request) => {
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.has('sair')) {
    const u = url.searchParams.get('sair') ?? '', t = url.searchParams.get('t') ?? '', certo = assinaturaDescadastro(u);
    if (!process.env.EMAIL_SEGREDO || t.length !== certo.length || !timingSafeEqual(Buffer.from(t), Buffer.from(certo))) return pagina('Link inválido.');
    const c = (await emails().get(u, { type: 'json' })) as Contato | null;
    if (c) await emails().setJSON(u, { ...c, optin: false });
    return pagina('Pronto, você não vai mais receber e-mails do Aprovô.');
  }
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Sessão expirada.' }, 401);
  if (req.method === 'GET') return json(((await emails().get(usuario, { type: 'json' })) as Contato | null) ?? { email: '', optin: false });
  const { email, optin } = (await req.json().catch(() => ({}))) as { email?: string; optin?: boolean };
  if (!email) { await emails().delete(usuario); return json({ ok: true }); }
  if (!emailValido(email)) return json({ erro: 'E-mail inválido.' }, 400);
  await emails().setJSON(usuario, { email: email.trim().toLowerCase(), optin: optin !== false, criadoEm: Date.now() });
  return json({ ok: true });
};

export const config = { path: '/api/email' };
