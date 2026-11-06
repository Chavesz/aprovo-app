# Kanban – Aprovô (mentor para passar em concurso)

O que os líderes fazem de melhor e o que copiamos da ideia (não do conteúdo):
- **QConcursos / TEC**: banco enorme de questões com filtros por banca, matéria e assunto, comentários e estatísticas. → filtros + comentário + "macete" (já temos).
- **Estratégia / Gran**: trilhas de aulas por edital, PDFs, revisões e notícias de concursos abertos. → trilhas do mentor, resumo em PDF e radar de concursos.
- **Apps de mentoria (Coach/Mentoria)**: plano semanal adaptativo, metas diárias e cobrança. → plano por IA e dica do dia.

Prioridade: **P1** = vende muito e custa pouco · **P2** = vende bem e custa médio · **P3** = depois.

## A fazer
### Lote 17+ (pedido 06/11: engajamento, batalha, convite, landing com movimento)
- [x] **Batalha entre amigos**: 10 ou 20 questões iguais para os dois, link pelo WhatsApp, placar ao vivo (atualiza a cada poucos segundos), vencedor por acertos e tempo
- [x] **Convite de amigos**: link pessoal; a cada 3 amigos que criarem conta, 7 dias de Pro grátis; contador no Ranking
- [x] **Ranking**: "Melhor do dia" em destaque, vitórias em batalhas, selo do top 3 da semana
- [x] **Landing com movimento**: chat do hero digitando ao vivo, números contando, seções surgindo ao rolar, faixa rolando com concursos abertos de verdade (respeitando prefers-reduced-motion)
- [ ] **Liga semanal** (estilo Duolingo): grupos de 20 alunos do mesmo nível, sobe/desce de divisão no domingo
- [x] **Sequência de dias** com chama e meta diária na barra de cima; aviso "não perca a sequência"
- [ ] **Mentor com IA proativo**: mensagem diária no app ("hoje: 30 min de Previdenciário, você errou 3 ontem") e resumo semanal
- [ ] **Questão comentada pela IA sob demanda** com citação da lei e botão "reportar erro"
- [ ] **Cadernos de erros** por matéria, exportáveis em PDF
- [ ] **Concursos abertos**: salvar favoritos, aviso quando sair edital do cargo favorito, prazo de inscrição
- [ ] **Novos prints** do app atualizados para a landing e as lojas
- [ ] **Design do app** (padrão QConcursos/Gran/Duolingo): tela inicial "Hoje" com plano, sequência, batalha pendente e ranking resumido

### Benchmark 06/11/2026 (o que os concorrentes têm e o que puxar)
Referências públicas: QConcursos e TEC (banco com filtros e comentários de professores), Gran e Estratégia (cursos, planos de estudo, simulados nacionais com ranking), PCI Concursos (lista de concursos abertos por estado), Aprova Concursos e Mentor Concursos (mentoria humana cara). Diferencial do Aprovô: **mentor com IA** que entrevista o aluno e monta e ajusta o plano, a preço de app.
- [x] Mentor com IA em formato de entrevista (06/11, conversa + diagnóstico de 10 questões + plano em min/dia): 5 a 8 perguntas no chat (rotina, pontos fracos, provas anteriores) e plano gerado a partir das respostas, revisado toda semana com base no desempenho
- [ ] Simulado nacional mensal com ranking por cargo e por estado e nota de corte estimada (Gran/Estratégia fazem; puxa retenção)
- [ ] Radar de concursos abertos: além do Querido Diário, ler editais publicados em diários estaduais e páginas oficiais de bancas (só fontes públicas) e avisar por e-mail/WhatsApp quem marcou a cidade
- [ ] Prefeituras pequenas: pedir ao aluno o link do edital e da prova anterior; a IA extrai matérias e gera questões "estilo" da banca local
- [ ] Comentários em vídeo/texto curto por questão gerados pela IA e revisados pelos alunos (votos), como a "resolução comentada" do QConcursos
- [ ] Cadernos de questões por assunto que o aluno salva e compartilha
- [ ] Sequência de dias e metas semanais com notificação (retenção, Duolingo-like)
- [ ] Ranking: liga entre amigos (código de convite) e selo do top 10 da semana

_Reordenado em 04/11/2026 pela crítica de conversão (`notas/design/critica-2026-11-04.md`). Os números entre parênteses são os achados do relatório._
- [P1] (3) Recortar Grátis × Pro (explicação de erro, plano até a prova, PDFs no Pro) com lista única `RECURSOS_PRO` usada pelo app e pela landing; ajustar cota em `mentor.mts`
- [P1] (4) Concurso ativo único: edital começa vazio (não Cuité para todos), simulado da semana, resumão e flashcards seguem o concurso escolhido
- [P1] (5) Confiança: rodapé com responsável/contato, páginas /termos e /privacidade, e-mail obrigatório antes de pagar, recuperar senha por e-mail (**Kauã**: CNPJ/contato)
- [P2] (7) Teste grátis com 5 questões oficiais com banca e ano, sorteadas pelo concurso da página de origem (`?c=slug`)
- [P2] (8) Resultado do teste grátis sem muro: mostrar o resultado e só então pedir cadastro
- [P2] (9) Plano da semana variado por peso das matérias, com "Começar" em cada bloco
- [P2] (10) Formulário de pesos do Mentor estoura 375 px (grid `1fr 64px 64px`)
- [P2] (11) "Aula" das trilhas é só busca no YouTube: trocar por vídeos escolhidos ou rotular como busca
- [P2] (12) 7 abas não cabem em 375 px: agrupar (ex.: Estudar / Simulado / Mentor / Eu)
- [P3] (13) Praticar: questão começa no meio da tela e o botão principal é "Pular"
- [P3] (14) Selo da Netlify cobre CTAs (**Kauã**, já listado)
- [P3] (15-16) Landing: prova social real e números que não exponham o acervo pequeno
- [P3] (17) Desempenho conversar com o "Mentor que te conhece"
- [P3] (18-19) Landing pesada no celular barato; app logado baixa ~12,9 MB de JSON (dividir/podar)
- [P3] (20) "Quero o Pro quando abrir" precisa avisar de verdade (lista de e-mail)
- [P3] (21-24) Flashcards de erro, diálogos nativos (confirm), distrações no simulado, "Entrar" da landing levando ao teste
- [P2] Mais provas oficiais da Cebraspe pelo site novo. **Bloqueado em 04/11/2026:** a Cebraspe retirou os links de cadernos e gabaritos do STJ 2018 ("Comunicado - Retirada de links") e da PC PB 2021; procurar outros concursos com caderno ainda no ar (antes: demais cargos do STJ 2018 e da PC PB 2021; PF 2021 Escrivão/Papiloscopista têm fonte embaralhada, não rendem): `scripts/importar-cebraspe-site.sh` (Certo/Errado) e `importar-cebraspe-questao.py` (múltipla escolha)
- [P3] Dividir o `cebraspe.json` por concurso e baixar só o do filtro. Avaliado em 04/11/2026: ganho pequeno hoje (já carrega depois da abertura, ~700 KB comprimido) e exige mudar todos os importadores; refazer quando passar de ~2 MB. Reavaliado: a 1ª carga baixa só ~137 KB (bancos pequenos); o cebraspe.json (794 KB comprimido) já vem depois, então dividir não melhora a 1ª carga
- [P3] Mais provas da Consulplan (importador pronto: `scripts/importar-consulplan.py`). Verificado em 04/11/2026: dos 296 concursos listados, só o TJ CE 2019 tem caderno + gabarito pós-recurso; os de 2026 (TJMG, Bálsamo, Potirendaba, SAAEB, CRA/PR...) publicaram cadernos mas só gabarito preliminar, tentar de novo quando sair o pós-recurso. caderno e gabarito definitivo são públicos no CDN (`cdnsite.institutoconsulplan.org.br/concursos/...`), links na página de cada concurso (montada por JS, usar o navegador). Ex.: TJ CE Juiz Leigo 2019
- [P3] Provas de outras bancas. Verificado em 03/11/2026: **AOCP** e **FCC** não publicam o caderno (só editais/gabaritos); **Vunesp** e **IBFC** só liberam a prova com login de candidato. Não dá para importar sem conta, então ficam fora
- [P1] Supabase fase 2: trocar as leituras do Blobs para o Supabase (depois da `SUPABASE_SERVICE_ROLE_KEY` na Netlify, **Kauã**)
- [P2] Depoimentos reais na landing (coletar com os primeiros alunos, **Kauã**)
- [P2] Tirar o selo "Powered by Netlify" (configuração do site na Netlify, **Kauã**)
- [P3] Lembrete diário por notificação push (precisa de chaves VAPID e de um agendador)
- [P1] **Ligar a cobrança do Pro (Kauã)** (atualizado em 05/11: agora é assinatura mensal R$ 50; ver `notas/PENDENCIAS-KAUA.md`): o código está pronto e desligado. Na Netlify (Site settings → Environment variables): `MP_ACCESS_TOKEN` (credencial de produção do Mercado Pago), `PRO_PRECO` (ex.: `19.90`), opcionais `PRO_DIAS` (padrão 30) e `MP_WEBHOOK_SECRET` (painel do MP → Webhooks, URL `https://aprovoapp.netlify.app/api/mp-webhook`, evento Pagamentos). Depois do deploy o botão "Assinar o Pro" aparece sozinho no Mentor. Testar antes com a credencial de teste do MP
- [P2] **Ligar os e-mails (Kauã)**: código pronto e desligado. Criar conta no Resend, verificar um domínio e definir `RESEND_API_KEY`, `EMAIL_DE` (ex.: `Aprovô <oi@dominio.com.br>`) e `EMAIL_SEGREDO` (qualquer texto longo aleatório, assina o link de descadastro). Boas-vindas sai na criação da conta; lembrete de revisão roda todo dia às 8h (função agendada `lembrete-revisao`)
- [P3] Mais provas oficiais de outras bancas (FGV, FCC, Vunesp, IBFC). Atenção: vários PDFs da Cebraspe vêm com fonte embaralhada e não dão para extrair texto (ex.: CAIXA NM2 2010). CPCON/UEPB (PB): em 04/11/2026 o servidor arquivo.cpcon.uepb.edu.br responde, mas com certificado TLS vencido; tentar de novo quando renovarem

## Fazendo
- (nenhum)

## Feito
- Lote 06/11/2026 (16): **ranking geral** com recorte Brasil / meu cargo / meu estado e critério "Últimos 7 dias"; aba renomeada para **Ranking**; radar de concursos já abre na cidade/UF do perfil; boas-vindas pergunta **se o edital já saiu** e o Mentor planeja pelo último edital quando não saiu; app no celular com 7 abas cabendo e topo enxuto
- Lote 05/11/2026 (15), vender hoje: **Cakto** como cobrança principal (`CAKTO_CHECKOUT_URL`): botão Assinar leva à oferta com a referência do aluno (`sck`) e o e-mail preenchido; **webhook `/api/cakto-webhook`** com HMAC (`x-cakto-signature`) ou segredo no corpo (`CAKTO_WEBHOOK_SECRET`), ativa o Pro por 33 dias a cada pagamento, cancelamento mantém até o fim do mês pago, estorno e chargeback voltam ao grátis, compra de e-mail sem conta fica pendente até o cadastro; **admin por usuário ou e-mail**; **boas-vindas com perfil** (concurso/cargo, banca, cidade/UF, data da prova, nível, horas por dia) salvo em `cq:mentor` → `planos_mentor.perfil`, usado no contexto do Mentor; **filtro "Só do meu concurso"** nas questões e no simulado livre (matérias do perfil e, se houver 40+, só a banca dele)
- Lote 05/11/2026 (14), pronto para vender: **assinatura mensal recorrente** do Mercado Pago (preapproval, `PRO_PRECO` padrão R$ 50) em `/api/assinar` (assinar, cancelar, situação), webhook com `subscription_preapproval` e `subscription_authorized_payment` que ativa o Pro e espelha `perfis.plano` + `assinaturas` no Supabase; **fallback por link** (`CHECKOUT_URL`/`VITE_CHECKOUT_URL`, Mercado Pago ou Cakto) e **liberação manual** em `/admin.html` (`ADMIN_TOKEN`); **landing curta** em /aprovo (hero sem prometer aprovação, 3 benefícios, prints reais do app, preço único Pro R$ 50/mês com "Assinar" e "cancele quando quiser", grátis como porta de entrada, FAQ); **/termos** e **/privacidade**; meta tags e imagem OG (`/img/og.png`); app com tela de planos nova (R$ 50/mês, e-mail do recibo, cancelar assinatura), `?assinar=1` leva direto à criação de conta e aos Planos, `?pro=ok` avisa o pagamento
- Lote 04/11/2026 (13), da crítica de conversão: **"Por que errei? Perguntar ao Mentor"** em toda questão errada (abre o Mentor com a pergunta pronta, inclusive antes de montar o perfil); **card de cota esgotada** com "Ver o Pro" no lugar do balão de erro; **Planos visível também sem perfil**; tela de venda com título "Pro: o Mentor do seu lado até o dia da prova", preço em destaque e selos Pix/cartão e sem renovação; **landing sem o card "Pro em breve"** enquanto a cobrança estiver desligada (`PRO_PRECO_LANDING` em `gerar-paginas.py` liga o card com preço); **texto das questões**: quebras de linha do PDF juntadas, comando Cebraspe cortado no "**Item:**" (3.211 questões), páginas de SEO sem markdown cru, crédito de autor vazado removido, `scripts/qa-textos.py` para conferir
- Lote 04/11/2026 (12), experiência: **filtro no resultado do simulado** (Todas / Erradas / Em branco / Com dúvida, com contagem); **aviso de simulado em andamento** nas outras abas (minutos restantes, respondidas e "Voltar ao simulado"); **tamanho do texto da questão** (botão Aa no topo da questão: 100%, 115%, 130%, guardado no aparelho)
- Lote 04/11/2026 (11), experiência: **atalhos no Praticar** (letra responde, Enter/→ próxima, ← volta); **marcar dúvida no simulado** (botão ou tecla ?, aparece no mapa e no aviso de entrega: "9 em branco e 1 com dúvida"); **aviso de 5 minutos finais** (faixa + relógio vermelho); barra do simulado corrigida no celular (o botão Entregar saía da tela)
- Lote 04/11/2026 (10), experiência: lote 9 testado na tela em tamanho de celular (refazer as erradas: 3 itens, 6 min; WhatsApp: texto certo; caderno .txt conferido) e corrigido o .txt, que não trazia as alternativas na múltipla escolha; **entregar com aviso de quantas estão em branco**; **atalhos de teclado no simulado** (letra marca, C/E no Certo/Errado, ← → trocam; dica só aparece em computador); **contador "N/M respondidas"** ao lado do mapa
- Lote 04/11/2026 (9): **"Refazer as N que errei"** no fim do simulado (nova rodada só com as erradas, 2 min por item); **baixar o Meu caderno em .txt** (todo ou só o filtrado pela busca); **"Desafiar no WhatsApp"** também no resultado do simulado comum e do Certo/Errado
- Lote 04/11/2026 (8): nota Cebraspe testada no app (3 certas − 3 erradas, 4 em branco = 0 de 10, conferido com o gabarito); **Meu caderno** (lista com busca de todas as anotações, no topo de Revisar); simulado C/E com **"Deixar em branco"** e chip **"Ritmo Cebraspe"** (2 min por item); **seu acerto × média dos alunos** no Ranking (média de quem tem 10+ respostas)
- Lote 04/11/2026 (7), produto (inspirado na concorrência): **caderno de anotações por questão** ("✎ Anotar nesta questão", salvo na conta), **flashcards dos seus erros** (baralho "Meus erros" montado das questões que você errou por último, com revisão espaçada) e **nota no critério Cebraspe** no simulado de Certo/Errado (certas − erradas, branco vale zero, alerta quando o chute custa caro)
- Lote 04/11/2026 (6): **alerta semanal por e-mail de concurso novo na cidade do radar** (função agendada `alerta-concursos`, segundas 8h, Querido Diário; cidade/UF do radar passam a sincronizar com a conta; desligado até o Resend), **+29 questões PC PB 2021 Perito/Técnico** (conhecimentos gerais e criminalística). Divisão do cebraspe.json reavaliada: não ajuda a 1ª carga
- Lote 04/11/2026 (5): `notas/PENDENCIAS-KAUA.md` (tudo que só o Kauã pode fazer: variáveis da Netlify, onde pegar, onde colar e como testar); **+25 itens STJ 2018 Analista** (conhecimentos básicos), **+65 itens STJ 2018 Técnico de Enfermagem** e **+67 questões PC PB 2021 Delegado** (Cebraspe, gabarito definitivo). PF 2021 Escrivão testada: fonte embaralhada, nada aproveitável
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

### Lote 18 (feito)
- [x] Painel "Hoje" no Praticar com mensagem diária do Mentor (saudação, dias até a prova, erros de ontem, blocos do dia)
- [x] Liga semanal por divisão no Ranking (Bronze/Prata/Ouro/Diamante pelos acertos de 7 dias)
- [x] Caderno de erros em PDF (já existia no Revisar)
- [x] Reportar erro na questão (/api/reportar → Blobs "reportes")

### Lote 19 (feito)
- [x] Admin: lista de erros reportados (/admin.html → "Ver reportes")
- [x] Resumo semanal do Mentor (7 dias vs. semana anterior, melhor/pior matéria, meta)
- [x] Alertas em Concursos: "novo desde a última visita" e notícias novas sobre concursos salvos

### Lote 20 (feito)
- [x] Cadernos com nome (📁 na questão; Revisar → Meus cadernos → Praticar), sincronizados com a conta
- [x] "Comentar com IA" em questões sem comentário: explica o gabarito oficial e lista a base legal

### Lote 21 (feito)
- [x] Landing: recursos novos (batalha, liga, concursos abertos com alerta, cadernos e comentário com a lei)
- [x] Landing: print novo do ranking/batalha (4 prints)

### Lote 22 (feito)
- [x] Meta do dia com barra no painel Hoje (pelo tempo do plano)
- [x] Conquistas (7 selos) no Ranking

### Lote 23 (feito)
- [x] Desafio do dia: 5 questões oficiais sorteadas pela data, iguais para todos, placar aberto (código D+AAMMDD)

### Lote 24 (feito)
- [x] Desafio do dia: placar resumido num blob só, devolve top 50 + o aluno
- [x] Convite para instalar o app (Android/desktop com botão; iPhone com instrução), depois de 5 questões

### Lote 25 (feito)
- [x] Produção conferida: reportar, batalha, concursos abertos, landing nova e print
- [x] Compartilhar resultado da batalha/desafio (🟩🟥 + posição, sem revelar questões)
- [x] Tempo da batalha conta a partir da primeira resposta

### Lote 26 (feito)
- [x] Modo foco (pomodoro 25/50 min + pausa de 5) no painel Hoje, com minutos de foco do dia

### Lote 27 (feito)
- [x] Minutos de foco por dia, sincronizados com a conta (cq:foco)
- [x] Resumo semanal do Mentor mostra o tempo no modo foco

### Lote 28 (feito)
- [x] Revisão crítica do Praticar no celular: tirei a meta e o modo foco duplicados, o Hoje mostra 2 blocos e as autorais começam recolhidas (questão sobe ~300px)

### Lote 29 (feito)
- [x] Celular: painel Hoje e meta do dia viram um bloco só (questão começa ~50px mais acima)

### Lote 30 (feito)
- [x] Botão Revanche no fim da batalha (nova batalha do mesmo tamanho, pronta para mandar o link)
- [x] Hoje: modo foco e "Falar com o Mentor" na mesma linha

### Lote 31 (feito)
- [x] Hoje avisa batalha pendente (entrou e não terminou, últimos 3 dias) com link "Jogar"

### Lote 32 (feito) — foco em vender
- [x] Páginas de concurso para SEO em /concurso/<slug> (INSS, PF, PRF, TJ CE, STJ, OAB, prefeituras): matérias que mais caem, questões oficiais, CTA para o plano; sem datas/vagas inventadas
- [x] Paywall: ao bater o limite grátis de IA (429) abre aviso com o que o Pro libera e botão "Ver o Pro"
- [x] Tabela Grátis × Pro atualizada (autorais, comentário com a lei, batalhas/liga grátis)
- Já existia: e-mail de boas-vindas (Resend, ao criar conta com e-mail)

### Lote 33 (feito) — velocidade e onboarding
- [x] Batalha, Ranking, Concursos e Edital carregam sob demanda (JS inicial 106 → 91 KB gzip)
- [x] Bancos grandes (Cebraspe/OAB/ENEM) começam a baixar 1,5 s depois, sem disputar a primeira tela
- [x] Removido o seletor antigo de cargo (ACE/ACS) que aparecia depois do Mentor: um passo a menos no onboarding

### Lote 34 (feito) — onboarding rápido
- [x] Atalho "Pular perguntas e fazer o simulado agora" a partir da banca: do zero à 1ª questão do diagnóstico em 5 toques (Já sei qual → concurso → banca → pular → Bora)

### Lote 35 (feito) — conversão
- [x] Landing: bloco de preço virou tabela Grátis × Pro (deixa claro que o Pro = 300 usos de IA/dia, autorais, plano completo e PDF; o resto é grátis)
- [x] CTA grátis reforça "diagnóstico de 10 questões, sem cartão"

### Lote 36 (feito)
- [x] Menu lateral: fixo à esquerda no computador (≥1000px) e gaveta ☰ no celular, como nos outros sistemas (MIDAS); substitui a barra de abas de baixo
