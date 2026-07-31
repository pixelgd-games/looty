alter table public.wallet_accounts
  alter column balance set default 0;

create or replace function public.looty_initialize_wallet_balance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.balance <> 0 then
    raise exception 'wallet opening balance is managed by Looty' using errcode = '22023';
  end if;

  if new.currency = 'POINT' then
    new.balance := 10000.00;
  end if;

  return new;
end;
$$;

drop trigger if exists wallet_accounts_initialize_balance on public.wallet_accounts;

create trigger wallet_accounts_initialize_balance
before insert on public.wallet_accounts
for each row
execute function public.looty_initialize_wallet_balance();

alter table public.game_sessions
  drop constraint if exists game_sessions_demo_currency_check;

alter table public.game_sessions
  add constraint game_sessions_demo_currency_check
  check (wallet_mode <> 'demo' or currency = 'POINT');

revoke all on function public.looty_initialize_wallet_balance() from public, anon, authenticated, service_role;
