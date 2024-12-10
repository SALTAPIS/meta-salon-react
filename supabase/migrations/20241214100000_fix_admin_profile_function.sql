-- Drop existing function
DROP FUNCTION IF EXISTS get_all_profiles_admin();

-- Create admin function to get all profiles with proper typing
CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  balance numeric(10,2),
  username text,
  display_name text,
  avatar_url text,
  updated_at timestamptz,
  email_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return all profiles with email from auth.users
  RETURN QUERY
  SELECT 
    profiles.id,
    auth_users.email,
    profiles.role,
    profiles.created_at,
    profiles.balance,
    profiles.username,
    profiles.display_name,
    profiles.avatar_url,
    profiles.updated_at,
    profiles.email_verified
  FROM profiles
  LEFT JOIN auth.users auth_users ON auth_users.id = profiles.id
  ORDER BY profiles.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_profiles_admin() TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 