-- =============================================================
-- 04 — LIMPEZA DOS DADOS DE TESTE
--
-- 🚨 ESTE É O ÚNICO SCRIPT DESTRUTIVO DO PACOTE. 🚨
--
-- REGRA: rode a FASE 1 e a FASE 2. Leia o resultado. Só depois
--        descomente a FASE 4. Nada apaga sozinho.
--
-- ORDEM OBRIGATÓRIA:
--   FASE 0 — backup (manual, no painel)
--   FASE 1 — cópia de segurança das linhas em tabela paralela
--   FASE 2 — PREVIEW: veja exatamente o que será apagado
--   FASE 3 — marcar como teste (reversível, recomendado)
--   FASE 4 — DELETE de verdade (irreversível, comentado)
-- =============================================================


-- =============================================================
-- FASE 0 — BACKUP  (faça ANTES de qualquer coisa)
-- =============================================================
-- No painel: Supabase → Database → Backups → "Create backup"
-- Ou pelo terminal, com o banco parado de receber escrita:
--   supabase db dump --db-url "$DATABASE_URL" -f backup-pre-limpeza.sql
--
-- Confirme que o arquivo tem tamanho > 0 antes de seguir.
-- Sem backup confirmado, PARE AQUI.


-- =============================================================
-- FASE 1 — CÓPIA DE SEGURANÇA DENTRO DO PRÓPRIO BANCO
-- Cria tabelas *_backup_teste com as linhas candidatas.
-- Não apaga nada. Serve de rede se você apagar algo errado.
-- =============================================================
begin;

create table if not exists public.sales_backup_teste as
select *, now() as _copiado_em from public.sales where false;

create table if not exists public.users_profile_backup_teste as
select *, now() as _copiado_em from public.users_profile where false;

-- Define o critério UMA vez, em uma view, para preview e delete
-- usarem exatamente a mesma regra.
create or replace view public._alunos_de_teste as
select p.user_id, p.email, p.name, p.created_at
from public.users_profile p
where p.is_admin = false
  and (
       p.email ilike '%+teste%'    or p.email ilike '%+test%'
    or p.email ilike '%@teste.%'   or p.email ilike '%@test.%'
    or p.email ilike '%example.com'
    or p.email ilike '%mailinator%' or p.email ilike '%yopmail%'
    or p.name  ilike '%cliente teste%'
    or p.name  ilike '%john doe%'
    or p.name  ilike 'teste%'
  );

create or replace view public._vendas_de_teste as
select s.*
from public.sales s
where s.is_test = true
   or s.user_id in (select user_id from public._alunos_de_teste)
   or s.email ilike '%+teste%' or s.email ilike '%+test%'
   or s.email ilike '%example.com'
   or s.name  ilike '%cliente teste%' or s.name ilike '%john doe%'
   or s.created_at > now();   -- as transações datadas de 2026

commit;


-- =============================================================
-- FASE 2 — PREVIEW  ⬅️ LEIA COM ATENÇÃO ANTES DE SEGUIR
-- Somente leitura. Confira NOME POR NOME.
-- Se aparecer UM cliente real nesta lista, ajuste o critério
-- da FASE 1 antes de continuar.
-- =============================================================

-- 2a) Alunos que seriam apagados
select * from public._alunos_de_teste order by created_at desc;

-- 2b) Vendas que seriam apagadas e quanto isso muda o faturamento
select count(*) as vendas_a_remover,
       sum(amount_cents)/100.0 as valor_a_remover_reais
from public._vendas_de_teste;

select * from public._vendas_de_teste order by created_at desc;

-- 2c) Faturamento ANTES x DEPOIS (é este número que você anuncia)
select
  (select sum(amount_cents)/100.0 from public.sales
    where status = 'approved')                              as receita_hoje,
  (select sum(amount_cents)/100.0 from public.sales
    where status = 'approved'
      and id not in (select id from public._vendas_de_teste)) as receita_apos_limpeza;

-- 2d) O que mais será removido em cascata ao apagar esses alunos
select 'entitlements' as tabela, count(*) from public.user_entitlements
  where user_id in (select user_id from public._alunos_de_teste)
union all
select 'progresso',     count(*) from public.user_progress
  where user_id in (select user_id from public._alunos_de_teste)
union all
select 'fits',          count(*) from public.community_fits
  where user_id in (select user_id from public._alunos_de_teste)
union all
select 'conversas_ia',  count(*) from public.fit_check_conversations
  where user_id in (select user_id from public._alunos_de_teste)
union all
select 'creditos_ia',   count(*) from public.fit_check_credits
  where user_id in (select user_id from public._alunos_de_teste);


-- =============================================================
-- FASE 3 — MARCAR EM VEZ DE APAGAR  ✅ RECOMENDADO
-- Reversível. Tira o dado de teste de toda métrica sem perder
-- o histórico. Faça isto AGORA e deixe a FASE 4 para depois.
-- =============================================================
begin;

update public.sales
   set is_test = true
 where id in (select id from public._vendas_de_teste)
   and is_test = false;

update public.users_profile
   set is_test = true
 where user_id in (select user_id from public._alunos_de_teste)
   and is_test = false;

commit;

-- Confira o resultado:
select count(*) filter (where is_test) as marcadas_teste,
       count(*) filter (where not is_test) as reais
from public.sales;

-- ⚠️ Depois desta fase, o código do admin precisa filtrar
--    `is_test = false` em TODA métrica de receita. O
--    src/lib/admin/metrics.ts já faz isso para sales.
--    Falta aplicar o mesmo filtro em users_profile.


-- =============================================================
-- FASE 4 — DELETE DEFINITIVO  🚨 IRREVERSÍVEL 🚨
--
-- Está TUDO COMENTADO de propósito.
-- Só descomente depois de:
--   [ ] backup da FASE 0 confirmado e baixado
--   [ ] preview da FASE 2 conferido linha por linha
--   [ ] nenhum cliente real na lista
--
-- Apagar o usuário do auth.users derruba em cascata:
-- perfil, entitlements, progresso, fits, conversas e créditos.
-- =============================================================

-- begin;
--
-- -- guarda as linhas antes de sumir
-- insert into public.sales_backup_teste
--   select s.*, now() from public.sales s
--    where s.id in (select id from public._vendas_de_teste);
--
-- insert into public.users_profile_backup_teste
--   select p.*, now() from public.users_profile p
--    where p.user_id in (select user_id from public._alunos_de_teste);
--
-- -- 1. vendas de teste
-- delete from public.sales
--  where id in (select id from public._vendas_de_teste);
--
-- -- 2. contas de teste (cascata cuida do resto)
-- delete from auth.users
--  where id in (select user_id from public._alunos_de_teste);
--
-- -- CONFIRA o resultado ANTES do commit:
-- select count(*) from public.sales;
-- select count(*) from public.users_profile;
--
-- -- Se o número bater com o esperado:
-- commit;
-- -- Se NÃO bater:
-- -- rollback;


-- =============================================================
-- LIMPEZA DOS AUXILIARES (só depois de tudo pronto)
-- =============================================================
-- drop view if exists public._vendas_de_teste;
-- drop view if exists public._alunos_de_teste;
-- (mantenha as tabelas *_backup_teste por pelo menos 90 dias)
