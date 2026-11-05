// /api/assinar: assinatura mensal do Pro.
// Com MP_ACCESS_TOKEN: assinatura recorrente do Mercado Pago (preapproval), PRO_PRECO por mês (padrão 50).
// Sem token, mas com CHECKOUT_URL (link pronto do Mercado Pago ou da Cakto): manda o aluno para o link; o admin libera o Pro à mão.
// GET              → { disponivel, modo, preco, link?, plano?, status?, ate?, recorrente? }
// GET ?ir=1        → redireciona (botão "Assinar" da landing, que é página estática)
// POST (logado)    → { url } do checkout · body opcional { email } (o Mercado Pago exige o e-mail do pagador)
// DELETE (logado)  → cancela a assinatura no Mercado Pago (o acesso segue até o fim do período pago)
import { json, usuarioDaRequisicao } from '../lib/contas';
import { emails, emailValido, type Contato } from '../lib/email';
import { aplicarPreapproval, cfgAssinatura, lerPlano, mp, type Preapproval } from '../lib/assinatura';
import { planoDe } from '../lib/uso';
import { linkCheckout, registrarEmail } from '../lib/cakto';

export default async (req: Request) => {
  const c = cfgAssinatura();
  const url = new URL(req.url);

  if (req.method === 'GET' && url.searchParams.has('ir')) {
    const destino = c.modo === 'link' ? c.link : `${c.site}/?assinar=1`;
    return new Response(null, { status: 302, headers: { location: destino, 'cache-control': 'no-store' } });
  }

  const usuario = await usuarioDaRequisicao(req);

  if (req.method === 'GET') {
    const base = { disponivel: c.modo !== 'nenhum', modo: c.modo, preco: c.preco, link: c.modo === 'link' ? c.link : undefined };
    if (!usuario) return json(base);
    const p = await lerPlano(usuario);
    return json({ ...base, plano: await planoDe(usuario), status: p.status, ate: p.ate, recorrente: p.provedor === 'mercadopago' && p.status === 'ativa' });
  }

  if (!usuario) return json({ erro: 'Entre na sua conta para assinar.' }, 401);

  if (req.method === 'DELETE') {
    const p = await lerPlano(usuario);
    if (!c.token || p.provedor !== 'mercadopago' || !p.assinatura) return json({ erro: 'Não há assinatura recorrente para cancelar por aqui. Fale com o suporte.' }, 404);
    try {
      const pre = await mp<Preapproval>(`/preapproval/${p.assinatura}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) });
      await aplicarPreapproval({ ...pre, external_reference: usuario });
      return json({ ok: true, ate: (await lerPlano(usuario)).ate });
    } catch {
      return json({ erro: 'Não foi possível cancelar agora. Tente de novo em instantes.' }, 502);
    }
  }

  if (req.method !== 'POST') return json({ erro: 'Método não permitido.' }, 405);
  if (c.modo === 'link') return json({ url: c.link });
  if (c.modo === 'cakto') {
    // Cakto: link da oferta com a referência do aluno (sck) e o e-mail já preenchido, se houver.
    const corpo = (await req.json().catch(() => ({}))) as { email?: string };
    const salvo = (await emails().get(usuario, { type: 'json' })) as Contato | null;
    const email = (corpo.email ?? salvo?.email ?? '').trim().toLowerCase();
    if (email && emailValido(email) && !salvo?.email) {
      await emails().setJSON(usuario, { email, optin: true, criadoEm: Date.now() });
      await registrarEmail(usuario, email);
    }
    const destino = await linkCheckout(usuario, emailValido(email) ? email : undefined);
    return destino ? json({ url: destino }) : json({ erro: 'Checkout indisponível.' }, 503);
  }
  if (c.modo === 'nenhum') return json({ erro: 'A assinatura do Pro ainda não está aberta.' }, 503);
  const atual = await lerPlano(usuario);
  if ((await planoDe(usuario)) === 'pro' && atual.status === 'ativa') return json({ erro: 'Sua conta já é Pro.' }, 409);

  const corpo = (await req.json().catch(() => ({}))) as { email?: string };
  const salvo = (await emails().get(usuario, { type: 'json' })) as Contato | null;
  const email = (corpo.email ?? salvo?.email ?? '').trim().toLowerCase();
  if (!emailValido(email)) return json({ erro: 'Informe seu e-mail para receber o recibo da assinatura.', precisaEmail: true }, 400);
  if (!salvo?.email) await emails().setJSON(usuario, { email, optin: true, criadoEm: Date.now() });

  try {
    const p = await mp<Preapproval>('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Aprovô Pro (mensal)',
        external_reference: usuario,
        payer_email: email,
        back_url: `${c.site}/?pro=ok`,
        status: 'pending',
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: c.preco, currency_id: 'BRL' },
      }),
    });
    if (!p.init_point) throw new Error('sem init_point');
    await aplicarPreapproval({ ...p, external_reference: usuario });
    return json({ url: p.init_point });
  } catch {
    return json({ erro: 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.' }, 502);
  }
};

export const config = { path: '/api/assinar' };
