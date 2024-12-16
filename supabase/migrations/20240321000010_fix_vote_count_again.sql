-- Update cast_vote function to properly handle vote counts with vote power
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
        RAISE EXCEPTION 'One or both artworks not active';
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

    -- Calculate total vote value
    v_total_value := p_value * v_vote_power;

    -- Create match record
    INSERT INTO public.artwork_matches (
        artwork_id_1,
        artwork_id_2,
        winner_id,
        loser_id,
        user_id,
        vote_power
    ) VALUES (
        p_artwork_id,
        p_other_artwork_id,
        CASE WHEN p_value > 0 THEN p_artwork_id ELSE p_other_artwork_id END,
        CASE WHEN p_value > 0 THEN p_other_artwork_id ELSE p_artwork_id END,
        v_user_id,
        v_vote_power
    )
    RETURNING id INTO v_match_id;

    -- Update vote pack
    UPDATE public.vote_packs
    SET 
        votes_remaining = votes_remaining - p_value,
        votes_used = votes_used + p_value,
        updated_at = now()
    WHERE id = p_pack_id;

    -- Update artwork vote counts and vault values
    -- For the winner: increment vote_count by 1 per vote, vault_value by total value
    UPDATE public.artworks
    SET 
        vote_count = vote_count + p_value, -- Changed to p_value (number of votes)
        vault_value = vault_value + v_total_value, -- Total value (votes * power)
        wins = wins + 1,
        updated_at = now()
    WHERE id = CASE WHEN p_value > 0 THEN p_artwork_id ELSE p_other_artwork_id END;

    -- For the loser: just increment losses
    UPDATE public.artworks
    SET 
        losses = losses + 1,
        updated_at = now()
    WHERE id = CASE WHEN p_value > 0 THEN p_other_artwork_id ELSE p_artwork_id END;

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
GRANT EXECUTE ON FUNCTION public.cast_vote(UUID, UUID, UUID, INTEGER) TO authenticated; 