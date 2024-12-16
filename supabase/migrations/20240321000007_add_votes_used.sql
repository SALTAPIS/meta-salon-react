-- Add votes_used column to vote_packs table
ALTER TABLE public.vote_packs
ADD COLUMN votes_used INTEGER NOT NULL DEFAULT 0
CHECK (votes_used >= 0);

-- Add comment explaining the column
COMMENT ON COLUMN public.vote_packs.votes_used IS 'The total number of votes used from this pack. Default is 0, must be greater than or equal to 0.'; 