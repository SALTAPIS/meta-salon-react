-- Set all artworks to active vault_status
UPDATE public.artworks
SET vault_status = 'active'
WHERE vault_status IS NULL OR vault_status = ''; 