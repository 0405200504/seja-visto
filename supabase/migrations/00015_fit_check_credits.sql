-- =============================================================
-- Fit Check (IA): créditos de imagem ("tokens").
-- Cada conta nova ganha 5 imagens grátis. 1 token = 1 imagem analisada.
-- Ao zerar, a pessoa precisa comprar um pacote de tokens (Cakto).
-- O saldo só é alterado pelo servidor (service_role) — o cliente só lê.
-- =============================================================

create table if not exists public.fit_check_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fit_check_credits enable row level security;

-- Cliente só enxerga o próprio saldo. Alterações ficam no service_role.
create policy "fit_check_credits: read own or admin" on public.fit_check_credits
  for select using (auth.uid() = user_id or public.is_admin());

grant select on public.fit_check_credits to authenticated;
grant all on public.fit_check_credits to service_role;

-- Todo mundo que já tem conta começa com os 5 grátis também.
insert into public.fit_check_credits (user_id, balance)
select id, 5 from auth.users
on conflict (user_id) do nothing;

-- Consome 1 token de forma atômica (só se houver saldo). Retorna o novo
-- saldo, ou NULL quando não havia crédito para descontar.
create or replace function public.consume_fit_check_credit(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.fit_check_credits
    set balance = balance - 1, updated_at = now()
    where user_id = p_user and balance > 0
    returning balance into new_balance;
  return new_balance;
end;
$$;

-- Credita tokens comprados (pacote da Cakto). Cria a linha se não existir.
create or replace function public.add_fit_check_credits(p_user uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  insert into public.fit_check_credits (user_id, balance)
    values (p_user, p_amount)
  on conflict (user_id)
    do update set balance = public.fit_check_credits.balance + p_amount, updated_at = now()
    returning balance into new_balance;
  return new_balance;
end;
$$;

revoke all on function public.consume_fit_check_credit(uuid) from public;
revoke all on function public.add_fit_check_credits(uuid, integer) from public;
grant execute on function public.consume_fit_check_credit(uuid) to service_role;
grant execute on function public.add_fit_check_credits(uuid, integer) to service_role;
