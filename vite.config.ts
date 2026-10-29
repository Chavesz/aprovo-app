import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Só no `npm run dev`: responde /api/ia com dados de exemplo, para testar a interface sem chave da IA.
// Em produção a rota é a Netlify Function em netlify/functions/ia.mts.
function iaDeExemplo(): Plugin {
  return {
    name: 'ia-de-exemplo',
    configureServer(server) {
      // Conta e progresso em memória, só para testar a interface (em produção: Netlify Functions + Blobs).
      const contas = new Map<string, { senha: string; nome: string }>();
      const sessoes = new Map<string, string>();
      const progresso = new Map<string, string>();
      const lerCorpo = (req: NodeJS.ReadableStream) =>
        new Promise<string>((ok) => {
          let c = '';
          req.on('data', (p) => (c += p));
          req.on('end', () => ok(c));
        });
      server.middlewares.use('/api/conta', async (req, res) => {
        const p = JSON.parse((await lerCorpo(req)) || '{}');
        const u = String(p.usuario ?? '').toLowerCase();
        res.setHeader('content-type', 'application/json');
        const responder = (status: number, corpo: unknown) => {
          res.statusCode = status;
          res.end(JSON.stringify(corpo));
        };
        if (p.acao === 'criar') {
          if (contas.has(u)) return responder(400, { erro: 'Esse usuário já existe. Escolha outro ou entre.' });
          contas.set(u, { senha: p.senha, nome: p.nome || u });
        } else if (p.acao === 'entrar') {
          if (contas.get(u)?.senha !== p.senha) return responder(400, { erro: 'Usuário ou senha incorretos.' });
        } else return responder(200, { ok: true });
        const token = Math.random().toString(16).slice(2).padEnd(64, '0');
        sessoes.set(token, u);
        responder(200, { token, usuario: u, nome: contas.get(u)!.nome });
      });
      server.middlewares.use('/api/ranking', (req, res) => {
        const eu = sessoes.get(String(req.headers.authorization ?? '').replace('Bearer ', ''));
        res.setHeader('content-type', 'application/json');
        const linhas = Array.from(contas.entries()).map(([u, c]) => {
          const h: { certa: boolean }[] = JSON.parse(progresso.get(u) ?? '{}')['cq:historico'] ?? [];
          const a = h.filter((x) => x.certa).length;
          return { usuario: u, eu: u === eu, nome: c.nome, total: h.length, acertos: a, hoje: h.length, acertosHoje: a, provas: 0, provasHoje: 0 };
        });
        res.end(JSON.stringify(linhas));
      });
      server.middlewares.use('/api/progresso', async (req, res) => {
        const u = sessoes.get(String(req.headers.authorization ?? '').replace('Bearer ', ''));
        res.setHeader('content-type', 'application/json');
        if (!u) {
          res.statusCode = 401;
          return res.end(JSON.stringify({ erro: 'Sessão expirada. Entre de novo.' }));
        }
        if (req.method === 'PUT') {
          progresso.set(u, await lerCorpo(req));
          return res.end(JSON.stringify({ ok: true }));
        }
        res.end(progresso.get(u) ?? '{}');
      });

      server.middlewares.use('/api/ia', (req, res) => {
        let corpo = '';
        req.on('data', (c) => (corpo += c));
        req.on('end', () => {
          const p = JSON.parse(corpo || '{}');
          const resposta =
            p.acao === 'edital'
              ? {
                  concurso: { nome: 'INSS 2026 (exemplo)', banca: 'Cebraspe', orgao: 'INSS', cargo: 'Técnico do Seguro Social' },
                  disciplinas: [
                    { nome: 'Língua Portuguesa', assuntos: ['Interpretação de texto', 'Concordância', 'Crase', 'Pontuação'] },
                    { nome: 'Direito Constitucional', assuntos: ['Direitos fundamentais', 'Seguridade social na CF', 'Administração pública'] },
                    { nome: 'Direito Previdenciário', assuntos: ['Segurados do RGPS', 'Benefícios', 'Custeio'] },
                  ],
                }
              : {
                  questoes: Array.from({ length: Math.min(p.quantidade ?? 3, 10) }, (_, i) => ({
                    enunciado: `Questão de exemplo ${i + 1} sobre ${p.assunto}. No servidor real, este texto vem da IA.`,
                    comando: 'Assinale a alternativa correta.',
                    alternativas: p.formato === 'certo-errado'
                      ? [{ letra: 'C', texto: 'Certo' }, { letra: 'E', texto: 'Errado' }]
                      : ['A', 'B', 'C', 'D', 'E'].map((l) => ({ letra: l, texto: `Alternativa ${l} de exemplo.` })),
                    gabarito: p.formato === 'certo-errado' ? (i % 2 ? 'E' : 'C') : 'ABCDE'[i % 5],
                    comentario: 'Comentário de exemplo: a IA explica aqui o porquê do gabarito e de cada alternativa.',
                  })),
                };
          setTimeout(() => {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(resposta));
          }, 700);
        });
      });
    },
  };
}

export default defineConfig({ plugins: [react(), iaDeExemplo()] });
