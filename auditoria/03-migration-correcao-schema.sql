-- =============================================================
-- 03 — MIGRATION DE CORREÇÃO DE SCHEMA
-- Constraints, índices, idempotência do webhook e trava de tokens.
--
-- ⚠️  ANTES DE RODAR:
--     1. Faça backup (Supabase → Database → Backups → criar manual)
--     2. Rode o script 02 primeiro. Se ele acusar DUPLICATAS em
--        sales.cakto_id, o bloco 2 abaixo VAI FALHAR — limpe as
--        duplicatas com o script 04 antes.
--
-- ✅  NÃO apaga dado. Só adiciona constraints, índices e funções.
--     A única exceção é o UPDATE do bloco 1, que apenas normaliza
--     cakto_id vazio para NULL.
--
-- Rode dentro de uma transação. Se algo falhar, nada é aplicado.
-- =============================================================

begin;

-- -------------------------------------------------------------
-- 1) IDEMPOTÊNCIA DO WEBHOOK — tabela de eventos processados
--    Sem isto, a Cakto reenviando o mesmo evento credita tokens
--    de novo, duplica a venda e estende a validade duas vezes.
-- -------------------------------------------------------------
create table if not exists public.webhook_events (
  id            bigserial primary key,
  provider      text        not null default 'cakto',
  event_id      text        not null,   -- id único do evento no gateway
  event_type    text        not null,
  payload       jsonb       not null,   -- log completo, para disputa com cliente
  status        text        not null default 'processed'
                check (status in ('processed', 'failed', 'ignored')),
  error_message text,
  user_email    text,
  created_at    timestamptz not null default now(),
  unique (provider, event_id)           -- ⬅️ o coração da idempotência
);

alter table public.webhook_events enable row level security;

create policy "webhook_events: admin read" on public.webhook_events
  for select using (public.is_admin());

grant select on public.webhook_events to authenticated;
grant all    on public.webhook_events to service_role;

create index if not exists webhook_events_created_idx
  on public.webhook_events (created_at desc);
create index if not exists webhook_events_status_idx
  on public.webhook_events (status, created_at desc)
  where status = 'failed';

-- -------------------------------------------------------------
-- 2) VENDAS — impede a mesma transição da Cakto entrar duas vezes
-- -------------------------------------------------------------
-- normaliza string vazia para NULL (UNIQUE ignora NULL)
update public.sales set cakto_id = null where cakto_id = '';

-- índice único parcial: só vale quando há cakto_id de verdade,
-- então venda manual (cakto_id nulo) continua livre.
create unique index if not exists sales_cakto_id_unique
  on public.sales (cakto_id) where cakto_id is not null;

-- valores negativos são impossíveis
alter table public.sales
  drop constraint if exists sales_amount_positivo;
alter table public.sales
  add constraint sales_amount_positivo check (amount_cents >= 0) not valid;

alter table public.sales
  drop constraint if exists sales_fee_coerente;
alter table public.sales
  add constraint sales_fee_coerente
  check (gateway_fee_cents >= 0 and gateway_fee_cents <= amount_cents) not valid;

-- status precisa ser um dos valores conhecidos
alter table public.sales
  drop constraint if exists sales_status_valido;
alter table public.sales
  add constraint sales_status_valido
  check (status in ('approved','refunded','chargeback','pending','manual')) not valid;

-- índice do funil financeiro (dashboard filtra por status + data)
create index if not exists sales_user_status_idx
  on public.sales (user_id, status, created_at desc);
create index if not exists sales_email_lower_idx
  on public.sales (lower(email));

-- -------------------------------------------------------------
-- 3) ENTITLEMENTS — a chave precisa ser válida e a data coerente
-- -------------------------------------------------------------
alter table public.user_entitlements
  drop constraint if exists entitlement_nao_vazio;
alter table public.user_entitlements
  add constraint entitlement_nao_vazio check (length(trim(entitlement)) > 0) not valid;

-- consulta "quem tem acesso base válido agora" fica indexada
create index if not exists user_entitlements_lookup_idx
  on public.user_entitlements (user_id, entitlement)
  include (expires_at);

-- -------------------------------------------------------------
-- 4) TOKENS DE IA — saldo nunca negativo + reserva ATÔMICA
--    A função nova RESERVA o token ANTES da chamada à OpenAI e
--    devolve se a chamada falhar. Isso fecha a corrida em que
--    N requisições paralelas passam com 1 token só.
-- -------------------------------------------------------------
alter table public.fit_check_credits
  drop constraint if exists fit_check_credits_nao_negativo;
alter table public.fit_check_credits
  add constraint fit_check_credits_nao_negativo check (balance >= 0) not valid;

-- Reserva 1 token de forma atômica. Retorna o novo saldo,
-- ou NULL se não havia saldo (aí o app NÃO chama a OpenAI).
create or replace function public.reserve_fit_check_credit(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  -- zera saldo vencido antes de reservar
  update public.fit_check_credits
     set balance = 0, expires_at = null
   where user_id = p_user and expires_at is not null and expires_at < now();

  -- decremento condicional: o WHERE balance > 0 é a trava.
  -- Duas requisições simultâneas serializam nesta linha.
  update public.fit_check_credits
     set balance = balance - 1, updated_at = now()
   where user_id = p_user and balance > 0
  returning balance into new_balance;

  return new_balance;  -- NULL = sem saldo
end;
$$;

-- Devolve o token quando a chamada à IA falha (erro 5xx da OpenAI).
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

-- -------------------------------------------------------------
-- 5) PERFIL — e-mail único de verdade e busca rápida
-- -------------------------------------------------------------
-- (o índice único por lower(email) já existe desde a 00007;
--  este garante que exista mesmo se aquela migration não rodou)
create unique index if not exists users_profile_email_idx
  on public.users_profile (lower(email));

-- -------------------------------------------------------------
-- 6) ÍNDICES QUE FALTAM PARA ESCALA
-- -------------------------------------------------------------
create index if not exists user_progress_lesson_idx
  on public.user_progress (lesson_id) where completed = true;
create index if not exists fit_check_logs_user_kind_day_idx
  on public.fit_check_logs (user_id, kind, created_at desc);
create index if not exists fit_check_messages_user_idx
  on public.fit_check_messages (user_id, created_at desc);
create index if not exists community_fits_pending_idx
  on public.community_fits (created_at desc) where status = 'pending';
create index if not exists tracking_links_slug_idx
  on public.tracking_links (lower(slug)) where deleted_at is null;

-- -------------------------------------------------------------
-- 7) FLAG is_test em perfil (dado de teste nunca mais polui métrica)
-- -------------------------------------------------------------
alter table public.users_profile
  add column if not exists is_test boolean not null default false;
create index if not exists users_profile_is_test_idx
  on public.users_profile (is_test) where is_test = true;

commit;

-- -------------------------------------------------------------
-- 8) VALIDAÇÃO DAS CONSTRAINTS (rode DEPOIS de limpar os dados)
--    Criamos tudo como NOT VALID para não travar em dado velho.
--    Quando o script 04 tiver limpado, rode este bloco para que
--    o Postgres passe a validar também o histórico.
-- -------------------------------------------------------------
-- alter table public.sales validate constraint sales_amount_positivo;
-- alter table public.sales validate constraint sales_fee_coerente;
-- alter table public.sales validate constraint sales_status_valido;
-- alter table public.user_entitlements validate constraint entitlement_nao_vazio;
-- alter table public.fit_check_credits validate constraint fit_check_credits_nao_negativo;
