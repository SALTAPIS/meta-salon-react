-- Drop existing functions
DROP FUNCTION IF EXISTS public.audit_votes;
DROP FUNCTION IF EXISTS public.fix_vault_values;

-- Create function to audit vote records
CREATE OR REPLACE FUNCTION public.audit_votes()
RETURNS TABLE (
    artwork_id uuid,
    vote_count integer,
    vault_value numeric,
    actual_vote_count bigint,
    actual_vault_value numeric,
    vote_power_distribution text,
    status text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH vote_counts AS (
        SELECT 
            artwork_id,
            vote_power,
            COUNT(*) as power_count
        FROM votes
        GROUP BY artwork_id, vote_power
    ),
    vote_stats AS (
        SELECT 
            v.artwork_id,
            SUM(v.power_count) as actual_vote_count,
            SUM(v.power_count * v.vote_power) as actual_vault_value,
            string_agg(
                v.vote_power || 'x: ' || v.power_count || ' votes',
                ', '
                ORDER BY v.vote_power
            ) as vote_power_distribution
        FROM vote_counts v
        GROUP BY v.artwork_id
    )
    SELECT 
        a.id as artwork_id,
        a.vote_count,
        a.vault_value,
        COALESCE(vs.actual_vote_count, 0) as actual_vote_count,
        COALESCE(vs.actual_vault_value, 0) as actual_vault_value,
        COALESCE(vs.vote_power_distribution, 'No votes') as vote_power_distribution,
        CASE 
            WHEN a.vote_count != COALESCE(vs.actual_vote_count, 0) 
                OR a.vault_value != COALESCE(vs.actual_vault_value, 0)
            THEN 'Mismatch'
            ELSE 'OK'
        END as status
    FROM artworks a
    LEFT JOIN vote_stats vs ON vs.artwork_id = a.id
    WHERE a.vote_count != COALESCE(vs.actual_vote_count, 0) 
       OR a.vault_value != COALESCE(vs.actual_vault_value, 0)
    ORDER BY a.id;
$$;

-- Create function to fix vault values
CREATE OR REPLACE FUNCTION public.fix_vault_values()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_count integer := 0;
BEGIN
    -- Update artworks table with correct vote counts and vault values
    WITH vote_stats AS (
        SELECT 
            artwork_id,
            COUNT(*) as vote_count,
            SUM(value * vote_power) as vault_value
        FROM votes
        GROUP BY artwork_id
    )
    UPDATE artworks a
    SET 
        vote_count = COALESCE(vs.vote_count, 0),
        vault_value = COALESCE(vs.vault_value, 0),
        updated_at = now()
    FROM vote_stats vs
    WHERE a.id = vs.artwork_id
    AND (
        a.vote_count != COALESCE(vs.vote_count, 0)
        OR a.vault_value != COALESCE(vs.vault_value, 0)
    );

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- Return summary
    RETURN jsonb_build_object(
        'success', true,
        'updated_artworks', v_updated_count
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.audit_votes TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_vault_values TO authenticated; 