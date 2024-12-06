-- Check if user exists in auth.users
SELECT 'Auth User:' as check_type;
SELECT id, email, role, created_at
FROM auth.users
WHERE email = 'test.user@example.com';

-- Check if profile was created
SELECT 'Profile:' as check_type;
SELECT id, email, role, balance, created_at
FROM public.profiles
WHERE email = 'test.user@example.com';

-- Check trigger_logs for any errors
SELECT 'Recent Trigger Logs:' as check_type;
SELECT created_at, trigger_name, operation, table_name
FROM trigger_logs
WHERE created_at > NOW() - interval '5 minutes'
ORDER BY created_at DESC
LIMIT 5; 