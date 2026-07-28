-- =============================================================
-- Migração 00020: Fundação do novo admin (CRM profissional)
--  · Log de auditoria de toda mutação administrativa
--  · Soft delete (lixeira de 30 dias) no conteúdo
--  · CRM de alunos: tags, notas internas e último acesso
--  · Vendas: taxa de gateway, flag de teste e produto/oferta
--  · Configurações editáveis (Fit Check, quiz, tags, preços)
--  · Cliques individuais de links de rastreamento (série diária)
--  · Views salvas do admin (filtros nomeados)
--  · Overrides de conteúdo estático (guias, estilos, glossário,
--    plano de ação e bônus) sem precisar de deploy
-- =============================================================

-- ---------- Log de auditoria ----------

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,            -- ex: 'look.update', 'aluno.revogar_acesso'
  entity_type text not null,       -- ex: 'look', 'aluno', 'venda'
  entity_id text,
  entity_label text,               -- nome legível do registro no momento da ação
  before jsonb,
  after jsonb,
  ip text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit: admin read" on public.audit_log
  for select using (public.is_admin());
create policy "audit: admin insert" on public.audit_log
  for insert with check (public.is_admin());

grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);

-- ---------- Soft delete (lixeira) ----------

alter table public.looks add column if not exists deleted_at timestamptz;
alter table public.wardrobe_items add column if not exists deleted_at timestamptz;
alter table public.modules add column if not exists deleted_at timestamptz;
alter table public.lessons add column if not exists deleted_at timestamptz;
alter table public.tracking_links add column if not exists deleted_at timestamptz;

-- Alunos não enxergam registros na lixeira (admin continua vendo tudo).
drop policy if exists "looks: read for members" on public.looks;
create policy "looks: read for members" on public.looks
  for select to authenticated using (deleted_at is null or public.is_admin());

drop policy if exists "wardrobe_items: read for members" on public.wardrobe_items;
create policy "wardrobe_items: read for members" on public.wardrobe_items
  for select to authenticated using (deleted_at is null or public.is_admin());

drop policy if exists "modules: read for members" on public.modules;
create policy "modules: read for members" on public.modules
  for select to authenticated using (deleted_at is null or public.is_admin());

drop policy if exists "lessons: read for members" on public.lessons;
create policy "lessons: read for members" on public.lessons
  for select to authenticated using (deleted_at is null or public.is_admin());

create index if not exists looks_active_idx on public.looks (created_at desc) where deleted_at is null;
create index if not exists wardrobe_items_active_idx on public.wardrobe_items (created_at desc) where deleted_at is null;

-- ---------- CRM de alunos ----------

alter table public.users_profile add column if not exists tags text[] not null default '{}';
alter table public.users_profile add column if not exists admin_notes text;
alter table public.users_profile add column if not exists last_seen_at timestamptz;

create index if not exists users_profile_created_idx on public.users_profile (created_at desc);
create index if not exists users_profile_last_seen_idx on public.users_profile (last_seen_at desc nulls last);
create index if not exists users_profile_tags_idx on public.users_profile using gin (tags);

-- Aluno pode atualizar o próprio last_seen (já coberto pela policy "update own").

-- ---------- Vendas ----------

alter table public.sales add column if not exists is_test boolean not null default false;
alter table public.sales add column if not exists gateway_fee_cents integer not null default 0;
alter table public.sales add column if not exists entitlement text;
alter table public.sales add column if not exists offer_name text;
alter table public.sales add column if not exists refunded_at timestamptz;

create index if not exists sales_status_created_idx on public.sales (status, created_at desc);
create index if not exists sales_test_idx on public.sales (is_test, created_at desc);

-- ---------- Configurações editáveis ----------

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.app_settings enable row level security;

create policy "settings: admin manage" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

-- ---------- Cliques individuais dos links ----------

create table if not exists public.tracking_link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.tracking_links (id) on delete cascade,
  referer text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.tracking_link_clicks enable row level security;

create policy "link_clicks: admin read" on public.tracking_link_clicks
  for select using (public.is_admin());

grant select on public.tracking_link_clicks to authenticated;
grant all on public.tracking_link_clicks to service_role;

create index if not exists tracking_link_clicks_link_idx
  on public.tracking_link_clicks (link_id, created_at desc);

-- ---------- Views salvas do admin ----------

create table if not exists public.admin_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  page text not null,              -- ex: '/admin/conteudo/looks'
  name text not null,
  params text not null default '', -- querystring dos filtros
  created_at timestamptz not null default now(),
  unique (user_id, page, name)
);

alter table public.admin_saved_views enable row level security;

create policy "saved_views: own" on public.admin_saved_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.admin_saved_views to authenticated;
grant all on public.admin_saved_views to service_role;

-- ---------- Overrides de conteúdo estático ----------
-- Permite editar título/descrição/ordem e ocultar itens de guias,
-- estilos, glossário, plano de ação e bônus sem novo deploy.

create table if not exists public.content_overrides (
  kind text not null,              -- 'guia' | 'estilo' | 'glossario' | 'plano' | 'bonus'
  slug text not null,
  patch jsonb not null default '{}'::jsonb,
  hidden boolean not null default false,
  order_index integer,
  updated_at timestamptz not null default now(),
  primary key (kind, slug)
);

alter table public.content_overrides enable row level security;

create policy "content_overrides: read for members" on public.content_overrides
  for select to authenticated using (true);
create policy "content_overrides: admin write" on public.content_overrides
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.content_overrides to authenticated;
grant all on public.content_overrides to service_role;

-- ---------- Storage: bucket de imagens de conteúdo ----------
-- Upload por drag-and-drop no admin (looks, peças, capas de módulo).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content', 'content', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "content storage: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'content' and public.is_admin());

create policy "content storage: leitura" on storage.objects
  for select to authenticated
  using (bucket_id = 'content');

create policy "content storage: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'content' and public.is_admin());

-- ---------- Índices extras para escala ----------

create index if not exists fit_check_logs_created_idx on public.fit_check_logs (created_at desc);
create index if not exists user_entitlements_expiry_idx on public.user_entitlements (expires_at) where expires_at is not null;
create index if not exists fit_check_conversations_updated_idx on public.fit_check_conversations (updated_at desc);
