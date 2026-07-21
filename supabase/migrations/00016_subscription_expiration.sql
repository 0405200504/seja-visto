-- Adiciona expires_at na tabela user_entitlements
alter table public.user_entitlements 
add column if not exists expires_at timestamptz;

-- Adiciona validity_days na tabela cakto_product_map
alter table public.cakto_product_map 
add column if not exists validity_days integer;
