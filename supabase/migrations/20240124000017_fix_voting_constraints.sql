-- Create artwork_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.artwork_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    artwork_id UUID REFERENCES public.artworks(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_artwork_view UNIQUE (user_id, artwork_id)
);

-- Enable RLS on artwork_views
ALTER TABLE public.artwork_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own artwork views" ON public.artwork_views;
DROP POLICY IF EXISTS "Users can create their own artwork views" ON public.artwork_views;
DROP POLICY IF EXISTS "Admins can view all artwork views" ON public.artwork_views;

-- Create policies for artwork_views
CREATE POLICY "Users can view their own artwork views"
    ON public.artwork_views FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own artwork views"
    ON public.artwork_views FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all artwork views"
    ON public.artwork_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artwork_views_user_id ON public.artwork_views(user_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON public.artwork_views(artwork_id);

-- Add unique constraint to votes table to prevent duplicate votes
ALTER TABLE public.votes
ADD CONSTRAINT unique_user_artwork_vote UNIQUE (user_id, artwork_id);

-- Update cast_vote function to handle the unique constraint
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

    -- Check if user has already voted on this artwork
    IF EXISTS (
        SELECT 1 FROM public.votes
        WHERE user_id = v_user_id
        AND artwork_id = p_artwork_id
    ) THEN
        RAISE EXCEPTION 'You have already voted on this artwork';
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

    -- Calculate SLN value (vote value * vote power)
    v_sln_value := p_value * v_vote_power;

    -- Create vote record
    INSERT INTO public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,
        vote_power,
        total_value,
        sln_value,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,
        v_vote_power,
        v_sln_value,
        v_sln_value,
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

-- Grant permissions
GRANT ALL ON public.artwork_views TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_vote TO authenticated;