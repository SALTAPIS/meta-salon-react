-- Update admin role in both tables
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'admin@meta.salon';
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        -- Update auth.users
        UPDATE auth.users
        SET 
            raw_user_meta_data = jsonb_build_object(
                'role', 'admin',
                'balance', 1000
            ),
            is_super_admin = true,
            updated_at = now()
        WHERE id = v_user_id;

        -- Update public.profiles
        UPDATE public.profiles
        SET 
            role = 'admin',
            balance = 1000,
            updated_at = now()
        WHERE id = v_user_id;

        RAISE NOTICE 'Admin role updated successfully for user ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found with email: %', v_email;
    END IF;
END;
$$; 