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
  result json;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR auth.jwt() ->> 'role' = 'admin'
      OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Validate new role
  IF new_role NOT IN ('user', 'admin', 'artist', 'moderator') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: user, admin, artist, moderator', new_role;
  END IF;

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

  -- Update auth.users metadata
  UPDATE auth.users
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role),
    updated_at = now()
  WHERE id = target_user_id;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role(text, uuid) TO authenticated; 