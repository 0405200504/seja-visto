-- =============================================================
-- Migração 00023: registro de e-mails transacionais enviados
--
--  EM-01 · idempotência do e-mail de acesso (não manda duas vezes)
--  EM-02 · rastro de falha para poder reenviar sem duplicar
--
-- ⚠️  FAÇA BACKUP ANTES. Sugestão:
--     Supabase → Database → Backups → "Create backup" e espere concluir.
--
-- É uma migração ADITIVA: cria uma tabela nova. Não altera policy
-- existente, não apaga nem reescreve dado. Rodar duas vezes é seguro.
-- =============================================================

begin;

-- -------------------------------------------------------------
-- 1) REGISTRO DE ENVIOS
--
--    Uma linha por e-mail transacional que o sistema tenta enviar.
--    A coluna `chave` é a trava de idempotência:
--
--      acesso:user:<uuid do usuário>   → e-mail de acesso, um por conta
--      bonus:evento:<id do evento>     → aviso de bônus, um por evento
--
--    O ciclo é reservar → enviar → confirmar:
--      · insert com status 'enviando'  (o UNIQUE barra o webhook repetido)
--      · sucesso   → 'enviado'
--      · falha     → 'falhou'  (permite nova tentativa; NÃO marca enviado)
--
--    Nada de conteúdo do e-mail entra aqui: só destinatário, status e o
--    motivo do erro. Senha, token e chave de API nunca são gravados.
-- -------------------------------------------------------------
create table if not exists public.email_sends (
  id            bigserial   primary key,
  chave         text        not null,
  tipo          text        not null check (tipo in ('acesso', 'bonus', 'teste')),
  user_id       uuid        references auth.users(id) on delete set null,
  email         text        not null,
  status        text        not null default 'enviando'
                  check (status in ('enviando', 'enviado', 'falhou')),
  provedor      text,
  tentativas    integer     not null default 1,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  sent_at       timestamptz
);

-- A trava. Duas entregas do mesmo webhook disputam esta linha e só uma
-- consegue inserir; a outra recebe 23505 e desiste.
create unique index if not exists email_sends_chave_uk
  on public.email_sends (chave);

create index if not exists email_sends_email_idx
  on public.email_sends (email, created_at desc);
create index if not exists email_sends_falhas_idx
  on public.email_sends (created_at desc) where status <> 'enviado';

alter table public.email_sends enable row level security;

-- Só o admin lê pelo painel. O envio em si roda com service_role, que
-- ignora RLS — nenhum aluno enxerga a caixa de e-mails de ninguém.
drop policy if exists "email_sends: admin read" on public.email_sends;
create policy "email_sends: admin read" on public.email_sends
  for select using (public.is_admin());

grant select on public.email_sends to authenticated;
grant all    on public.email_sends to service_role;

commit;
