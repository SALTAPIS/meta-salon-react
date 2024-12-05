-- Add more detailed logging to the balance update trigger
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    -- Update updated_at timestamp
    NEW.updated_at = now();
    
    -- Log the trigger execution with more details
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
    ) RETURNING id INTO v_log_id;
    
    -- Log attempt to notify
    INSERT INTO public.trigger_logs (
        trigger_name,
        table_name,
        operation,
        old_data,
        new_data
    ) VALUES (
        'balance_notification',
        'profiles',
        'NOTIFY',
        jsonb_build_object(
            'log_id', v_log_id,
            'old_balance', OLD.balance,
            'new_balance', NEW.balance
        ),
        jsonb_build_object(
            'channel', 'balance_updates',
            'payload', json_build_object(
                'user_id', NEW.id,
                'old_balance', OLD.balance,
                'new_balance', NEW.balance,
                'timestamp', extract(epoch from now())
            )
        )
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
        
        -- Log successful notification
        INSERT INTO public.trigger_logs (
            trigger_name,
            table_name,
            operation,
            old_data,
            new_data
        ) VALUES (
            'balance_notification',
            'profiles',
            'NOTIFY_SENT',
            jsonb_build_object(
                'log_id', v_log_id,
                'status', 'success'
            ),
            jsonb_build_object(
                'channel', 'balance_updates',
                'user_id', NEW.id,
                'timestamp', extract(epoch from now())
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 