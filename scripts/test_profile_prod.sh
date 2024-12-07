#!/bin/bash

# Set the database URL
DB_URL="postgresql://postgres.jbpdlgpsakhxchqmtuwm:fritziforever-88@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

echo "1. Testing profile update functionality..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
DO \$\$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Update test profile with all fields
  UPDATE profiles
  SET 
    display_name = 'Test User',
    bio = 'This is a test bio',
    username = 'testuser123',
    email_verified = true,
    email_notifications = true,
    updated_at = now()
  WHERE id = test_user_id;
  
  -- Verify the update
  RAISE NOTICE 'Profile update result: %', (
    SELECT json_build_object(
      'display_name', display_name,
      'bio', bio,
      'username', username,
      'email_verified', email_verified,
      'email_notifications', email_notifications,
      'updated_at', updated_at
    )
    FROM profiles
    WHERE id = test_user_id
  );
END;
\$\$;"

echo -e "\n2. Testing profile trigger functionality..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
DO \$\$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Test username formatting
  UPDATE profiles
  SET username = '  TestUser123  '
  WHERE id = test_user_id;
  
  -- Verify username was formatted correctly (should be lowercase and trimmed)
  RAISE NOTICE 'Username formatting result: %', (
    SELECT username
    FROM profiles
    WHERE id = test_user_id
  );
  
  -- Test display_name trimming
  UPDATE profiles
  SET display_name = '  Test User  '
  WHERE id = test_user_id;
  
  -- Verify display_name was trimmed
  RAISE NOTICE 'Display name trimming result: %', (
    SELECT display_name
    FROM profiles
    WHERE id = test_user_id
  );
END;
\$\$;"

echo -e "\n3. Testing RLS policies..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
-- List all active policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;"

echo -e "\n4. Verifying final profile structure..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;" 