DO $$ 
BEGIN
    -- Update all existing artworks to have 'active' vault_status
    UPDATE public.artworks
    SET vault_status = 'active'
    WHERE vault_status IS NULL OR vault_status = 'pending';

    -- Create a trigger to set vault_status to 'active' for new artworks
    CREATE OR REPLACE FUNCTION set_default_vault_status()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.vault_status := 'active';
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Drop trigger if it exists
    DROP TRIGGER IF EXISTS set_artwork_vault_status ON public.artworks;

    -- Create trigger
    CREATE TRIGGER set_artwork_vault_status
        BEFORE INSERT ON public.artworks
        FOR EACH ROW
        EXECUTE FUNCTION set_default_vault_status();

END $$; 