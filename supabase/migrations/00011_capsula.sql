-- Cápsula pessoal: as 9 peças que o aluno cadastra no guia
-- "Monte 27 outfits com 9 peças" para montar os outfits com o que ele tem.

create table public.user_capsule (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tops text[] not null default '{"","",""}',
  bottoms text[] not null default '{"","",""}',
  shoes text[] not null default '{"","",""}',
  updated_at timestamptz not null default now()
);

alter table public.user_capsule enable row level security;

create policy "capsule: manage own" on public.user_capsule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_capsule to authenticated;
grant all on public.user_capsule to service_role;
