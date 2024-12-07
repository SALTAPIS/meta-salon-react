#!/bin/bash

# Set the database URL
DB_URL="postgresql://postgres.jbpdlgpsakhxchqmtuwm:fritziforever-88@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

echo "1. Resetting admin user..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
BEGIN;

-- First, delete existing admin user
DELETE FROM auth.users WHERE email = 'admin@meta.salon';

-- Create new admin user
WITH new_user AS (
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@meta.salon',
        crypt('rindim_MS8', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{\"provider\":\"email\",\"providers\":[\"email\"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id, email
)
INSERT INTO profiles (
    id,
    email,
    role,
    username,
    display_name,
    created_at,
    updated_at,
    balance,
    email_verified,
    email_notifications
)
SELECT
    id,
    email,
    'admin',
    'admin',
    'Admin',
    now(),
    now(),
    0,
    true,
    true
FROM new_user;

COMMIT;
"

echo -e "\n2. Verifying admin user..."
PGPASSWORD=fritziforever-88 psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.jbpdlgpsakhxchqmtuwm postgres -c "
SELECT 
    p.id,
    p.email,
    p.role,
    p.username,
    p.display_name,
    p.email_verified,
    u.email_confirmed_at,
    u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'admin@meta.salon';" 