-- Check auth.users table
SELECT id, email, raw_user_meta_data, created_at, confirmed_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check profiles table
SELECT id, email, role, balance, created_at, updated_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Check user_vote_packs table
SELECT id, user_id, pack_type, quantity, created_at
FROM public.user_vote_packs
ORDER BY created_at DESC
LIMIT 5;

-- Check auth trigger
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_vote_packs'); 