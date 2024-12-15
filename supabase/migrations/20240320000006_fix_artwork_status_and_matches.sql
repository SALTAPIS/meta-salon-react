-- First, let's check the current status of artworks and matches
DO $$
DECLARE
    v_artwork_count INTEGER;
    v_match_count INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO v_artwork_count
    FROM public.artworks
    WHERE (status = 'approved' OR status = 'submitted')
    AND vault_status = 'active';

    SELECT COUNT(*) INTO v_match_count
    FROM public.artwork_matches;

    RAISE NOTICE 'Current state: % active artworks, % matches', v_artwork_count, v_match_count;

    -- Update any NULL statuses to 'submitted'
    UPDATE public.artworks
    SET status = 'submitted'
    WHERE status IS NULL;

    -- Ensure all non-rejected artworks have active vault status
    UPDATE public.artworks
    SET vault_status = 'active'
    WHERE status != 'rejected'
    AND (vault_status IS NULL OR vault_status != 'active');

    -- Clean up any matches that reference non-existent artworks
    DELETE FROM public.artwork_matches m
    WHERE NOT EXISTS (
        SELECT 1 FROM public.artworks a
        WHERE a.id = m.artwork_id_1
    )
    OR NOT EXISTS (
        SELECT 1 FROM public.artworks a
        WHERE a.id = m.artwork_id_2
    );

    -- Get final counts
    SELECT COUNT(*) INTO v_artwork_count
    FROM public.artworks
    WHERE (status = 'approved' OR status = 'submitted')
    AND vault_status = 'active';

    SELECT COUNT(*) INTO v_match_count
    FROM public.artwork_matches;

    RAISE NOTICE 'After cleanup: % active artworks, % matches', v_artwork_count, v_match_count;
END $$; 