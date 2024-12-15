-- Drop existing trigger first
DROP TRIGGER IF EXISTS after_match_insert ON public.artwork_matches;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_next_artwork_pair(UUID);
DROP FUNCTION IF EXISTS update_artwork_stats_after_match();

-- Recreate get_next_artwork_pair with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_next_artwork_pair(p_user_id UUID)
RETURNS TABLE (
    artwork_id_1 UUID,
    artwork_id_2 UUID,
    remaining_count INTEGER
) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_remaining_count INTEGER;
BEGIN
    -- Get count of remaining artworks to vote on
    SELECT COUNT(*)
    INTO v_remaining_count
    FROM public.artworks a
    WHERE (a.status = 'approved' OR a.status = 'submitted')
    AND a.vault_status = 'active'
    AND NOT EXISTS (
        SELECT 1
        FROM public.artwork_matches m
        WHERE (m.artwork_id_1 = a.id OR m.artwork_id_2 = a.id)
        AND m.user_id = p_user_id
    );

    -- Get next pair if any artworks remain
    IF v_remaining_count >= 2 THEN
        RETURN QUERY
        WITH available_artworks AS (
            SELECT a.id
            FROM public.artworks a
            WHERE (a.status = 'approved' OR a.status = 'submitted')
            AND a.vault_status = 'active'
            AND NOT EXISTS (
                SELECT 1
                FROM public.artwork_matches m
                WHERE (m.artwork_id_1 = a.id OR m.artwork_id_2 = a.id)
                AND m.user_id = p_user_id
            )
            ORDER BY random()
            LIMIT 2
        )
        SELECT
            (array_agg(id))[1],
            (array_agg(id))[2],
            v_remaining_count
        FROM available_artworks;
    ELSE
        -- Return null pair but with remaining count
        RETURN QUERY
        SELECT
            NULL::UUID,
            NULL::UUID,
            v_remaining_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate update_artwork_stats_after_match with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_artwork_stats_after_match()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Create new trigger
CREATE TRIGGER after_match_insert
    AFTER INSERT ON public.artwork_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_artwork_stats_after_match(); 