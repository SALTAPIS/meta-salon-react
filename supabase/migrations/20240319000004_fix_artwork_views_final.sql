-- Add unique constraint to votes table to prevent duplicate votes
ALTER TABLE votes DROP CONSTRAINT IF EXISTS unique_user_artwork_vote;
ALTER TABLE votes ADD CONSTRAINT unique_user_artwork_vote UNIQUE (user_id, artwork_id);

-- Update the cast_vote function to properly record views and prevent duplicate votes
CREATE OR REPLACE FUNCTION public.cast_vote(p_artwork_id uuid, p_pack_id uuid, p_value integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_pack_votes integer;
    v_vote_power integer;
    v_vote_id uuid;
    v_artwork_status text;
    v_sln_value numeric;
    v_other_artwork_id uuid;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if artwork exists and get its status
    SELECT status INTO v_artwork_status
    FROM artworks
    WHERE id = p_artwork_id;

    IF v_artwork_status IS NULL THEN
        RAISE EXCEPTION 'Artwork not found';
    END IF;

    IF v_artwork_status != 'active' THEN
        RAISE EXCEPTION 'Artwork is not active';
    END IF;

    -- Check if user has already voted on this artwork
    IF EXISTS (SELECT 1 FROM votes WHERE user_id = v_user_id AND artwork_id = p_artwork_id) THEN
        RAISE EXCEPTION 'User has already voted on this artwork';
    END IF;

    -- Check vote pack and get remaining votes
    SELECT votes_remaining, vote_power INTO v_pack_votes, v_vote_power
    FROM vote_packs
    WHERE id = p_pack_id AND user_id = v_user_id;

    IF v_pack_votes IS NULL THEN
        RAISE EXCEPTION 'Vote pack not found or does not belong to user';
    END IF;

    IF v_pack_votes <= 0 THEN
        RAISE EXCEPTION 'No votes remaining in pack';
    END IF;

    -- Record the artwork view for the voted artwork
    INSERT INTO artwork_views (user_id, artwork_id)
    VALUES (v_user_id, p_artwork_id)
    ON CONFLICT (user_id, artwork_id) DO NOTHING;

    -- Find and record the other artwork in the pair
    -- This assumes that artworks are always shown in pairs
    -- and that when a user votes on one artwork, they've also seen its pair
    WITH recent_views AS (
        SELECT artwork_id, created_at
        FROM artwork_views
        WHERE user_id = v_user_id
        ORDER BY created_at DESC
        LIMIT 1
    )
    SELECT a.id INTO v_other_artwork_id
    FROM artworks a
    LEFT JOIN recent_views rv ON a.id = rv.artwork_id
    WHERE a.id != p_artwork_id
      AND a.status = 'active'
      AND rv.artwork_id IS NULL
    ORDER BY random()
    LIMIT 1;

    IF v_other_artwork_id IS NOT NULL THEN
        INSERT INTO artwork_views (user_id, artwork_id)
        VALUES (v_user_id, v_other_artwork_id)
        ON CONFLICT (user_id, artwork_id) DO NOTHING;
    END IF;

    -- Cast the vote
    INSERT INTO votes (user_id, artwork_id, vote_pack_id, value, vote_power)
    VALUES (v_user_id, p_artwork_id, p_pack_id, p_value, v_vote_power)
    RETURNING id INTO v_vote_id;

    -- Update vote pack
    UPDATE vote_packs
    SET votes_remaining = votes_remaining - 1,
        votes_used = votes_used + 1,
        updated_at = now()
    WHERE id = p_pack_id;

    -- Update artwork vote count and vault value
    WITH vote_sum AS (
        SELECT SUM(value) as total_value
        FROM votes
        WHERE artwork_id = p_artwork_id
    )
    UPDATE artworks
    SET vote_count = vote_count + 1,
        vault_value = COALESCE((SELECT total_value FROM vote_sum), 0)
    WHERE id = p_artwork_id;

    -- Return vote details
    RETURN jsonb_build_object(
        'vote_id', v_vote_id,
        'artwork_id', p_artwork_id,
        'value', p_value,
        'vote_power', v_vote_power
    );
END;
$function$; 