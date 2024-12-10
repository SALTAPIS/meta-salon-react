-- Drop existing function
DROP FUNCTION IF EXISTS get_all_profiles_admin();

-- Create admin function to get all profiles with proper typing and artwork count
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
  premium_until timestamptz,
  artwork_count bigint
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

  -- Return all profiles with email from auth.users and artwork count
  RETURN QUERY
  SELECT 
    p.id,
    CAST(au.email AS text),
    CAST(p.role AS text),
    p.created_at,
    p.balance,
    CAST(p.username AS text),
    CAST(p.display_name AS text),
    CAST(p.avatar_url AS text),
    p.updated_at,
    p.email_verified,
    p.premium_until,
    COALESCE(COUNT(a.id), 0)::bigint as artwork_count
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN artworks a ON a.user_id = p.id
  GROUP BY p.id, au.email, p.role, p.created_at, p.balance, p.username, 
           p.display_name, p.avatar_url, p.updated_at, p.email_verified, p.premium_until
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_profiles_admin() TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 