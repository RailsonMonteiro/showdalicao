-- ─── Ranking e Links de Jogo ──────────────────────────────────────────────────
-- Execute no SQL Editor do Supabase (dashboard.supabase.com → SQL Editor).
-- Pode executar múltiplas vezes com segurança.

-- ─── 1. Tabela game_links ─────────────────────────────────────────────────────
create table if not exists public.game_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.game_links enable row level security;

drop policy if exists "game_links_insert_owner" on public.game_links;
drop policy if exists "game_links_select_anon"  on public.game_links;
drop policy if exists "game_links_delete_owner" on public.game_links;

create policy "game_links_insert_owner"
on public.game_links for insert to authenticated
with check (user_id = auth.uid());

create policy "game_links_select_anon"
on public.game_links for select to anon, authenticated
using (true);

create policy "game_links_delete_owner"
on public.game_links for delete to authenticated
using (user_id = auth.uid());


-- ─── 2. Adiciona owner_id na tabela showdalicao existente ─────────────────────
-- A tabela já existe com: id bigint, created_at, name, score
-- Só falta a coluna owner_id para vincular ao professor dono do ranking.

alter table public.showdalicao
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.showdalicao enable row level security;

drop policy if exists "showdalicao_insert_owner" on public.showdalicao;
drop policy if exists "showdalicao_select_owner" on public.showdalicao;
drop policy if exists "showdalicao_delete_owner" on public.showdalicao;

-- Professor logado pode inserir entradas com seu próprio owner_id
create policy "showdalicao_insert_owner"
on public.showdalicao for insert to authenticated
with check (owner_id = auth.uid());

-- Professor logado vê apenas seu próprio ranking
create policy "showdalicao_select_owner"
on public.showdalicao for select to authenticated
using (owner_id = auth.uid());

-- Professor pode apagar seu próprio ranking
create policy "showdalicao_delete_owner"
on public.showdalicao for delete to authenticated
using (owner_id = auth.uid());


-- ─── 3. Função segura para saves anônimos (via link compartilhado) ────────────
create or replace function public.save_game_score(
  p_token  uuid,
  p_name   text,
  p_score  integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_age      interval;
begin
  select user_id, (now() - created_at)
  into   v_owner_id, v_age
  from   public.game_links
  where  id = p_token;

  if v_owner_id is null then
    raise exception 'Token inválido';
  end if;
  if v_age > interval '24 hours' then
    raise exception 'Token expirado';
  end if;

  insert into public.showdalicao (name, score, owner_id, created_at)
  values (trim(p_name), p_score, v_owner_id, now());
end;
$$;

grant execute on function public.save_game_score(uuid, text, integer) to anon;
grant execute on function public.save_game_score(uuid, text, integer) to authenticated;
