-- =============================================================
-- Fit Check (IA): conversas persistidas (histórico de 5 por usuário).
-- A foto é guardada só como miniatura (thumb) para não pesar no banco.
-- =============================================================

create table public.fit_check_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Fit check',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fit_check_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.fit_check_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  thumb text,
  created_at timestamptz not null default now()
);

alter table public.fit_check_conversations enable row level security;
alter table public.fit_check_messages enable row level security;

create policy "fit_check_conv: own" on public.fit_check_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fit_check_msg: own" on public.fit_check_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.fit_check_conversations to authenticated;
grant select, insert, update, delete on public.fit_check_messages to authenticated;
grant all on public.fit_check_conversations to service_role;
grant all on public.fit_check_messages to service_role;

create index fit_check_conversations_user_idx
  on public.fit_check_conversations (user_id, updated_at desc);
create index fit_check_messages_conv_idx
  on public.fit_check_messages (conversation_id, created_at);
