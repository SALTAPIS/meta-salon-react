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