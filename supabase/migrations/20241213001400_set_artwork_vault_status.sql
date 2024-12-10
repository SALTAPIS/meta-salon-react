-- Add vault_status column if it doesn't exist
ALTER TABLE public.artworks 
ADD COLUMN IF NOT EXISTS vault_status TEXT DEFAULT 'active';

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
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_default_vault_status_trigger ON public.artworks;
CREATE TRIGGER set_default_vault_status_trigger
    BEFORE INSERT ON public.artworks
    FOR EACH ROW
    EXECUTE FUNCTION set_default_vault_status(); 