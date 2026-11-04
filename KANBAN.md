# Kanban – Aprovô (mentor para passar em concurso)

O que os líderes fazem de melhor e o que copiamos da ideia (não do conteúdo):
- **QConcursos / TEC**: banco enorme de questões com filtros por banca, matéria e assunto, comentários e estatísticas. → filtros + comentário + "macete" (já temos).
- **Estratégia / Gran**: trilhas de aulas por edital, PDFs, revisões e notícias de concursos abertos. → trilhas do mentor, resumo em PDF e radar de concursos.
- **Apps de mentoria (Coach/Mentoria)**: plano semanal adaptativo, metas diárias e cobrança. → plano por IA e dica do dia.

Prioridade: **P1** = vende muito e custa pouco · **P2** = vende bem e custa médio · **P3** = depois.

## A fazer
- [P2] Polimento visual do Praticar no celular: o cartão da meta ocupa a tela toda e empurra a questão para baixo da dobra (recolher depois de definido)
- [P2] Filtro de matéria agrupado por área (Saúde, Engenharia, Informática, Direito...), porque com o MPU passaram de 80 matérias
- [P3] Mais concursos da Cebraspe no mesmo formato (pastas com caderno + `Gab_definitivo`): FUB 2009, SEDUC AM 2011
- [P1] Supabase fase 2: trocar as leituras do Blobs para o Supabase (depois da `SUPABASE_SERVICE_ROLE_KEY` na Netlify, **Kauã**)
- [P2] Depoimentos reais na landing (coletar com os primeiros alunos, **Kauã**)
- [P2] Tirar o selo "Powered by Netlify" (configuração do site na Netlify, **Kauã**)
- [P3] Lembrete diário por notificação push (precisa de chaves VAPID e de um agendador)
- [P2] Cobrança real do plano Pro (Mercado Pago / Stripe), **depende do Kauã** (conta e chave)
- [P3] Notificação/e-mail de concurso novo na cidade escolhida
- [P3] Mais provas oficiais de outras bancas (FGV, FCC, Vunesp, IBFC). Atenção: vários PDFs da Cebraspe vêm com fonte embaralhada e não dão para extrair texto (ex.: CAIXA NM2 2010). CPCON/UEPB (PB) testada em 03/11/2026: servidor arquivo.cpcon.uepb.edu.br não respondeu, tentar de novo

## Fazendo
- (nenhum)

## Feito
- [P2] **Limpeza dos enunciados**: 684 comandos sem cabeçalho/rodapé de página do caderno (`scripts/limpar-cabecalhos.py`)
- [P2] **Polimento do ranking no celular**: sozinho no ranking vira um cartão compacto (sem pódio de "1º de 1"), e o desempenho sobe para a primeira tela; prints em `notas/antes|depois-desempenho-celular.jpg`
- [P1] **+3.294 itens oficiais do MPU 2010 (Cebraspe)**, 54 cadernos (analista e técnico), Certo ou Errado, gabarito definitivo e fonte; `scripts/importar-mpu-2010.sh` + `ajustar-mpu-2010.py`; página de SEO nova
- [P2] **Filtro por tipo** (múltipla escolha × Certo ou Errado) e ícone próprio para a aba Edital
- [P2] **Polimento visual no celular** (menu numa linha, topo sem cortes, sem tag repetida), com prints em `notas/`
- [P1] **+1.061 itens oficiais da Cebraspe** (SEMAD São Luís 2008, 38 cadernos de saúde, Certo ou Errado) com gabarito definitivo e fonte; importador `scripts/importar-cebraspe-ce.py` + lote `scripts/importar-semad-slz-2008.sh`
- [P1] **Supabase fase 1**: escrita dupla Blobs → Supabase (perfis/Auth, respostas, simulados, plano do mentor, uso da IA, comentários), service role só nas funções, sem perder dados
- [P3] **Prova oficial UERN 2010 (Cebraspe)**: +24 questões com gabarito definitivo e fonte; importador aceita gabarito, matérias por faixa e ano
- [P2] **Filtro "Mais difíceis"** no Praticar (menos de 40% de acerto da comunidade, 5+ respostas)
- [P2] **Ranking do simulado da semana**: aba nova no ranking, zera no domingo
- [P2] **Estatística justa**: só a primeira resposta de cada aluno conta no % da comunidade
- [P1] **Auditoria de segurança**: /api/ia agora exige login e tem limite diário (antes era aberto e usava o modelo caro: risco de gastar a chave), IA trocada para Haiku, proteção contra SSRF no link do edital, senha mínima de 6, bloqueio após 8 senhas erradas, sessão expira em 90 dias, respostas da API sem cache e cabeçalhos de segurança (CSP, HSTS, X-Frame-Options) no netlify.toml
- [P1] **Supabase preparado**: migration com 8 tabelas (perfis, respostas, simulados, plano do mentor, uso da IA, assinaturas, radar, comentários) e RLS em todas, `.env.example` e `supabase/README.md`
- [P2] **Polimento de acessibilidade**: alvos de toque de 44px no celular e foco visível nos componentes novos
- [P1] **% de acerto da comunidade** em cada questão (/api/estatisticas), mostrado após responder
- [P2] **Caderno de erros em PDF** na aba Revisar (questões erradas da última vez, com gabarito, comentário e macete)
- [P2] **Flashcards de lei seca** (24 cartões: CF, 8.080, 8.142, 11.350, improbidade, licitações, LGPD) com caixas de Leitner 1-3-7-15-30 dias, sincronizados na conta
- [P2] **Números reais na landing** (4.033 questões, 7 bancas, 34 matérias) e páginas de SEO da OAB e do ENEM
- [P1] **Plano na agenda do celular**: botão no Mentor baixa um .ics com os blocos da semana e lembrete de 10 min
- [P1] **Modo foco 25/5** no Praticar, com aviso sonoro
- [P1] **Crítica de UX do funil**: botão da landing leva direto ao teste (/?teste=1), menu da landing estilizado, teste com veredito, barra de progresso e "pular e criar conta"; cadastro aceita "Outro concurso" (não só ACE/ACS)
- [P1] **Onboarding que converte**: teste de 5 questões comentadas sem cadastro na tela de entrada, terminando no cadastro
- [P2] **Desafiar no WhatsApp**: botão no resultado do simulado com a nota e o link da landing
- [P2] **Sequência de dias seguidos** na meta diária
- [P1] **Modo celular / PWA**: instala como app, abre offline com as questões já baixadas
- [P1] **Landing de vendas** em /aprovo, com benefícios, planos e questões de exemplo
- [P1] **SEO por concurso**: 10 páginas /concursos/* com questões de amostra, sitemap.xml e robots.txt (`scripts/gerar-paginas.py`)
- [P2] **Estatísticas por banca** no Desempenho (além de matéria e assunto)
- [P3] **Primeira prova oficial da Cebraspe**: CAIXA 2010 nível médio, 27 questões com o gabarito definitivo e a fonte (texto/figura e anuladas ficaram de fora)
- [P2] **Revisão espaçada**: questão errada volta em 1, 7 e 30 dias (filtro "Revisão do dia" + aviso no Praticar)
- [P2] **Simulado da semana**: as mesmas 40 questões para todos, com nota de corte estimada pelo ranking
- [P3] **Comentários dos alunos** em cada questão (/api/comentarios)
- [P1] Mentor com IA: onboarding, plano adaptativo, chat, resumo em PDF, Grátis × Pro
- [P1] **Concursos abertos perto de você**: estado + cidade, via API pública do Querido Diário (diários oficiais), com o link do diário e a fonte; atalho para o DOU
- [P1] **Página por banca**: estilo, dicas e onde baixar as provas anteriores oficiais (sites das bancas)
- [P1] **Mais questões das matérias comuns**: Português, RLM, Informática, Direito Constitucional, Direito Administrativo e Atualidades (autorais, com base na lei, não copiadas)
- [P1] **Dicas diárias e trilhas de aulas do mentor**: uma dica por dia e trilhas por matéria com aula no YouTube, fonte oficial e questões
