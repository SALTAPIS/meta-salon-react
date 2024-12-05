-- Enable real-time for profiles table
drop publication if exists salon_realtime;

create publication salon_realtime for table 
    profiles,
    transactions,
    vote_packs;

-- Enable real-time tracking for the tables
alter table profiles replica identity full;
alter table transactions replica identity full;
alter table vote_packs replica identity full;

-- Enable real-time for all operations on profiles
alter publication salon_realtime set (publish = 'insert,update,delete');

-- Ensure real-time is enabled for the database
alter system set wal_level = logical;
alter system set max_replication_slots = 10;
alter system set max_wal_senders = 10; 