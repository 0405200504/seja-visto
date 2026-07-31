-- =============================================================
-- Migração 00022: blindagem de custo da IA + visibilidade de login
--
--  IA-01 · idempotência do Fit Check (request_id único)
--  IA-02 · uma análise em andamento por aluno (lock com expiração)
--  IA-03 · ciclo reservar → confirmar → estornar num só lugar
--  IA-04 · custo gravado por chamada (teto diário e mensal em R$)
--  AU-01 · auth_attempts para ver ataque de login (e-mail/IP com HASH)
--
-- ⚠️  FAÇA BACKUP ANTES. Sugestão:
--     Supabase → Database → Backups → "Create backup" e espere concluir.
--
-- É uma migração ADITIVA: cria tabelas e funções novas, e só ACRESCENTA
-- colunas. Não altera policy existente, não apaga nem reescreve dado.
-- Rodar duas vezes é seguro (tudo é if not exists / create or replace).
-- =============================================================

begin;

-- -------------------------------------------------------------
-- 1) LEDGER DE REQUISIÇÕES DA IA (IA-01, IA-02, IA-03, IA-04)
--
--    Uma linha por envio do aluno. É ao mesmo tempo:
--      · chave de idempotência   → unique (user_id, request_id)
--      · lock por aluno          → status 'reservado' + expiração
--      · registro de custo real  → tokens e custo em centavos
-- -------------------------------------------------------------
create table if not exists public.fit_check_requests (
  id                bigserial   primary key,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  request_id        text        not null,
  kind              text        not null check (kind in ('photo', 'text')),
  status            text        not null default 'reservado'
                      check (status in ('reservado', 'concluido', 'falhou', 'estornado')),
  -- true quando um token de imagem foi debitado nesta requisição
  credito_reservado boolean     not null default false,
  model             text,
  prompt_tokens     integer     not null default 0,
  completion_tokens integer     not null default 0,
  custo_cents       integer     not null default 0 check (custo_cents >= 0),
  -- resposta guardada para devolver em reenvio com o mesmo request_id
  reply             text,
  erro              text,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz,

  -- A TRAVA DA IDEMPOTÊNCIA: o mesmo request_id do mesmo aluno não entra 2x.
  unique (user_id, request_id)
);

alter table public.fit_check_requests enable row level security;

-- O aluno lê o próprio histórico; escrita é só pelo servidor (service_role).
drop policy if exists "fit_check_requests: read own or admin" on public.fit_check_requests;
create policy "fit_check_requests: read own or admin" on public.fit_check_requests
  for select using (auth.uid() = user_id or public.is_admin());

grant select on public.fit_check_requests to authenticated;
grant all    on public.fit_check_requests to service_role;

create index if not exists fit_check_requests_user_idx
  on public.fit_check_requests (user_id, created_at desc);
-- Índice do teto de gasto: soma por período só das que custaram algo.
create index if not exists fit_check_requests_custo_idx
  on public.fit_check_requests (created_at desc) where custo_cents > 0;
-- Índice do lock: acha rápido a requisição em andamento do aluno.
create index if not exists fit_check_requests_em_andamento_idx
  on public.fit_check_requests (user_id, created_at desc) where status = 'reservado';

-- -------------------------------------------------------------
-- 2) COMEÇAR UMA REQUISIÇÃO  (idempotência + lock + débito atômico)
--
--    Uma única chamada resolve as três coisas, dentro de UMA transação.
--    Fazer isso no Postgres, e não no Node, é o que elimina a janela de
--    corrida: entre "decidir" e "gravar" não existe ida e volta de rede.
--
--    Retorna JSON com um campo "decisao":
--      'repetida'      → mesmo request_id já concluído; devolve o reply salvo
--      'em_andamento'  → já existe uma análise rodando (responder 409)
--      'sem_saldo'     → sem token de imagem (não chame a OpenAI)
--      'ok'            → pode chamar a OpenAI
-- -------------------------------------------------------------
create or replace function public.fit_check_begin(
  p_user       uuid,
  p_request_id text,
  p_kind       text,
  p_cobrar     boolean default true,          -- false para admin (não gasta token)
  p_lock_segundos integer default 120         -- tempo máximo de uma análise
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existente public.fit_check_requests;
  v_em_andamento integer;
  v_saldo integer;
begin
  -- ---------- (a) IDEMPOTÊNCIA ----------
  -- Trava a linha (for update) para dois cliques simultâneos com o mesmo
  -- request_id não passarem os dois por aqui.
  select * into v_existente
    from public.fit_check_requests
   where user_id = p_user and request_id = p_request_id
   for update;

  if found then
    if v_existente.status = 'concluido' then
      -- Reenvio do mesmo pedido: devolve o que já foi respondido, sem cobrar.
      return jsonb_build_object(
        'decisao', 'repetida',
        'reply',   v_existente.reply,
        'kind',    v_existente.kind
      );
    end if;

    if v_existente.status = 'reservado'
       and v_existente.created_at > now() - make_interval(secs => p_lock_segundos) then
      return jsonb_build_object('decisao', 'em_andamento');
    end if;

    -- Tentativa anterior falhou ou expirou: libera o request_id para retry.
    delete from public.fit_check_requests
     where id = v_existente.id;
  end if;

  -- ---------- (b) LOCK POR ALUNO ----------
  -- Uma análise em andamento por aluno. A expiração evita que uma requisição
  -- que morreu no meio (timeout, deploy) tranque o aluno para sempre.
  select count(*) into v_em_andamento
    from public.fit_check_requests
   where user_id = p_user
     and status = 'reservado'
     and created_at > now() - make_interval(secs => p_lock_segundos);

  if v_em_andamento > 0 then
    return jsonb_build_object('decisao', 'em_andamento');
  end if;

  -- ---------- (c) DÉBITO ATÔMICO ----------
  -- Só foto consome token; texto é grátis para o aluno.
  if p_kind = 'photo' and p_cobrar then
    -- zera saldo vencido antes de tentar reservar
    update public.fit_check_credits
       set balance = 0, expires_at = null
     where user_id = p_user
       and expires_at is not null
       and expires_at < now();

    -- O WHERE balance > 0 é a trava: requisições paralelas serializam nesta
    -- linha e só uma consegue o decremento. Se não retornar linha, não há
    -- saldo — e a OpenAI não é chamada.
    update public.fit_check_credits
       set balance = balance - 1, updated_at = now()
     where user_id = p_user and balance > 0
    returning balance into v_saldo;

    if v_saldo is null then
      return jsonb_build_object('decisao', 'sem_saldo', 'balance', 0);
    end if;
  end if;

  -- ---------- (d) ABRE A REQUISIÇÃO ----------
  insert into public.fit_check_requests (user_id, request_id, kind, status, credito_reservado)
  values (p_user, p_request_id, p_kind, 'reservado', (p_kind = 'photo' and p_cobrar));

  return jsonb_build_object('decisao', 'ok', 'balance', v_saldo);
end;
$$;

-- -------------------------------------------------------------
-- 3) CONFIRMAR — grava consumo real e custo
-- -------------------------------------------------------------
create or replace function public.fit_check_commit(
  p_user       uuid,
  p_request_id text,
  p_model      text,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_custo_cents integer,
  p_reply      text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.fit_check_requests
     set status            = 'concluido',
         model             = p_model,
         prompt_tokens     = greatest(coalesce(p_prompt_tokens, 0), 0),
         completion_tokens = greatest(coalesce(p_completion_tokens, 0), 0),
         -- soma: uma requisição pode ter mais de uma chamada à OpenAI
         -- (a análise + a geração do título)
         custo_cents       = custo_cents + greatest(coalesce(p_custo_cents, 0), 0),
         reply             = p_reply,
         completed_at      = now()
   where user_id = p_user and request_id = p_request_id;
end;
$$;

-- Acrescenta custo a uma requisição já aberta (ex.: a chamada do título).
create or replace function public.fit_check_add_custo(
  p_user uuid, p_request_id text, p_custo_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.fit_check_requests
     set custo_cents = custo_cents + greatest(coalesce(p_custo_cents, 0), 0)
   where user_id = p_user and request_id = p_request_id;
end;
$$;

-- -------------------------------------------------------------
-- 4) ESTORNAR — falha da nossa parte, o aluno não paga
-- -------------------------------------------------------------
create or replace function public.fit_check_rollback(
  p_user uuid, p_request_id text, p_erro text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservado boolean;
  v_saldo integer;
begin
  update public.fit_check_requests
     set status       = 'estornado',
         erro         = left(coalesce(p_erro, ''), 500),
         completed_at = now()
   where user_id = p_user and request_id = p_request_id
     and status = 'reservado'
  returning credito_reservado into v_reservado;

  -- Devolve o token só se ele realmente foi debitado, e só uma vez
  -- (o WHERE status='reservado' acima garante que não estorna duas vezes).
  if coalesce(v_reservado, false) then
    update public.fit_check_credits
       set balance = balance + 1, updated_at = now()
     where user_id = p_user
    returning balance into v_saldo;
  end if;

  return v_saldo;
end;
$$;

-- -------------------------------------------------------------
-- 5) GASTO ACUMULADO — alimenta o teto diário e mensal
-- -------------------------------------------------------------
create or replace function public.fit_check_gasto_cents(p_desde timestamptz)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(custo_cents), 0)::integer
    from public.fit_check_requests
   where created_at >= p_desde;
$$;

revoke all on function public.fit_check_begin(uuid, text, text, boolean, integer) from public;
revoke all on function public.fit_check_commit(uuid, text, text, integer, integer, integer, text) from public;
revoke all on function public.fit_check_add_custo(uuid, text, integer) from public;
revoke all on function public.fit_check_rollback(uuid, text, text) from public;
revoke all on function public.fit_check_gasto_cents(timestamptz) from public;

grant execute on function public.fit_check_begin(uuid, text, text, boolean, integer) to service_role;
grant execute on function public.fit_check_commit(uuid, text, text, integer, integer, integer, text) to service_role;
grant execute on function public.fit_check_add_custo(uuid, text, integer) to service_role;
grant execute on function public.fit_check_rollback(uuid, text, text) to service_role;
grant execute on function public.fit_check_gasto_cents(timestamptz) to service_role;

-- -------------------------------------------------------------
-- 6) CHECK (balance >= 0) VALIDADO
--    Na 00021 entrou como NOT VALID. O Postgres já aplica a regra em toda
--    escrita nova; validar agora faz o histórico ser conferido também, e o
--    saldo negativo passa a ser impossível por construção.
--    Se esta linha falhar, existe saldo negativo gravado: corrija com
--      update public.fit_check_credits set balance = 0 where balance < 0;
--    e rode a migração de novo.
-- -------------------------------------------------------------
alter table public.fit_check_credits validate constraint fit_check_credits_nao_negativo;

-- -------------------------------------------------------------
-- 7) TENTATIVAS DE AUTENTICAÇÃO (AU-01)
--    E-mail e IP entram com HASH (sha256 + pepper feito na aplicação).
--    Guardar e-mail e IP em texto puro num log de segurança criaria uma
--    segunda base de dado pessoal — sem necessidade, e contra a LGPD.
-- -------------------------------------------------------------
create table if not exists public.auth_attempts (
  id         bigserial   primary key,
  email_hash text        not null,
  ip_hash    text        not null,
  acao       text        not null check (acao in ('login', 'cadastro', 'reset', 'nova_senha')),
  sucesso    boolean     not null,
  motivo     text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.auth_attempts enable row level security;

drop policy if exists "auth_attempts: admin read" on public.auth_attempts;
create policy "auth_attempts: admin read" on public.auth_attempts
  for select using (public.is_admin());

grant select on public.auth_attempts to authenticated;
grant all    on public.auth_attempts to service_role;

create index if not exists auth_attempts_email_idx
  on public.auth_attempts (email_hash, created_at desc);
create index if not exists auth_attempts_ip_idx
  on public.auth_attempts (ip_hash, created_at desc);
create index if not exists auth_attempts_falhas_idx
  on public.auth_attempts (created_at desc) where sucesso = false;

-- Registra e devolve quantas falhas houve na janela — serve de trava
-- progressiva e de alerta, numa única ida ao banco.
create or replace function public.registrar_tentativa_auth(
  p_email_hash text,
  p_ip_hash    text,
  p_acao       text,
  p_sucesso    boolean,
  p_motivo     text default null,
  p_user_agent text default null,
  p_janela_minutos integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_falhas_email integer;
  v_falhas_ip integer;
begin
  insert into public.auth_attempts (email_hash, ip_hash, acao, sucesso, motivo, user_agent)
  values (p_email_hash, p_ip_hash, p_acao, p_sucesso, left(coalesce(p_motivo,''), 200),
          left(coalesce(p_user_agent,''), 300));

  select count(*) into v_falhas_email
    from public.auth_attempts
   where email_hash = p_email_hash and sucesso = false
     and created_at > now() - make_interval(mins => p_janela_minutos);

  select count(*) into v_falhas_ip
    from public.auth_attempts
   where ip_hash = p_ip_hash and sucesso = false
     and created_at > now() - make_interval(mins => p_janela_minutos);

  -- limpeza preguiçosa: retenção de 30 dias (LGPD — não guardar além do uso)
  if random() < 0.01 then
    delete from public.auth_attempts where created_at < now() - interval '30 days';
  end if;

  return jsonb_build_object('falhas_email', v_falhas_email, 'falhas_ip', v_falhas_ip);
end;
$$;

revoke all on function public.registrar_tentativa_auth(text, text, text, boolean, text, text, integer) from public;
grant execute on function public.registrar_tentativa_auth(text, text, text, boolean, text, text, integer) to service_role;

commit;

-- -------------------------------------------------------------
-- CONFERÊNCIA (rode depois; deve devolver as 3 linhas esperadas)
-- -------------------------------------------------------------
-- select count(*) as tabelas_novas from information_schema.tables
--  where table_schema='public' and table_name in ('fit_check_requests','auth_attempts');
-- select count(*) as funcoes_novas from pg_proc
--  where proname in ('fit_check_begin','fit_check_commit','fit_check_rollback',
--                    'fit_check_add_custo','fit_check_gasto_cents','registrar_tentativa_auth');
-- select convalidated from pg_constraint where conname='fit_check_credits_nao_negativo';
