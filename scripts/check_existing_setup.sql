-- Check all existing users across all relevant tables
SELECT 
    i.provider,
    i.identity_data->>'email' as identity_email,
    u.email as auth_email,
    u.role as auth_role,
    p.email as profile_email,
    p.role as profile_role,
    p.balance
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY i.created_at DESC; 