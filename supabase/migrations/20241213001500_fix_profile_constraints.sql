-- Drop existing constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS username_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS display_name_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS bio_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

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
  ),
  ADD CONSTRAINT profiles_role_check CHECK (
    role IN ('user', 'admin', 'artist', 'moderator')
  );

-- Drop existing RLS policies for profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile public read access" ON public.profiles;
DROP POLICY IF EXISTS "Profile owner update access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable profile creation during signup"
    ON public.profiles FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access"
    ON public.profiles
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, balance, email_verified)
    VALUES (
        new.id,
        new.email,
        'user',
        500,  -- Initial balance
        false
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;

-- Add helpful comments
COMMENT ON CONSTRAINT username_length ON profiles IS 'Username must be between 3 and 30 characters';
COMMENT ON CONSTRAINT display_name_length ON profiles IS 'Display name must be between 1 and 50 characters';
COMMENT ON CONSTRAINT bio_length ON profiles IS 'Bio must not exceed 500 characters'; 