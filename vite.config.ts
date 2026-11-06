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
          const d = JSON.parse(progresso.get(u) ?? '{}');
          const h: { certa: boolean }[] = d['cq:historico'] ?? [];
          const p: { estilo: boolean; nota: number }[] = d['cq:provas'] ?? [];
          const notas = p.filter((x) => x.estilo).map((x) => x.nota);
          const a = h.filter((x) => x.certa).length;
          return {
            usuario: u, eu: u === eu, nome: c.nome, total: h.length, acertos: a, hoje: h.length, acertosHoje: a,
            avulsas: h.length, acertosAvulsas: a, provasEstilo: notas.length,
            provas: p.length, provasHoje: p.length, melhorNota: Math.max(0, ...notas), ultimaNota: notas[notas.length - 1] ?? 0,
          };
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

      const estat = new Map<string, { a: number; t: number }>();
      server.middlewares.use('/api/estatisticas', async (req, res) => {
        res.setHeader('content-type', 'application/json');
        const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? '';
        if (req.method === 'GET') return res.end(JSON.stringify(estat.get(id) ?? { a: 0, t: 0 }));
        const p = JSON.parse((await lerCorpo(req)) || '{}');
        const v = estat.get(p.id) ?? { a: 0, t: 0 };
        estat.set(p.id, { a: v.a + (p.certa ? 1 : 0), t: v.t + 1 });
        res.end(JSON.stringify(estat.get(p.id)));
      });
      const comentarios = new Map<string, unknown[]>();
      server.middlewares.use('/api/comentarios', async (req, res) => {
        res.setHeader('content-type', 'application/json');
        const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? '';
        if (req.method === 'GET') return res.end(JSON.stringify(comentarios.get(id) ?? []));
        const p = JSON.parse((await lerCorpo(req)) || '{}');
        const l = [...(comentarios.get(p.id) ?? []), { usuario: 'teste', texto: p.texto, em: Date.now() }];
        comentarios.set(p.id, l);
        res.end(JSON.stringify(l));
      });

      // Mentor de exemplo: sem chave da IA no `npm run dev`.
      server.middlewares.use('/api/mentor', async (req, res) => {
        const p = JSON.parse((await lerCorpo(req)) || '{}');
        res.setHeader('content-type', 'application/json');
        const uso = { plano: 'gratis', usadas: 1, limite: 15, configurada: true };
        if (p.acao === 'uso') return res.end(JSON.stringify(uso));
        if (p.acao === 'edital')
          return res.end(JSON.stringify({ ...uso, edital: { concurso: 'Exemplo 2026', cargo: 'Agente', banca: 'EDUCA PB', dataProva: '', disciplinas: [{ nome: 'Português', questoes: 15, peso: 2, assuntos: ['Crase', 'Concordância'] }] } }));
        res.end(JSON.stringify({ ...uso, texto: 'Resposta de exemplo do **Mentor** (modo de teste).' }));
      });
      // Batalha (memória): um jogador fictício "Rival" responde sozinho para testar o placar ao vivo.
      const batalhas: Record<string, any> = {};
      server.middlewares.use('/api/convites', (_req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ amigos: 1, premios: 0, faltam: 2 })); });
      server.middlewares.use('/api/reportar', (_req, res) => { res.setHeader('content-type', 'application/json'); res.end('{"ok":true}'); });
      server.middlewares.use('/api/batalha', (req, res) => {
        let corpo = '';
        req.on('data', (c) => (corpo += c));
        req.on('end', () => {
          res.setHeader('content-type', 'application/json');
          const u = new URL(req.url ?? '', 'http://x');
          const eu = 'eu';
          const rival = (b: any) => { const r = b.jogadores.rival; const n = Math.min(b.ids.length, Math.floor((Date.now() - r.inicio) / 3000)); r.respostas = b.ids.map((_: string, i: number) => (i < n ? i % 3 !== 0 : null)); if (n >= b.ids.length) r.fim = r.inicio + b.ids.length * 3000; };
          if (req.method === 'GET') {
            if (u.searchParams.has('minhas')) return res.end(JSON.stringify({ vitorias: 0, lista: Object.values(batalhas).map((b: any) => ({ codigo: b.codigo, titulo: b.titulo, n: b.ids.length, criadaEm: b.criadaEm, jogadores: 2, pendente: Object.values(b.jogadores).some((j: any) => j.nome === 'Você' && !j.fim) })) }));
            const b = batalhas[u.searchParams.get('codigo') ?? '']; if (!b) { res.statusCode = 404; return res.end('{"erro":"Batalha não encontrada."}'); }
            rival(b); return res.end(JSON.stringify({ ...b, eu }));
          }
          const p = JSON.parse(corpo || '{}');
          if (p.acao === 'criar') { const codigo = 'TESTE' + Object.keys(batalhas).length; batalhas[codigo] = { codigo, titulo: p.titulo, ids: p.ids, criador: eu, criadaEm: Date.now(), jogadores: { [eu]: { nome: 'Você', respostas: p.ids.map(() => null), inicio: Date.now() }, rival: { nome: 'Rival', respostas: [], inicio: Date.now() } } }; return res.end(JSON.stringify({ codigo })); }
          if (p.acao === 'diario') { const codigo = 'D' + new Date().toISOString().slice(2, 10).replace(/-/g, ''); batalhas[codigo] ??= { codigo, titulo: 'Desafio do dia', ids: p.ids, criador: 'aprovo', criadaEm: Date.now(), jogadores: { rival: { nome: 'Rival', respostas: [true, true, false], inicio: Date.now() } } }; batalhas[codigo].jogadores[eu] ??= { nome: 'Você', respostas: p.ids.map(() => null), inicio: Date.now() }; return res.end(JSON.stringify({ ...batalhas[codigo], eu })); }
          const b = batalhas[String(p.codigo).toUpperCase()]; if (!b) { res.statusCode = 404; return res.end('{"erro":"Batalha não encontrada."}'); }
          if (p.acao === 'responder') { const j = b.jogadores[eu]; if (j.respostas[p.i] === null) j.respostas[p.i] = !!p.certa; if (j.respostas.every((r: any) => r !== null)) j.fim = Date.now(); }
          rival(b); res.end(JSON.stringify({ ...b, eu }));
        });
      });
      server.middlewares.use('/api/concursos-abertos', (_req, res) => {
        const h = new Date().toISOString();
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ fonte: 'teste', lista: [
          { titulo: 'Prefeitura de Patos (PB) abre concurso com 120 vagas', link: 'https://concursosnobrasil.com/concursos/pb/x', uf: 'PB', data: h, tipo: 'concurso', area: 'Administrativo' },
          { titulo: 'Concurso INSS 2026: edital com 1.500 vagas para Técnico', link: 'https://concursosnobrasil.com/concursos/df/y', uf: 'DF', data: h, tipo: 'concurso', area: 'Federais' },
          { titulo: 'Prefeitura de Cuité (PB) seleciona Agentes Comunitários de Saúde', link: 'https://concursosnobrasil.com/concursos/pb/z', uf: 'PB', data: h, tipo: 'selecao', area: 'Saúde' },
        ] }));
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
