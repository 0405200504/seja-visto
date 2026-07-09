-- =============================================================
-- Integração de vendas (Cakto): entitlements por usuário,
-- mapa de produtos e e-mail no perfil para busca no webhook.
-- =============================================================

-- E-mail no perfil (permite localizar usuário por e-mail no webhook)
alter table public.users_profile add column if not exists email text;

update public.users_profile p
set email = u.email
from auth.users u
where u.id = p.user_id and p.email is null;

create unique index if not exists users_profile_email_idx on public.users_profile (lower(email));

-- Trigger de novo usuário passa a gravar também o e-mail
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (user_id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email);
  return new;
end;
$$;

-- ---------- Entitlements (produto base + order bumps) ----------

create table public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement text not null,
  source text,
  created_at timestamptz not null default now(),
  unique (user_id, entitlement)
);

-- Mapa: ID do produto/oferta na Cakto -> chave do bônus na plataforma
create table public.cakto_product_map (
  cakto_id text primary key,
  entitlement text not null,
  label text,
  created_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;
alter table public.cakto_product_map enable row level security;

create policy "entitlements: read own or admin" on public.user_entitlements
  for select using (auth.uid() = user_id or public.is_admin());
create policy "entitlements: admin manage" on public.user_entitlements
  for all using (public.is_admin()) with check (public.is_admin());

create policy "cakto_map: admin only" on public.cakto_product_map
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.user_entitlements to authenticated;
grant select, insert, update, delete on public.cakto_product_map to authenticated;
grant all on public.user_entitlements to service_role;
grant all on public.cakto_product_map to service_role;

create index user_entitlements_user_idx on public.user_entitlements (user_id);
