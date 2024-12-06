-- Show users from auth.identities
SELECT 'Auth Identities:' as source;
SELECT 
    id,
    user_id,
    provider,
    identity_data->>'email' as email,
    created_at
FROM auth.identities;

-- Show users from auth.users
SELECT 'Auth Users:' as source;
SELECT 
    id,
    email,
    role,
    created_at
FROM auth.users;

-- Show users from public.profiles
SELECT 'Profiles:' as source;
SELECT 
    id,
    email,
    role,
    balance,
    created_at
FROM public.profiles; 