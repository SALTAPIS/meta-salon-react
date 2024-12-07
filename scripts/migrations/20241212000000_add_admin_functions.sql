-- Create admin functions
CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  created_at timestamp with time zone,
  balance integer,
  premium_until timestamp with time zone,
  updated_at timestamp with time zone
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user has admin role
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return all profiles
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    (au.raw_user_meta_data->>'role')::text as role,
    au.created_at,
    COALESCE((p.raw_user_meta_data->>'balance')::integer, 0) as balance,
    (p.raw_user_meta_data->>'premium_until')::timestamp with time zone as premium_until,
    au.updated_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$; 