-- Add missing columns to votes table
ALTER TABLE public.votes
ADD COLUMN IF NOT EXISTS vote_power INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_value INTEGER GENERATED ALWAYS AS (value * vote_power) STORED,
ADD COLUMN IF NOT EXISTS sln_value NUMERIC GENERATED ALWAYS AS (value * vote_power) STORED;

-- Update existing votes with vote power from their packs
UPDATE public.votes v
SET vote_power = vp.vote_power
FROM public.vote_packs vp
WHERE v.pack_id = vp.id
AND v.vote_power IS NULL; 