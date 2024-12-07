#!/bin/bash

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL environment variable is not set"
    exit 1
fi

# Apply the migration
psql "$SUPABASE_DB_URL" -f supabase/migrations/20241212000000_profile_optimizations.sql

# Verify the changes
psql "$SUPABASE_DB_URL" -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;"

# Check triggers
psql "$SUPABASE_DB_URL" -c "
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;"

# Check policies
psql "$SUPABASE_DB_URL" -c "
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;" 