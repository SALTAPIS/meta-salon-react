-- Drop existing publications
drop publication if exists salon_realtime;
drop publication if exists meta_salon_realtime;

-- Create single publication for all tables
create publication salon_realtime for all tables;

-- Enable real-time tracking for the tables
alter table profiles replica identity full;
alter table transactions replica identity full;
alter table vote_packs replica identity full;

-- Enable real-time for all operations
alter publication salon_realtime set (publish = 'insert,update,delete');

-- Ensure real-time is enabled for the database
alter system set wal_level = logical;
alter system set max_replication_slots = 10;
alter system set max_wal_senders = 10;

-- Create function to handle balance updates
create or replace function public.handle_balance_update()
returns trigger
security definer
as $$
begin
    -- Update updated_at timestamp
    new.updated_at = now();
    
    -- Notify about balance change
    if old.balance is distinct from new.balance then
        perform pg_notify(
            'balance_updates',
            json_build_object(
                'user_id', new.id,
                'old_balance', old.balance,
                'new_balance', new.balance,
                'timestamp', extract(epoch from now())
            )::text
        );
    end if;
    return new;
end;
$$ language plpgsql;

-- Create trigger for balance updates
drop trigger if exists on_balance_update on public.profiles;
create trigger on_balance_update
    before update on public.profiles
    for each row
    execute function public.handle_balance_update();

-- Create function to handle transaction updates
create or replace function public.handle_transaction_insert()
returns trigger
security definer
as $$
begin
    -- Notify about new transaction
    perform pg_notify(
        'transaction_updates',
        json_build_object(
            'user_id', new.user_id,
            'type', new.type,
            'amount', new.amount,
            'timestamp', extract(epoch from now())
        )::text
    );
    return new;
end;
$$ language plpgsql;

-- Create trigger for transaction updates
drop trigger if exists on_transaction_insert on public.transactions;
create trigger on_transaction_insert
    after insert on public.transactions
    for each row
    execute function public.handle_transaction_insert();
 