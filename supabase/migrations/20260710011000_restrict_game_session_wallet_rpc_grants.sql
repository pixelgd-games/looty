revoke all on function public.looty_hash_launch_token(text) from public, anon, authenticated, service_role;
revoke all on function public.looty_active_session(text) from public, anon, authenticated, service_role;
revoke all on function public.looty_apply_wallet_transaction(text, text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.create_game_session(text, text, integer, text) from public, anon, authenticated, service_role;
revoke all on function public.wallet_get_balance(text) from public, anon, authenticated, service_role;
revoke all on function public.wallet_bet(text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.wallet_payout(text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.wallet_refund(text, text, numeric, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.close_game_round(text, text) from public, anon, authenticated, service_role;

grant execute on function public.create_game_session(text, text, integer, text) to service_role;
grant execute on function public.wallet_get_balance(text) to service_role;
grant execute on function public.wallet_bet(text, text, numeric, text, jsonb) to service_role;
grant execute on function public.wallet_payout(text, text, numeric, text, jsonb) to service_role;
grant execute on function public.wallet_refund(text, text, numeric, text, jsonb) to service_role;
grant execute on function public.close_game_round(text, text) to service_role;
