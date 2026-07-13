-- =============================================================
-- Fit Check (IA): registro de uso para limite diário por usuário.
-- =============================================================

create table public.fit_check_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('photo', 'text')),
  created_at timestamptz not null default now()
);

alter table public.fit_check_logs enable row level security;

create policy "fit_check: read own or admin" on public.fit_check_logs
  for select using (auth.uid() = user_id or public.is_admin());
create policy "fit_check: insert own" on public.fit_check_logs
  for insert with check (auth.uid() = user_id);

grant select, insert on public.fit_check_logs to authenticated;
grant all on public.fit_check_logs to service_role;

create index fit_check_logs_user_day_idx on public.fit_check_logs (user_id, created_at);
