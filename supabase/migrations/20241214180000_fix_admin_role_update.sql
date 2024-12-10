-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_user_role;

-- Create function to update user role
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Check if current user is admin
  SELECT role = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = v_current_user_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Validate new role
  IF new_role NOT IN ('user', 'admin', 'artist', 'moderator') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: user, admin, artist, moderator', new_role;
  END IF;

  -- Update the user's role
  UPDATE profiles
  SET 
    role = new_role,
    updated_at = now()
  WHERE id = target_user_id
  RETURNING json_build_object(
    'id', id,
    'role', role,
    'updated_at', updated_at
  ) INTO STRICT result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
 