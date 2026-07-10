create table public.gateway_rate_limits (
  bucket_key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (bucket_key_hash, window_started_at),
  check (btrim(bucket_key_hash) <> ''),
  check (request_count > 0)
);

alter table public.gateway_rate_limits enable row level security;

revoke all on table public.gateway_rate_limits from public, anon, authenticated;
grant all on table public.gateway_rate_limits to service_role;

create or replace function public.looty_consume_gateway_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key_hash text;
  v_window_started_at timestamptz;
  v_allowed boolean;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'rate limit key is required' using errcode = '22023';
  end if;

  if p_limit < 1 or p_limit > 10000 then
    raise exception 'rate limit must be between 1 and 10000' using errcode = '22023';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'rate limit window must be between 1 and 86400 seconds' using errcode = '22023';
  end if;

  v_key_hash := public.looty_hash_secret(p_key);
  v_window_started_at := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.gateway_rate_limits (
    bucket_key_hash,
    window_started_at,
    request_count,
    expires_at
  )
  values (
    v_key_hash,
    v_window_started_at,
    1,
    v_window_started_at + (p_window_seconds * 2 * interval '1 second')
  )
  on conflict (bucket_key_hash, window_started_at)
  do update set
    request_count = public.gateway_rate_limits.request_count + 1,
    updated_at = now()
  where public.gateway_rate_limits.request_count < p_limit
  returning true
  into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

create or replace function public.looty_cleanup_gateway_runtime()
returns table (
  expired_sessions integer,
  removed_rate_limits integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_sessions integer;
  v_removed_rate_limits integer;
begin
  update public.game_sessions
  set
    status = 'expired',
    closed_at = coalesce(closed_at, now())
  where status = 'active'
    and (
      expires_at <= now()
      or (
        gateway_token_hash is null
        and launch_code_used_at is null
        and launch_code_expires_at <= now()
      )
    );

  get diagnostics v_expired_sessions = row_count;

  delete from public.gateway_rate_limits
  where expires_at <= now();

  get diagnostics v_removed_rate_limits = row_count;

  return query
  select v_expired_sessions, v_removed_rate_limits;
end;
$$;

revoke all on function public.looty_consume_gateway_rate_limit(text, integer, integer) from public, anon, authenticated, service_role;
revoke all on function public.looty_cleanup_gateway_runtime() from public, anon, authenticated, service_role;

grant execute on function public.looty_consume_gateway_rate_limit(text, integer, integer) to service_role;
grant execute on function public.looty_cleanup_gateway_runtime() to service_role;
