// /api/admin: liberação manual do Pro (fallback quando a venda é por link pronto, Pix direto ou cortesia).
// DESLIGADO até existir ADMIN_TOKEN na Netlify (texto aleatório com 32+ caracteres). Use pela página /admin.html.
// Authorization: Bearer <ADMIN_TOKEN>
// GET  ?usuario=x                       → plano atual
// POST { usuario, acao: 'pro', dias? }  → libera o Pro por N dias (padrão 31; 0 = sem prazo)
// POST { usuario, acao: 'gratis' }      → volta ao grátis
import { timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json, normalizar } from '../lib/contas';
import { gravarPlano, lerPlano } from '../lib/assinatura';
import { planoDe } from '../lib/uso';

function autorizado(req: Request) {
  const segredo = process.env.ADMIN_TOKEN ?? '';
  if (segredo.length < 32) return false;
  const t = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  return t.length === segredo.length && timingSafeEqual(Buffer.from(t), Buffer.from(segredo));
}

export default async (req: Request) => {
  if (!process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN.length < 32) return json({ erro: 'Admin desligado: defina ADMIN_TOKEN (32+ caracteres) na Netlify.' }, 503);
  if (!autorizado(req)) return json({ erro: 'Não autorizado.' }, 401);
  const url = new URL(req.url);
  const corpo = req.method === 'POST' ? ((await req.json().catch(() => ({}))) as { usuario?: string; acao?: string; dias?: number }) : {};
  const usuario = normalizar(String(corpo.usuario ?? url.searchParams.get('usuario') ?? ''));
  if (!usuario) return json({ erro: 'Informe o usuário.' }, 400);
  const existe = await getStore({ name: 'usuarios', consistency: 'strong' }).get(usuario);
  if (!existe) return json({ erro: `Usuário "${usuario}" não existe.` }, 404);

  if (req.method === 'GET') return json({ usuario, plano: await planoDe(usuario), registro: await lerPlano(usuario) });
  if (req.method !== 'POST') return json({ erro: 'Método não permitido.' }, 405);

  const atual = await lerPlano(usuario);
  if (corpo.acao === 'pro') {
    const dias = corpo.dias === undefined ? 31 : Math.max(0, Math.min(3650, Number(corpo.dias) || 0));
    const ate = dias ? Math.max(Date.now(), atual.ate ?? 0) + dias * 86400_000 : undefined;
    const r = await gravarPlano(usuario, { ...atual, plano: 'pro', provedor: 'manual', status: 'ativa', ate, assinatura: undefined });
    return json({ ok: true, usuario, registro: r });
  }
  if (corpo.acao === 'gratis') {
    const r = await gravarPlano(usuario, { ...atual, plano: 'gratis', provedor: 'manual', status: 'expirada', ate: Date.now(), assinatura: undefined });
    return json({ ok: true, usuario, registro: r });
  }
  return json({ erro: 'acao deve ser "pro" ou "gratis".' }, 400);
};

export const config = { path: '/api/admin' };
