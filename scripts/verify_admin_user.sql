-- Check admin user in auth.users
SELECT id, email, raw_user_meta_data->>'role' as role, created_at, last_sign_in_at, confirmed_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';

-- Check admin profile
SELECT id, email, role, balance, created_at, updated_at
FROM public.profiles
WHERE role = 'admin'; 