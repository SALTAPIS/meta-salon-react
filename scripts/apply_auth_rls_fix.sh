#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source the environment variables
if [ -f "$SCRIPT_DIR/../.env" ]; then
  source "$SCRIPT_DIR/../.env"
fi

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL environment variable is not set"
  exit 1
fi

# Apply the migration
psql "$SUPABASE_DB_URL" -f "$SCRIPT_DIR/migrations/20241212020000_fix_auth_rls.sql"

echo "Auth RLS fixes applied successfully" 