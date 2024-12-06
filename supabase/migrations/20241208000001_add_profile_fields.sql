-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;

-- Create a function to generate a unique username from email
CREATE OR REPLACE FUNCTION generate_unique_username(email text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    base_username text;
    test_username text;
    counter integer := 0;
BEGIN
    -- Extract everything before the @ symbol and remove special characters
    base_username := lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    
    -- Initial try with just the base username
    test_username := base_username;
    
    -- Keep trying with incrementing numbers until we find a unique username
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = test_username) LOOP
        counter := counter + 1;
        test_username := base_username || counter::text;
    END LOOP;
    
    RETURN test_username;
END;
$$;

-- Update existing profiles with generated usernames if they don't have one
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, email FROM profiles WHERE username IS NULL AND email IS NOT NULL
    LOOP
        UPDATE profiles 
        SET username = generate_unique_username(r.email)
        WHERE id = r.id;
    END LOOP;
END;
$$;

-- Create a trigger to generate username for new profiles
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger AS $$
BEGIN
    IF NEW.username IS NULL AND NEW.email IS NOT NULL THEN
        NEW.username := generate_unique_username(NEW.email);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_profile_username ON profiles;
CREATE TRIGGER ensure_profile_username
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_profile(); 