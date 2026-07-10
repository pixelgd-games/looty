drop function if exists public.wallet_bet(text, text, numeric, text, jsonb);
drop function if exists public.wallet_payout(text, text, numeric, text, jsonb);
drop function if exists public.wallet_refund(text, text, numeric, text, jsonb);
drop function if exists public.wallet_get_balance(text);
drop function if exists public.close_game_round(text, text);
drop function if exists public.looty_apply_wallet_transaction(text, text, text, numeric, text, jsonb);

alter table public.wallet_transactions
  add column game_session_id uuid references public.game_sessions(id) on delete set null;

update public.wallet_transactions wt
set game_session_id = gr.game_session_id
from public.game_rounds gr
where wt.game_session_id is null
  and wt.game_id = gr.game_id
  and wt.round_id = gr.round_id;

create index wallet_transactions_game_session_id_idx
  on public.wallet_transactions (game_session_id);

drop index if exists public.game_rounds_game_round_id_key;

create unique index game_rounds_session_round_id_key
  on public.game_rounds (game_session_id, round_id);

create or replace function public.wallet_get_balance(p_gateway_token text)
returns table (
  session_id uuid,
  player_account_id uuid,
  wallet_account_id uuid,
  currency text,
  balance numeric,
  locked_balance numeric
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session record;
begin
  select *
  into v_session
  from public.looty_active_session(p_gateway_token, 'balance')
  limit 1;

  if v_session.session_id is null then
    raise exception 'game session is not active' using errcode = 'P0002';
  end if;

  return query
  select
    v_session.session_id,
    v_session.player_account_id,
    wa.id,
    wa.currency,
    wa.balance,
    wa.locked_balance
  from public.wallet_accounts wa
  where wa.id = v_session.wallet_account_id
    and wa.status = 'active';
end;
$$;

create or replace function public.looty_apply_wallet_transaction(
  p_gateway_token text,
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
  v_round record;
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
  from public.looty_active_session(p_gateway_token, v_type)
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
      or v_existing.game_session_id is distinct from v_session.session_id
      or v_existing.type <> v_type
      or v_existing.amount <> p_amount
      or coalesce(v_existing.round_id, '') <> v_round_id then
      raise exception 'idempotency_key conflicts with another transaction' using errcode = '23505';
    end if;

    return query
    select
      v_existing.id,
      v_existing.wallet_account_id,
      v_existing.game_session_id,
      v_session.game_id,
      v_round_id,
      v_existing.type,
      v_existing.amount,
      v_existing.balance_before,
      v_existing.balance_after,
      v_session.currency;
    return;
  end if;

  select *
  into v_round
  from public.game_rounds gr
  where gr.game_session_id = v_session.session_id
    and gr.round_id = v_round_id
  limit 1
  for update;

  if v_round.id is not null and v_round.status <> 'open' then
    raise exception 'game round is already closed' using errcode = 'P0001';
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
    game_session_id,
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
    v_session.session_id,
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
    on conflict (game_session_id, round_id)
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
    on conflict (game_session_id, round_id)
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
    on conflict (game_session_id, round_id)
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

create or replace function public.wallet_bet(
  p_gateway_token text,
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
language sql
security definer
set search_path = public, extensions
as $$
  select *
  from public.looty_apply_wallet_transaction(
    p_gateway_token,
    'bet',
    p_round_id,
    p_amount,
    p_idempotency_key,
    p_metadata
  );
$$;

create or replace function public.wallet_payout(
  p_gateway_token text,
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
language sql
security definer
set search_path = public, extensions
as $$
  select *
  from public.looty_apply_wallet_transaction(
    p_gateway_token,
    'payout',
    p_round_id,
    p_amount,
    p_idempotency_key,
    p_metadata
  );
$$;

create or replace function public.wallet_refund(
  p_gateway_token text,
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
language sql
security definer
set search_path = public, extensions
as $$
  select *
  from public.looty_apply_wallet_transaction(
    p_gateway_token,
    'refund',
    p_round_id,
    p_amount,
    p_idempotency_key,
    p_metadata
  );
$$;

create or replace function public.close_game_round(
  p_gateway_token text,
  p_round_id text
)
returns table (
  game_round_id uuid,
  game_session_id uuid,
  game_id uuid,
  round_id text,
  status text,
  bet_amount numeric,
  payout_amount numeric,
  refund_amount numeric,
  settled_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session record;
  v_round_id text := nullif(btrim(p_round_id), '');
begin
  if v_round_id is null then
    raise exception 'round_id is required' using errcode = '22023';
  end if;

  select *
  into v_session
  from public.looty_active_session(p_gateway_token, 'close-round')
  limit 1;

  if v_session.session_id is null then
    raise exception 'game session is not active' using errcode = 'P0002';
  end if;

  return query
  update public.game_rounds gr
  set
    status = case when gr.status = 'open' then 'settled' else gr.status end,
    settled_at = coalesce(gr.settled_at, now())
  where gr.game_session_id = v_session.session_id
    and gr.round_id = v_round_id
  returning
    gr.id,
    gr.game_session_id,
    gr.game_id,
    gr.round_id,
    gr.status,
    gr.bet_amount,
    gr.payout_amount,
    gr.refund_amount,
    gr.settled_at;

  if not found then
    raise exception 'game round was not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.looty_apply_wallet_transaction(text, text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.wallet_get_balance(text) from public, anon, authenticated, service_role;
revoke all on function public.wallet_bet(text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.wallet_payout(text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.wallet_refund(text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.close_game_round(text, text) from public, anon, authenticated, service_role;

grant execute on function public.wallet_get_balance(text) to service_role;
grant execute on function public.wallet_bet(text, text, numeric, text, jsonb) to service_role;
grant execute on function public.wallet_payout(text, text, numeric, text, jsonb) to service_role;
grant execute on function public.wallet_refund(text, text, numeric, text, jsonb) to service_role;
grant execute on function public.close_game_round(text, text) to service_role;
