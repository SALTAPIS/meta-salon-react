-- Temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for testing
DROP POLICY IF EXISTS "Profiles are viewable by authenticated" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Verify admin user exists and has correct role
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@meta.salon'
RETURNING id, email, role, created_at;

-- Show all profiles for verification
SELECT id, email, role, created_at, balance
FROM profiles
ORDER BY created_at DESC; 