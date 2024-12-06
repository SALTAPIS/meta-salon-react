-- First, let's see what we have in auth.users
SELECT id, email, role, created_at
FROM auth.users
ORDER BY created_at DESC;

-- Show current profiles
SELECT 'Current profiles:' as message;
SELECT id, email, role, created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Now let's sync missing profiles from auth.users
WITH missing_profiles AS (
    SELECT 
        u.id,
        u.email,
        u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
)
INSERT INTO public.profiles (id, email, role, balance, created_at, updated_at)
SELECT 
    id,
    email,
    CASE 
        WHEN email = 'admin@meta.salon' THEN 'admin'
        ELSE 'user'
    END as role,
    0 as balance,
    created_at,
    created_at
FROM missing_profiles
RETURNING id, email, role, created_at;

-- Make sure admin user has correct role
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'admin@meta.salon'
RETURNING id, email, role, created_at;

-- Show final state of profiles
SELECT 'Final profiles state:' as message;
SELECT id, email, role, balance, created_at
FROM public.profiles
ORDER BY created_at DESC; 