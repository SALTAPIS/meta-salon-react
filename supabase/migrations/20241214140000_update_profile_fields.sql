-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- Update existing RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create or replace function to handle profile updates
CREATE OR REPLACE FUNCTION public.update_profile(
    profile_id uuid,
    username_arg text DEFAULT NULL,
    display_name_arg text DEFAULT NULL,
    bio_arg text DEFAULT NULL,
    avatar_url_arg text DEFAULT NULL,
    premium_until_arg timestamptz DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_record public.profiles;
BEGIN
    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id) THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    -- Update the profile
    UPDATE public.profiles
    SET
        username = COALESCE(username_arg, username),
        display_name = COALESCE(display_name_arg, display_name),
        bio = COALESCE(bio_arg, bio),
        avatar_url = COALESCE(avatar_url_arg, avatar_url),
        premium_until = COALESCE(premium_until_arg, premium_until),
        updated_at = now()
    WHERE id = profile_id
    RETURNING * INTO profile_record;

    RETURN profile_record;
END;
$$; 