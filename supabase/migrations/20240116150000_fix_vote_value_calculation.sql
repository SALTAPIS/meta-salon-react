-- Drop existing function
DROP FUNCTION IF EXISTS public.cast_vote;

-- Create updated cast_vote function with correct value calculation
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
    v_total_value integer;
    v_sln_value numeric;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Not authenticated'
        );
    END IF;

    -- Check artwork status
    SELECT vault_status INTO v_artwork_status
    FROM public.artworks
    WHERE id = p_artwork_id;

    IF v_artwork_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Artwork not found'
        );
    END IF;

    IF v_artwork_status != 'active' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Artwork vault is not active'
        );
    END IF;

    -- Check vote pack ownership and available votes
    SELECT votes_remaining, vote_power INTO v_pack_votes, v_vote_power
    FROM public.vote_packs
    WHERE id = p_pack_id
    AND user_id = v_user_id
    AND (expires_at IS NULL OR expires_at > now());

    IF v_pack_votes IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired vote pack'
        );
    END IF;

    IF v_pack_votes < p_value THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient votes in pack. Available: %s, Requested: %s', 
                v_pack_votes, p_value)
        );
    END IF;

    -- Calculate total vote value and SLN value
    -- Total value is the raw vote count multiplied by vote power
    v_total_value := p_value * v_vote_power;
    -- SLN value is the same as vote power (1 vote = vote_power SLN)
    v_sln_value := p_value * v_vote_power;

    -- Create vote record with SLN value
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
        v_total_value,
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

    -- Update artwork vote count and SLN value
    UPDATE public.artworks
    SET 
        vote_count = COALESCE(vote_count, 0) + v_total_value,
        vault_value = COALESCE(vault_value, 0) + v_sln_value,
        updated_at = now()
    WHERE id = p_artwork_id;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'total_value', v_total_value,
        'sln_value', v_sln_value,
        'votes_remaining', v_pack_votes - p_value
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cast_vote TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_vote TO anon; 