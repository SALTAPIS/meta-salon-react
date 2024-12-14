-- Create artworks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    vault_status TEXT DEFAULT 'active',
    vote_count INTEGER DEFAULT 0,
    vault_value INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on artworks
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can create artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can update their own artworks" ON public.artworks;

-- Create RLS policies for artworks
CREATE POLICY "Anyone can view artworks"
    ON public.artworks FOR SELECT
    USING (true);

CREATE POLICY "Users can create artworks"
    ON public.artworks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artworks"
    ON public.artworks FOR UPDATE
    USING (auth.uid() = user_id);

-- Create artwork_views table to track which artworks have been shown to users
CREATE TABLE IF NOT EXISTS public.artwork_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    artwork_id UUID REFERENCES public.artworks(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_artwork_view UNIQUE (user_id, artwork_id)
);

-- Enable RLS on artwork_views
ALTER TABLE public.artwork_views ENABLE ROW LEVEL SECURITY;

-- Create policies for artwork_views
CREATE POLICY "Users can view their own artwork views"
    ON public.artwork_views FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own artwork views"
    ON public.artwork_views FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artwork_views_user_id ON public.artwork_views(user_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON public.artwork_views(artwork_id);

-- Grant permissions
GRANT ALL ON public.artwork_views TO authenticated;

-- Create vote_packs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vote_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    votes_remaining INTEGER NOT NULL CHECK (votes_remaining >= 0),
    vote_power INTEGER NOT NULL CHECK (vote_power > 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on vote_packs
ALTER TABLE public.vote_packs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own vote packs" ON public.vote_packs;
DROP POLICY IF EXISTS "Users can create vote packs" ON public.vote_packs;

-- Create RLS policies for vote_packs
CREATE POLICY "Users can view their own vote packs"
    ON public.vote_packs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create vote packs"
    ON public.vote_packs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Drop existing votes table and its dependencies
DROP FUNCTION IF EXISTS public.cast_vote CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;

-- Create votes table with correct schema
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    artwork_id UUID REFERENCES public.artworks(id) NOT NULL,
    pack_id UUID REFERENCES public.vote_packs(id) NOT NULL,
    value INTEGER NOT NULL,
    vote_power INTEGER NOT NULL,
    total_value INTEGER NOT NULL,
    consumed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_artwork_vote UNIQUE (user_id, artwork_id)
);

-- Enable RLS on votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all votes" ON public.votes;
DROP POLICY IF EXISTS "Users can create votes" ON public.votes;
DROP POLICY IF EXISTS "prevent_duplicate_votes" ON public.votes;

-- Create RLS policies for votes
CREATE POLICY "Users can view all votes"
    ON public.votes FOR SELECT
    USING (true);

CREATE POLICY "Users can create votes"
    ON public.votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prevent_duplicate_votes" ON public.votes
FOR INSERT TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1
    FROM public.votes v
    WHERE v.user_id = auth.uid()
    AND v.artwork_id = artwork_id
  )
);

-- Create cast_vote function
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_artwork_id uuid,
    p_pack_id uuid,
    p_value integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_pack_votes integer;
    v_vote_power integer;
    v_vote_id uuid;
    v_artwork_status text;
    v_sln_value numeric;
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
    SELECT votes_remaining, vote_power INTO v_pack_votes, v_vote_power
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

    -- Calculate SLN value (vote power affects SLN value only)
    v_sln_value := p_value * v_vote_power;

    -- Create vote record
    INSERT INTO public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,
        vote_power,
        total_value,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,
        v_vote_power,
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

    -- Update artwork vote count and vault value
    -- vote_count gets incremented by 1 for each vote action
    -- vault_value gets the SLN value (vote value * vote power)
    UPDATE public.artworks
    SET 
        vote_count = COALESCE(vote_count, 0) + 1,
        vault_value = COALESCE(vault_value, 0) + v_sln_value,
        updated_at = now()
    WHERE id = p_artwork_id;

    -- Record artwork view
    INSERT INTO public.artwork_views (user_id, artwork_id)
    VALUES (v_user_id, p_artwork_id)
    ON CONFLICT (user_id, artwork_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'raw_votes', p_value,
        'sln_value', v_sln_value,
        'votes_remaining', v_pack_votes - p_value
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cast_vote TO authenticated;

-- Reset vote counts to correct values
WITH vote_counts AS (
  SELECT artwork_id, SUM(value) as actual_count
  FROM votes
  GROUP BY artwork_id
)
UPDATE artworks a
SET vote_count = COALESCE(vc.actual_count, 0)
FROM vote_counts vc
WHERE a.id = vc.artwork_id; 