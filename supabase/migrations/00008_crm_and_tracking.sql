-- =============================================================
-- Migração 00008: Tabelas para CRM Financeiro (vendas)
-- e Links de Rastreamento (tracking_links) com cliques.
-- =============================================================

-- ---------- Tabela de Vendas (CRM/Financeiro) ----------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  name text,
  amount_cents integer not null, -- valor em centavos (ex: 19700 para R$ 197,00)
  status text not null, -- 'approved', 'refunded', 'chargeback'
  payment_method text, -- 'pix', 'credit_card', 'boleto', 'manual'
  cakto_id text, -- ID da transação na Cakto (opcional)
  created_at timestamptz not null default now()
);

-- Habilitar RLS para vendas
alter table public.sales enable row level security;

-- Política de RLS: apenas administradores podem ler e gerenciar vendas
create policy "sales: admin manage" on public.sales
  for all using (public.is_admin()) with check (public.is_admin());

-- Concede privilégios para roles autenticadas e service_role
grant select, insert, update, delete on public.sales to authenticated;
grant all on public.sales to service_role;

-- Índices de busca rápida
create index if not exists sales_email_idx on public.sales (email);
create index if not exists sales_created_at_idx on public.sales (created_at);
create index if not exists sales_cakto_id_idx on public.sales (cakto_id);


-- ---------- Tabela de Links de Rastreamento ----------
create table if not exists public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  destination_url text not null,
  description text,
  clicks_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Habilitar RLS para links de rastreamento
alter table public.tracking_links enable row level security;

-- Política de RLS: apenas administradores podem gerenciar
create policy "links: admin manage" on public.tracking_links
  for all using (public.is_admin()) with check (public.is_admin());

-- Concede privilégios
grant select, insert, update, delete on public.tracking_links to authenticated;
grant all on public.tracking_links to service_role;
