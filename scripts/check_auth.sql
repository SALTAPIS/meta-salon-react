-- List all tables in auth schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Check users table
SELECT 'auth.users:' as table_name;
SELECT id, email, role, created_at
FROM auth.users
ORDER BY created_at DESC;

-- Check identities table
SELECT 'auth.identities:' as table_name;
SELECT id, user_id, provider, identity_data->>'email' as email, created_at
FROM auth.identities
ORDER BY created_at DESC;

-- Check current profiles
SELECT 'public.profiles:' as table_name;
SELECT id, email, role, balance, created_at
FROM public.profiles
ORDER BY created_at DESC; 