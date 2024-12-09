-- Function to purchase a vote pack
CREATE OR REPLACE FUNCTION public.purchase_vote_pack(
    p_type text,
    p_amount numeric
)
RETURNS uuid
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_user_balance numeric;
    v_pack_id uuid;
    v_votes_remaining integer;
    v_vote_power integer;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user's current balance
    SELECT balance INTO v_user_balance
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_user_balance IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    IF v_user_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %', p_amount, v_user_balance;
    END IF;

    -- Set vote pack parameters based on type
    CASE p_type
        WHEN 'basic' THEN
            v_votes_remaining := 10;
            v_vote_power := 1;
        WHEN 'art_lover' THEN
            v_votes_remaining := 100;
            v_vote_power := 1;
        WHEN 'pro' THEN
            v_votes_remaining := 25;
            v_vote_power := 2;
        WHEN 'expert' THEN
            v_votes_remaining := 30;
            v_vote_power := 5;
        WHEN 'elite' THEN
            v_votes_remaining := 50;
            v_vote_power := 10;
        ELSE
            RAISE EXCEPTION 'Invalid vote pack type: %', p_type;
    END CASE;

    -- Create transaction record
    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        description,
        status
    ) VALUES (
        v_user_id,
        'vote_pack',
        -p_amount,
        'Purchase ' || p_type || ' vote pack',
        'completed'
    );

    -- Update user balance
    UPDATE public.profiles
    SET 
        balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Create vote pack
    INSERT INTO public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    ) VALUES (
        v_user_id,
        p_type,
        v_votes_remaining,
        v_vote_power,
        NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO v_pack_id;

    RETURN v_pack_id;
END;
$$ LANGUAGE plpgsql; 