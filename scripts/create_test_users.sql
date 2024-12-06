-- Function to create a test user
CREATE OR REPLACE FUNCTION create_test_user(
    p_email TEXT,
    p_password TEXT,
    p_role TEXT DEFAULT 'user'
) RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        role,
        created_at,
        updated_at
    )
    VALUES (
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        'authenticated',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_user_id;

    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        role,
        balance,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        p_email,
        p_role,
        0,
        NOW(),
        NOW()
    );

    RETURN v_user_id::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create some test users
SELECT create_test_user('test1@example.com', 'test123', 'user');
SELECT create_test_user('test2@example.com', 'test123', 'user');
SELECT create_test_user('moderator@example.com', 'test123', 'moderator'); 