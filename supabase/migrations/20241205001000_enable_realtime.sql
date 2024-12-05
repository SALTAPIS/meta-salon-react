-- Drop existing publications
DROP PUBLICATION IF EXISTS salon_realtime;
DROP PUBLICATION IF EXISTS meta_salon_realtime;

-- Create single publication for all tables
CREATE PUBLICATION salon_realtime FOR ALL TABLES;

-- Enable real-time tracking for the tables
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE vote_packs REPLICA IDENTITY FULL;

-- Enable real-time for all operations
ALTER PUBLICATION salon_realtime SET (publish = 'insert,update,delete');

-- Create function to handle balance updates
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

-- Create trigger for balance updates
DROP TRIGGER IF EXISTS on_balance_update ON public.profiles;
CREATE TRIGGER on_balance_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_balance_update();

-- Create function to handle transaction updates
CREATE OR REPLACE FUNCTION public.handle_transaction_insert()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- Notify about new transaction
    PERFORM pg_notify(
        'transaction_updates',
        json_build_object(
            'user_id', NEW.user_id,
            'type', NEW.type,
            'amount', NEW.amount,
            'timestamp', extract(epoch from now())
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction updates
DROP TRIGGER IF EXISTS on_transaction_insert ON public.transactions;
CREATE TRIGGER on_transaction_insert
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_transaction_insert();
 