-- Add new profile fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS display_name text;

-- Create function to generate unique username from email
CREATE OR REPLACE FUNCTION generate_unique_username(email text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    base_username text;
    temp_username text;
    counter integer := 0;
BEGIN
    -- Extract part before @ and remove special characters
    base_username := lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    temp_username := base_username;
    
    -- Keep trying until we find a unique username
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = temp_username) LOOP
        counter := counter + 1;
        temp_username := base_username || counter::text;
    END LOOP;
    
    RETURN temp_username;
END;
$$;

-- Create trigger to generate username if not provided
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Generate username if not provided
    IF NEW.username IS NULL THEN
        NEW.username := generate_unique_username(NEW.email);
    END IF;

    -- Set display_name if not provided
    IF NEW.display_name IS NULL THEN
        NEW.display_name := split_part(NEW.email, '@', 1);
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_profile();

-- Add username validation check
ALTER TABLE profiles
ADD CONSTRAINT username_format CHECK (
    username ~* '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$'
); 