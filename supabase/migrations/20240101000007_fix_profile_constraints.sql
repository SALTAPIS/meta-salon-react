-- Drop existing constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS username_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS display_name_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS bio_length;

-- Add updated constraints with reasonable lengths
ALTER TABLE profiles
  ADD CONSTRAINT username_length CHECK (
    username IS NULL OR LENGTH(username) BETWEEN 3 AND 30
  ),
  ADD CONSTRAINT display_name_length CHECK (
    display_name IS NULL OR LENGTH(display_name) BETWEEN 1 AND 50
  ),
  ADD CONSTRAINT bio_length CHECK (
    bio IS NULL OR LENGTH(bio) <= 500
  );

-- Add helpful comments
COMMENT ON CONSTRAINT username_length ON profiles IS 'Username must be between 3 and 30 characters';
COMMENT ON CONSTRAINT display_name_length ON profiles IS 'Display name must be between 1 and 50 characters';
COMMENT ON CONSTRAINT bio_length ON profiles IS 'Bio must not exceed 500 characters'; 