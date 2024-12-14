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
GRANT EXECUTE ON FUNCTION public.admin_reset_all_votes TO authenticated; 