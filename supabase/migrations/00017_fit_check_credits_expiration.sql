-- Adiciona a coluna expires_at na tabela fit_check_credits
alter table public.fit_check_credits 
add column if not exists expires_at timestamptz;

-- Atualiza a função de consumir crédito para verificar expiração (Lazy Reset)
create or replace function public.consume_fit_check_credit(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  -- Se o saldo estiver expirado, zera o saldo e limpa a data
  update public.fit_check_credits
    set balance = 0, expires_at = null
    where user_id = p_user and expires_at is not null and expires_at < now();

  -- Consome o crédito normal se ainda houver saldo
  update public.fit_check_credits
    set balance = balance - 1, updated_at = now()
    where user_id = p_user and balance > 0
    returning balance into new_balance;
    
  return new_balance;
end;
$$;

-- Atualiza a função de adicionar créditos para definir validade de 30 dias
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
  -- Busca expiração atual
  select expires_at into current_expiry 
  from public.fit_check_credits 
  where user_id = p_user;

  -- Se a expiração atual for futura, somamos 30 dias nela. Senão, 30 dias a partir de agora.
  if current_expiry is not null and current_expiry > now() then
    new_expiry := current_expiry + interval '30 days';
  else
    new_expiry := now() + interval '30 days';
  end if;

  insert into public.fit_check_credits (user_id, balance, expires_at)
    values (p_user, p_amount, now() + interval '30 days')
  on conflict (user_id)
    do update set 
      balance = public.fit_check_credits.balance + p_amount, 
      expires_at = new_expiry,
      updated_at = now()
    returning balance into new_balance;
    
  return new_balance;
end;
$$;
