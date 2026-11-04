# Kanban – Aprovô (mentor para passar em concurso)

O que os líderes fazem de melhor e o que copiamos da ideia (não do conteúdo):
- **QConcursos / TEC**: banco enorme de questões com filtros por banca, matéria e assunto, comentários e estatísticas. → filtros + comentário + "macete" (já temos).
- **Estratégia / Gran**: trilhas de aulas por edital, PDFs, revisões e notícias de concursos abertos. → trilhas do mentor, resumo em PDF e radar de concursos.
- **Apps de mentoria (Coach/Mentoria)**: plano semanal adaptativo, metas diárias e cobrança. → plano por IA e dica do dia.

Prioridade: **P1** = vende muito e custa pouco · **P2** = vende bem e custa médio · **P3** = depois.

## A fazer
- [P2] Mais provas oficiais da Cebraspe pelo site novo (demais cargos da PC PB 2021, do STJ 2018 e da PF 2021): `scripts/importar-cebraspe-site.sh` (Certo/Errado) e `importar-cebraspe-questao.py` (múltipla escolha)
- [P3] Dividir o `cebraspe.json` por concurso e baixar só o do filtro (hoje ele já carrega depois da abertura)
- [P3] Mais provas da Consulplan (importador pronto: `scripts/importar-consulplan.py`). Verificado em 04/11/2026: dos 296 concursos listados, só o TJ CE 2019 tem caderno + gabarito pós-recurso; os de 2026 (TJMG, Bálsamo, Potirendaba, SAAEB, CRA/PR...) publicaram cadernos mas só gabarito preliminar, tentar de novo quando sair o pós-recurso. caderno e gabarito definitivo são públicos no CDN (`cdnsite.institutoconsulplan.org.br/concursos/...`), links na página de cada concurso (montada por JS, usar o navegador). Ex.: TJ CE Juiz Leigo 2019
- [P3] Provas de outras bancas. Verificado em 03/11/2026: **AOCP** e **FCC** não publicam o caderno (só editais/gabaritos); **Vunesp** e **IBFC** só liberam a prova com login de candidato. Não dá para importar sem conta, então ficam fora
- [P1] Supabase fase 2: trocar as leituras do Blobs para o Supabase (depois da `SUPABASE_SERVICE_ROLE_KEY` na Netlify, **Kauã**)
- [P2] Depoimentos reais na landing (coletar com os primeiros alunos, **Kauã**)
- [P2] Tirar o selo "Powered by Netlify" (configuração do site na Netlify, **Kauã**)
- [P3] Lembrete diário por notificação push (precisa de chaves VAPID e de um agendador)
- [P1] **Ligar a cobrança do Pro (Kauã)**: o código está pronto e desligado. Na Netlify (Site settings → Environment variables): `MP_ACCESS_TOKEN` (credencial de produção do Mercado Pago), `PRO_PRECO` (ex.: `19.90`), opcionais `PRO_DIAS` (padrão 30) e `MP_WEBHOOK_SECRET` (painel do MP → Webhooks, URL `https://aprovoapp.netlify.app/api/mp-webhook`, evento Pagamentos). Depois do deploy o botão "Assinar o Pro" aparece sozinho no Mentor. Testar antes com a credencial de teste do MP
- [P2] **Ligar os e-mails (Kauã)**: código pronto e desligado. Criar conta no Resend, verificar um domínio e definir `RESEND_API_KEY`, `EMAIL_DE` (ex.: `Aprovô <oi@dominio.com.br>`) e `EMAIL_SEGREDO` (qualquer texto longo aleatório, assina o link de descadastro). Boas-vindas sai na criação da conta; lembrete de revisão roda todo dia às 8h (função agendada `lembrete-revisao`)
- [P3] Notificação/e-mail de concurso novo na cidade escolhida
- [P3] Mais provas oficiais de outras bancas (FGV, FCC, Vunesp, IBFC). Atenção: vários PDFs da Cebraspe vêm com fonte embaralhada e não dão para extrair texto (ex.: CAIXA NM2 2010). CPCON/UEPB (PB) testada em 03/11/2026: servidor arquivo.cpcon.uepb.edu.br não respondeu, tentar de novo

## Fazendo
- (nenhum)

## Feito
- Lote 04/11/2026 (4): **cobrança do Pro via Mercado Pago pronta e desligada** (`/api/assinar` cria o Checkout Pro com Pix e cartão, sem boleto; `/api/mp-webhook` rebusca o pagamento na API do MP, confere a assinatura se houver segredo, é idempotente e libera o Pro por 30 dias; o plano expira sozinho), **e-mails de ciclo de vida prontos e desligados** (Resend: boas-vindas na criação da conta, lembrete diário de revisão agendado, link de descadastro assinado; e-mail opcional no cadastro) e **+54 questões da PC PB 2021 Escrivão** (Cebraspe)
- Lote 04/11/2026 (3), conversão: **primeira visita cai direto na 1ª questão** do teste grátis (sem tela de login; link "Já tenho conta"), **tela de planos Grátis x Pro** no Mentor com tabela comparativa fiel aos limites reais (15/300 mensagens) e botão "Quero o Pro quando abrir" (só registra no aparelho, nada é cobrado), **faixa de prova social** na landing com as provas oficiais reais do banco e a contagem de cada uma
- Lote 04/11/2026 (2): **+45 questões da PC PB 2021** (Agente de Investigação, Cebraspe, múltipla escolha, gabarito definitivo); selo **"✓ Prova oficial" / "Autoral"** em cada questão e filtro **Origem** no Praticar. Consulplan: nenhuma outra prova com gabarito definitivo publicado
- Lote 04/11/2026: **+36 questões da Consulplan** (TJ CE 2019 Juiz Leigo, gabarito pós-recurso, `public/data/consulplan.json`), **+21 itens da PF 2021** (Agente; Informática e Contabilidade com fonte embaralhada no PDF, ficaram fora) e **+25 itens do STJ 2018** (Técnico, conhecimentos básicos). `importar-cebraspe-site.sh` corrigido (caminhos do Windows e gabarito em UTF-8)
- Redesign (04/11/2026): identidade Marca-texto escolhida entre 3 direções por crítica de outro agente (`notas/design/`): amarelo de grifo #ffd43b para ação, berinjela #4a2f7a de marca, roxo claro para IA, Archivo + Source Serif 4, logo "A grifado", modo escuro neutro. Landing /aprovo refeita como página de vendas (hero, números e bancas reais, como funciona, Mentor IA, planos, FAQ, CTA). Lighthouse mobile: home 94, /aprovo 100 de desempenho; 100 nas demais
- Lighthouse mobile (03/11/2026, Node 22): home 96/100/100/100 e /aprovo 99/100/100/100 (desempenho/acessibilidade/boas práticas/SEO). Fontes do Google passaram a carregar sem bloquear a renderização (app e páginas geradas)
- Mentor leva a matéria do plano/edital para o filtro certo mesmo com nome diferente do banco (`resolverDisciplina`: "Conhecimentos Específicos" → "Específicos ACE", ignora "Professor de…" se não pedido)
- Verificação Consulplan/IDECAN (03/11/2026): **Consulplan** publica caderno + gabarito definitivo sem login; **IDECAN** bloqueia com verificação anti-robô (Cloudflare), fica fora
- [P2] **Aviso "carregando mais provas"** no Praticar enquanto Cebraspe, OAB e ENEM chegam (some sozinho; o aluno já pode começar)
- [P1] **Auditoria das questões**: `scripts/auditar-questoes.py` (ids e textos duplicados, gabarito sem alternativa, alternativas vazias, restos de PDF); 75 removidas e 46 textos limpos; relatório em `notas/auditoria-qualidade.md`
- [P1] **Auditoria de desempenho no celular**: OAB e ENEM (1,1 MB comprimidos) também carregam depois da abertura; medições em `notas/auditoria-qualidade.md`
- [P2] **Mentor: trocar de modelo ao editar o perfil** ("Trocar por um modelo pronto" troca matérias e pesos de uma vez); testado com o modelo INSS
- [P1] **+66 questões oficiais do TJ CE 2023 (Cebraspe)**, Técnico Judiciário (Judiciária e Técnico-Administrativa), múltipla escolha A–E, gabarito definitivo; novo importador `scripts/importar-cebraspe-questao.py`
- [P1] **+68 itens oficiais da PRF 2021 (Cebraspe)**: conhecimentos gerais, legislação de trânsito e direito, gabarito definitivo; `scripts/importar-cebraspe-site.sh` para qualquer caderno do site novo
- [P2] **Mentor: modelo INSS** (Técnico do Seguro Social) em 1 toque, com Seguridade Social e Previdência pesando o dobro; a matéria entra no grupo Direito do filtro
- [P2] **20 questões autorais no estilo FCC e Vunesp** (CF, Lei 8.112, atos administrativos, Português, Matemática, RLM, Informática), marcadas como "Aprovô (estilo FCC/Vunesp)" e "não são oficiais" (`scripts/gerar-estilo.py`)
- [P1] **+164 itens oficiais do INSS 2022 (Cebraspe)**, Técnico do Seguro Social: básicos e Seguridade/Previdência, gabarito definitivo e fonte; links pegos no site novo da Cebraspe (`scripts/importar-inss-2022.sh`); página de SEO nova
- [P2] **Mentor: modelo "Polícia e Bombeiros (FGV)"** em 1 toque, usando as matérias das provas da PM SP e do CBMERJ
- [P2] **Pesquisa das bancas FCC, Vunesp, IBFC e AOCP** pelo navegador: nenhuma deixa a prova pública (detalhes no card de Consulplan/IDECAN)
- [P1] **+73 questões oficiais da FGV: CBMERJ Cadete 2022** (Português, Matemática, Física, Química, Biologia, Geografia, História e Sociologia), gabarito definitivo e fonte; importador FGV agora separa questões coladas na mesma linha e limpa rodapés
- [P2] **Landing no celular sem botão duplicado**: o botão fixo "Fazer 5 questões grátis" só aparece depois que o botão do topo sai da tela
- [P2] **Abertura mais rápida**: o app abre com os bancos menores e o da Cebraspe (5+ MB) entra logo depois, sem travar a primeira tela
- [P1] **Primeira prova oficial da FGV**: PM SP Cabo 2022, 55 questões de múltipla escolha com gabarito definitivo e fonte (lista de PDFs pega com o navegador, pois o site monta por JavaScript); importador `scripts/importar-fgv.py`; página de SEO nova
- [P1] **+703 itens oficiais da SEDUC AM 2011 (Cebraspe)**: professores de 18 áreas, pedagogo, merendeiro e apoio; nome do cargo tirado da página oficial; página de SEO nova
- [P2] **Resumo semanal compartilhável** no Desempenho: questões, % de acerto, dias de estudo, ponto forte e o que focar, com botão para WhatsApp
- [P2] **Revisão espaçada 1-3-7-30** (antes 1-7-30) e aviso de quantas voltam amanhã
- [P1] **Landing /aprovo mais vendedora**: número real de questões no topo (9.592), "Como funciona" em 3 passos, lista das provas oficiais no banco, perguntas frequentes e botão fixo no celular; print em `notas/depois-landing-celular.jpg`
- [P1] **Plano do dia na home**: faixa no topo do Praticar com o primeiro bloco do plano ("Hoje: 45 min de Direito Administrativo · Treinar agora") ou o convite para montar o plano
- [P1] **Mentor em 1 toque**: 5 modelos prontos (ACS, ACE, Técnico Cebraspe, Prefeitura nível médio, Enfermagem) geram o plano na hora, sem gastar a IA nem colar o edital
- [P2] **Filtro de matéria agrupado por área** (Básicas, Direito, Saúde, Engenharia e exatas, Educação e comunicação, Tecnologia, Gestão e contas)
- [P2] **Praticar no celular**: o cartão da meta começa recolhido e a questão aparece na primeira tela; prints em `notas/antes|depois-meta-praticar.jpg`
- [P1] **+1.180 itens oficiais da FUB 2009 (Cebraspe)**, 49 cargos, gabarito definitivo e fonte; importador genérico `scripts/importar-cebraspe-lote.sh` (qualquer pasta da Cebraspe) e filtro de texto colado no PDF
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
