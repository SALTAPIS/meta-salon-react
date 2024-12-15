-- Drop existing function
DROP FUNCTION IF EXISTS get_next_artwork_pair();

-- Recreate function with single row return
CREATE OR REPLACE FUNCTION get_next_artwork_pair()
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
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
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
        AND m.user_id = v_user_id
    );

    -- Get next pair if any artworks remain
    IF v_remaining_count >= 2 THEN
        WITH available_artworks AS (
            SELECT a.id
            FROM public.artworks a
            WHERE (a.status = 'approved' OR a.status = 'submitted')
            AND a.vault_status = 'active'
            AND NOT EXISTS (
                SELECT 1
                FROM public.artwork_matches m
                WHERE (m.artwork_id_1 = a.id OR m.artwork_id_2 = a.id)
                AND m.user_id = v_user_id
            )
            ORDER BY random()
            LIMIT 2
        ),
        pair AS (
            SELECT
                (array_agg(id))[1] as artwork_id_1,
                (array_agg(id))[2] as artwork_id_2,
                v_remaining_count as remaining_count
            FROM available_artworks
        )
        SELECT * FROM pair LIMIT 1;
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