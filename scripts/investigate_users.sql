-- List all tables in both auth and public schemas
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname IN ('auth', 'public')
ORDER BY schemaname, tablename;

-- Check auth.users
SELECT 'auth.users' as table_name, count(*) as count;
SELECT * FROM auth.users LIMIT 5;

-- Check auth.identities
SELECT 'auth.identities' as table_name, count(*) as count;
SELECT * FROM auth.identities LIMIT 5;

-- Check public.profiles
SELECT 'public.profiles' as table_name, count(*) as count;
SELECT * FROM public.profiles LIMIT 5;

-- Check relationships between tables
SELECT 
    i.id as identity_id,
    i.user_id,
    i.provider,
    i.identity_data->>'email' as identity_email,
    u.email as user_email,
    u.role as user_role,
    p.email as profile_email,
    p.role as profile_role,
    p.balance
FROM auth.identities i
FULL OUTER JOIN auth.users u ON i.user_id = u.id
FULL OUTER JOIN public.profiles p ON u.id = p.id
ORDER BY i.created_at DESC NULLS LAST;

-- Check for any users without profiles
SELECT u.* 
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check for any profiles without users
SELECT p.* 
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL; 