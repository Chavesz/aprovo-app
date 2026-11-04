// E-mails de ciclo de vida (boas-vindas e lembrete de revisão) pelo Resend.
// DESLIGADO até existirem na Netlify: RESEND_API_KEY e EMAIL_DE (ex.: "Aprovô <oi@seudominio.com.br>", domínio verificado no Resend).
// EMAIL_SEGREDO assina o link de descadastro; sem ele, os e-mails não são enviados.
import { getStore } from '@netlify/blobs';
import { createHmac } from 'node:crypto';

export const SITE = (process.env.SITE_URL ?? 'https://aprovoapp.netlify.app').replace(/\/$/, '');
export const emails = () => getStore({ name: 'emails', consistency: 'strong' });
export interface Contato { email: string; optin: boolean; criadoEm: number; ultimoLembrete?: string; ultimoAlerta?: string }

export const emailLigado = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_DE && process.env.EMAIL_SEGREDO);
export const emailValido = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(e ?? '');

export const assinaturaDescadastro = (usuario: string) =>
  createHmac('sha256', process.env.EMAIL_SEGREDO ?? '').update(`descadastro:${usuario}`).digest('hex').slice(0, 32);
const linkSair = (usuario: string) => `${SITE}/api/email?sair=${encodeURIComponent(usuario)}&t=${assinaturaDescadastro(usuario)}`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function moldura(usuario: string, titulo: string, corpo: string, botao: string, link: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f8f8fa;font-family:Arial,Helvetica,sans-serif;color:#2a1f3d">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
<p style="font-weight:800;font-size:20px;color:#4a2f7a;margin:0 0 20px">Aprovô</p>
<h1 style="font-size:22px;line-height:1.25;margin:0 0 12px">${titulo}</h1>
<div style="font-size:16px;line-height:1.6;color:#5c5370">${corpo}</div>
<p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#ffd43b;color:#2a1f3d;font-weight:700;text-decoration:none;padding:14px 22px;border-radius:10px">${botao}</a></p>
<p style="font-size:12px;color:#5c5370;margin-top:32px">Você recebe este e-mail porque cadastrou este endereço no Aprovô. <a href="${linkSair(usuario)}" style="color:#4a2f7a">Não quero mais receber</a>.</p>
</div></body></html>`;
}

export async function enviarEmail(para: string, assunto: string, html: string) {
  if (!emailLigado()) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_DE, to: [para], subject: assunto, html }),
  });
  return r.ok;
}

export const boasVindas = (usuario: string, nome: string) =>
  moldura(usuario, `Bem-vindo ao Aprovô, ${esc(nome)}!`,
    '<p>Em 3 passos você já está estudando do jeito certo:</p><ol><li><strong>Escolha o concurso</strong> no Mentor (ou cole o edital).</li><li><strong>Faça o plano do dia</strong>: o Mentor diz o que estudar hoje.</li><li><strong>Revise o que errar</strong>: a questão volta em 1, 3, 7 e 30 dias.</li></ol>',
    'Fazer as questões de hoje', `${SITE}/`);

export const lembreteRevisao = (usuario: string, nome: string, n: number) =>
  moldura(usuario, `${esc(nome)}, ${n} ${n === 1 ? 'questão voltou' : 'questões voltaram'} para revisão hoje`,
    '<p>São questões que você errou e que chegaram no dia certo de revisar. Revisar agora é o que faz o erro virar acerto na prova.</p><p>Leva poucos minutos.</p>',
    'Revisar agora', `${SITE}/`);

/** Mesma regra do app (revisaoDoDia): última resposta errada volta em 1, 3, 7 e 30 dias conforme os acertos seguidos. */
export function devidasHoje(historico: { id: string; certa: boolean; em: number }[], agora = Date.now()) {
  const INTERVALOS = [1, 3, 7, 30];
  const por = new Map<string, { certa: boolean; em: number }[]>();
  for (const h of historico ?? []) por.set(h.id, [...(por.get(h.id) ?? []), h]);
  let n = 0;
  por.forEach((rs) => {
    const iErro = rs.map((r) => r.certa).lastIndexOf(false);
    if (iErro < 0) return;
    const acertos = rs.length - 1 - iErro;
    if (acertos >= INTERVALOS.length) return;
    if (agora - rs[rs.length - 1].em >= INTERVALOS[acertos] * 86400_000 - 3600_000) n++;
  });
  return n;
}

export const alertaConcursos = (usuario: string, nome: string, cidade: string, itens: { data: string; url: string; trecho: string }[]) =>
  moldura(usuario, `${esc(nome)}, saiu concurso no diário oficial de ${esc(cidade)}`,
    `<p>Encontramos ${itens.length} ${itens.length === 1 ? 'publicação' : 'publicações'} com "concurso" e "edital" desde o último aviso:</p><ul>${itens
      .map((i) => `<li style="margin-bottom:10px"><strong>${esc(i.data)}</strong>: ${esc(i.trecho.slice(0, 220))}… <a href="${esc(i.url)}" style="color:#4a2f7a">abrir o diário</a></li>`)
      .join('')}</ul><p>Confira o edital no link oficial. Os dados vêm do projeto Querido Diário (Open Knowledge Brasil).</p>`,
    'Ver no radar de concursos', `${SITE}/`);
