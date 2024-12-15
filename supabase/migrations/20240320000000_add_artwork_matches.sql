-- Create artwork_matches table to track matches
CREATE TABLE IF NOT EXISTS public.artwork_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id_1 UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    artwork_id_2 UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT different_artworks CHECK (artwork_id_1 != artwork_id_2),
    CONSTRAINT winner_must_be_participant CHECK (winner_id IN (artwork_id_1, artwork_id_2))
);

-- Enable RLS
ALTER TABLE public.artwork_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all matches"
    ON public.artwork_matches FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own matches"
    ON public.artwork_matches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to update artwork stats after a match
CREATE OR REPLACE FUNCTION update_artwork_stats_after_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Update winner's stats
    UPDATE public.artworks
    SET wins = wins + 1
    WHERE id = NEW.winner_id;

    -- Update loser's stats
    UPDATE public.artworks
    SET losses = losses + 1
    WHERE id IN (NEW.artwork_id_1, NEW.artwork_id_2)
        AND id != NEW.winner_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats after match
CREATE TRIGGER after_match_insert
    AFTER INSERT ON public.artwork_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_artwork_stats_after_match();

-- Function to get next artwork pair for a user
CREATE OR REPLACE FUNCTION get_next_artwork_pair(p_user_id UUID)
RETURNS TABLE (artwork_id_1 UUID, artwork_id_2 UUID) AS $$
BEGIN
    RETURN QUERY
    WITH available_artworks AS (
        SELECT a.id
        FROM public.artworks a
        WHERE a.status = 'approved'
        AND a.vault_status = 'active'
        AND NOT EXISTS (
            SELECT 1
            FROM public.artwork_views av
            WHERE av.artwork_id = a.id
            AND av.user_id = p_user_id
        )
        ORDER BY random()
        LIMIT 2
    )
    SELECT
        (array_agg(id))[1] as artwork_id_1,
        (array_agg(id))[2] as artwork_id_2
    FROM available_artworks;
END;
$$ LANGUAGE plpgsql; 