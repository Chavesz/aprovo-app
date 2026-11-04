# Supabase do Aprovô

Status: **projeto `Aprovo` (ref lnudxzgqeqabvzkyqbgb, sa-east-1) criado e migration aplicada.** Falta só a `SUPABASE_SERVICE_ROLE_KEY` na Netlify para o espelhamento começar.

## Passos (Kauã)
1. Crie um projeto **novo e grátis** no Supabase só para o Aprovô (não use o do MIDAS).
2. Rode `supabase/migrations/20261104000000_inicial.sql` (SQL Editor ou `supabase db push`).
3. Em Advisors → Security, confira que não há avisos (RLS está ligado em todas as tabelas).
4. Cole na Netlify as variáveis do `.env.example`.

## Migração dos dados atuais (Netlify Blobs → Supabase)
Hoje contas, progresso, ranking, uso da IA, comentários e estatísticas ficam no Netlify Blobs.
A troca será feita com fallback: as funções leem do Supabase e, se o aluno ainda não existir lá,
leem do Blobs e copiam (migração preguiçosa no primeiro acesso). Nada é apagado do Blobs.
Implementado em `netlify/lib/supa.ts` (fase 1, escrita dupla):
- cada aluno vira um usuário no Supabase Auth (e-mail técnico `usuario@alunos.aprovo.app`) e um `perfis` no primeiro salvamento;
- `/api/progresso` espelha respostas, simulados, cargo e plano do mentor (só o que é novo desde o último envio);
- uso da IA e comentários também são espelhados;
- o Blobs continua sendo a leitura; se o Supabase falhar, nada se perde.
Fase 2 (card): trocar as leituras para o Supabase depois que todos os alunos ativos tiverem sido espelhados.
