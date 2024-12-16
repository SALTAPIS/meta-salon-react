-- Add loser_id column to artwork_matches table
ALTER TABLE public.artwork_matches
ADD COLUMN loser_id UUID REFERENCES public.artworks(id);

-- Update existing matches to set loser_id based on the non-winner artwork
UPDATE public.artwork_matches
SET loser_id = CASE 
    WHEN artwork_id_1 = winner_id THEN artwork_id_2
    ELSE artwork_id_1
END
WHERE loser_id IS NULL; 