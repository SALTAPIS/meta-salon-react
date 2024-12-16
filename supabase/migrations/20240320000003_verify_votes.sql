-- Function to show all artwork vote stats (including matches)
CREATE OR REPLACE FUNCTION public.verify_votes()
RETURNS TABLE (
    artwork_id uuid,
    title text,
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
        a.title,
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
    WHERE a.vote_count > 0 OR vs.actual_vote_count > 0
    ORDER BY a.vote_count DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_votes TO authenticated; 