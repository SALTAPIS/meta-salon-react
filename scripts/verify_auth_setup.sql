-- Check auth schema permissions
SELECT nspname, proacl 
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE nspname = 'auth';

-- Check auth.users table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'auth' AND table_name = 'users';

-- Check if the auth trigger exists
SELECT tgname, proname 
FROM pg_trigger t 
JOIN pg_proc p ON t.tgfoid = p.oid 
WHERE tgrelid = 'auth.users'::regclass;

-- Check profile trigger function
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check RLS policies on profiles table
SELECT pol.polname, 
       CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as policy_type,
       pg_get_expr(pol.polqual, pol.polrelid) as policy_definition
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' AND pc.relname = 'profiles'; 