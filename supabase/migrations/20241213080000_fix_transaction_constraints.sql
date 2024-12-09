-- Drop existing constraints
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions drop constraint if exists transactions_status_check;

-- Recreate constraints with clean values
alter table public.transactions
add constraint transactions_type_check
check (type = any (array[
  'grant',
  'submission',
  'vote_pack',
  'reward',
  'premium',
  'refund'
]::text[]));

alter table public.transactions
add constraint transactions_status_check
check (status = any (array[
  'pending',
  'completed',
  'failed',
  'cancelled'
]::text[])); 