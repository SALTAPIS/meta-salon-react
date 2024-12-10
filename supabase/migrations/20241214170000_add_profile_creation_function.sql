-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_initial_profile;

-- Create function to create initial profile
CREATE OR REPLACE FUNCTION create_initial_profile(
  user_id uuid,
  user_email text,
  user_role text,
  initial_balance numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    role,
    balance,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_role,
    initial_balance,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    balance = EXCLUDED.balance,
    updated_at = now()
  WHERE profiles.id = EXCLUDED.id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_initial_profile TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 