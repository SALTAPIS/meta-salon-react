-- Add current_pair_id column to artworks table
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS current_pair_id uuid REFERENCES artworks(id);

-- Create index for current_pair_id
CREATE INDEX IF NOT EXISTS idx_artworks_current_pair_id ON artworks(current_pair_id);

-- Create function to update current_pair_id
CREATE OR REPLACE FUNCTION update_current_pair_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- When a vote is cast, update the current_pair_id for both artworks in the pair
    IF TG_OP = 'INSERT' THEN
        -- Get the other artwork in the pair
        WITH other_artwork AS (
            SELECT a2.id as other_id
            FROM artworks a1
            JOIN artworks a2 ON a1.current_pair_id = a2.id
            WHERE a1.id = NEW.artwork_id
        )
        UPDATE artworks
        SET current_pair_id = NULL
        WHERE id = NEW.artwork_id
           OR id = (SELECT other_id FROM other_artwork);
    END IF;
    RETURN NEW;
END;
$function$;

-- Create trigger for updating current_pair_id
DROP TRIGGER IF EXISTS update_current_pair_id_trigger ON votes;
CREATE TRIGGER update_current_pair_id_trigger
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_current_pair_id(); 