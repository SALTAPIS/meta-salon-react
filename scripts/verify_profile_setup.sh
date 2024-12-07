#!/bin/bash

# Set the database URL
DB_URL="postgresql://postgres.jbpdlgpsakhxchqmtuwm:fritziforever-88@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

echo "Checking profiles table structure..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;"

echo -e "\nChecking triggers..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;"

echo -e "\nChecking policies..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;" 