-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS get_all_profiles_admin();

-- Create the consolidated admin function
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
  email_verified boolean,
  premium_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return all profiles with email from auth.users
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.role,
    p.created_at,
    p.balance,
    p.username,
    p.display_name,
    p.avatar_url,
    p.updated_at,
    p.email_verified,
    p.premium_until
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_profiles_admin() TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
 