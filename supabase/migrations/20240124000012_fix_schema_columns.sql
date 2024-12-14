-- Add missing columns to votes table
ALTER TABLE public.votes
ADD COLUMN IF NOT EXISTS consumed_at timestamptz,
ADD COLUMN IF NOT EXISTS sln_value numeric;

-- Add missing columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payout_id uuid;

-- Create vault_states table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vault_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id uuid REFERENCES public.artworks(id) NOT NULL,
    accumulated_value numeric DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_artwork_vault_state UNIQUE (artwork_id)
);

-- Enable RLS on vault_states
ALTER TABLE public.vault_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view vault states" ON public.vault_states;
DROP POLICY IF EXISTS "Admins can update vault states" ON public.vault_states;

-- Create policies for vault_states
CREATE POLICY "Anyone can view vault states"
    ON public.vault_states FOR SELECT
    USING (true);

CREATE POLICY "Admins can update vault states"
    ON public.vault_states FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.vault_states TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 