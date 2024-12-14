-- Create artwork_views table to track which artworks have been shown to users
CREATE TABLE IF NOT EXISTS public.artwork_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    artwork_id UUID REFERENCES public.artworks(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_artwork_view UNIQUE (user_id, artwork_id)
);

-- Enable RLS on artwork_views
ALTER TABLE public.artwork_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own artwork views" ON public.artwork_views;
DROP POLICY IF EXISTS "Users can create their own artwork views" ON public.artwork_views;

-- Create policies for artwork_views
CREATE POLICY "Users can view their own artwork views"
    ON public.artwork_views FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own artwork views"
    ON public.artwork_views FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artwork_views_user_id ON public.artwork_views(user_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON public.artwork_views(artwork_id);

-- Grant permissions
GRANT ALL ON public.artwork_views TO authenticated;
