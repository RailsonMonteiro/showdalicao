-- Estrutura mínima para o login.html conversar com o Supabase.
-- Execute no SQL Editor do Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  igreja text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ranking (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  pontuacao integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, igreja)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', 'Sem nome'),
    coalesce(new.raw_user_meta_data ->> 'igreja', 'Sem igreja')
  )
  on conflict (id) do update
    set nome = excluded.nome,
        igreja = excluded.igreja,
        updated_at = now();

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_ranking_updated_at on public.ranking;
create trigger set_ranking_updated_at
before update on public.ranking
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.ranking enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "ranking_select_authenticated" on public.ranking;
create policy "ranking_select_authenticated"
on public.ranking
for select
to authenticated
using (true);

drop policy if exists "ranking_insert_own" on public.ranking;
create policy "ranking_insert_own"
on public.ranking
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ranking_update_own" on public.ranking;
create policy "ranking_update_own"
on public.ranking
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);