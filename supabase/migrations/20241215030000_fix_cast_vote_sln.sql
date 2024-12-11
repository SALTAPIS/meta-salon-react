-- Update the cast_vote function to properly calculate SLN value
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_artwork_id uuid,
    p_pack_id uuid,
    p_value integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_vote_id uuid;
    v_pack_votes integer;
    v_vote_power integer;
    v_total_value integer;
    v_sln_value numeric;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get vote pack details
    SELECT votes_remaining, vote_power 
    INTO v_pack_votes, v_vote_power
    FROM public.vote_packs
    WHERE id = p_pack_id AND user_id = v_user_id;

    IF v_pack_votes IS NULL THEN
        RAISE EXCEPTION 'Vote pack not found or not owned by user';
    END IF;

    IF v_pack_votes < p_value THEN
        RAISE EXCEPTION 'Insufficient votes in pack. Available: %, Requested: %', 
            v_pack_votes, p_value;
    END IF;

    -- Calculate total vote value and SLN value
    v_total_value := p_value * v_vote_power;
    -- Each vote is worth 1 SLN, multiplied by vote power
    v_sln_value := p_value * v_vote_power;

    -- Create vote record
    INSERT INTO public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,
        vote_power,
        total_value,
        sln_value
    )
    VALUES (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,
        v_vote_power,
        v_total_value,
        v_sln_value
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
        vote_count = COALESCE(vote_count, 0) + v_total_value,
        vault_value = COALESCE(vault_value, 0) + v_sln_value,
        updated_at = now()
    WHERE id = p_artwork_id;

    -- Update vault state
    INSERT INTO public.vault_states (
        artwork_id,
        vote_count,
        last_vote_at,
        updated_at
    )
    VALUES (
        p_artwork_id,
        v_total_value,
        now(),
        now()
    )
    ON CONFLICT (artwork_id) DO UPDATE
    SET
        vote_count = vault_states.vote_count + v_total_value,
        last_vote_at = now(),
        updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'total_value', v_total_value,
        'sln_value', v_sln_value,
        'votes_remaining', v_pack_votes - p_value
    );
END;
$$; 