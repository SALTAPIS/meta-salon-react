-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_balance_update ON public.profiles;

-- Create a table for trigger logs if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trigger_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    trigger_name text NOT NULL,
    table_name text NOT NULL,
    operation text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS if not already enabled
ALTER TABLE public.trigger_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view trigger logs" ON public.trigger_logs;

-- Create policy for admins to view logs
CREATE POLICY "Admins can view trigger logs"
ON public.trigger_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Update balance update trigger with logging
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- Update updated_at timestamp
    NEW.updated_at = now();
    
    -- Log the trigger execution
    INSERT INTO public.trigger_logs (
        trigger_name,
        table_name,
        operation,
        old_data,
        new_data
    ) VALUES (
        'handle_balance_update',
        'profiles',
        TG_OP,
        row_to_json(OLD)::jsonb,
        row_to_json(NEW)::jsonb
    );
    
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
CREATE TRIGGER on_balance_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_balance_update();
  