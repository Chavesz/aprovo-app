-- Aprovô: banco inicial. RLS ligado em TODAS as tabelas.
-- Cada aluno só lê e escreve as próprias linhas (auth.uid()). As Netlify Functions usam a service role
-- (que ignora RLS) apenas no servidor; a chave service role NUNCA vai para o front.

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text unique not null check (char_length(usuario) between 2 and 40),
  nome text not null default '' check (char_length(nome) <= 60),
  cargo text check (cargo in ('ACE', 'ACS', 'OUTRO')),
  plano text not null default 'gratis' check (plano in ('gratis', 'pro')),
  criado_em timestamptz not null default now()
);

create table public.respostas (
  id bigint generated always as identity primary key,
  aluno uuid not null references public.perfis (id) on delete cascade,
  questao text not null check (char_length(questao) <= 120),
  marcada text not null check (marcada ~ '^[A-E]$'),
  certa boolean not null,
  simulado boolean not null default false,
  em timestamptz not null default now()
);
create index respostas_aluno_em on public.respostas (aluno, em desc);
create index respostas_questao on public.respostas (questao);

create table public.simulados (
  id bigint generated always as identity primary key,
  aluno uuid not null references public.perfis (id) on delete cascade,
  estilo boolean not null default false,
  semanal boolean not null default false,
  acertos int not null check (acertos >= 0),
  total int not null check (total > 0),
  nota numeric not null,
  maximo numeric not null,
  questoes text[] not null default '{}',
  materias jsonb,
  em timestamptz not null default now()
);
create index simulados_aluno on public.simulados (aluno, em desc);

create table public.planos_mentor (
  aluno uuid primary key references public.perfis (id) on delete cascade,
  perfil jsonb not null,
  atualizado_em timestamptz not null default now()
);

create table public.uso_ia (
  aluno uuid not null references public.perfis (id) on delete cascade,
  dia date not null,
  chamadas int not null default 0 check (chamadas >= 0),
  primary key (aluno, dia)
);

create table public.assinaturas (
  id bigint generated always as identity primary key,
  aluno uuid not null references public.perfis (id) on delete cascade,
  provedor text not null check (provedor in ('mercadopago', 'stripe', 'manual')),
  referencia text,
  status text not null check (status in ('ativa', 'cancelada', 'pendente', 'expirada')),
  inicio timestamptz not null default now(),
  fim timestamptz
);
create index assinaturas_aluno on public.assinaturas (aluno);

-- Radar de concursos: público para leitura (vem de diários oficiais), só o servidor escreve.
create table public.radar_concursos (
  id bigint generated always as identity primary key,
  uf char(2) not null,
  cidade text not null,
  ibge text,
  data date not null,
  trecho text not null,
  url text not null check (url ~ '^https://'),
  fonte text not null default 'Querido Diário',
  unique (url)
);
create index radar_uf_data on public.radar_concursos (uf, data desc);

create table public.comentarios (
  id bigint generated always as identity primary key,
  aluno uuid not null references public.perfis (id) on delete cascade,
  questao text not null,
  texto text not null check (char_length(texto) between 3 and 600),
  em timestamptz not null default now()
);
create index comentarios_questao on public.comentarios (questao, em);

alter table public.perfis enable row level security;
alter table public.respostas enable row level security;
alter table public.simulados enable row level security;
alter table public.planos_mentor enable row level security;
alter table public.uso_ia enable row level security;
alter table public.assinaturas enable row level security;
alter table public.radar_concursos enable row level security;
alter table public.comentarios enable row level security;

-- Perfil: o aluno vê e edita o próprio (exceto o plano, que só o servidor muda).
create policy "perfil: ler o próprio" on public.perfis for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: criar o próprio" on public.perfis for insert to authenticated with check ((select auth.uid()) = id and plano = 'gratis');
create policy "perfil: editar o próprio" on public.perfis for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id and plano = (select p.plano from public.perfis p where p.id = (select auth.uid())));

create policy "respostas: ler as próprias" on public.respostas for select to authenticated using ((select auth.uid()) = aluno);
create policy "respostas: gravar as próprias" on public.respostas for insert to authenticated with check ((select auth.uid()) = aluno);

create policy "simulados: ler os próprios" on public.simulados for select to authenticated using ((select auth.uid()) = aluno);
create policy "simulados: gravar os próprios" on public.simulados for insert to authenticated with check ((select auth.uid()) = aluno);

create policy "plano: ler o próprio" on public.planos_mentor for select to authenticated using ((select auth.uid()) = aluno);
create policy "plano: gravar o próprio" on public.planos_mentor for insert to authenticated with check ((select auth.uid()) = aluno);
create policy "plano: editar o próprio" on public.planos_mentor for update to authenticated using ((select auth.uid()) = aluno) with check ((select auth.uid()) = aluno);

-- Uso da IA e assinaturas: o aluno só lê; quem grava é o servidor (service role).
create policy "uso: ler o próprio" on public.uso_ia for select to authenticated using ((select auth.uid()) = aluno);
create policy "assinatura: ler a própria" on public.assinaturas for select to authenticated using ((select auth.uid()) = aluno);

create policy "radar: leitura pública" on public.radar_concursos for select to anon, authenticated using (true);

create policy "comentários: todos logados leem" on public.comentarios for select to authenticated using (true);
create policy "comentários: publicar como si mesmo" on public.comentarios for insert to authenticated with check ((select auth.uid()) = aluno);
create policy "comentários: apagar os próprios" on public.comentarios for delete to authenticated using ((select auth.uid()) = aluno);

-- % de acerto da comunidade sem expor as respostas de outros alunos (só o agregado de uma questão).
create function public.acerto_questao(q text)
returns table (acertos bigint, total bigint)
language sql stable security definer set search_path = '' as $$
  select count(*) filter (where r.certa), count(*) from public.respostas r where r.questao = q;
$$;
revoke execute on function public.acerto_questao(text) from public, anon;
grant execute on function public.acerto_questao(text) to authenticated;
