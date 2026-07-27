-- =============================================================
-- Comunidade de fits: alunos enviam fotos dos próprios looks
-- (pendentes até aprovação do admin) e todos podem curtir,
-- salvar e comentar — tanto fits da comunidade quanto looks
-- oficiais da plataforma.
-- =============================================================

-- ---------- Fotos enviadas pelos alunos ----------

create table public.community_fits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text,
  image_path text not null,
  caption text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---------- Curtidas e salvamentos ----------
-- Cada linha aponta para um look oficial OU um fit da comunidade.

create table public.fit_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  look_id uuid references public.looks (id) on delete cascade,
  fit_id uuid references public.community_fits (id) on delete cascade,
  kind text not null check (kind in ('like', 'save')),
  created_at timestamptz not null default now(),
  check ((look_id is null) <> (fit_id is null)),
  unique (user_id, look_id, kind),
  unique (user_id, fit_id, kind)
);

-- ---------- Comentários ----------

create table public.fit_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text,
  look_id uuid references public.looks (id) on delete cascade,
  fit_id uuid references public.community_fits (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  check ((look_id is null) <> (fit_id is null))
);

-- ---------- RLS ----------

alter table public.community_fits enable row level security;
alter table public.fit_reactions enable row level security;
alter table public.fit_comments enable row level security;

-- Fits: aprovados são públicos entre os alunos; pendentes/recusados só o dono e o admin.
create policy "fits: select approved or own or admin" on public.community_fits
  for select to authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy "fits: insert own pending" on public.community_fits
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "fits: admin update" on public.community_fits
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "fits: delete own or admin" on public.community_fits
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Reações: leitura para contagem; escrita só do próprio usuário.
create policy "reactions: read for members" on public.fit_reactions
  for select to authenticated using (true);
create policy "reactions: insert own" on public.fit_reactions
  for insert to authenticated with check (user_id = auth.uid());
create policy "reactions: delete own" on public.fit_reactions
  for delete to authenticated using (user_id = auth.uid());

-- Comentários: leitura para todos os alunos; cada um escreve/apaga o seu; admin apaga qualquer um.
create policy "comments: read for members" on public.fit_comments
  for select to authenticated using (true);
create policy "comments: insert own" on public.fit_comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "comments: delete own or admin" on public.fit_comments
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- Índices ----------

create index community_fits_status_idx on public.community_fits (status, created_at desc);
create index community_fits_user_idx on public.community_fits (user_id);
create index fit_reactions_look_idx on public.fit_reactions (look_id, kind);
create index fit_reactions_fit_idx on public.fit_reactions (fit_id, kind);
create index fit_reactions_user_idx on public.fit_reactions (user_id, kind);
create index fit_comments_look_idx on public.fit_comments (look_id, created_at);
create index fit_comments_fit_idx on public.fit_comments (fit_id, created_at);

-- ---------- Storage: bucket público para as fotos ----------
-- As fotos são servidas por URL pública; o que controla a visibilidade
-- na plataforma é a tabela community_fits (caminhos são UUIDs não adivinháveis).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fits', 'fits', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fits storage: upload na própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fits' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fits storage: leitura para membros" on storage.objects
  for select to authenticated
  using (bucket_id = 'fits');

create policy "fits storage: delete próprio ou admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fits' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
