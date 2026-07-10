drop function if exists public.create_game_session(text, text, integer, text);
drop function if exists public.looty_active_session(text);
drop function if exists public.looty_hash_launch_token(text);

alter table public.game_sessions
  rename column launch_token_hash to launch_code_hash;

alter table public.game_sessions
  add column launch_code_expires_at timestamptz,
  add column launch_code_used_at timestamptz,
  add column gateway_token_hash text,
  add column gateway_token_expires_at timestamptz,
  add column gateway_token_scopes text[] not null default array['balance', 'bet', 'payout', 'refund', 'close-round']::text[],
  add column wallet_mode text not null default 'demo';

update public.game_sessions
set
  status = case when status = 'active' then 'revoked' else status end,
  closed_at = case when status = 'active' then coalesce(closed_at, now()) else closed_at end,
  launch_code_expires_at = least(expires_at, now()),
  launch_code_used_at = coalesce(launch_code_used_at, now());

alter table public.game_sessions
  alter column launch_code_expires_at set not null,
  add constraint game_sessions_wallet_mode_check
    check (wallet_mode in ('demo', 'platform', 'external')),
  add constraint game_sessions_gateway_token_pair_check
    check ((gateway_token_hash is null) = (gateway_token_expires_at is null)),
  add constraint game_sessions_gateway_token_scopes_check
    check (cardinality(gateway_token_scopes) > 0);

create unique index game_sessions_gateway_token_hash_key
  on public.game_sessions (gateway_token_hash)
  where gateway_token_hash is not null;

create or replace function public.looty_hash_secret(p_secret text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select case
    when p_secret is null or btrim(p_secret) = '' then null
    else encode(digest(p_secret, 'sha256'), 'hex')
  end;
$$;

create or replace function public.create_game_session(
  p_game_slug text,
  p_currency text default 'POINT',
  p_expires_in_seconds integer default 3600,
  p_display_name text default null,
  p_auth_user_id uuid default null
)
returns table (
  session_id uuid,
  player_account_id uuid,
  wallet_account_id uuid,
  game_id uuid,
  launch_code text,
  launch_code_expires_at timestamptz,
  account_type text,
  currency text,
  wallet_mode text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_account_type text := 'guest';
  v_currency text := upper(btrim(coalesce(p_currency, 'POINT')));
  v_expires_in_seconds integer := coalesce(p_expires_in_seconds, 3600);
  v_game_id uuid;
  v_player_account_id uuid;
  v_player_status text;
  v_wallet_account_id uuid;
  v_launch_code text;
  v_launch_code_hash text;
  v_launch_code_expires_at timestamptz;
  v_session_id uuid;
  v_expires_at timestamptz;
begin
  if p_game_slug is null or btrim(p_game_slug) = '' then
    raise exception 'game slug is required' using errcode = '22023';
  end if;

  if v_currency = '' then
    raise exception 'currency is required' using errcode = '22023';
  end if;

  if v_expires_in_seconds < 60 or v_expires_in_seconds > 86400 then
    raise exception 'expires_in_seconds must be between 60 and 86400' using errcode = '22023';
  end if;

  select g.id
  into v_game_id
  from public.games g
  where g.slug = btrim(p_game_slug)
    and g.published = true
    and g.launch_url is not null
    and btrim(g.launch_url) <> ''
  limit 1;

  if v_game_id is null then
    raise exception 'game is not available' using errcode = 'P0002';
  end if;

  if p_auth_user_id is not null then
    v_account_type := 'registered';

    insert into public.player_accounts (
      auth_user_id,
      account_type,
      display_name
    )
    values (
      p_auth_user_id,
      'registered',
      nullif(btrim(p_display_name), '')
    )
    on conflict (auth_user_id) where auth_user_id is not null
    do update set
      account_type = 'registered',
      display_name = coalesce(public.player_accounts.display_name, excluded.display_name),
      upgraded_at = coalesce(public.player_accounts.upgraded_at, now())
    returning id, status
    into v_player_account_id, v_player_status;
  else
    insert into public.player_accounts (
      account_type,
      display_name
    )
    values (
      'guest',
      nullif(btrim(p_display_name), '')
    )
    returning id, status
    into v_player_account_id, v_player_status;
  end if;

  if v_player_status <> 'active' then
    raise exception 'player account is not active' using errcode = 'P0001';
  end if;

  insert into public.wallet_accounts (
    player_account_id,
    currency
  )
  values (
    v_player_account_id,
    v_currency
  )
  on conflict (player_account_id, currency) where status = 'active'
  do update set
    updated_at = now()
  returning id
  into v_wallet_account_id;

  v_launch_code := encode(gen_random_bytes(32), 'hex');
  v_launch_code_hash := public.looty_hash_secret(v_launch_code);
  v_expires_at := now() + (v_expires_in_seconds * interval '1 second');
  v_launch_code_expires_at := least(v_expires_at, now() + interval '2 minutes');

  insert into public.game_sessions (
    player_account_id,
    wallet_account_id,
    game_id,
    launch_code_hash,
    launch_code_expires_at,
    account_type,
    currency,
    wallet_mode,
    expires_at
  )
  values (
    v_player_account_id,
    v_wallet_account_id,
    v_game_id,
    v_launch_code_hash,
    v_launch_code_expires_at,
    v_account_type,
    v_currency,
    'demo',
    v_expires_at
  )
  returning id
  into v_session_id;

  return query
  select
    v_session_id,
    v_player_account_id,
    v_wallet_account_id,
    v_game_id,
    v_launch_code,
    v_launch_code_expires_at,
    v_account_type,
    v_currency,
    'demo'::text,
    v_expires_at;
end;
$$;

create or replace function public.exchange_game_launch_code(
  p_launch_code text,
  p_gateway_expires_in_seconds integer default 3600
)
returns table (
  session_id uuid,
  player_account_id uuid,
  wallet_account_id uuid,
  game_id uuid,
  gateway_token text,
  gateway_token_expires_at timestamptz,
  gateway_token_scopes text[],
  account_type text,
  currency text,
  wallet_mode text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_session record;
  v_gateway_expires_in_seconds integer := coalesce(p_gateway_expires_in_seconds, 3600);
  v_gateway_token text;
  v_gateway_token_hash text;
  v_gateway_token_expires_at timestamptz;
begin
  if p_launch_code is null or btrim(p_launch_code) = '' then
    raise exception 'launch_code is required' using errcode = '22023';
  end if;

  if v_gateway_expires_in_seconds < 300 or v_gateway_expires_in_seconds > 86400 then
    raise exception 'gateway token expiry must be between 300 and 86400' using errcode = '22023';
  end if;

  select
    gs.id,
    gs.player_account_id,
    gs.wallet_account_id,
    gs.game_id,
    gs.gateway_token_scopes,
    gs.account_type,
    gs.currency,
    gs.wallet_mode,
    gs.expires_at
  into v_session
  from public.game_sessions gs
  join public.player_accounts pa on pa.id = gs.player_account_id
  join public.wallet_accounts wa on wa.id = gs.wallet_account_id
  where gs.launch_code_hash = public.looty_hash_secret(p_launch_code)
    and gs.launch_code_used_at is null
    and gs.launch_code_expires_at > now()
    and gs.status = 'active'
    and gs.expires_at > now()
    and pa.status = 'active'
    and wa.status = 'active'
  for update of gs;

  if v_session.id is null then
    raise exception 'launch code is invalid or expired' using errcode = 'P0002';
  end if;

  v_gateway_token := encode(gen_random_bytes(32), 'hex');
  v_gateway_token_hash := public.looty_hash_secret(v_gateway_token);
  v_gateway_token_expires_at := least(
    v_session.expires_at,
    now() + (v_gateway_expires_in_seconds * interval '1 second')
  );

  update public.game_sessions
  set
    launch_code_used_at = now(),
    gateway_token_hash = v_gateway_token_hash,
    gateway_token_expires_at = v_gateway_token_expires_at
  where id = v_session.id;

  return query
  select
    v_session.id,
    v_session.player_account_id,
    v_session.wallet_account_id,
    v_session.game_id,
    v_gateway_token,
    v_gateway_token_expires_at,
    v_session.gateway_token_scopes,
    v_session.account_type,
    v_session.currency,
    v_session.wallet_mode,
    v_session.expires_at;
end;
$$;

create or replace function public.looty_active_session(
  p_gateway_token text,
  p_required_scope text default null
)
returns table (
  session_id uuid,
  player_account_id uuid,
  wallet_account_id uuid,
  game_id uuid,
  account_type text,
  currency text,
  wallet_mode text,
  gateway_token_scopes text[]
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    gs.id,
    gs.player_account_id,
    gs.wallet_account_id,
    gs.game_id,
    gs.account_type,
    gs.currency,
    gs.wallet_mode,
    gs.gateway_token_scopes
  from public.game_sessions gs
  join public.player_accounts pa on pa.id = gs.player_account_id
  join public.wallet_accounts wa on wa.id = gs.wallet_account_id
  where gs.gateway_token_hash = public.looty_hash_secret(p_gateway_token)
    and gs.gateway_token_expires_at > now()
    and gs.status = 'active'
    and gs.expires_at > now()
    and pa.status = 'active'
    and wa.status = 'active'
    and (
      p_required_scope is null
      or p_required_scope = any(gs.gateway_token_scopes)
    );
$$;

revoke all on table public.player_accounts from public, anon, authenticated;
revoke all on table public.wallet_accounts from public, anon, authenticated;
revoke all on table public.wallet_transactions from public, anon, authenticated;
revoke all on table public.game_sessions from public, anon, authenticated;
revoke all on table public.game_rounds from public, anon, authenticated;

grant all on table public.player_accounts to service_role;
grant all on table public.wallet_accounts to service_role;
grant all on table public.wallet_transactions to service_role;
grant all on table public.game_sessions to service_role;
grant all on table public.game_rounds to service_role;

revoke all on function public.looty_hash_secret(text) from public, anon, authenticated, service_role;
revoke all on function public.looty_active_session(text, text) from public, anon, authenticated, service_role;
revoke all on function public.create_game_session(text, text, integer, text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.exchange_game_launch_code(text, integer) from public, anon, authenticated, service_role;

grant execute on function public.create_game_session(text, text, integer, text, uuid) to service_role;
grant execute on function public.exchange_game_launch_code(text, integer) to service_role;
