-- Check admin user setup
SELECT 'Admin Profile:' as check;
SELECT id, email, role, balance
FROM profiles
WHERE email = 'admin@meta.salon';

-- Check all profiles (using service role to bypass RLS)
SELECT 'All Profiles:' as check;
SELECT id, email, role, balance
FROM profiles;

-- Check RLS bypass using service role
SELECT 'Testing RLS bypass:' as check;
SET request.jwt.claim.role = 'service_role';
SELECT id, email, role, balance
FROM profiles; 