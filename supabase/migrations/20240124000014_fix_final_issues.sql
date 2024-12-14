-- Drop and recreate votes table
DROP TABLE IF EXISTS public.votes CASCADE;
CREATE TABLE public.votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    artwork_id uuid REFERENCES public.artworks(id) NOT NULL,
    pack_id uuid REFERENCES public.vote_packs(id) NOT NULL,
    value integer NOT NULL,
    vote_power integer NOT NULL,
    total_value numeric NOT NULL,
    sln_value numeric NOT NULL,
    consumed boolean DEFAULT false,
    consumed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies for votes
CREATE POLICY "Users can view their own votes"
    ON public.votes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own votes"
    ON public.votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all votes"
    ON public.votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Drop and recreate transactions table
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    type text NOT NULL,
    amount numeric NOT NULL,
    description text,
    payout_id uuid,
    metadata jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
    ON public.transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Drop and recreate vault_states table
DROP TABLE IF EXISTS public.vault_states CASCADE;
CREATE TABLE public.vault_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id uuid REFERENCES public.artworks(id) NOT NULL,
    accumulated_value numeric DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_artwork_vault_state UNIQUE (artwork_id)
);

-- Enable RLS on vault_states
ALTER TABLE public.vault_states ENABLE ROW LEVEL SECURITY;

-- Create policies for vault_states
CREATE POLICY "Anyone can view vault states"
    ON public.vault_states FOR SELECT
    USING (true);

CREATE POLICY "Admins can update vault states"
    ON public.vault_states FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.votes TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.vault_states TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 