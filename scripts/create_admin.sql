-- Create admin user if not exists
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if admin user exists
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'admin@meta.salon';

    IF v_user_id IS NULL THEN
        -- Generate new UUID
        v_user_id := gen_random_uuid();
        
        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin,
            role
        )
        VALUES (
            v_user_id,
            'admin@meta.salon',
            crypt('rindim_MS8', gen_salt('bf')),
            now(),
            now(),
            now(),
            jsonb_build_object(
                'role', 'admin',
                'balance', 1000
            ),
            true,
            'authenticated'
        );

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
            'admin@meta.salon',
            'admin',
            1000,
            now(),
            now()
        );

        RAISE NOTICE 'Admin user created with ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', v_user_id;
    END IF;
END;
$$; 