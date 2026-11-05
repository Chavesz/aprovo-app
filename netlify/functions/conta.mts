// /api/conta: criar conta, entrar e sair.
import { criarConta, entrar, json, sair } from '../lib/contas';
import { registrarEmail } from '../lib/cakto';
import { boasVindas, emails, emailValido, enviarEmail } from '../lib/email';

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);
  let corpo: { acao?: string; usuario?: string; nome?: string; senha?: string; token?: string; email?: string };
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'Pedido inválido.' }, 400);
  }
  try {
    if (corpo.acao === 'criar') {
      const c = await criarConta(corpo.usuario ?? '', corpo.nome ?? '', corpo.senha ?? '');
      // E-mail é opcional; serve para boas-vindas e lembrete de revisão (enviados só quando o e-mail estiver ligado).
      const email = (corpo.email ?? '').trim().toLowerCase();
      if (email && emailValido(email)) {
        await emails().setJSON(c.usuario, { email, optin: true, criadoEm: Date.now() });
        await registrarEmail(c.usuario, email);
        await enviarEmail(email, 'Bem-vindo ao Aprovô: seu plano começa hoje', boasVindas(c.usuario, c.nome)).catch(() => false);
      }
      return json(c);
    }
    if (corpo.acao === 'entrar') return json(await entrar(corpo.usuario ?? '', corpo.senha ?? ''));
    if (corpo.acao === 'sair' && corpo.token) {
      await sair(corpo.token);
      return json({ ok: true });
    }
    return json({ erro: 'Ação desconhecida.' }, 400);
  } catch (e) {
    return json({ erro: (e as Error).message }, 400);
  }
};

export const config = { path: '/api/conta' };
