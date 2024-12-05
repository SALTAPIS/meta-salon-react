-- Check if real-time is enabled for the database
SELECT 
    name,
    setting,
    context,
    short_desc
FROM pg_settings
WHERE name LIKE '%wal%';

-- Enable WAL level logical for real-time
ALTER SYSTEM SET wal_level = logical;

-- Check real-time configuration
SELECT 
    usename,
    application_name,
    state,
    sync_state,
    sync_priority
FROM pg_stat_replication;

-- Verify publication
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication
WHERE pubname = 'salon_realtime';

-- Re-create publication with explicit settings
DROP PUBLICATION IF EXISTS salon_realtime;
CREATE PUBLICATION salon_realtime FOR TABLE 
    profiles,
    transactions,
    vote_packs
WITH (publish = 'insert,update,delete,truncate');

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON vote_packs TO authenticated;

-- Enable row level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_packs ENABLE ROW LEVEL SECURITY;

-- Set replica identity to full for better change tracking
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE vote_packs REPLICA IDENTITY FULL; 