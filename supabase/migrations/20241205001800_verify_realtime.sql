-- Check existing publications
SELECT * FROM pg_publication WHERE pubname = 'salon_realtime';

-- Check which tables are included
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'salon_realtime';

-- Drop and recreate publication with explicit settings
DROP PUBLICATION IF EXISTS salon_realtime;

CREATE PUBLICATION salon_realtime FOR TABLE 
    profiles,
    transactions,
    vote_packs
WITH (publish = 'insert,update,delete');

-- Set replica identity for better change tracking
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE vote_packs REPLICA IDENTITY FULL;

-- Enable real-time for specific tables
ALTER PUBLICATION salon_realtime SET TABLE 
    profiles (id, balance, updated_at),
    transactions (id, user_id, type, amount, created_at),
    vote_packs (id, user_id, votes_remaining, vote_power, expires_at);

-- Verify settings
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'salon_realtime'; 