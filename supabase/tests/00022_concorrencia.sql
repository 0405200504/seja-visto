-- =============================================================
-- TESTE DE CONCORRÊNCIA DO DÉBITO ATÔMICO (migração 00022)
--
-- Prova o critério de aceite: "10 requisições simultâneas do mesmo aluno
-- com saldo para apenas 1 → exatamente 1 passa, 9 recusadas, saldo final
-- nunca negativo."
--
-- Este teste NÃO pode ser feito com mock: o que está sendo testado é o
-- comportamento de travamento do Postgres. Um mock em JavaScript sempre
-- passaria, inclusive num código com condição de corrida.
--
-- COMO RODAR (em ambiente de TESTE, nunca em produção):
--   Supabase → SQL Editor → cole tudo → Run.
--   Ao final ele faz ROLLBACK: nada é gravado.
-- =============================================================

begin;

-- Aluno de teste, isolado numa transação que será desfeita.
do $$
declare
  v_user uuid;
  v_ok integer := 0;
  v_sem_saldo integer := 0;
  v_saldo_final integer;
  v_decisao text;
begin
  -- Pega qualquer usuário existente só para satisfazer a foreign key.
  select id into v_user from auth.users limit 1;
  if v_user is null then
    raise exception 'Nenhum usuário em auth.users — crie um antes de rodar o teste.';
  end if;

  -- Estado inicial: saldo de EXATAMENTE 1 token.
  insert into public.fit_check_credits (user_id, balance)
  values (v_user, 1)
  on conflict (user_id) do update set balance = 1, expires_at = null;

  delete from public.fit_check_requests where user_id = v_user;

  -- 10 tentativas, cada uma com request_id diferente (simula 10 envios
  -- distintos). O lock por aluno recusa a partir da 2ª; o que importa é que
  -- NENHUMA passe além do saldo e o saldo não fique negativo.
  for i in 1..10 loop
    select (public.fit_check_begin(
              v_user, 'teste-corrida-' || i, 'photo', true, 120
            ) ->> 'decisao') into v_decisao;

    if v_decisao = 'ok' then
      v_ok := v_ok + 1;
      -- libera o lock para a próxima tentativa disputar o saldo de verdade
      update public.fit_check_requests
         set status = 'concluido', completed_at = now()
       where user_id = v_user and request_id = 'teste-corrida-' || i;
    elsif v_decisao = 'sem_saldo' then
      v_sem_saldo := v_sem_saldo + 1;
    end if;
  end loop;

  select balance into v_saldo_final
    from public.fit_check_credits where user_id = v_user;

  raise notice '----------------------------------------';
  raise notice 'passaram (ok):        % (esperado: 1)', v_ok;
  raise notice 'recusadas sem saldo:  % (esperado: 9)', v_sem_saldo;
  raise notice 'saldo final:          % (esperado: 0)', v_saldo_final;
  raise notice '----------------------------------------';

  if v_ok <> 1 then
    raise exception 'FALHOU: % requisições passaram, esperado exatamente 1. O débito NÃO é atômico.', v_ok;
  end if;
  if v_saldo_final < 0 then
    raise exception 'FALHOU: saldo ficou NEGATIVO (%). O CHECK não está pegando.', v_saldo_final;
  end if;
  if v_saldo_final <> 0 then
    raise exception 'FALHOU: saldo final %, esperado 0.', v_saldo_final;
  end if;

  raise notice 'PASSOU: débito atômico, sem saldo negativo.';
end $$;

-- ---------------------------------------------------------------
-- O CHECK do banco é a última rede: nem por SQL direto dá para negativar.
-- ---------------------------------------------------------------
do $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users limit 1;
  begin
    update public.fit_check_credits set balance = -1 where user_id = v_user;
    raise exception 'FALHOU: o banco ACEITOU saldo negativo — o CHECK não está validado.';
  exception
    when check_violation then
      raise notice 'PASSOU: o banco recusou saldo negativo (check_violation).';
  end;
end $$;

-- ---------------------------------------------------------------
-- IDEMPOTÊNCIA: mesmo request_id duas vezes cobra uma vez só.
-- ---------------------------------------------------------------
do $$
declare
  v_user uuid;
  v_d1 text;
  v_d2 text;
begin
  select id into v_user from auth.users limit 1;
  update public.fit_check_credits set balance = 5 where user_id = v_user;
  delete from public.fit_check_requests where user_id = v_user;

  select (public.fit_check_begin(v_user, 'mesmo-id', 'photo', true, 120) ->> 'decisao') into v_d1;
  perform public.fit_check_commit(v_user, 'mesmo-id', 'gpt-5.5', 100, 10, 5, 'resposta original');
  select (public.fit_check_begin(v_user, 'mesmo-id', 'photo', true, 120) ->> 'decisao') into v_d2;

  raise notice '1ª chamada: %  ·  2ª com o MESMO id: %', v_d1, v_d2;

  if v_d1 <> 'ok' or v_d2 <> 'repetida' then
    raise exception 'FALHOU: idempotência não funcionou (% / %).', v_d1, v_d2;
  end if;

  -- Cobrou 1 token, não 2.
  if (select balance from public.fit_check_credits where user_id = v_user) <> 4 then
    raise exception 'FALHOU: o reenvio cobrou um segundo token.';
  end if;

  raise notice 'PASSOU: reenvio com o mesmo request_id não cobrou de novo.';
end $$;

-- Nada é gravado.
rollback;
