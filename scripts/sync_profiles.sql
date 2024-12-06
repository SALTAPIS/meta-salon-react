-- First, let's see what users we have in auth.users but not in profiles
WITH missing_profiles AS (
  SELECT 
    u.id,
    u.email,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL
)
-- Insert missing profiles
INSERT INTO public.profiles (id, email, role, balance, created_at, updated_at)
SELECT 
  id,
  email,
  'user' as role,
  0 as balance,
  created_at,
  created_at
FROM missing_profiles
RETURNING id, email, role, created_at;

-- Show all profiles after sync
SELECT p.id, p.email, p.role, p.balance, p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC; 