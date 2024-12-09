-- Backup existing data
create temp table transactions_backup as select * from public.transactions;

-- Drop existing table
drop table if exists public.transactions cascade;

-- Recreate table with clean constraints
create table public.transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    type text not null,
    amount numeric(10,2) not null,
    status text not null default 'completed',
    description text,
    reference_id uuid,
    metadata jsonb,
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Add clean constraints
alter table public.transactions
add constraint transactions_type_check
check (type in ('grant', 'submission', 'vote_pack', 'reward', 'premium', 'refund'));

alter table public.transactions
add constraint transactions_status_check
check (status in ('pending', 'completed', 'failed', 'cancelled'));

-- Restore data
insert into public.transactions
select * from transactions_backup;

-- Drop backup table
drop table transactions_backup;

-- Create indexes
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_user_created on public.transactions(user_id, created_at desc); 