-- Check existing publications
SELECT * FROM pg_publication;

-- Check which tables are included in publications
SELECT 
    p.pubname,
    schemaname,
    tablename
FROM pg_publication p
JOIN pg_publication_tables pt 
    ON p.pubname = pt.pubname;

-- Check replica identity status
SELECT 
    schemaname,
    tablename,
    replica_identity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'transactions', 'vote_packs');

-- If publication doesn't exist or needs update, create/update it
DROP PUBLICATION IF EXISTS salon_realtime;

CREATE PUBLICATION salon_realtime FOR TABLE 
    profiles,
    transactions,
    vote_packs;

-- Set replica identity for real-time tracking
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE vote_packs REPLICA IDENTITY FULL;

-- Enable real-time for specific tables
ALTER PUBLICATION salon_realtime SET TABLE profiles, transactions, vote_packs; 