-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_user_role(text, uuid);
DROP FUNCTION IF EXISTS update_user_role(uuid, text);

-- Create function to update user role
CREATE OR REPLACE FUNCTION update_user_role(
  new_role text,
  target_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_is_admin boolean;
  result json;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  -- Check if current user is admin by checking user_metadata
  SELECT (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Validate new role
  IF new_role NOT IN ('user', 'admin', 'artist', 'moderator') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: user, admin, artist, moderator', new_role;
  END IF;

  -- Update the user's role in both profiles and user_metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('role', new_role)
      ELSE
        raw_user_meta_data || jsonb_build_object('role', new_role)
    END
  WHERE id = target_user_id;

  -- Update the profiles table
  UPDATE profiles
  SET 
    role = new_role,
    updated_at = now()
  WHERE id = target_user_id
  RETURNING json_build_object(
    'id', id,
    'role', role,
    'updated_at', updated_at
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role(text, uuid) TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
 