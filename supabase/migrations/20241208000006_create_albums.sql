-- Create albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    privacy text DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'unlisted')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create images table
CREATE TABLE IF NOT EXISTS public.images (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    album_id uuid REFERENCES public.albums ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title text,
    description text,
    storage_path text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to ensure each user has a default album
CREATE OR REPLACE FUNCTION ensure_default_album()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create default album if user doesn't have one
    IF NOT EXISTS (
        SELECT 1 FROM public.albums 
        WHERE user_id = NEW.id AND is_default = true
    ) THEN
        INSERT INTO public.albums (
            user_id,
            title,
            description,
            is_default,
            privacy
        ) VALUES (
            NEW.id,
            'Default Album',
            'My public profile album',
            true,
            'public'
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for default album
DROP TRIGGER IF EXISTS on_profile_created_album ON profiles;
CREATE TRIGGER on_profile_created_album
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_default_album();

-- Enable RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create policies for albums
CREATE POLICY "Users can view public albums"
    ON public.albums
    FOR SELECT
    USING (
        privacy = 'public' OR
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can manage their own albums"
    ON public.albums
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create policies for images
CREATE POLICY "Users can view images in accessible albums"
    ON public.images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE albums.id = images.album_id
            AND (
                albums.privacy = 'public' OR
                albums.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Users can manage their own images"
    ON public.images
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid()); 