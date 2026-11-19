-- Money tasks: source of truth for Tasks list and Money Calendar.
-- Run in Supabase SQL editor if the table does not exist yet.

create table if not exists public.money_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  amount numeric(12, 2),
  due_date date not null,
  type text not null check (type in ('pay', 'save', 'plan')),
  status text not null default 'open' check (status in ('open', 'done')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists money_tasks_user_due_idx
  on public.money_tasks (user_id, due_date);

alter table public.money_tasks enable row level security;

create policy "Users read own money_tasks"
  on public.money_tasks for select
  using (auth.uid() = user_id);

create policy "Users insert own money_tasks"
  on public.money_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users update own money_tasks"
  on public.money_tasks for update
  using (auth.uid() = user_id);

create policy "Users delete own money_tasks"
  on public.money_tasks for delete
  using (auth.uid() = user_id);
