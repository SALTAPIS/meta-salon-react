-- Update admin role in both tables for specific user ID
UPDATE auth.users
SET 
    raw_user_meta_data = jsonb_build_object(
        'role', 'admin',
        'balance', 1000
    ),
    is_super_admin = true,
    updated_at = now()
WHERE id = 'b0005ad6-cc12-4e6c-9bf1-467eb4383e60';

UPDATE public.profiles
SET 
    role = 'admin',
    balance = 1000,
    updated_at = now()
WHERE id = 'b0005ad6-cc12-4e6c-9bf1-467eb4383e60'; 