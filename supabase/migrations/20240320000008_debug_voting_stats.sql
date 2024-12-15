-- Get voting statistics for qwer40
WITH user_info AS (
    SELECT id as user_id
    FROM auth.users
    WHERE email = 'qwer40@gmail.com'
)
SELECT
    (SELECT COUNT(*) FROM public.artworks 
     WHERE status IN ('approved', 'submitted') AND vault_status = 'active') as total_active_artworks,
    
    (SELECT COUNT(*) FROM public.artwork_matches m
     WHERE m.user_id = (SELECT user_id FROM user_info)) as total_votes_cast,
    
    (SELECT COUNT(*) FROM public.artworks a
     WHERE a.status IN ('approved', 'submitted') 
     AND a.vault_status = 'active'
     AND NOT EXISTS (
         SELECT 1 FROM public.artwork_matches m
         WHERE (m.artwork_id_1 = a.id OR m.artwork_id_2 = a.id)
         AND m.user_id = (SELECT user_id FROM user_info)
     )) as available_for_voting,
    
    (SELECT COUNT(*) FROM public.artworks
     WHERE status = 'draft') as draft_artworks,
    
    (SELECT COUNT(*) FROM public.artworks
     WHERE status = 'rejected') as rejected_artworks; 