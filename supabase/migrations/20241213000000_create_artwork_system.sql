-- Create artwork storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for artworks
CREATE POLICY "Artwork images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

CREATE POLICY "Users can upload their own artwork"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artworks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own artwork"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'artworks' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'artworks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own artwork"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'artworks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create albums table
CREATE TABLE public.albums (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_default_album_per_user UNIQUE (user_id, is_default)
);

-- Create artworks table
CREATE TABLE public.artworks (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    album_id UUID REFERENCES public.albums(id),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submission_fee BIGINT,
    challenge_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up RLS policies for albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all albums"
ON public.albums FOR SELECT
USING (true);

CREATE POLICY "Users can create their own albums"
ON public.albums FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums"
ON public.albums FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums"
ON public.albums FOR DELETE
USING (auth.uid() = user_id);

-- Set up RLS policies for artworks
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all artworks"
ON public.artworks FOR SELECT
USING (true);

CREATE POLICY "Users can create their own artworks"
ON public.artworks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artworks"
ON public.artworks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artworks"
ON public.artworks FOR DELETE
USING (auth.uid() = user_id);

-- Create function to ensure user has default album
CREATE OR REPLACE FUNCTION public.ensure_default_album()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.albums (user_id, name, description, is_default)
  VALUES (NEW.id, 'Default Album', 'Your default album for artworks', true)
  ON CONFLICT (user_id, is_default) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create default album for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_default_album();

-- Add indexes for performance
CREATE INDEX idx_artworks_user_id ON public.artworks(user_id);
CREATE INDEX idx_artworks_album_id ON public.artworks(album_id);
CREATE INDEX idx_artworks_status ON public.artworks(status);
CREATE INDEX idx_albums_user_id ON public.albums(user_id); 