-- Update the handle_new_user function to ensure basic pack creation
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
        description
    ) VALUES (
        NEW.id,
        'grant',
        500,
        'Initial token grant'
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