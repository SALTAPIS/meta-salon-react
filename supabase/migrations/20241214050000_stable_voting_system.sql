-- Drop existing objects
DROP FUNCTION IF EXISTS public.cast_vote CASCADE;
DROP TABLE IF EXISTS public.vault_states CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;

-- Make sure artworks table has required columns
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
END $$;

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    artwork_id UUID REFERENCES public.artworks(id) NOT NULL,
    pack_id UUID REFERENCES public.vote_packs(id) NOT NULL,
    value INTEGER NOT NULL,
    consumed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create vault_states table
CREATE TABLE IF NOT EXISTS public.vault_states (
    artwork_id UUID PRIMARY KEY REFERENCES public.artworks(id),
    vote_count INTEGER DEFAULT 0,
    last_vote_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cast_vote function
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_artwork_id UUID,
    p_pack_id UUID,
    p_value INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_pack_votes INTEGER;
    v_vote_id UUID;
    v_artwork_status TEXT;
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can create their own votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can view vault states" ON public.vault_states;

-- Create new policies
CREATE POLICY "Users can view their own votes"
ON public.votes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own votes"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

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