-- Add vault_status and vote_count columns if they don't exist
DO $$ 
BEGIN
    -- Add vault_status if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'artworks' 
        AND column_name = 'vault_status'
    ) THEN
        ALTER TABLE public.artworks ADD COLUMN vault_status TEXT DEFAULT 'active';
    END IF;

    -- Add vote_count if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'artworks' 
        AND column_name = 'vote_count'
    ) THEN
        ALTER TABLE public.artworks ADD COLUMN vote_count INTEGER DEFAULT 0;
    END IF;

    -- Update existing rows to have vault_status = 'active' if null
    UPDATE public.artworks 
    SET vault_status = 'active' 
    WHERE vault_status IS NULL;

    -- Update existing rows to have vote_count = 0 if null
    UPDATE public.artworks 
    SET vote_count = 0 
    WHERE vote_count IS NULL;
END $$; 