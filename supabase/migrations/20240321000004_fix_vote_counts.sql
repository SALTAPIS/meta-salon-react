-- Drop existing cast_vote function
DROP FUNCTION IF EXISTS public.cast_vote(uuid, uuid, uuid, integer);

-- Update cast_vote function to properly update vote counts and vault values
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_artwork_id UUID,
    p_other_artwork_id UUID,
    p_pack_id UUID,
    p_value INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_pack_votes INTEGER;
    v_vote_power INTEGER;
    v_vote_id UUID;
    v_artwork_status TEXT;
    v_other_artwork_status TEXT;
    v_match_id UUID;
    v_total_value INTEGER;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check artwork statuses
    SELECT vault_status INTO v_artwork_status
    FROM public.artworks
    WHERE id = p_artwork_id;

    SELECT vault_status INTO v_other_artwork_status
    FROM public.artworks
    WHERE id = p_other_artwork_id;

    IF v_artwork_status IS NULL OR v_other_artwork_status IS NULL THEN
        RAISE EXCEPTION 'One or both artworks not found';
    END IF;

    IF v_artwork_status != 'active' OR v_other_artwork_status != 'active' THEN
        RAISE EXCEPTION 'One or both artwork vaults are not active';
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

    -- Calculate total vote value (value * vote_power)
    v_total_value := p_value * v_vote_power;

    -- Record the match
    INSERT INTO artwork_matches (
        user_id,
        artwork_id_1,
        artwork_id_2,
        winner_id,
        loser_id,
        vote_power
    ) VALUES (
        v_user_id,
        p_artwork_id,
        p_other_artwork_id,
        CASE WHEN p_value > 0 THEN p_artwork_id ELSE p_other_artwork_id END,
        CASE WHEN p_value > 0 THEN p_other_artwork_id ELSE p_artwork_id END,
        v_vote_power
    ) RETURNING id INTO v_match_id;

    -- Record the vote
    INSERT INTO votes (
        user_id,
        artwork_id,
        pack_id,
        value,
        vote_power,
        total_value
    ) VALUES (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,
        v_vote_power,
        v_total_value
    ) RETURNING id INTO v_vote_id;

    -- Update vote pack
    UPDATE vote_packs
    SET votes_remaining = votes_remaining - 1,
        votes_used = votes_used + 1,
        updated_at = now()
    WHERE id = p_pack_id;

    -- Update winning artwork vote count and vault value
    UPDATE artworks
    SET vote_count = vote_count + 1,
        vault_value = vault_value + v_total_value,
        updated_at = now()
    WHERE id = p_artwork_id;

    -- Return match details
    RETURN jsonb_build_object(
        'match_id', v_match_id,
        'winner_id', CASE WHEN p_value > 0 THEN p_artwork_id ELSE p_other_artwork_id END,
        'loser_id', CASE WHEN p_value > 0 THEN p_other_artwork_id ELSE p_artwork_id END,
        'vote_power', v_vote_power,
        'total_value', v_total_value
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cast_vote TO authenticated; 