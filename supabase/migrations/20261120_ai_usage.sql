-- Daily AI usage caps (receipt parse-receipt). Apply in Supabase SQL editor if not run yet.
-- Users may read their own rows; writes are service-role only (Edge Function).

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count int not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

drop policy if exists "Users read own ai_usage" on public.ai_usage;

create policy "Users read own ai_usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);