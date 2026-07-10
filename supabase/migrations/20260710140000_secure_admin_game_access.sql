create or replace function public.is_looty_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_looty_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_looty_admin() to authenticated, service_role;

alter table public.admin_users enable row level security;

drop policy if exists admin_users_read on public.admin_users;
drop policy if exists admin_users_self_read on public.admin_users;

create policy admin_users_self_read
on public.admin_users
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

revoke all on table public.admin_users from public, anon, authenticated;
grant all on table public.admin_users to service_role;

alter table public.games enable row level security;

drop policy if exists "admins manage games" on public.games;
drop policy if exists "public can read published games" on public.games;
drop policy if exists public_read_published_games on public.games;
drop policy if exists games_admin_select on public.games;
drop policy if exists games_admin_insert on public.games;
drop policy if exists games_admin_update on public.games;
drop policy if exists games_admin_delete on public.games;

create policy games_admin_select
on public.games
for select
to authenticated
using (public.is_looty_admin());

create policy games_admin_insert
on public.games
for insert
to authenticated
with check (public.is_looty_admin());

create policy games_admin_update
on public.games
for update
to authenticated
using (public.is_looty_admin())
with check (public.is_looty_admin());

create policy games_admin_delete
on public.games
for delete
to authenticated
using (public.is_looty_admin());

revoke all on table public.games from public, anon, authenticated;
grant select, insert, update, delete on table public.games to authenticated;
grant all on table public.games to service_role;

create or replace function public.looty_public_games_v1()
returns table (
  id uuid,
  slug text,
  name text,
  type text,
  supports_live boolean,
  thumbnail text,
  created_at timestamptz,
  launch_url text,
  sort_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.slug,
    g.name,
    g.type,
    g.supports_live,
    g.thumbnail,
    g.created_at,
    g.launch_url,
    g.sort_order
  from public.games g
  where g.published = true
    and g.launch_url is not null
    and btrim(g.launch_url) <> ''
  order by g.sort_order, g.created_at desc;
$$;

revoke all on function public.looty_public_games_v1() from public, anon, authenticated, service_role;
grant execute on function public.looty_public_games_v1() to anon, authenticated, service_role;

create or replace view public.public_games_v1
with (security_invoker = true, security_barrier = true)
as
select *
from public.looty_public_games_v1();

revoke all on table public.public_games_v1 from public, anon, authenticated, service_role;
grant select on table public.public_games_v1 to anon, authenticated, service_role;
