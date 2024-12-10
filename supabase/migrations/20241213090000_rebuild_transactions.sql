-- Backup existing data
CREATE TEMP TABLE transactions_backup AS 
SELECT 
    id,
    user_id,
    type,
    amount,
    description,
    created_at,
    updated_at
FROM public.transactions;

-- Drop existing table
DROP TABLE IF EXISTS public.transactions CASCADE;

-- Recreate table with clean constraints
CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    type text NOT NULL,
    amount numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'completed',
    description text,
    reference_id uuid,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add clean constraints
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN ('grant', 'submission', 'vote_pack', 'reward', 'premium', 'refund'));

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_status_check
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Restore data
INSERT INTO public.transactions (
    id,
    user_id,
    type,
    amount,
    status,
    description,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    type,
    amount,
    'completed' AS status,
    description,
    created_at,
    updated_at
FROM transactions_backup;

-- Drop backup table
DROP TABLE transactions_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC); 