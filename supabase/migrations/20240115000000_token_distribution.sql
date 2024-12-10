-- Token Distribution System Migration

-- Artist payouts table
CREATE TABLE IF NOT EXISTS public.artist_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES auth.users(id) NOT NULL,
    artwork_id UUID REFERENCES public.artworks(id) NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending',
    transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Add payout tracking to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES public.artist_payouts(id),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Function to calculate available payout
CREATE OR REPLACE FUNCTION public.calculate_artist_payout(p_artwork_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_available_amount NUMERIC;
    v_artist_id UUID;
BEGIN
    -- Get artist ID and verify ownership
    SELECT user_id INTO v_artist_id
    FROM artworks
    WHERE id = p_artwork_id;

    IF v_artist_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to calculate payout for this artwork';
    END IF;

    -- Calculate available amount (vault_value minus already processed payouts)
    SELECT COALESCE(vault_value, 0) - COALESCE(
        (SELECT SUM(amount) 
         FROM artist_payouts 
         WHERE artwork_id = p_artwork_id 
         AND status IN ('pending', 'processing', 'completed')),
        0
    )
    INTO v_available_amount
    FROM artworks
    WHERE id = p_artwork_id;
    
    RETURN v_available_amount;
END;
$$;

-- Function to request payout
CREATE OR REPLACE FUNCTION public.request_artist_payout(
    p_artwork_id UUID,
    p_amount NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payout_id UUID;
    v_available_amount NUMERIC;
    v_artist_id UUID;
BEGIN
    -- Get artist ID and verify ownership
    SELECT user_id INTO v_artist_id
    FROM artworks
    WHERE id = p_artwork_id;

    IF v_artist_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to request payout for this artwork';
    END IF;

    -- Calculate available amount
    v_available_amount := calculate_artist_payout(p_artwork_id);
    
    IF v_available_amount < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds. Available: %, Requested: %', 
            v_available_amount, p_amount;
    END IF;
    
    -- Create payout record
    INSERT INTO artist_payouts (
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

    -- Record transaction
    INSERT INTO transactions (
        user_id,
        type,
        amount,
        description,
        payout_id,
        metadata
    )
    VALUES (
        auth.uid(),
        'payout_request',
        p_amount,
        format('Payout request for artwork %s', p_artwork_id),
        v_payout_id,
        jsonb_build_object(
            'artwork_id', p_artwork_id,
            'available_balance', v_available_amount,
            'requested_amount', p_amount
        )
    );
    
    RETURN v_payout_id;
END;
$$;

-- Function to process payout (admin only)
CREATE OR REPLACE FUNCTION public.process_artist_payout(
    p_payout_id UUID,
    p_status TEXT,
    p_transaction_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payout artist_payouts;
BEGIN
    -- Verify admin role
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can process payouts';
    END IF;

    -- Get payout record
    SELECT * INTO v_payout
    FROM artist_payouts
    WHERE id = p_payout_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payout not found';
    END IF;

    IF v_payout.status NOT IN ('pending', 'processing') THEN
        RAISE EXCEPTION 'Invalid payout status for processing: %', v_payout.status;
    END IF;

    -- Update payout status
    UPDATE artist_payouts
    SET 
        status = p_status,
        transaction_id = COALESCE(p_transaction_id, transaction_id),
        processed_at = CASE WHEN p_status = 'completed' THEN now() ELSE processed_at END
    WHERE id = p_payout_id;

    -- Record transaction for status change
    INSERT INTO transactions (
        user_id,
        type,
        amount,
        description,
        payout_id,
        metadata
    )
    VALUES (
        auth.uid(),
        'payout_' || p_status,
        v_payout.amount,
        format('Payout %s for artwork %s', p_status, v_payout.artwork_id),
        p_payout_id,
        jsonb_build_object(
            'artwork_id', v_payout.artwork_id,
            'status', p_status,
            'processed_by', auth.uid()
        )
    );

    RETURN TRUE;
END;
$$;

-- Set up RLS policies
ALTER TABLE public.artist_payouts ENABLE ROW LEVEL SECURITY;

-- Artists can view their own payouts
CREATE POLICY "Artists can view their own payouts"
    ON public.artist_payouts
    FOR SELECT
    TO authenticated
    USING (artist_id = auth.uid());

-- Artists can create payout requests
CREATE POLICY "Artists can create payout requests"
    ON public.artist_payouts
    FOR INSERT
    TO authenticated
    WITH CHECK (artist_id = auth.uid());

-- Only admins can update payout status
CREATE POLICY "Admins can update payouts"
    ON public.artist_payouts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.artist_payouts TO authenticated;
GRANT ALL ON public.transactions TO authenticated; 