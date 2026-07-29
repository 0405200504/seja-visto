-- =============================================================
-- Migração 00021: correções de segurança de pré-lançamento
--
--  VS-01 · paywall real no banco (conteúdo pago exige acesso ativo)
--  VS-02 · bucket de fotos dos alunos deixa de ser público
--  VS-03 · idempotência do webhook (webhook_events + unique)
--  VS-06 · reserva atômica de token de IA
--  VS-26 · contador de cliques atômico
--  + constraints, índices e a flag is_test
--
-- ⚠️  ORDEM: faça backup antes. O bloco 2 (backfill) roda ANTES
--     do bloco 3 (policy) de propósito — sem ele, aluno pagante
--     sem entitlement perderia o acesso no instante do deploy.
--
-- ⚠️  O bloco 5 (bucket privado) quebra as URLs de foto antigas.
--     Só rode junto com o deploy do código que usa URL assinada.
-- =============================================================

begin;

-- -------------------------------------------------------------
-- 1) IDEMPOTÊNCIA DO WEBHOOK (VS-03)
--    O UNIQUE (provider, event_id) é o que impede a Cakto de
--    criar venda duplicada ao reenviar o mesmo evento.
--    O payload completo fica gravado para disputa com cliente.
-- -------------------------------------------------------------
create table if not exists public.webhook_events (
  id            bigserial primary key,
  provider      text        not null default 'cakto',
  event_id      text        not null,
  event_type    text        not null,
  payload       jsonb       not null,
  status        text        not null default 'processed'
                check (status in ('processed', 'failed', 'ignored', 'pending')),
  error_message text,
  user_email    text,
  created_at    timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.webhook_events enable row level security;

drop policy if exists "webhook_events: admin read" on public.webhook_events;
create policy "webhook_events: admin read" on public.webhook_events
  for select using (public.is_admin());

grant select on public.webhook_events to authenticated;
grant all    on public.webhook_events to service_role;

create index if not exists webhook_events_created_idx
  on public.webhook_events (created_at desc);
create index if not exists webhook_events_falhos_idx
  on public.webhook_events (created_at desc) where status = 'failed';

-- -------------------------------------------------------------
-- 2) BACKFILL DE SEGURANÇA (roda ANTES da policy do bloco 3)
--    Todo mundo que tem venda aprovada precisa ter o entitlement
--    'base', senão perde o acesso quando a RLS apertar.
--    É aditivo: não altera nem apaga nada que já exista.
-- -------------------------------------------------------------
insert into public.user_entitlements (user_id, entitlement, source)
select distinct s.user_id, 'base', 'backfill:00021'
from public.sales s
where s.user_id is not null
  and s.status = 'approved'
  and coalesce(s.is_test, false) = false
on conflict (user_id, entitlement) do nothing;

-- Admins nunca podem ser trancados para fora.
insert into public.user_entitlements (user_id, entitlement, source)
select p.user_id, 'base', 'backfill:00021:admin'
from public.users_profile p
where p.is_admin = true
on conflict (user_id, entitlement) do nothing;

-- -------------------------------------------------------------
-- 3) PAYWALL NO BANCO (VS-01)
--    Até aqui, qualquer usuário logado lia todo o conteúdo pago.
-- -------------------------------------------------------------
create or replace function public.tem_acesso_base()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_entitlements
    where user_id = auth.uid()
      and entitlement = 'base'
      and (expires_at is null or expires_at > now())
  );
$$;

revoke all on function public.tem_acesso_base() from public;
grant execute on function public.tem_acesso_base() to authenticated, service_role;

-- Conteúdo pago: só para quem tem acesso ativo (ou admin).
drop policy if exists "looks: read for members" on public.looks;
create policy "looks: read for members" on public.looks
  for select to authenticated
  using (deleted_at is null and (public.tem_acesso_base() or public.is_admin()));

drop policy if exists "lessons: read for members" on public.lessons;
create policy "lessons: read for members" on public.lessons
  for select to authenticated
  using (deleted_at is null and (public.tem_acesso_base() or public.is_admin()));

drop policy if exists "modules: read for members" on public.modules;
create policy "modules: read for members" on public.modules
  for select to authenticated
  using (deleted_at is null and (public.tem_acesso_base() or public.is_admin()));

drop policy if exists "wardrobe_items: read for members" on public.wardrobe_items;
create policy "wardrobe_items: read for members" on public.wardrobe_items
  for select to authenticated
  using (deleted_at is null and (public.tem_acesso_base() or public.is_admin()));

-- Comunidade de fits também é conteúdo de produto.
drop policy if exists "fits: select approved or own or admin" on public.community_fits;
create policy "fits: select approved or own or admin" on public.community_fits
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (status = 'approved' and public.tem_acesso_base())
  );

-- -------------------------------------------------------------
-- 4) RESERVA ATÔMICA DE TOKEN DE IA (VS-06)
--    A antiga consume_fit_check_credit rodava DEPOIS da chamada
--    à OpenAI. Agora reservamos antes e devolvemos se falhar.
-- -------------------------------------------------------------
create or replace function public.reserve_fit_check_credit(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  -- zera saldo vencido antes de tentar reservar
  update public.fit_check_credits
     set balance = 0, expires_at = null
   where user_id = p_user
     and expires_at is not null
     and expires_at < now();

  -- O WHERE balance > 0 é a trava: duas requisições simultâneas
  -- serializam nesta linha e só uma consegue o decremento.
  update public.fit_check_credits
     set balance = balance - 1, updated_at = now()
   where user_id = p_user and balance > 0
  returning balance into new_balance;

  return new_balance;  -- NULL = sem saldo, não chame a IA
end;
$$;

create or replace function public.refund_fit_check_credit(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.fit_check_credits
     set balance = balance + 1, updated_at = now()
   where user_id = p_user
  returning balance into new_balance;
  return new_balance;
end;
$$;

revoke all on function public.reserve_fit_check_credit(uuid) from public;
revoke all on function public.refund_fit_check_credit(uuid)  from public;
grant execute on function public.reserve_fit_check_credit(uuid) to service_role;
grant execute on function public.refund_fit_check_credit(uuid)  to service_role;

-- Estorno de reembolso não pode deixar o saldo negativo.
create or replace function public.add_fit_check_credits(p_user uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
  current_expiry timestamptz;
  new_expiry timestamptz;
begin
  select expires_at into current_expiry
    from public.fit_check_credits where user_id = p_user;

  if current_expiry is not null and current_expiry > now() then
    new_expiry := current_expiry + interval '30 days';
  else
    new_expiry := now() + interval '30 days';
  end if;

  insert into public.fit_check_credits (user_id, balance, expires_at)
    values (p_user, greatest(p_amount, 0), now() + interval '30 days')
  on conflict (user_id)
    do update set
      -- greatest(...) impede saldo negativo em estorno de reembolso
      balance    = greatest(public.fit_check_credits.balance + p_amount, 0),
      expires_at = case when p_amount > 0 then new_expiry
                        else public.fit_check_credits.expires_at end,
      updated_at = now()
    returning balance into new_balance;

  return new_balance;
end;
$$;

revoke all on function public.add_fit_check_credits(uuid, integer) from public;
grant execute on function public.add_fit_check_credits(uuid, integer) to service_role;

-- -------------------------------------------------------------
-- 5) STORAGE — fotos dos alunos deixam de ser públicas (VS-02)
--    ⚠️ Quebra as URLs antigas. Deploy do código junto.
-- -------------------------------------------------------------
update storage.buckets set public = false where id = 'fits';

drop policy if exists "fits storage: leitura para membros" on storage.objects;
create policy "fits storage: leitura para membros" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fits'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or public.tem_acesso_base()
    )
  );

-- -------------------------------------------------------------
-- 6) CONTADOR DE CLIQUES ATÔMICO (VS-26)
-- -------------------------------------------------------------
create or replace function public.registrar_clique(
  p_link_id uuid, p_referer text, p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tracking_links
     set clicks_count = clicks_count + 1
   where id = p_link_id;

  insert into public.tracking_link_clicks (link_id, referer, user_agent)
  values (p_link_id, p_referer, p_user_agent);
end;
$$;

revoke all on function public.registrar_clique(uuid, text, text) from public;
grant execute on function public.registrar_clique(uuid, text, text) to service_role;

-- -------------------------------------------------------------
-- 7) CONSTRAINTS DE INTEGRIDADE
--    NOT VALID: valem para dado novo sem travar no histórico.
--    Rode o bloco 9 depois de limpar os dados de teste.
-- -------------------------------------------------------------
update public.sales set cakto_id = null where cakto_id = '';

create unique index if not exists sales_cakto_id_unique
  on public.sales (cakto_id) where cakto_id is not null;

alter table public.sales drop constraint if exists sales_amount_positivo;
alter table public.sales add constraint sales_amount_positivo
  check (amount_cents >= 0) not valid;

alter table public.sales drop constraint if exists sales_fee_coerente;
alter table public.sales add constraint sales_fee_coerente
  check (gateway_fee_cents >= 0 and gateway_fee_cents <= amount_cents) not valid;

alter table public.sales drop constraint if exists sales_status_valido;
alter table public.sales add constraint sales_status_valido
  check (status in ('approved','refunded','chargeback','pending','manual')) not valid;

alter table public.fit_check_credits drop constraint if exists fit_check_credits_nao_negativo;
alter table public.fit_check_credits add constraint fit_check_credits_nao_negativo
  check (balance >= 0) not valid;

alter table public.user_entitlements drop constraint if exists entitlement_nao_vazio;
alter table public.user_entitlements add constraint entitlement_nao_vazio
  check (length(trim(entitlement)) > 0) not valid;

-- -------------------------------------------------------------
-- 8) ÍNDICES E FLAG DE TESTE
-- -------------------------------------------------------------
alter table public.users_profile
  add column if not exists is_test boolean not null default false;

create index if not exists users_profile_is_test_idx
  on public.users_profile (is_test) where is_test = true;
create index if not exists user_entitlements_lookup_idx
  on public.user_entitlements (user_id, entitlement) include (expires_at);
create index if not exists sales_user_status_idx
  on public.sales (user_id, status, created_at desc);
create index if not exists sales_email_lower_idx
  on public.sales (lower(email));
create index if not exists user_progress_lesson_idx
  on public.user_progress (lesson_id) where completed = true;
create index if not exists fit_check_logs_user_kind_day_idx
  on public.fit_check_logs (user_id, kind, created_at desc);
create index if not exists community_fits_pending_idx
  on public.community_fits (created_at desc) where status = 'pending';
create index if not exists tracking_links_slug_idx
  on public.tracking_links (lower(slug)) where deleted_at is null;

-- -------------------------------------------------------------
-- 8b) PREÇO ESPERADO POR PRODUTO (VS-12)
--     Quando preenchido, o webhook recusa compra cujo valor não
--     bate com o cadastrado — o sistema deixa de confiar no
--     preço que vem no payload.
-- -------------------------------------------------------------
alter table public.cakto_product_map
  add column if not exists expected_amount_cents integer;

-- -------------------------------------------------------------
-- 9) RATE LIMIT (VS-14)
--    Janela deslizante no banco. Precisa ser no banco porque a
--    Vercel roda várias instâncias — contador em memória não vê
--    as requisições que caíram na outra instância.
-- -------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket      text        not null,   -- ex: 'login:email@x.com'
  window_start timestamptz not null,
  hits        integer     not null default 0,
  primary key (bucket, window_start)
);

alter table public.rate_limits enable row level security;
-- Sem policy: só o service_role acessa (RLS bloqueia todo o resto).
grant all on public.rate_limits to service_role;

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

-- Retorna TRUE se a requisição pode passar, FALSE se estourou o limite.
create or replace function public.checar_rate_limit(
  p_bucket text, p_limite integer, p_janela_segundos integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inicio timestamptz;
  total  integer;
begin
  -- alinha a janela (ex: janela de 60s começa sempre no minuto cheio)
  inicio := to_timestamp(
    floor(extract(epoch from now()) / p_janela_segundos) * p_janela_segundos
  );

  insert into public.rate_limits (bucket, window_start, hits)
  values (p_bucket, inicio, 1)
  on conflict (bucket, window_start)
    do update set hits = public.rate_limits.hits + 1
  returning hits into total;

  -- limpeza preguiçosa das janelas velhas
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return total <= p_limite;
end;
$$;

revoke all on function public.checar_rate_limit(text, integer, integer) from public;
grant execute on function public.checar_rate_limit(text, integer, integer) to service_role;

commit;

-- -------------------------------------------------------------
-- 10) VALIDAÇÃO DAS CONSTRAINTS
--    Rode SÓ depois da limpeza dos dados de teste (script 04).
-- -------------------------------------------------------------
-- alter table public.sales validate constraint sales_amount_positivo;
-- alter table public.sales validate constraint sales_fee_coerente;
-- alter table public.sales validate constraint sales_status_valido;
-- alter table public.fit_check_credits validate constraint fit_check_credits_nao_negativo;
-- alter table public.user_entitlements validate constraint entitlement_nao_vazio;
