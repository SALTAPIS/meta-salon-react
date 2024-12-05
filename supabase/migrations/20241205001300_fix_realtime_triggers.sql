-- Ensure WAL level is set to logical (this should be done manually by the DBA)
-- ALTER SYSTEM SET wal_level = logical;

-- Drop duplicate triggers
DROP TRIGGER IF EXISTS on_balance_change ON public.profiles;
DROP TRIGGER IF EXISTS on_balance_update ON public.profiles;

-- Create single balance update trigger
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- Update updated_at timestamp
    NEW.updated_at = now();
    
    -- Notify about balance change
    IF OLD.balance IS DISTINCT FROM NEW.balance THEN
        PERFORM pg_notify(
            'balance_updates',
            json_build_object(
                'user_id', NEW.id,
                'old_balance', OLD.balance,
                'new_balance', NEW.balance,
                'timestamp', extract(epoch from now())
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create single trigger for balance updates
CREATE TRIGGER on_balance_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_balance_update();

-- Drop and recreate publication with explicit settings
DROP PUBLICATION IF EXISTS salon_realtime;

CREATE PUBLICATION salon_realtime FOR TABLE 
    profiles,
    transactions,
    vote_packs
WITH (publish = 'insert,update,delete');

-- Set replica identity for better change tracking
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE vote_packs REPLICA IDENTITY FULL;

-- Verify publication settings
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication
WHERE pubname = 'salon_realtime'; 