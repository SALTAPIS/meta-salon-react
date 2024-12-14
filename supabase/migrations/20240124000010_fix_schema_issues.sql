-- Fix votes table
ALTER TABLE public.votes
ADD COLUMN IF NOT EXISTS sln_value numeric,
ADD COLUMN IF NOT EXISTS consumed_at timestamptz;

-- Fix transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payout_id uuid;

-- Fix vault_states table
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

-- Fix admin_reset_all_votes function
CREATE OR REPLACE FUNCTION public.admin_reset_all_votes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Check if the user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_user_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can reset all votes';
    END IF;

    -- Reset all vote-related data
    UPDATE public.artworks
    SET 
        vote_count = 0,
        vault_value = 0;

    DELETE FROM public.votes;
    DELETE FROM public.artwork_views;
    
    -- Reset vault states
    UPDATE public.vault_states
    SET accumulated_value = 0;
END;
$$;

-- Grant permissions
GRANT ALL ON public.vault_states TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 