-- Check if storage extension is available
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_available_extensions 
        WHERE name = 'storage'
    ) THEN
        -- Enable storage if available
        CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";
    END IF;
END $$;

-- Create avatars bucket if storage is available
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'storage'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true)
        ON CONFLICT (id) DO NOTHING;

        -- Create album-images bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('album-images', 'album-images', true)
        ON CONFLICT (id) DO NOTHING;

        -- Set up security policies for avatars
        CREATE POLICY "Avatar images are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');

        CREATE POLICY "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );

        CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );

        CREATE POLICY "Users can delete their own avatar"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Set up security policies for album images
CREATE POLICY "Album images are accessible based on album privacy"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'album-images' AND
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE 
            a.id::text = (storage.foldername(name))[2] AND
            (
                a.privacy = 'public' OR
                a.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            )
    )
);

CREATE POLICY "Users can upload images to their own albums"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'album-images' AND
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE 
            a.user_id = auth.uid() AND
            a.id::text = (storage.foldername(name))[2]
    )
);

CREATE POLICY "Users can update images in their own albums"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'album-images' AND
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE 
            a.user_id = auth.uid() AND
            a.id::text = (storage.foldername(name))[2]
    )
)
WITH CHECK (
    bucket_id = 'album-images' AND
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE 
            a.user_id = auth.uid() AND
            a.id::text = (storage.foldername(name))[2]
    )
);

CREATE POLICY "Users can delete images from their own albums"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'album-images' AND
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE 
            a.user_id = auth.uid() AND
            a.id::text = (storage.foldername(name))[2]
    )
);

-- Create storage triggers for cleanup
CREATE OR REPLACE FUNCTION delete_storage_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM storage.objects
    WHERE name LIKE OLD.id::text || '/%';
    RETURN OLD;
END;
$$;

-- Add trigger to clean up album images when album is deleted
DROP TRIGGER IF EXISTS on_album_deleted ON public.albums;
CREATE TRIGGER on_album_deleted
    AFTER DELETE ON public.albums
    FOR EACH ROW
    EXECUTE FUNCTION delete_storage_object(); 