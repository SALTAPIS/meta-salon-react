-- Add status column to transactions if it doesn't exist
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Add constraint for status values
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_status_check
CHECK (status = ANY (ARRAY[
  'pending',
  'completed',
  'failed',
  'cancelled'
]::text[]));

-- Update existing records to have a valid status
UPDATE public.transactions
SET status = 'completed'
WHERE status IS NULL; 