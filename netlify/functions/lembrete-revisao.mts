// Função agendada (todo dia às 8h de Brasília): manda o lembrete de revisão para quem cadastrou e-mail
// e tem questões erradas no dia de revisar. Não faz nada enquanto o e-mail estiver desligado (ver netlify/lib/email.ts).
import { getStore } from '@netlify/blobs';
import { devidasHoje, emailLigado, emails, enviarEmail, lembreteRevisao, type Contato } from '../lib/email';

const hojeBR = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);

export default async () => {
  if (!emailLigado()) return new Response('e-mail desligado');
  const progresso = getStore({ name: 'progresso', consistency: 'strong' });
  const usuarios = getStore({ name: 'usuarios', consistency: 'strong' });
  const { blobs } = await emails().list();
  let enviados = 0;
  for (const b of blobs) {
    const c = (await emails().get(b.key, { type: 'json' })) as Contato | null;
    if (!c?.optin || c.ultimoLembrete === hojeBR()) continue;
    const dados = (await progresso.get(b.key, { type: 'json' })) as Record<string, unknown> | null;
    const n = devidasHoje((dados?.['cq:historico'] as never) ?? []);
    if (!n) continue;
    const nome = ((await usuarios.get(b.key, { type: 'json' })) as { nome?: string } | null)?.nome ?? 'Oi';
    if (await enviarEmail(c.email, `🔁 ${n} ${n === 1 ? 'questão' : 'questões'} para revisar hoje`, lembreteRevisao(b.key, nome, n))) {
      await emails().setJSON(b.key, { ...c, ultimoLembrete: hojeBR() });
      enviados++;
    }
  }
  return new Response(`${enviados} lembretes`);
};

export const config = { schedule: '0 11 * * *' };
