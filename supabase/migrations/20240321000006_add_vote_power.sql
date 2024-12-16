-- Add vote_power column to artwork_matches table
ALTER TABLE public.artwork_matches
ADD COLUMN vote_power INTEGER NOT NULL DEFAULT 1
CHECK (vote_power > 0);

-- Add comment explaining the column
COMMENT ON COLUMN public.artwork_matches.vote_power IS 'The power of the vote used in this match. Default is 1, must be greater than 0.'; 