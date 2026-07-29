-- =============================================================
-- 02 — DIAGNÓSTICO DE INTEGRIDADE DE DADOS
-- Rode no SQL Editor do Supabase. É 100% SOMENTE LEITURA.
-- Nenhum comando aqui altera, apaga ou trunca nada.
-- Cada bloco devolve as linhas problemáticas. Zero linhas = OK.
-- =============================================================

-- -------------------------------------------------------------
-- 1) E-MAILS DUPLICADOS (ignorando maiúsculas e alias +tag)
--    joao+teste@x.com e Joao@x.com contam como o mesmo e-mail.
-- -------------------------------------------------------------
with normalizado as (
  select
    user_id,
    email,
    lower(split_part(email, '@', 1)) as parte_local,
    regexp_replace(lower(email), '\+[^@]*@', '@') as email_norm
  from public.users_profile
  where email is not null
)
select email_norm, count(*) as qtd, array_agg(email) as variacoes, array_agg(user_id) as usuarios
from normalizado
group by email_norm
having count(*) > 1;

-- -------------------------------------------------------------
-- 2) CONTAS ÓRFÃS nos dois sentidos
-- -------------------------------------------------------------
-- 2a) Existe em auth.users mas NÃO tem perfil (trigger falhou)
select u.id, u.email, u.created_at
from auth.users u
left join public.users_profile p on p.user_id = u.id
where p.user_id is null;

-- 2b) Existe perfil apontando para usuário que não existe mais
select p.user_id, p.email, p.created_at
from public.users_profile p
left join auth.users u on u.id = p.user_id
where u.id is null;

-- 2c) E-mail do perfil divergente do e-mail real do Auth
select p.user_id, p.email as email_perfil, u.email as email_auth
from public.users_profile p
join auth.users u on u.id = p.user_id
where lower(coalesce(p.email, '')) is distinct from lower(coalesce(u.email, ''));

-- -------------------------------------------------------------
-- 3) TRANSAÇÕES ÓRFÃS (venda sem aluno correspondente)
-- -------------------------------------------------------------
select s.id, s.email, s.amount_cents, s.status, s.created_at
from public.sales s
left join auth.users u on u.id = s.user_id
where s.user_id is null or u.id is null
order by s.created_at desc;

-- -------------------------------------------------------------
-- 4) TRANSAÇÕES DUPLICADAS — webhook reenviado pela Cakto.
--    Esta é a causa provável das duplicatas que você já viu.
-- -------------------------------------------------------------
select cakto_id, count(*) as qtd, sum(amount_cents)/100.0 as total_reais,
       array_agg(id) as ids, min(created_at) as primeira, max(created_at) as ultima
from public.sales
where cakto_id is not null and cakto_id <> ''
group by cakto_id
having count(*) > 1
order by qtd desc;

-- Duplicata "por semelhança" (mesmo e-mail, mesmo valor, poucos minutos)
select a.id, b.id as id_duplicado, a.email, a.amount_cents/100.0 as valor, a.created_at, b.created_at
from public.sales a
join public.sales b
  on a.email = b.email and a.amount_cents = b.amount_cents
 and a.id < b.id
 and abs(extract(epoch from (a.created_at - b.created_at))) < 600
order by a.created_at desc;

-- -------------------------------------------------------------
-- 5) ACESSOS (entitlements)
-- -------------------------------------------------------------
-- 5a) Duplicados para o mesmo aluno + produto
--     (não deve retornar nada — existe UNIQUE, é uma confirmação)
select user_id, entitlement, count(*)
from public.user_entitlements
group by user_id, entitlement having count(*) > 1;

-- 5b) Acesso apontando para chave de produto/bônus que não existe mais.
--     AJUSTE a lista abaixo com as chaves válidas de src/lib/bonuses.ts
select entitlement, count(*) as qtd, array_agg(distinct user_id) as usuarios
from public.user_entitlements
where entitlement not in (
  'base','economize-58',
  'guarda-roupa-funcional','grupo-whatsapp'
  -- ... complete com as 10 chaves de BONUSES
)
and entitlement !~ '^tokens[-:_]?[0-9]+$'
group by entitlement;

-- 5c) Aluno com acesso liberado mas SEM nenhuma venda registrada
--     (liberação manual legítima OU acesso indevido — confira um a um)
select p.email, e.entitlement, e.source, e.created_at
from public.user_entitlements e
join public.users_profile p on p.user_id = e.user_id
where e.entitlement = 'base'
  and not exists (
    select 1 from public.sales s
    where s.user_id = e.user_id and s.status = 'approved'
  )
order by e.created_at desc;

-- 5d) Aluno que pediu REEMBOLSO mas continua com acesso ativo.
--     ⚠️ Cada linha aqui é dinheiro devolvido com produto entregue.
select p.email, s.amount_cents/100.0 as valor_devolvido, s.refunded_at,
       array_agg(e.entitlement) as ainda_tem_acesso
from public.sales s
join public.users_profile p on p.user_id = s.user_id
join public.user_entitlements e on e.user_id = s.user_id
where s.status in ('refunded', 'chargeback')
group by p.email, s.amount_cents, s.refunded_at
order by s.refunded_at desc;

-- 5e) Acessos com prazo JÁ VENCIDO (deveriam estar bloqueados)
select p.email, e.entitlement, e.expires_at,
       (now()::date - e.expires_at::date) as dias_vencido
from public.user_entitlements e
join public.users_profile p on p.user_id = e.user_id
where e.expires_at is not null and e.expires_at < now()
order by e.expires_at;

-- -------------------------------------------------------------
-- 6) PROGRESSO apontando para aula excluída
-- -------------------------------------------------------------
select pr.id, pr.user_id, pr.lesson_id
from public.user_progress pr
left join public.lessons l on l.id = pr.lesson_id
where pr.lesson_id is not null and (l.id is null or l.deleted_at is not null);

-- -------------------------------------------------------------
-- 7) CONTEÚDO COM PROBLEMA
-- -------------------------------------------------------------
-- 7a) Looks sem imagem ou sem campo obrigatório
select id, title,
       case when image_url is null or image_url = '' then 'sem imagem' end as p1,
       case when title is null or trim(title) = ''   then 'sem título' end as p2,
       case when pieces = '[]'::jsonb                then 'sem peças'  end as p3
from public.looks
where deleted_at is null
  and (image_url is null or image_url = ''
       or title is null or trim(title) = ''
       or pieces = '[]'::jsonb);

-- 7b) Ordem duplicada dentro do mesmo módulo (aulas fora de ordem)
select module_id, order_index, count(*) as qtd, array_agg(title) as aulas
from public.lessons
where deleted_at is null
group by module_id, order_index having count(*) > 1;

-- 7c) Módulos com ordem duplicada
select order_index, count(*), array_agg(title)
from public.modules where deleted_at is null
group by order_index having count(*) > 1;

-- 7d) Aulas órfãs (módulo apagado)
select l.id, l.title from public.lessons l
left join public.modules m on m.id = l.module_id
where m.id is null or (m.deleted_at is not null and l.deleted_at is null);

-- -------------------------------------------------------------
-- 8) DATAS INCOERENTES / NO FUTURO
--    Você mencionou registros datados de 2026.
-- -------------------------------------------------------------
select 'sales' as tabela, id::text, created_at from public.sales where created_at > now()
union all
select 'users_profile', user_id::text, created_at from public.users_profile where created_at > now()
union all
select 'user_entitlements', id::text, created_at from public.user_entitlements where created_at > now()
union all
select 'community_fits', id::text, created_at from public.community_fits where created_at > now()
union all
select 'fit_check_logs', id::text, created_at from public.fit_check_logs where created_at > now()
order by created_at desc;

-- Venda registrada ANTES do cadastro do próprio aluno (impossível)
select s.id, s.email, s.created_at as venda, p.created_at as cadastro
from public.sales s join public.users_profile p on p.user_id = s.user_id
where s.created_at < p.created_at - interval '1 minute';

-- -------------------------------------------------------------
-- 9) TIPO DAS COLUNAS DE DINHEIRO
--    Esperado: integer (centavos). Se aparecer real/double/float,
--    é ERRO GRAVE de arredondamento contábil.
-- -------------------------------------------------------------
select table_name, column_name, data_type, numeric_precision, numeric_scale
from information_schema.columns
where table_schema = 'public'
  and (column_name ilike '%amount%' or column_name ilike '%price%'
       or column_name ilike '%cents%' or column_name ilike '%fee%'
       or column_name ilike '%valor%')
order by table_name, column_name;

-- Valores monetários impossíveis
select id, email, amount_cents, gateway_fee_cents, status, created_at
from public.sales
where amount_cents < 0 or gateway_fee_cents < 0 or gateway_fee_cents > amount_cents;

-- -------------------------------------------------------------
-- 10) SALDO DE TOKENS
-- -------------------------------------------------------------
-- 10a) Saldo negativo (não deveria existir)
select user_id, balance, expires_at from public.fit_check_credits where balance < 0;

-- 10b) Consumo registrado x saldo — procura divergência grande.
--      Cada foto analisada deveria ter debitado 1 token.
select p.email,
       c.balance                                  as saldo_atual,
       count(l.id) filter (where l.kind = 'photo') as fotos_analisadas,
       c.expires_at
from public.fit_check_credits c
join public.users_profile p on p.user_id = c.user_id
left join public.fit_check_logs l on l.user_id = c.user_id
group by p.email, c.balance, c.expires_at
having count(l.id) filter (where l.kind = 'photo') > 5 + c.balance
order by fotos_analisadas desc;

-- 10c) Custo de IA por aluno (últimos 30 dias) — quem está sangrando margem
select p.email,
       count(*)                as chamadas,
       sum(l.total_tokens)     as tokens_openai,
       round(sum(l.total_tokens) * 0.0000006, 4) as custo_usd_aprox
from public.fit_check_logs l
join public.users_profile p on p.user_id = l.user_id
where l.created_at > now() - interval '30 days'
group by p.email
order by tokens_openai desc nulls last
limit 30;

-- -------------------------------------------------------------
-- 11) REGISTROS DE TESTE AINDA PRESENTES
--     Confira esta lista ANTES de rodar o script 04 de limpeza.
-- -------------------------------------------------------------
select 'perfil' as origem, user_id::text as id, email, name, created_at
from public.users_profile
where email ilike '%+teste%' or email ilike '%+test%'
   or email ilike '%@teste%' or email ilike '%example.com'
   or email ilike '%@test.%' or email ilike '%mailinator%'
   or name ilike '%teste%'   or name ilike '%john doe%'
   or name ilike '%cliente teste%'
union all
select 'venda', id::text, email, name, created_at
from public.sales
where is_test = true
   or email ilike '%+teste%' or email ilike '%+test%'
   or email ilike '%example.com' or email ilike '%@teste%'
   or name ilike '%teste%' or name ilike '%john doe%'
   or cakto_id is null or cakto_id = ''
order by created_at desc;

-- Faturamento REAL vs. faturamento com lixo de teste dentro
select
  count(*) filter (where status = 'approved')                     as vendas_todas,
  sum(amount_cents) filter (where status = 'approved')/100.0      as receita_bruta_todas,
  count(*) filter (where status = 'approved' and is_test = false) as vendas_reais,
  sum(amount_cents) filter (where status = 'approved' and is_test = false)/100.0 as receita_real
from public.sales;

-- -------------------------------------------------------------
-- 12) CONSTRAINTS E ÍNDICES QUE EXISTEM HOJE
--     Use para comparar com o script 03 (migration de correção).
-- -------------------------------------------------------------
select tc.table_name, tc.constraint_name, tc.constraint_type,
       rc.delete_rule as on_delete
from information_schema.table_constraints tc
left join information_schema.referential_constraints rc
       on rc.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.constraint_type in ('FOREIGN KEY', 'UNIQUE', 'CHECK', 'PRIMARY KEY')
order by tc.table_name, tc.constraint_type;

select tablename, indexname, indexdef
from pg_indexes where schemaname = 'public'
order by tablename, indexname;

-- Índices que NUNCA foram usados (candidatos a remoção) e
-- tabelas que estão sofrendo sequential scan (candidatas a índice)
select relname as tabela, seq_scan as varreduras_completas,
       idx_scan as usos_de_indice, n_live_tup as linhas
from pg_stat_user_tables
where schemaname = 'public'
order by seq_scan desc;

-- Tamanho ocupado por tabela (para projeção de custo)
select relname as tabela,
       pg_size_pretty(pg_total_relation_size(relid)) as tamanho_total
from pg_catalog.pg_statio_user_tables
order by pg_total_relation_size(relid) desc;
