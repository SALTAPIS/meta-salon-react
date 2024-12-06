-- Create admin user if not exists
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'admin@meta.salon';
    v_encrypted_password text;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NULL THEN
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
            v_email,
            crypt('Admin@123', gen_salt('bf')), -- Default password, should be changed immediately
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

        -- Delete existing profile if any (shouldn't happen but just in case)
        DELETE FROM public.profiles WHERE email = v_email;

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
            v_email,
            'admin',
            1000,
            now(),
            now()
        );

        -- Create initial transaction
        INSERT INTO public.transactions (
            user_id,
            type,
            amount,
            status,
            description,
            metadata,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            'grant',
            1000,
            'completed',
            'Initial admin balance grant',
            jsonb_build_object(
                'source', 'system',
                'reason', 'admin_creation'
            ),
            now(),
            now()
        );

        RAISE NOTICE 'Admin user created successfully with ID: %', v_user_id;
        RAISE NOTICE 'Default password is: Admin@123 - PLEASE CHANGE THIS IMMEDIATELY!';
    ELSE
        -- Update existing user to admin if not already
        UPDATE auth.users
        SET
            raw_user_meta_data = jsonb_build_object(
                'role', 'admin',
                'balance', 1000
            ),
            is_super_admin = true,
            updated_at = now()
        WHERE id = v_user_id;

        -- Delete and recreate profile to ensure consistency
        DELETE FROM public.profiles WHERE id = v_user_id;
        
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
            v_email,
            'admin',
            1000,
            now(),
            now()
        );

        RAISE NOTICE 'Admin user already exists with ID: %, profile recreated', v_user_id;
    END IF;
END;
$$; 