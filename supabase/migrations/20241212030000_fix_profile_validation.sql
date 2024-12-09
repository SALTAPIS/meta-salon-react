-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update profile validation
ALTER TABLE public.profiles
  ADD CONSTRAINT display_name_length 
  CHECK (
    display_name IS NULL OR 
    (length(display_name) >= 1 AND length(display_name) <= 50)
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT username_format 
  CHECK (
    username IS NULL OR 
    (length(username) >= 3 AND length(username) <= 30 AND username ~ '^[a-zA-Z0-9_-]+$')
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT bio_length 
  CHECK (
    bio IS NULL OR 
    length(bio) <= 500
  );

-- Update profile function to handle validation
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate display name
  IF NEW.display_name IS NOT NULL AND (length(NEW.display_name) < 1 OR length(NEW.display_name) > 50) THEN
    RAISE EXCEPTION 'Display name must be between 1 and 50 characters';
  END IF;

  -- Validate username
  IF NEW.username IS NOT NULL AND (
    length(NEW.username) < 3 OR 
    length(NEW.username) > 30 OR 
    NEW.username !~ '^[a-zA-Z0-9_-]+$'
  ) THEN
    RAISE EXCEPTION 'Username must be between 3 and 30 characters and contain only letters, numbers, underscores, and hyphens';
  END IF;

  -- Validate bio
  IF NEW.bio IS NOT NULL AND length(NEW.bio) > 500 THEN
    RAISE EXCEPTION 'Bio must not exceed 500 characters';
  END IF;

  -- Set updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update(); 