-- RLS for shopping_list and pantry (apply in Supabase if policies are missing).
-- Safe to re-run: drops named policies first.

alter table public.shopping_list enable row level security;
alter table public.pantry enable row level security;

drop policy if exists "Users read own shopping_list" on public.shopping_list;
drop policy if exists "Users insert own shopping_list" on public.shopping_list;
drop policy if exists "Users update own shopping_list" on public.shopping_list;
drop policy if exists "Users delete own shopping_list" on public.shopping_list;

create policy "Users read own shopping_list"
  on public.shopping_list for select
  using (auth.uid() = user_id);

create policy "Users insert own shopping_list"
  on public.shopping_list for insert
  with check (auth.uid() = user_id);

create policy "Users update own shopping_list"
  on public.shopping_list for update
  using (auth.uid() = user_id);

create policy "Users delete own shopping_list"
  on public.shopping_list for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read own pantry" on public.pantry;
drop policy if exists "Users insert own pantry" on public.pantry;
drop policy if exists "Users update own pantry" on public.pantry;
drop policy if exists "Users delete own pantry" on public.pantry;

create policy "Users read own pantry"
  on public.pantry for select
  using (auth.uid() = user_id);

create policy "Users insert own pantry"
  on public.pantry for insert
  with check (auth.uid() = user_id);

create policy "Users update own pantry"
  on public.pantry for update
  using (auth.uid() = user_id);

create policy "Users delete own pantry"
  on public.pantry for delete
  using (auth.uid() = user_id);