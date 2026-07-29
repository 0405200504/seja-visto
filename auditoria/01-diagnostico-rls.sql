-- =============================================================
-- 01 — DIAGNÓSTICO DE RLS E PERMISSÕES
-- Rode no SQL Editor do Supabase. É 100% SOMENTE LEITURA.
-- Nada aqui altera, apaga ou bloqueia dado nenhum.
-- =============================================================

-- -------------------------------------------------------------
-- A) Toda tabela do schema public e se a RLS está LIGADA.
--    Esperado: rls_habilitada = true em TODAS as linhas.
--    Qualquer "false" com dado de aluno = CRÍTICO.
-- -------------------------------------------------------------
select
  c.relname                         as tabela,
  c.relrowsecurity                  as rls_habilitada,
  c.relforcerowsecurity             as rls_forcada,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as qtd_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity asc, c.relname;

-- -------------------------------------------------------------
-- B) Todas as policies, com a expressão completa.
--    Procure por: qual = 'true' ou with_check nulo em tabelas
--    de perfil, vendas, acessos, tokens, progresso e conversas.
-- -------------------------------------------------------------
select
  tablename                as tabela,
  policyname               as policy,
  cmd                      as comando,
  roles                    as papeis,
  qual                     as using_expr,
  with_check               as with_check_expr
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- -------------------------------------------------------------
-- C) Policies de UPDATE SEM with_check.
--    Sem with_check o usuário pode reescrever a linha para
--    pertencer a outra pessoa. Resultado esperado: 0 linhas.
-- -------------------------------------------------------------
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
  and cmd in ('UPDATE', 'ALL')
  and with_check is null;

-- -------------------------------------------------------------
-- D) Policies abertas para anon (visitante sem login).
--    Resultado esperado: 0 linhas.
-- -------------------------------------------------------------
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
  and ('anon' = any(roles) or 'public' = any(roles));

-- -------------------------------------------------------------
-- E) Tabelas com GRANT direto para anon (fura RLS via PostgREST
--    se a policy for permissiva). Esperado: 0 linhas.
-- -------------------------------------------------------------
select table_name, grantee, string_agg(privilege_type, ', ') as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'PUBLIC')
group by table_name, grantee
order by table_name;

-- -------------------------------------------------------------
-- F) Funções SECURITY DEFINER (rodam como dono, ignoram RLS).
--    Confira que cada uma tem "set search_path" e que o EXECUTE
--    não está concedido para anon/public.
-- -------------------------------------------------------------
select
  p.proname                                       as funcao,
  pg_get_function_identity_arguments(p.oid)       as argumentos,
  p.prosecdef                                     as security_definer,
  p.proconfig                                     as config_search_path,
  array(select unnest(p.proacl)::text)            as permissoes
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname;

-- -------------------------------------------------------------
-- G) Views expostas na API. View comum roda com os direitos de
--    quem a criou e NÃO aplica RLS das tabelas de origem.
--    Qualquer view aqui que junte e-mail, venda ou token
--    precisa virar "security_invoker = true".
-- -------------------------------------------------------------
select
  c.relname as view_name,
  case when c.reloptions::text like '%security_invoker=true%'
       then 'OK (invoker)' else 'ATENCAO (definer)' end as modo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm');

-- -------------------------------------------------------------
-- H) STORAGE — buckets públicos.
--    "public = true" significa que QUALQUER pessoa na internet
--    com a URL baixa o arquivo, SEM login e SEM passar por RLS.
--    O bucket "fits" (fotos dos alunos) NÃO pode ser público.
-- -------------------------------------------------------------
select id, name, public as e_publico, file_size_limit, allowed_mime_types
from storage.buckets
order by public desc, id;

-- Policies do storage
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- -------------------------------------------------------------
-- I) Confirma se as migrations locais realmente rodaram na nuvem.
--    Compare a lista com supabase/migrations/ no repositório.
-- -------------------------------------------------------------
select version, name from supabase_migrations.schema_migrations order by version;
