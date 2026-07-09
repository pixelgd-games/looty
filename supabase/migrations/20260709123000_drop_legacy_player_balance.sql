-- Remove old pre-wallet player/balance artifacts.
-- Formal wallet work should use wallet_accounts + wallet_transactions instead.

drop function if exists public.ensure_my_player_v1();
drop table if exists public.player_balances;
drop table if exists public.players;
