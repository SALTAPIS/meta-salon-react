-- Drop and recreate the handle_new_user function to ensure it creates initial packs correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- Create profile first with initial balance
    INSERT INTO public.profiles (
        id,
        email,
        balance,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        500, -- Initial balance
        NOW(),
        NOW()
    );

    -- Record initial token grant
    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        description,
        status
    ) VALUES (
        NEW.id,
        'grant',
        500,
        'Initial token grant',
        'completed'
    );

    -- Create initial basic vote pack
    INSERT INTO public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    ) VALUES (
        NEW.id,
        'basic',
        10,
        1,
        NOW() + INTERVAL '30 days'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix any existing users who don't have a basic pack
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get all users without a basic pack
    FOR user_record IN 
        SELECT p.id, p.email 
        FROM public.profiles p
        WHERE NOT EXISTS (
            SELECT 1 
            FROM public.vote_packs v 
            WHERE v.user_id = p.id 
            AND v.type = 'basic'
        )
    LOOP
        -- Create basic pack for user
        INSERT INTO public.vote_packs (
            user_id,
            type,
            votes_remaining,
            vote_power,
            expires_at
        ) VALUES (
            user_record.id,
            'basic',
            10,
            1,
            NOW() + INTERVAL '30 days'
        );

        RAISE NOTICE 'Created basic pack for user %', user_record.email;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 