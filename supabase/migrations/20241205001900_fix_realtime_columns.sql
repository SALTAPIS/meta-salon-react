-- Drop existing publication
DROP PUBLICATION IF EXISTS salon_realtime;

-- Recreate publication without column restrictions
CREATE PUBLICATION salon_realtime FOR TABLE 
    profiles,
    transactions,
    vote_packs
WITH (publish = 'insert,update,delete');

-- Set replica identity for better change tracking
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE vote_packs REPLICA IDENTITY FULL;

-- Verify settings
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'salon_realtime'; 