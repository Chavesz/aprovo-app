import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Só no `npm run dev`: responde /api/ia com dados de exemplo, para testar a interface sem chave da IA.
// Em produção a rota é a Netlify Function em netlify/functions/ia.mts.
function iaDeExemplo(): Plugin {
  return {
    name: 'ia-de-exemplo',
    configureServer(server) {
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
