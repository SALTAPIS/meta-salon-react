-- Drop existing tables and functions
DROP FUNCTION IF EXISTS public.cast_vote;
DROP TABLE IF EXISTS public.vault_states;
DROP TABLE IF EXISTS public.votes;

-- Make sure artworks table has vault_status
ALTER TABLE public.artworks 
ADD COLUMN IF NOT EXISTS vault_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;

-- Create votes table
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    artwork_id UUID REFERENCES public.artworks(id),
    pack_id UUID REFERENCES public.vote_packs(id),
    value INTEGER NOT NULL,
    consumed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create vault_states table
CREATE TABLE public.vault_states (
    artwork_id UUID PRIMARY KEY REFERENCES public.artworks(id),
    vote_count INTEGER DEFAULT 0,
    last_vote_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cast_vote function
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_artwork_id uuid,
    p_pack_id uuid,
    p_value integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_pack_votes integer;
    v_used_votes integer;
    v_vote_id uuid;
    v_artwork_status text;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check artwork status
    SELECT vault_status INTO v_artwork_status
    FROM public.artworks
    WHERE id = p_artwork_id;

    IF v_artwork_status IS NULL THEN
        RAISE EXCEPTION 'Artwork not found';
    END IF;

    IF v_artwork_status != 'active' THEN
        RAISE EXCEPTION 'Artwork vault is not active';
    END IF;

    -- Check vote pack ownership and available votes
    SELECT votes_remaining INTO v_pack_votes
    FROM public.vote_packs
    WHERE id = p_pack_id
    AND user_id = v_user_id
    AND (expires_at IS NULL OR expires_at > now());

    IF v_pack_votes IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired vote pack';
    END IF;

    IF v_pack_votes < p_value THEN
        RAISE EXCEPTION 'Insufficient votes in pack. Available: %, Requested: %', 
            v_pack_votes, p_value;
    END IF;

    -- Create vote record
    INSERT INTO public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,
        now(),
        now()
    )
    RETURNING id INTO v_vote_id;

    -- Update vote pack
    UPDATE public.vote_packs
    SET 
        votes_remaining = votes_remaining - p_value,
        updated_at = now()
    WHERE id = p_pack_id;

    -- Update artwork vote count
    UPDATE public.artworks
    SET 
        vote_count = COALESCE(vote_count, 0) + p_value,
        updated_at = now()
    WHERE id = p_artwork_id;

    -- Update or insert vault state
    INSERT INTO public.vault_states (
        artwork_id,
        vote_count,
        last_vote_at,
        updated_at
    )
    VALUES (
        p_artwork_id,
        p_value,
        now(),
        now()
    )
    ON CONFLICT (artwork_id) DO UPDATE
    SET
        vote_count = COALESCE(vault_states.vote_count, 0) + p_value,
        last_vote_at = now(),
        updated_at = now();

    RETURN v_vote_id;
END;
$$;

-- Set up RLS policies
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_states ENABLE ROW LEVEL SECURITY;

-- Votes policies
CREATE POLICY "Users can view their own votes"
ON public.votes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own votes"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Vault states policies
CREATE POLICY "Anyone can view vault states"
ON public.vault_states FOR SELECT
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.votes TO authenticated;
GRANT ALL ON public.vault_states TO authenticated;
GRANT ALL ON public.artworks TO authenticated;
GRANT ALL ON public.vote_packs TO authenticated;

-- Set all artworks to active status
UPDATE public.artworks
SET vault_status = 'active'
WHERE vault_status IS NULL OR vault_status = '';