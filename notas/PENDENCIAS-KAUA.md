# O que só o Kauã pode fazer para o Aprovô vender

O código já está pronto. Cada item abaixo depende de uma conta, de uma chave ou de uma decisão sua.

**Onde colar as variáveis:** painel da Netlify → site **aprovoapp** → *Site configuration* → *Environment variables* → *Add a variable*.
Marque o escopo **Functions** e depois rode um novo deploy em *Deploys* → *Trigger deploy* → *Deploy site*. A variável só passa a valer depois desse deploy.

Nunca mande nenhuma dessas chaves por chat, e-mail ou commit. Elas só vão no painel da Netlify.

## Por ordem de prioridade

| # | O quê | Libera | Tempo |
|---|---|---|---|
| 1 | `ANTHROPIC_API_KEY` | O Mentor com IA: conversa, leitura do edital, resumos e geração de questões | 5 min |
| 2 | Mercado Pago (`MP_ACCESS_TOKEN` + webhook) **ou** link pronto (`CHECKOUT_URL` + `ADMIN_TOKEN`) | A assinatura do Pro, R$ 50/mês | 20 min |
| 3 | Contato e responsável | Rodapé e termos com CNPJ/CPF e e-mail de suporte (me passe os dados) | 5 min |
| 4 | Resend (`RESEND_API_KEY`, `EMAIL_DE`, `EMAIL_SEGREDO`) | E-mail de boas-vindas, lembrete diário de revisão e alerta semanal de concurso na cidade | 30 min |
| 5 | `SUPABASE_SERVICE_ROLE_KEY` | Cópia de segurança dos dados no Supabase (o app já funciona sem) | 5 min |
| 6 | Tirar o selo "Powered by Netlify" | Visual mais limpo e uns 35 KB a menos em cada página | 2 min |
| 7 | Depoimentos reais | Prova social na landing (hoje ela mostra só números reais do banco) | contínuo |
| 8 | Domínio próprio (opcional) | Mais confiança na hora de pagar; também serve para o remetente dos e-mails | 30 min |

---

### 1. `ANTHROPIC_API_KEY`: o Mentor com IA

- **Onde pegar:** em [console.anthropic.com](https://console.anthropic.com), vá em *Settings* → *API keys* → *Create key*. Coloque crédito em *Billing*: com 15 mensagens por dia no grátis, poucos dólares cobrem os primeiros alunos.
- **Onde colar:** na Netlify, com o nome `ANTHROPIC_API_KEY`. Se a chave já estiver lá, confira apenas se o crédito está ativo.
- **Como testar:**
  1. Entre no app.
  2. Abra a aba **Mentor** e mande "Oi".
  3. A resposta deve chegar e o contador de mensagens do dia deve subir (ex.: 1/15). Se aparecer erro de IA indisponível, a chave ou o crédito estão faltando.

### 2. Cobrança do Pro (R$ 50/mês, recorrente)

Escolha **um** dos dois caminhos. O botão "Assinar" da landing e do app usa o que estiver configurado.

**Caminho A: Mercado Pago automático (recomendado).** O Pro libera e renova sozinho.
- **Onde pegar:** em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) → *Suas integrações* → *Criar aplicação* (produto **Assinaturas**). Em *Credenciais de produção*, copie o **Access Token** (`APP_USR-...`).
- **Onde colar (Netlify):** `MP_ACCESS_TOKEN` = o Access Token. Opcional: `PRO_PRECO` (padrão `50`).
- **Webhook:** no painel do Mercado Pago → *Webhooks* → *Configurar notificações*. URL `https://aprovoapp.netlify.app/api/mp-webhook`, eventos **Planos e assinaturas** (assinaturas e pagamentos autorizados) e **Pagamentos**. Copie a **assinatura secreta** para `MP_WEBHOOK_SECRET`.
- **Como testar:** abra `https://aprovoapp.netlify.app/api/assinar`: deve vir `"modo":"mercadopago"`. No app, Mentor → Planos → **Assinar**. Depois do pagamento, o contador do Mentor passa a `/300` em até 1 minuto. O aluno cancela em Mentor → Planos → *Cancelar assinatura*.

**Caminho B: link pronto (Mercado Pago ou Cakto), liberação à mão.** Mais rápido para começar.
- **Onde pegar:** crie um **link de assinatura** de R$ 50/mês no Mercado Pago (*Assinaturas* → *Criar plano*) ou na Cakto, e copie o link `https://...`.
- **Onde colar (Netlify):** `CHECKOUT_URL` = o link. Também vale `VITE_CHECKOUT_URL`.
- **Liberar o Pro:** quem paga informa o usuário do Aprovô no checkout. Crie `ADMIN_TOKEN` na Netlify (texto aleatório com 32+ caracteres), abra `https://aprovoapp.netlify.app/admin.html`, cole a chave e o usuário e toque em **Liberar Pro** (31 dias).

Sem nenhuma das duas variáveis, o botão mostra "Quero o Pro quando abrir" e nada é cobrado.

### 3. Preço do Pro

Definido em **R$ 50/mês** (landing, app e termos). Para mudar: `PRO_PRECO` na Netlify (cobrança) e `PRO_PRECO` em `scripts/gerar-paginas.py` (landing). Depois, peça para eu regerar as páginas.

### 4. Resend: e-mails de boas-vindas e de lembrete

- **Onde pegar:**
  1. Crie a conta em [resend.com](https://resend.com) (o plano grátis envia 3 mil e-mails por mês).
  2. Em *Domains* → *Add domain*, adicione um domínio seu e cole os registros DNS que o Resend mostrar.
  3. Em *API Keys* → *Create*, gere a chave.
  - Não dá para enviar de um `@gmail.com`: o Resend exige um domínio verificado. Usamos o Resend, que funciona pela internet sem configurar servidor de e-mail (SMTP).
- **Onde colar (Netlify):**
  - `RESEND_API_KEY`: a chave (começa com `re_`).
  - `EMAIL_DE`: o remetente, com o domínio verificado. Ex.: `Aprovô <oi@seudominio.com.br>`.
  - `EMAIL_SEGREDO`: qualquer texto longo e aleatório, com 40 caracteres ou mais. Ele assina o link "não quero mais receber".
- **Como testar:**
  1. Crie uma conta nova no app e preencha o campo **E-mail (opcional)**. O e-mail de boas-vindas deve chegar em até 1 minuto.
  2. O lembrete de revisão sai todo dia às 8h para quem tem questões erradas no dia de revisar. Para ver na hora: na Netlify, vá em *Functions* → `lembrete-revisao` → *Run now*. Se ninguém tiver revisão no dia, nada é enviado.
  3. Clique em "Não quero mais receber" no e-mail. A página deve confirmar o descadastro.

### 5. `SUPABASE_SERVICE_ROLE_KEY`: cópia dos dados no Supabase

- **Onde pegar:** no [painel do Supabase](https://supabase.com/dashboard), projeto `lnudxzgqeqabvzkyqbgb` → *Project Settings* → *API Keys* → **service_role** (secret) → *Reveal*.
- **Onde colar:** na Netlify, com o nome `SUPABASE_SERVICE_ROLE_KEY`. A `SUPABASE_URL` já tem o padrão certo e não precisa ser criada.
- **Como testar:** responda algumas questões no app. No Supabase, em *Table Editor*, as tabelas de progresso devem ganhar linhas novas.
- **Depois disso:** eu faço a fase 2, em que o app passa a ler os dados do Supabase.
- **Cuidado:** esta chave ignora todas as regras de segurança do banco. Ela só vai na Netlify; nunca no front nem em mensagens.

### 6. Tirar o selo "Powered by Netlify"

Na Netlify, abra o site → *Site configuration* → *General* → *Site details* e procure a opção do selo ou do *badge*. Se não achar ali, ela pode estar no plano da conta.

**Como testar:** abra o app no celular e confira que o selo sumiu do canto inferior direito.

### 7. Depoimentos reais

Peça a 3 a 5 primeiros alunos uma frase curta, com nome, cargo e cidade, e a autorização para publicar. Mande o texto para mim e eu coloco na landing. Não vamos inventar depoimentos.

### 8. Domínio próprio (opcional)

Compre o domínio (ex.: `aprovo.app.br`) no [registro.br](https://registro.br) e ligue na Netlify em *Domain management* → *Add a domain*. Depois disso, mude `SITE_URL` na Netlify para o domínio novo e atualize a URL do webhook no Mercado Pago. O mesmo domínio serve para o remetente do Resend.

---

## Conferência rápida depois de tudo ligado

- [ ] `/api/assinar` responde `"disponivel":true`
- [ ] O Mentor responde no app
- [ ] O e-mail de boas-vindas chega ao criar uma conta com e-mail
- [ ] Um pagamento de teste libera o Pro (contador em /300)
- [ ] `/admin.html` libera o Pro de uma conta de teste
- [ ] O selo da Netlify sumiu
