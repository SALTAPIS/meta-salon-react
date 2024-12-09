-- Add vault_status column to artworks table
ALTER TABLE public.artworks
ADD COLUMN IF NOT EXISTS vault_status text DEFAULT 'active'::text NOT NULL;

-- Add check constraint for valid vault_status values
ALTER TABLE public.artworks
ADD CONSTRAINT artworks_vault_status_check 
CHECK (vault_status IN ('active', 'locked', 'closed')); 