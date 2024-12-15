-- Recalculate wins and losses from existing matches
WITH match_stats AS (
    SELECT 
        winner_id,
        COUNT(*) as win_count
    FROM public.artwork_matches
    GROUP BY winner_id
),
loss_stats AS (
    SELECT 
        a.id as artwork_id,
        COUNT(*) as loss_count
    FROM public.artworks a
    JOIN public.artwork_matches m ON (a.id = m.artwork_id_1 OR a.id = m.artwork_id_2)
    WHERE a.id != m.winner_id
    GROUP BY a.id
)
UPDATE public.artworks a
SET 
    wins = COALESCE(ms.win_count, 0),
    losses = COALESCE(ls.loss_count, 0)
FROM match_stats ms
FULL OUTER JOIN loss_stats ls ON ls.artwork_id = a.id
WHERE a.id = ms.winner_id OR a.id = ls.artwork_id; 