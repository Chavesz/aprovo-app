# Gabarito — questões para estudar

App web para estudar para concursos: questões oficiais com filtros, simulado cronometrado, **questões geradas por IA a partir do seu edital (por texto ou voz)** e um painel de desempenho completo. Mobile-first, modo claro e escuro; o progresso fica salvo no navegador.

| Meu edital (celular) | Painel de desempenho (desktop, escuro) |
| --- | --- |
| <img src="docs/edital-mobile.jpg" width="280" alt="Edital organizado pela IA" /> | ![Desempenho](docs/desempenho-desktop-escuro.jpg) |

| Praticar (desktop) | Simulado (desktop) |
| --- | --- |
| ![Praticar](docs/praticar-desktop.jpg) | ![Simulado](docs/simulado-desktop.jpg) |

| Celular, modo escuro | Desempenho no celular |
| --- | --- |
| <img src="docs/praticar-mobile-escuro.jpg" width="280" alt="Praticar no celular, modo escuro" /> | <img src="docs/desempenho-mobile.jpg" width="280" alt="Desempenho no celular" /> |

## Funcionalidades

- **Filtros** por banca, órgão, disciplina, assunto e ano, além de “não feitas”, “errei” e “marcadas”.
- **Resposta com feedback** imediato: alternativa certa em verde, a sua em vermelho quando erra, e o gabarito oficial. O campo `comentario` do banco aparece como gabarito comentado quando existir.
- **Simulado cronometrado**: 5 a 45 questões sorteadas, 10 a 90 minutos, mapa de navegação, entrega automática quando o tempo acaba e correção questão por questão.
- **Meu edital com IA**: cole o conteúdo programático ou fale o que vai prestar (ditado por voz no Chrome/Edge). A IA identifica banca, órgão e cargo, separa disciplinas e assuntos, e cria questões inéditas no estilo da banca (A a E ou certo/errado, três níveis de dificuldade), cada uma com gabarito comentado. Dá para editar os assuntos, ter vários editais e praticar só as questões de um edital ou assunto.
- **Painel de desempenho**: acerto geral, resolvidas, acertos, dias seguidos de estudo, gráfico dos últimos 14 dias, acerto por disciplina e por assunto (do mais fraco ao mais forte), filtro de 7 dias, 30 dias ou tudo, e histórico recente. Tudo em `localStorage`.
- **Marcar para revisar** com a bandeira de cada questão e refazer só as marcadas.
- **Modo escuro** automático (segue o sistema) com botão para alternar.

## Stack

Vite + React 18 + TypeScript, CSS puro com tokens. Nenhuma dependência de UI. O build final tem cerca de 50 KB de JS gzip, mais o banco de questões (~1,2 MB, cacheado).

> Usa Vite 2 para rodar também em Node 14. A Netlify faz o build em Node 20 (definido no `netlify.toml`).

## IA (Netlify Function + Claude)

A rota `/api/ia` é a função [`netlify/functions/ia.mts`](netlify/functions/ia.mts). Ela chama a API do Claude (`claude-opus-5-5`) com saída em JSON estruturado, então a resposta sempre vem no formato que o app espera. A chave fica só no servidor, nunca no navegador.

Para ligar em produção, na Netlify vá em **Site configuration → Environment variables** e crie `ANTHROPIC_API_KEY` com uma chave do [Console da Anthropic](https://console.anthropic.com). Sem a chave, o app funciona normalmente e a aba Edital mostra um aviso.

- O ditado usa a Web Speech API do navegador (sem custo e sem enviar áudio para o servidor); o texto transcrito é o que vai para a IA.
- Em `npm run dev`, a rota `/api/ia` responde com dados de exemplo (plugin em `vite.config.ts`), para testar a interface sem chave. Para testar a IA de verdade localmente: `netlify dev` com a variável definida (precisa de Node 18+).
- Para vender: cada geração custa centavos de API. Antes de abrir ao público, vale colocar login e limite de uso por pessoa (ex.: Netlify Identity ou Supabase) para ninguém usar sua chave sem controle.

## Rodar localmente

```bash
npm install
npm run dev
```

Para regerar o banco de questões a partir da API: `npm run bank`.

## Fonte das questões e licença

- **Origem:** [API pública enem.dev](https://enem.dev) ([código-fonte](https://github.com/yunger7/enem-api)), que disponibiliza as provas e os gabaritos oficiais do ENEM aplicados pelo INEP.
- **Conteúdo:** provas do ENEM de 2019 a 2023, 892 questões (inclui as versões em inglês e espanhol de língua estrangeira). Provas oficiais são documentos públicos do INEP; textos de terceiros citados nos enunciados mantêm a referência de origem que aparece na própria prova.
- **Como o banco é montado:** `scripts/build-bank.cjs` baixa as questões, remove duplicadas e grava `public/data/questoes.json`. O app não chama a API em tempo de execução, então não há CORS nem dependência de disponibilidade externa (por isso não foi preciso Netlify Function).
- **Assunto:** a API não informa assunto. Ele é classificado automaticamente por palavras-chave (ver `TOPICS` no script); questões sem correspondência ficam como “Geral”.
- **Banca/órgão:** todas são INEP/MEC por enquanto. O formato do JSON já aceita outras bancas: basta adicionar questões de provas públicas de concursos (por exemplo, editais e provas divulgados pelos próprios órgãos) com os campos `banca`, `orgao`, `prova`, `ano`, `disciplina`, `assunto`, `alternativas`, `gabarito` e, opcionalmente, `comentario`.
- Não há scraping de sites pagos (QConcursos, TEC etc.).

## Deploy na Netlify

O `netlify.toml` já define build (`npm run build`), pasta `dist` e Node 20.

Pelo painel (sem CLI):
1. Entre em [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Escolha o GitHub e o repositório `concurso-questoes`.
3. Confirme as configurações (já vêm do `netlify.toml`) e clique em **Deploy**.

Pela CLI:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --build --prod
```

## Publicar no GitHub

```bash
gh repo create concurso-questoes --public --source . --push
```

Ou, sem o `gh`: crie o repositório vazio `concurso-questoes` no GitHub e rode `git remote add origin https://github.com/<seu-usuario>/concurso-questoes.git` e `git push -u origin main`.
