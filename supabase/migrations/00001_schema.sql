-- =============================================================
-- Plano Pronto de Estilo — Schema + RLS
-- Execute este arquivo no SQL Editor do Supabase (ou via CLI).
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabelas ----------

create table public.users_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text,
  style_goal text,
  preferred_style text,
  main_difficulty text,
  onboarding_completed boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index integer not null default 0,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  content text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.looks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  occasion text not null,
  style text not null,
  climate text not null,
  level text not null,
  base_color text not null,
  image_url text,
  pieces jsonb not null default '[]'::jsonb,
  why_it_works text,
  adaptations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  priority text not null check (priority in ('essencial', 'intermediaria', 'avancada')),
  description text,
  how_to_use text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  look_id uuid not null references public.looks (id) on delete cascade,
  kind text not null default 'favorite' check (kind in ('favorite', 'plan', 'have_pieces')),
  created_at timestamptz not null default now(),
  unique (user_id, look_id, kind)
);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete cascade,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table public.user_wardrobe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items (id) on delete cascade,
  status text not null check (status in ('tenho', 'quero_comprar')),
  created_at timestamptz not null default now(),
  unique (user_id, wardrobe_item_id)
);

create table public.action_plan_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day integer not null check (day between 1 and 7),
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

-- ---------- Funções auxiliares ----------

-- Verifica se o usuário logado é admin (security definer para não recursar no RLS).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users_profile
    where user_id = auth.uid() and is_admin
  );
$$;

-- Cria o perfil automaticamente quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (user_id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Impede que um usuário comum se promova a admin.
-- Sessões sem usuário (SQL Editor, service role) podem alterar normalmente.
create or replace function public.prevent_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar permissões.';
  end if;
  return new;
end;
$$;

create trigger guard_is_admin
  before update on public.users_profile
  for each row execute procedure public.prevent_admin_escalation();

-- ---------- RLS ----------

alter table public.users_profile enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.looks enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.user_favorites enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_wardrobe enable row level security;
alter table public.action_plan_progress enable row level security;

-- Perfis: cada um vê/edita o seu; admin vê todos.
create policy "profiles: select own or admin" on public.users_profile
  for select using (auth.uid() = user_id or public.is_admin());
create policy "profiles: update own" on public.users_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Conteúdo do produto: leitura para logados, escrita só para admin.
create policy "modules: read for members" on public.modules
  for select to authenticated using (true);
create policy "modules: write for admin" on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "lessons: read for members" on public.lessons
  for select to authenticated using (true);
create policy "lessons: write for admin" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "looks: read for members" on public.looks
  for select to authenticated using (true);
create policy "looks: write for admin" on public.looks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "wardrobe_items: read for members" on public.wardrobe_items
  for select to authenticated using (true);
create policy "wardrobe_items: write for admin" on public.wardrobe_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Dados do usuário: isolados por user_id.
create policy "favorites: own" on public.user_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "progress: own" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress: admin read" on public.user_progress
  for select using (public.is_admin());

create policy "user_wardrobe: own" on public.user_wardrobe
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "action_plan: own" on public.action_plan_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Grants ----------
-- Versões recentes do Postgres do Supabase não concedem privilégios
-- automaticamente em tabelas novas. O RLS acima continua limitando o acesso.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;

-- Índices para as consultas mais comuns.
create index lessons_module_idx on public.lessons (module_id, order_index);
create index looks_filters_idx on public.looks (occasion, style, climate, level, base_color);
create index favorites_user_idx on public.user_favorites (user_id, kind);
create index progress_user_idx on public.user_progress (user_id, module_id);
create index user_wardrobe_user_idx on public.user_wardrobe (user_id);
create index action_plan_user_idx on public.action_plan_progress (user_id);
