-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;

-- Create or replace function to handle profile updates
CREATE OR REPLACE FUNCTION handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = now();
  
  -- Ensure username is lowercase and trimmed
  IF NEW.username IS NOT NULL THEN
    NEW.username = lower(trim(NEW.username));
  END IF;

  -- Ensure display_name is trimmed
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name = trim(NEW.display_name);
  END IF;

  -- Ensure bio is trimmed
  IF NEW.bio IS NOT NULL THEN
    NEW.bio = trim(NEW.bio);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_update ON profiles;

-- Create trigger for profile updates
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_update();

-- Update RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY read_own_profile ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY update_own_profile ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for admin to read all profiles
CREATE POLICY admin_read_all_profiles ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy for admin to update all profiles
CREATE POLICY admin_update_all_profiles ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin'); 