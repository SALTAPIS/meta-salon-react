-- Drop the old function
DROP FUNCTION IF EXISTS get_next_artwork_pair(UUID);

-- Create updated function with remaining count
CREATE OR REPLACE FUNCTION get_next_artwork_pair(p_user_id UUID)
RETURNS TABLE (
    artwork_id_1 UUID,
    artwork_id_2 UUID,
    remaining_count INTEGER
) AS $$
DECLARE
    v_remaining_count INTEGER;
BEGIN
    -- Get count of remaining artworks to vote on
    SELECT COUNT(*)
    INTO v_remaining_count
    FROM public.artworks a
    WHERE a.status = 'approved'
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
            WHERE a.status = 'approved'
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