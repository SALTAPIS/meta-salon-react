-- Get user ID for qwer40
WITH user_info AS (
    SELECT id as user_id
    FROM auth.users
    WHERE email = 'qwer40@gmail.com'
),
artwork_status AS (
    SELECT 
        a.id,
        a.title,
        a.status,
        a.vault_status,
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM public.artwork_matches m 
                WHERE (m.artwork_id_1 = a.id OR m.artwork_id_2 = a.id)
                AND m.user_id = (SELECT user_id FROM user_info)
            ) THEN 'Already voted'
            WHEN a.status NOT IN ('approved', 'submitted') THEN 'Wrong status: ' || a.status
            WHEN a.vault_status != 'active' THEN 'Inactive vault'
            ELSE 'Available for voting'
        END as voting_status
    FROM public.artworks a
)
SELECT 
    id,
    title,
    status,
    vault_status,
    voting_status
FROM artwork_status
ORDER BY 
    CASE 
        WHEN voting_status = 'Available for voting' THEN 1
        ELSE 2
    END,
    title; 