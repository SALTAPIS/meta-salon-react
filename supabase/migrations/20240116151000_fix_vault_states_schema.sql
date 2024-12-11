-- Drop existing table
DROP TABLE IF EXISTS public.vault_states CASCADE;

-- Create vault_states table with correct schema
CREATE TABLE public.vault_states (
    artwork_id UUID PRIMARY KEY REFERENCES public.artworks(id),
    vote_count INTEGER DEFAULT 0,
    accumulated_value NUMERIC DEFAULT 0,
    last_vote_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS policies
ALTER TABLE public.vault_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view vault states"
ON public.vault_states FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON public.vault_states TO authenticated;

-- Initialize vault states for existing artworks
INSERT INTO public.vault_states (artwork_id, vote_count, accumulated_value)
SELECT 
    id,
    COALESCE(vote_count, 0),
    COALESCE(vault_value, 0)
FROM public.artworks
ON CONFLICT (artwork_id) DO UPDATE
SET 
    vote_count = EXCLUDED.vote_count,
    accumulated_value = EXCLUDED.accumulated_value; 