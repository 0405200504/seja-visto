-- =============================================================
-- Migração 00024: WhatsApp para recuperação de carrinho e renovação
--
--  WA-01 · contatos com telefone, consentimento e opt-out
--  WA-02 · carrinhos (checkout iniciado e não concluído)
--  WA-03 · assinaturas mensais e anuais, com próxima cobrança
--  WA-04 · fila de mensagens, com idempotência e retentativa
--
-- ⚠️  FAÇA BACKUP ANTES. Sugestão:
--     Supabase → Database → Backups → "Create backup" e espere concluir.
--
-- É uma migração ADITIVA: cria tabelas novas. Não altera policy existente,
-- não apaga nem reescreve dado. Rodar duas vezes é seguro.
--
-- CONTEXTO: até aqui o telefone do comprador chegava no payload da Cakto,
-- era usado na hora para mandar o WhatsApp de acesso e era DESCARTADO. Não
-- existia consentimento, opt-out, carrinho nem assinatura no banco.
-- =============================================================

begin;

-- -------------------------------------------------------------
-- 1) CONTATOS (WA-01)
--
--    Uma linha por telefone. É aqui que mora a base legal do envio:
--    quando o consentimento foi dado, de onde veio, para o quê vale, e
--    se a pessoa pediu para parar.
--
--    `phone` é sempre E.164 sem o "+" (ex.: 5515988300526). A
--    normalização acontece na aplicação (lib/whatsapp/phone.ts) — aqui o
--    check só barra o que claramente não é telefone.
-- -------------------------------------------------------------
create table if not exists public.whatsapp_contacts (
  id                 bigserial   primary key,
  phone              text        not null unique check (phone ~ '^[1-9][0-9]{9,14}$'),
  user_id            uuid        references auth.users(id) on delete set null,
  email              text,
  name               text,
  -- Consentimento
  consent_granted_at timestamptz,
  consent_source     text,
  consent_categories text[]      not null default array['compra','assinatura','pagamento','acesso'],
  -- Opt-out: preenchido quando a pessoa responde PARAR
  opted_out_at       timestamptz,
  opt_out_reason     text,
  -- Última mensagem recebida da pessoa (serve de sinal de engajamento)
  last_inbound_at    timestamptz,
  last_inbound_text  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists whatsapp_contacts_user_idx  on public.whatsapp_contacts (user_id);
create index if not exists whatsapp_contacts_email_idx on public.whatsapp_contacts (lower(email));

-- -------------------------------------------------------------
-- 2) CARRINHOS (WA-02)
--
--    Um checkout iniciado na Cakto. Vira "abandonado" só quando o
--    pagamento não se concretiza E o prazo do meio de pagamento passou
--    (PIX dentro da validade ou boleto a vencer NÃO são abandono).
-- -------------------------------------------------------------
create table if not exists public.whatsapp_carts (
  id             bigserial   primary key,
  checkout_id    text        not null unique,
  contact_id     bigint      not null references public.whatsapp_contacts(id) on delete cascade,
  plan           text        not null default 'outro' check (plan in ('mensal', 'anual', 'outro')),
  entitlement    text,
  amount_cents   integer     not null default 0,
  installments   integer,
  checkout_url   text,
  payment_method text,
  status         text        not null default 'aberto'
                   check (status in ('aberto', 'pago', 'cancelado', 'expirado', 'desistiu')),
  -- Prazo do PIX/boleto. Enquanto estiver no futuro, não é abandono.
  expires_at     timestamptz,
  abandoned_at   timestamptz,
  resolved_at    timestamptz,
  resolved_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists whatsapp_carts_status_idx  on public.whatsapp_carts (status, abandoned_at);
create index if not exists whatsapp_carts_contact_idx on public.whatsapp_carts (contact_id);

-- -------------------------------------------------------------
-- 3) ASSINATURAS (WA-03)
--
--    Mensal (30 dias) e anual (365 dias), conforme o validity_days do
--    cakto_product_map. `next_charge_at` é o que dispara os lembretes.
-- -------------------------------------------------------------
create table if not exists public.subscriptions (
  id                     bigserial   primary key,
  cakto_subscription_id  text        unique,
  contact_id             bigint      references public.whatsapp_contacts(id) on delete set null,
  user_id                uuid        references auth.users(id) on delete cascade,
  email                  text        not null,
  plan                   text        not null check (plan in ('mensal', 'anual')),
  amount_cents           integer     not null default 0,
  status                 text        not null default 'ativa'
                           check (status in ('ativa', 'pendente', 'suspensa', 'cancelada', 'expirada')),
  next_charge_at         timestamptz,
  last_payment_at        timestamptz,
  payment_failed_at      timestamptz,
  suspended_at           timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_next_charge_idx on public.subscriptions (status, next_charge_at);
create index if not exists subscriptions_user_idx        on public.subscriptions (user_id);
create index if not exists subscriptions_email_idx       on public.subscriptions (lower(email));

-- -------------------------------------------------------------
-- 4) FILA DE MENSAGENS (WA-04)
--
--    Nada é enviado direto: tudo entra aqui agendado e o cron processa.
--
--    `dedupe_key` é a trava de duplicidade, no formato pedido:
--      <contato>:<carrinho|assinatura>:<tipo>:<data agendada>
--
--    O corpo da mensagem é gravado para você poder auditar exatamente o
--    que foi enviado. Nenhum token, link de recuperação de senha ou dado
--    de cartão entra aqui.
-- -------------------------------------------------------------
create table if not exists public.whatsapp_messages (
  id                  bigserial   primary key,
  dedupe_key          text        not null unique,
  message_type        text        not null,
  contact_id          bigint      not null references public.whatsapp_contacts(id) on delete cascade,
  cart_id             bigint      references public.whatsapp_carts(id) on delete set null,
  subscription_id     bigint      references public.subscriptions(id) on delete set null,
  plan                text,
  body                text        not null,
  scheduled_for       timestamptz not null,
  status              text        not null default 'scheduled'
                        check (status in ('scheduled','processing','sent','failed','cancelled','skipped')),
  attempts            integer     not null default 0,
  next_attempt_at     timestamptz,
  provider_message_id text,
  response_code       integer,
  error_category      text,
  error_message       text,
  skip_reason         text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Índice que o cron usa para pegar o que está na hora de enviar.
create index if not exists whatsapp_messages_pendentes_idx
  on public.whatsapp_messages (scheduled_for)
  where status in ('scheduled', 'failed');

create index if not exists whatsapp_messages_contact_idx on public.whatsapp_messages (contact_id, created_at desc);
create index if not exists whatsapp_messages_tipo_idx    on public.whatsapp_messages (message_type, status);

-- -------------------------------------------------------------
-- 5) RLS
--
--    Tudo roda por service_role (webhook e cron). O admin lê pelo painel.
--    Nenhum aluno enxerga telefone ou histórico de mensagem de ninguém.
-- -------------------------------------------------------------
alter table public.whatsapp_contacts enable row level security;
alter table public.whatsapp_carts    enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.whatsapp_messages enable row level security;

drop policy if exists "whatsapp_contacts: admin read" on public.whatsapp_contacts;
create policy "whatsapp_contacts: admin read" on public.whatsapp_contacts
  for select using (public.is_admin());

drop policy if exists "whatsapp_carts: admin read" on public.whatsapp_carts;
create policy "whatsapp_carts: admin read" on public.whatsapp_carts
  for select using (public.is_admin());

/* A assinatura é o único caso em que o próprio aluno lê a linha dele:
   a página /renovar mostra plano e vencimento para quem está logado. */
drop policy if exists "subscriptions: own or admin" on public.subscriptions;
create policy "subscriptions: own or admin" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "whatsapp_messages: admin read" on public.whatsapp_messages;
create policy "whatsapp_messages: admin read" on public.whatsapp_messages
  for select using (public.is_admin());

grant select on public.whatsapp_contacts to authenticated;
grant select on public.whatsapp_carts    to authenticated;
grant select on public.subscriptions     to authenticated;
grant select on public.whatsapp_messages to authenticated;
grant all    on public.whatsapp_contacts to service_role;
grant all    on public.whatsapp_carts    to service_role;
grant all    on public.subscriptions     to service_role;
grant all    on public.whatsapp_messages to service_role;

-- -------------------------------------------------------------
-- 6) RESERVA DE ENVIO
--
--    Pega até N mensagens que estão na hora e marca como 'processing'
--    numa só transação. Sem isto, duas execuções do cron ao mesmo tempo
--    mandariam a mesma mensagem duas vezes.
--
--    A cláusula `for update skip locked` é o que garante que cada linha
--    saia para um único processador.
--
--    Também impede mais de uma mensagem simultânea para o MESMO contato:
--    o distinct on (contact_id) devolve no máximo uma por pessoa.
-- -------------------------------------------------------------
create or replace function public.reservar_mensagens_whatsapp(p_limite integer default 10)
returns setof public.whatsapp_messages
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidatas as (
    select distinct on (m.contact_id) m.id
      from public.whatsapp_messages m
     where m.scheduled_for <= now()
       and (
         m.status = 'scheduled'
         -- 'failed' só volta à fila quando a aplicação marcou uma próxima
         -- tentativa. Erro permanente (número inválido, credencial) fica
         -- com next_attempt_at nulo e NUNCA é repescado — sem isto, a
         -- mensagem tentaria para sempre.
         or (m.status = 'failed' and m.next_attempt_at is not null and m.next_attempt_at <= now())
         -- Reserva órfã: a execução morreu depois de reservar e antes de
         -- concluir (timeout da função na Vercel, deploy no meio). Sem
         -- esta linha, a mensagem ficaria presa em 'processing' para
         -- sempre e o cliente nunca receberia.
         or (m.status = 'processing' and m.updated_at < now() - interval '10 minutes')
       )
     order by m.contact_id, m.scheduled_for
  ),
  travadas as (
    select m.id
      from public.whatsapp_messages m
      join candidatas c on c.id = m.id
     order by m.scheduled_for
     limit p_limite
     for update of m skip locked
  )
  update public.whatsapp_messages m
     set status = 'processing',
         attempts = m.attempts + 1,
         updated_at = now()
    from travadas t
   where m.id = t.id
  returning m.*;
end;
$$;

revoke all on function public.reservar_mensagens_whatsapp(integer) from public, anon, authenticated;
grant execute on function public.reservar_mensagens_whatsapp(integer) to service_role;

commit;
