-- =============================================================
-- Migração 00014: Colunas de controle de tokens para logs de IA
-- =============================================================

alter table public.fit_check_logs add column if not exists prompt_tokens integer default 0;
alter table public.fit_check_logs add column if not exists completion_tokens integer default 0;
alter table public.fit_check_logs add column if not exists total_tokens integer default 0;
