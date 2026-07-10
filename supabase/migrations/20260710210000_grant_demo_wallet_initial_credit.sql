alter table public.wallet_accounts
  alter column balance set default 10000.00;

create or replace function public.record_demo_wallet_initial_credit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.currency = 'POINT' and new.balance = 10000.00 then
    insert into public.wallet_transactions (
      wallet_account_id,
      type,
      amount,
      balance_before,
      balance_after,
      idempotency_key,
      metadata
    )
    values (
      new.id,
      'deposit',
      10000.00,
      0,
      10000.00,
      'demo-initial-credit:' || new.id::text,
      jsonb_build_object(
        'source', 'looty',
        'reason', 'demo_initial_credit',
        'wallet_mode', 'demo'
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists wallet_accounts_demo_initial_credit on public.wallet_accounts;

create trigger wallet_accounts_demo_initial_credit
after insert on public.wallet_accounts
for each row
execute function public.record_demo_wallet_initial_credit();

revoke all on function public.record_demo_wallet_initial_credit() from public, anon, authenticated, service_role;
