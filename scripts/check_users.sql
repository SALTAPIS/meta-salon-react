-- Show counts from all relevant tables
SELECT 'auth.users' as table_name, count(*) as count FROM auth.users
UNION ALL
SELECT 'auth.identities' as table_name, count(*) FROM auth.identities
UNION ALL
SELECT 'public.profiles' as table_name, count(*) FROM public.profiles;

-- Show all users with their related data
SELECT 
    u.email as auth_email,
    u.role as auth_role,
    u.created_at as auth_created,
    p.email as profile_email,
    p.role as profile_role,
    p.balance,
    p.created_at as profile_created
FROM auth.users u
FULL OUTER JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC; 