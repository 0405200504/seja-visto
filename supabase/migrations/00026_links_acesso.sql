-- =============================================================
-- Migração 00026: links de acesso próprios (definir senha)
--
--  AC-01 · o link do e-mail deixa de depender do OTP do Supabase,
--          que expira em no máximo 24h (teto do próprio Supabase)
--  AC-02 · tela de definir senha que funciona em QUALQUER navegador,
--          inclusive quando o e-mail é aberto em outro aparelho
--
-- ⚠️  FAÇA BACKUP ANTES. Sugestão:
--     Supabase → Database → Backups → "Create backup" e espere concluir.
--
-- É uma migração ADITIVA: cria uma tabela nova e amplia um CHECK
-- existente. Não apaga dado, não altera policy de outra tabela.
-- Rodar duas vezes é seguro.
-- =============================================================

begin;

-- -------------------------------------------------------------
-- 1) LINKS DE ACESSO
--
--    Uma linha por link de "criar/redefinir senha" que a gente
--    manda por e-mail. Substitui o link de recuperação do Supabase,
--    que morre em 24h e não podia ser esticado: 86400s é o teto do
--    serviço, e um comprador que abre o e-mail no dia seguinte
--    perdia o acesso.
--
--    O token NUNCA é guardado aqui: só o SHA-256 dele. Um vazamento
--    desta tabela (dump, backup, print do painel) não devolve nenhum
--    link utilizável — exatamente como uma tabela de senhas.
--
--    Uso único: `usado_em` é preenchido num UPDATE condicional, então
--    dois cliques simultâneos no mesmo link só deixam um passar.
-- -------------------------------------------------------------
create table if not exists public.access_links (
  id          bigserial   primary key,
  token_hash  text        not null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  email       text        not null,
  finalidade  text        not null check (finalidade in ('acesso', 'recuperacao')),
  expira_em   timestamptz not null,
  usado_em    timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists access_links_token_uk
  on public.access_links (token_hash);

create index if not exists access_links_user_idx
  on public.access_links (user_id, created_at desc);

-- Para a limpeza dos vencidos (ver item 3).
create index if not exists access_links_expira_idx
  on public.access_links (expira_em);

-- RLS ligada e NENHUMA policy: ninguém que chegue pela chave pública
-- lê ou escreve aqui. Só o service role, que roda no servidor e
-- ignora RLS por definição.
alter table public.access_links enable row level security;

-- Cinto e suspensório: mesmo sem policy, tira o privilégio de tabela
-- dos papéis que o navegador consegue assumir.
revoke all on public.access_links from anon, authenticated;
revoke all on sequence public.access_links_id_seq from anon, authenticated;

comment on table public.access_links is
  'Links de definição de senha enviados por e-mail. Guarda o SHA-256 do token, nunca o token.';

-- -------------------------------------------------------------
-- 2) E-MAIL DE RECUPERAÇÃO ENTRA NO REGISTRO DE ENVIOS
--
--    O "esqueci minha senha" passa a sair pelo nosso remetente
--    (Resend, template em português) em vez do template padrão do
--    Supabase, em inglês. Para aparecer em /admin junto dos outros,
--    o tipo precisa ser aceito pelo CHECK.
-- -------------------------------------------------------------
alter table public.email_sends
  drop constraint if exists email_sends_tipo_check;

alter table public.email_sends
  add constraint email_sends_tipo_check
  check (tipo in ('acesso', 'bonus', 'teste', 'recuperacao'));

-- -------------------------------------------------------------
-- 3) LIMPEZA DOS LINKS VENCIDOS
--
--    Link vencido não serve para nada e não precisa ficar guardado.
--    Chamada sob demanda (a criação de um link novo aproveita e
--    limpa); não depende de cron, que o plano Free não tem.
-- -------------------------------------------------------------
create or replace function public.limpar_links_acesso_vencidos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removidos integer;
begin
  delete from public.access_links
   where expira_em < now() - interval '7 days'
      or (usado_em is not null and usado_em < now() - interval '7 days');
  get diagnostics removidos = row_count;
  return removidos;
end;
$$;

revoke all on function public.limpar_links_acesso_vencidos() from public, anon, authenticated;

commit;
