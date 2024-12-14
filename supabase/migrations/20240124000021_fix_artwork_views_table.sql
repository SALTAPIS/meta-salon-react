-- Drop existing table if it exists
DROP TABLE IF EXISTS public.artwork_views;

-- Create artwork_views table
CREATE TABLE public.artwork_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT artwork_views_user_artwork_unique UNIQUE (user_id, artwork_id)
);

-- Add foreign key constraint to auth.users
ALTER TABLE public.artwork_views
ADD CONSTRAINT artwork_views_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Set up RLS policies
ALTER TABLE public.artwork_views ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own views
CREATE POLICY "Users can view their own artwork views"
ON public.artwork_views
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create their own views
CREATE POLICY "Users can create their own artwork views"
ON public.artwork_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admins full access
CREATE POLICY "Admins have full access to artwork views"
ON public.artwork_views
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.artwork_views TO authenticated; 