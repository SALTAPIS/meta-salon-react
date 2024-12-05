-- Drop existing publications
drop publication if exists salon_realtime;
drop publication if exists meta_salon_realtime;

-- Create single publication for all tables
create publication salon_realtime for table 
    profiles,
    transactions,
    vote_packs;

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

-- Update trigger for balance changes
create or replace function public.notify_balance_change()
returns trigger
security definer
as $$
begin
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

drop trigger if exists on_balance_change on public.profiles;
create trigger on_balance_change
    after update on public.profiles
    for each row
    execute function public.notify_balance_change();
 