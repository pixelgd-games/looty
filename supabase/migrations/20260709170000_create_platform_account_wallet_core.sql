create table public.player_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  account_type text not null check (account_type in ('guest', 'registered')),
  display_name text,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  upgraded_at timestamptz,
  check (account_type <> 'registered' or auth_user_id is not null)
);

create unique index player_accounts_auth_user_id_key
  on public.player_accounts (auth_user_id)
  where auth_user_id is not null;

create table public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  player_account_id uuid not null references public.player_accounts(id) on delete cascade,
  currency text not null default 'POINT',
  balance numeric(18, 2) not null default 0,
  locked_balance numeric(18, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'frozen', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (balance >= 0),
  check (locked_balance >= 0),
  check (btrim(currency) <> '')
);

create unique index wallet_accounts_active_currency_key
  on public.wallet_accounts (player_account_id, currency)
  where status = 'active';

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_account_id uuid not null references public.player_accounts(id) on delete cascade,
  wallet_account_id uuid not null references public.wallet_accounts(id) on delete restrict,
  game_id uuid not null references public.games(id) on delete restrict,
  launch_token_hash text not null unique,
  account_type text not null check (account_type in ('guest', 'registered')),
  currency text not null default 'POINT',
  status text not null default 'active' check (status in ('active', 'closed', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (btrim(launch_token_hash) <> ''),
  check (btrim(currency) <> '')
);

create index game_sessions_player_account_id_idx
  on public.game_sessions (player_account_id);

create index game_sessions_game_id_idx
  on public.game_sessions (game_id);

create table public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete restrict,
  round_id text not null,
  status text not null default 'open' check (status in ('open', 'settled', 'refunded', 'cancelled')),
  bet_amount numeric(18, 2) not null default 0,
  payout_amount numeric(18, 2) not null default 0,
  refund_amount numeric(18, 2) not null default 0,
  started_at timestamptz not null default now(),
  settled_at timestamptz,
  check (btrim(round_id) <> ''),
  check (bet_amount >= 0),
  check (payout_amount >= 0),
  check (refund_amount >= 0)
);

create unique index game_rounds_game_round_id_key
  on public.game_rounds (game_id, round_id);

create index game_rounds_game_session_id_idx
  on public.game_rounds (game_session_id);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references public.wallet_accounts(id) on delete restrict,
  type text not null check (type in ('deposit', 'withdraw', 'bet', 'payout', 'refund', 'adjustment')),
  amount numeric(18, 2) not null,
  balance_before numeric(18, 2) not null,
  balance_after numeric(18, 2) not null,
  game_id uuid references public.games(id) on delete set null,
  round_id text,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (amount > 0),
  check (btrim(idempotency_key) <> ''),
  check (metadata is not null)
);

create index wallet_transactions_wallet_account_id_idx
  on public.wallet_transactions (wallet_account_id);

create index wallet_transactions_game_round_idx
  on public.wallet_transactions (game_id, round_id);

alter table public.player_accounts enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_rounds enable row level security;
