-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.set_admin_role;

-- Create function to set admin role
CREATE OR REPLACE FUNCTION public.set_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only admins can set admin roles.';
  END IF;

  -- Update the user's role to admin
  UPDATE profiles
  SET 
    role = 'admin',
    updated_at = now()
  WHERE id = target_user_id;

  -- Log the change
  INSERT INTO audit_log (
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    changed_by
  )
  VALUES (
    'update',
    'profiles',
    target_user_id,
    jsonb_build_object('role', (SELECT role FROM profiles WHERE id = target_user_id)),
    jsonb_build_object('role', 'admin'),
    auth.uid()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_admin_role TO authenticated;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Admins can view audit log"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
 