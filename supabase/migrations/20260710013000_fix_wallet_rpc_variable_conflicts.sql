create or replace function public.create_game_session(
  p_game_slug text,
  p_currency text default 'POINT',
  p_expires_in_seconds integer default 3600,
  p_display_name text default null
)
returns table (
  session_id uuid,
  player_account_id uuid,
  wallet_account_id uuid,
  game_id uuid,
  launch_token text,
  account_type text,
  currency text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_auth_user_id uuid := auth.uid();
  v_account_type text := 'guest';
  v_currency text := upper(btrim(coalesce(p_currency, 'POINT')));
  v_expires_in_seconds integer := coalesce(p_expires_in_seconds, 3600);
  v_game_id uuid;
  v_player_account_id uuid;
  v_player_status text;
  v_wallet_account_id uuid;
  v_launch_token text;
  v_launch_token_hash text;
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

  if v_auth_user_id is not null then
    v_account_type := 'registered';

    insert into public.player_accounts (
      auth_user_id,
      account_type,
      display_name
    )
    values (
      v_auth_user_id,
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

  v_launch_token := encode(gen_random_bytes(32), 'hex');
  v_launch_token_hash := public.looty_hash_launch_token(v_launch_token);
  v_expires_at := now() + (v_expires_in_seconds * interval '1 second');

  insert into public.game_sessions (
    player_account_id,
    wallet_account_id,
    game_id,
    launch_token_hash,
    account_type,
    currency,
    expires_at
  )
  values (
    v_player_account_id,
    v_wallet_account_id,
    v_game_id,
    v_launch_token_hash,
    v_account_type,
    v_currency,
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
    v_launch_token,
    v_account_type,
    v_currency,
    v_expires_at;
end;
$$;

create or replace function public.looty_apply_wallet_transaction(
  p_launch_token text,
  p_type text,
  p_round_id text,
  p_amount numeric,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  transaction_id uuid,
  wallet_account_id uuid,
  game_session_id uuid,
  game_id uuid,
  round_id text,
  transaction_type text,
  amount numeric,
  balance_before numeric,
  balance_after numeric,
  currency text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_session record;
  v_wallet record;
  v_existing record;
  v_type text := lower(btrim(coalesce(p_type, '')));
  v_round_id text := nullif(btrim(p_round_id), '');
  v_idempotency_key text := nullif(btrim(p_idempotency_key), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_balance_before numeric(18, 2);
  v_balance_after numeric(18, 2);
  v_transaction_id uuid;
begin
  if v_type not in ('bet', 'payout', 'refund') then
    raise exception 'unsupported wallet transaction type' using errcode = '22023';
  end if;

  if v_round_id is null then
    raise exception 'round_id is required' using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be greater than zero' using errcode = '22023';
  end if;

  if v_idempotency_key is null then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    raise exception 'metadata must be a json object' using errcode = '22023';
  end if;

  select *
  into v_session
  from public.looty_active_session(p_launch_token)
  limit 1;

  if v_session.session_id is null then
    raise exception 'game session is not active' using errcode = 'P0002';
  end if;

  select *
  into v_wallet
  from public.wallet_accounts wa
  where wa.id = v_session.wallet_account_id
    and wa.status = 'active'
  for update;

  if v_wallet.id is null then
    raise exception 'wallet account is not active' using errcode = 'P0002';
  end if;

  select *
  into v_existing
  from public.wallet_transactions wt
  where wt.idempotency_key = v_idempotency_key
  limit 1;

  if v_existing.id is not null then
    if v_existing.wallet_account_id <> v_session.wallet_account_id
      or v_existing.type <> v_type
      or v_existing.amount <> p_amount
      or coalesce(v_existing.round_id, '') <> v_round_id then
      raise exception 'idempotency_key conflicts with another transaction' using errcode = '23505';
    end if;

    return query
    select
      v_existing.id,
      v_existing.wallet_account_id,
      v_session.session_id,
      v_session.game_id,
      v_round_id,
      v_existing.type,
      v_existing.amount,
      v_existing.balance_before,
      v_existing.balance_after,
      v_session.currency;
    return;
  end if;

  v_balance_before := v_wallet.balance;

  if v_type = 'bet' then
    if v_balance_before < p_amount then
      raise exception 'insufficient wallet balance' using errcode = 'P0001';
    end if;

    v_balance_after := v_balance_before - p_amount;
  else
    v_balance_after := v_balance_before + p_amount;
  end if;

  update public.wallet_accounts
  set
    balance = v_balance_after,
    updated_at = now()
  where id = v_session.wallet_account_id;

  insert into public.wallet_transactions (
    wallet_account_id,
    type,
    amount,
    balance_before,
    balance_after,
    game_id,
    round_id,
    idempotency_key,
    metadata
  )
  values (
    v_session.wallet_account_id,
    v_type,
    p_amount,
    v_balance_before,
    v_balance_after,
    v_session.game_id,
    v_round_id,
    v_idempotency_key,
    v_metadata
  )
  returning id
  into v_transaction_id;

  if v_type = 'bet' then
    insert into public.game_rounds (
      game_session_id,
      game_id,
      round_id,
      status,
      bet_amount
    )
    values (
      v_session.session_id,
      v_session.game_id,
      v_round_id,
      'open',
      p_amount
    )
    on conflict (game_id, round_id)
    do update set
      bet_amount = public.game_rounds.bet_amount + excluded.bet_amount;
  elsif v_type = 'payout' then
    insert into public.game_rounds (
      game_session_id,
      game_id,
      round_id,
      status,
      payout_amount,
      settled_at
    )
    values (
      v_session.session_id,
      v_session.game_id,
      v_round_id,
      'settled',
      p_amount,
      now()
    )
    on conflict (game_id, round_id)
    do update set
      status = 'settled',
      payout_amount = public.game_rounds.payout_amount + excluded.payout_amount,
      settled_at = coalesce(public.game_rounds.settled_at, now());
  elsif v_type = 'refund' then
    insert into public.game_rounds (
      game_session_id,
      game_id,
      round_id,
      status,
      refund_amount,
      settled_at
    )
    values (
      v_session.session_id,
      v_session.game_id,
      v_round_id,
      'refunded',
      p_amount,
      now()
    )
    on conflict (game_id, round_id)
    do update set
      status = 'refunded',
      refund_amount = public.game_rounds.refund_amount + excluded.refund_amount,
      settled_at = coalesce(public.game_rounds.settled_at, now());
  end if;

  return query
  select
    v_transaction_id,
    v_session.wallet_account_id,
    v_session.session_id,
    v_session.game_id,
    v_round_id,
    v_type,
    p_amount,
    v_balance_before,
    v_balance_after,
    v_session.currency;
end;
$$;

revoke all on function public.create_game_session(text, text, integer, text) from public;
revoke all on function public.create_game_session(text, text, integer, text) from anon;
revoke all on function public.create_game_session(text, text, integer, text) from authenticated;
revoke all on function public.looty_apply_wallet_transaction(text, text, text, numeric, text, jsonb) from public;
revoke all on function public.looty_apply_wallet_transaction(text, text, text, numeric, text, jsonb) from anon;
revoke all on function public.looty_apply_wallet_transaction(text, text, text, numeric, text, jsonb) from authenticated;
revoke all on function public.looty_apply_wallet_transaction(text, text, text, numeric, text, jsonb) from service_role;

grant execute on function public.create_game_session(text, text, integer, text) to service_role;
