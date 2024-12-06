-- Create function to get all profiles for admin
CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    -- Return all profiles
    RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
  ELSE
    -- If not admin, return only their own profile
    RETURN QUERY SELECT * FROM profiles WHERE id = auth.uid();
  END IF;
END;
$$; 