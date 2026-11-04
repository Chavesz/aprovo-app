// /api/assinar: cobrança do plano Pro pelo Mercado Pago (Checkout Pro: Pix e cartão).
// Fica DESLIGADA até existirem na Netlify: MP_ACCESS_TOKEN (credencial de produção) e PRO_PRECO (ex.: "19.90").
// Opcional: PRO_DIAS (dias de acesso por pagamento, padrão 30) e SITE_URL (padrão https://aprovoapp.netlify.app).
// GET  → { disponivel, preco, dias }   ·   POST (logado) → { url } do checkout.
import { json, usuarioDaRequisicao } from '../lib/contas';
import { planoDe } from '../lib/uso';

const cfg = () => {
  const token = process.env.MP_ACCESS_TOKEN ?? '';
  const preco = Number(String(process.env.PRO_PRECO ?? '').replace(',', '.'));
  const dias = Number(process.env.PRO_DIAS ?? 30) || 30;
  const site = (process.env.SITE_URL ?? 'https://aprovoapp.netlify.app').replace(/\/$/, '');
  return { token, preco, dias, site, ok: !!token && preco > 0 };
};

export default async (req: Request) => {
  const c = cfg();
  if (req.method === 'GET') return json({ disponivel: c.ok, preco: c.ok ? c.preco : null, dias: c.dias });
  if (!c.ok) return json({ erro: 'A assinatura do Pro ainda não está aberta.' }, 503);
  const usuario = await usuarioDaRequisicao(req);
  if (!usuario) return json({ erro: 'Entre na sua conta para assinar.' }, 401);
  if ((await planoDe(usuario)) === 'pro') return json({ erro: 'Sua conta já é Pro.' }, 409);

  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { authorization: `Bearer ${c.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'aprovo-pro', title: `Aprovô Pro (${c.dias} dias)`, quantity: 1, unit_price: c.preco, currency_id: 'BRL' }],
      external_reference: usuario,
      metadata: { usuario, dias: c.dias },
      // Pix e cartão ficam liberados; boleto sai porque demora dias para compensar.
      payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 1 },
      back_urls: { success: `${c.site}/?pro=ok`, pending: `${c.site}/?pro=pendente`, failure: `${c.site}/?pro=erro` },
      auto_return: 'approved',
      notification_url: `${c.site}/api/mp-webhook`,
      statement_descriptor: 'APROVO PRO',
    }),
  });
  const p = (await r.json().catch(() => ({}))) as { init_point?: string; message?: string };
  if (!r.ok || !p.init_point) return json({ erro: 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.' }, 502);
  return json({ url: p.init_point });
};

export const config = { path: '/api/assinar' };
