-- Drop existing function
DROP FUNCTION IF EXISTS public.cast_vote;
DROP FUNCTION IF EXISTS public.reset_all_votes;
DROP FUNCTION IF EXISTS public.admin_reset_all_votes;

-- Create admin reset function
CREATE OR REPLACE FUNCTION public.admin_reset_all_votes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_votes integer;
    v_updated_artworks integer;
    v_user_id uuid;
    v_is_admin boolean;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_user_id
        AND (role = 'admin' OR user_metadata->>'role' = 'admin')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only admins can reset votes';
    END IF;

    -- Delete all votes
    WITH deleted AS (
        DELETE FROM public.votes
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_votes FROM deleted;

    -- Reset all artwork vote counts and vault values
    WITH updated AS (
        UPDATE public.artworks
        SET 
            vote_count = 0,
            vault_value = 0,
            updated_at = now()
        RETURNING *
    )
    SELECT COUNT(*) INTO v_updated_artworks FROM updated;

    -- Reset vault states
    DELETE FROM public.vault_states;

    -- Reset vote packs to initial state
    UPDATE public.vote_packs
    SET
        votes_remaining = initial_votes,
        updated_at = now();

    -- Return summary
    RETURN jsonb_build_object(
        'success', true,
        'deleted_votes', v_deleted_votes,
        'updated_artworks', v_updated_artworks
    );
END;
$$;

-- Create updated cast_vote function with correct vote count calculation
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

    -- Calculate SLN value (vote power affects SLN value only)
    v_sln_value := p_value * v_vote_power;

    -- Create vote record
    INSERT INTO public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,          -- Raw vote count
        vote_power,     -- Power of the vote pack used
        total_value,    -- Same as raw vote count
        sln_value,      -- Vote count * vote power
        consumed,       -- Track if vote has been consumed
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,        -- Raw vote count
        v_vote_power,   -- Power of the vote pack used
        p_value,        -- Same as raw vote count
        v_sln_value,    -- Vote count * vote power
        false,          -- Not consumed initially
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
    -- vote_count gets raw votes, vault_value gets SLN value
    UPDATE public.artworks
    SET 
        vote_count = COALESCE(vote_count, 0) + p_value,
        vault_value = COALESCE(vault_value, 0) + v_sln_value,
        updated_at = now()
    WHERE id = p_artwork_id;

    -- Update vault state
    INSERT INTO public.vault_states (
        artwork_id,
        vote_count,
        total_votes,
        sln_value,
        last_vote_at,
        updated_at
    )
    VALUES (
        p_artwork_id,
        p_value,
        p_value,
        v_sln_value,
        now(),
        now()
    )
    ON CONFLICT (artwork_id) DO UPDATE
    SET
        vote_count = vault_states.vote_count + p_value,
        total_votes = vault_states.total_votes + p_value,
        sln_value = vault_states.sln_value + v_sln_value,
        last_vote_at = now(),
        updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'raw_votes', p_value,
        'sln_value', v_sln_value,
        'votes_remaining', v_pack_votes - p_value
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cast_vote TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_all_votes TO authenticated;
