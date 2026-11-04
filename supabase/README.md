# Supabase do Aprovô

Status: **migrations prontas, projeto ainda não criado.** Esta sessão não tem acesso ao Supabase (sem MCP/CLI logado).

## Passos (Kauã)
1. Crie um projeto **novo e grátis** no Supabase só para o Aprovô (não use o do MIDAS).
2. Rode `supabase/migrations/20261104000000_inicial.sql` (SQL Editor ou `supabase db push`).
3. Em Advisors → Security, confira que não há avisos (RLS está ligado em todas as tabelas).
4. Cole na Netlify as variáveis do `.env.example`.

## Migração dos dados atuais (Netlify Blobs → Supabase)
Hoje contas, progresso, ranking, uso da IA, comentários e estatísticas ficam no Netlify Blobs.
A troca será feita com fallback: as funções leem do Supabase e, se o aluno ainda não existir lá,
leem do Blobs e copiam (migração preguiçosa no primeiro acesso). Nada é apagado do Blobs.
Esse passo depende do projeto existir (card no KANBAN.md).
