-- Drop and recreate consume_votes function
DROP FUNCTION IF EXISTS public.consume_votes;
CREATE FUNCTION public.consume_votes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.votes
    SET 
        consumed = true,
        updated_at = now()
    WHERE consumed = false;
END;
$$;

-- Drop and recreate request_artist_payout function
DROP FUNCTION IF EXISTS public.request_artist_payout;
CREATE FUNCTION public.request_artist_payout(
    p_artwork_id uuid,
    p_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_available_amount numeric;
    v_payout_id uuid;
BEGIN
    -- Check if the artwork belongs to the requesting user
    IF NOT EXISTS (
        SELECT 1 FROM public.artworks
        WHERE id = p_artwork_id
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You can only request payouts for your own artworks';
    END IF;

    -- Get available amount for payout
    SELECT vault_value INTO v_available_amount
    FROM public.artworks
    WHERE id = p_artwork_id;

    IF v_available_amount IS NULL OR v_available_amount < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds available for payout';
    END IF;

    -- Create payout record
    INSERT INTO public.artist_payouts (
        artist_id,
        artwork_id,
        amount,
        status
    )
    VALUES (
        auth.uid(),
        p_artwork_id,
        p_amount,
        'pending'
    )
    RETURNING id INTO v_payout_id;

    -- Create transaction record
    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        description,
        metadata
    )
    VALUES (
        auth.uid(),
        'payout_request',
        p_amount,
        format('Payout request for artwork %s', p_artwork_id),
        jsonb_build_object(
            'artwork_id', p_artwork_id,
            'available_balance', v_available_amount,
            'requested_amount', p_amount,
            'payout_id', v_payout_id
        )
    );

    RETURN v_payout_id;
END;
$$;

-- Drop and recreate recalculate_artwork_vault_values function
DROP FUNCTION IF EXISTS public.recalculate_artwork_vault_values;
CREATE FUNCTION public.recalculate_artwork_vault_values()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_artwork RECORD;
    v_total_sln numeric;
BEGIN
    FOR v_artwork IN SELECT id FROM public.artworks LOOP
        -- Calculate total SLN value from votes
        SELECT COALESCE(SUM(value * vote_power), 0)
        INTO v_total_sln
        FROM public.votes
        WHERE artwork_id = v_artwork.id;

        -- Update artwork vault value
        UPDATE public.artworks
        SET vault_value = v_total_sln
        WHERE id = v_artwork.id;
    END LOOP;
END;
$$;

-- Drop and recreate cast_vote function
DROP FUNCTION IF EXISTS public.cast_vote;
CREATE FUNCTION public.cast_vote(
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
        consumed,
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
        false,
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

-- Drop and recreate admin_reset_all_votes function
DROP FUNCTION IF EXISTS public.admin_reset_all_votes;
CREATE FUNCTION public.admin_reset_all_votes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Check if the user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_user_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can reset all votes';
    END IF;

    -- Reset all vote-related data
    UPDATE public.artworks
    SET 
        vote_count = 0,
        vault_value = 0;

    DELETE FROM public.votes;
    DELETE FROM public.artwork_views;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.consume_votes TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_artist_payout TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_artwork_vault_values TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_vote TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_all_votes TO authenticated; 