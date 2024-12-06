-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by admin" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated" ON profiles;

-- Create policy for users to view their own profile
CREATE POLICY "Profiles are viewable by owner"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for admins to view all profiles
CREATE POLICY "Profiles are viewable by admin"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verify admin user exists and has correct role
DO $$
BEGIN
  -- Update admin user role if exists
  UPDATE profiles
  SET role = 'admin'
  WHERE email = 'admin@meta.salon';

  -- Log the result
  RAISE NOTICE 'Admin user updated. Current admin users:';
END $$;

-- Show current admin users
SELECT id, email, role, created_at
FROM profiles
WHERE role = 'admin'; 