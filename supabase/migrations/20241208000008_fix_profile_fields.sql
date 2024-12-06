-- Ensure all profile fields exist with proper constraints
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS username text UNIQUE,
    ADD COLUMN IF NOT EXISTS display_name text,
    ADD COLUMN IF NOT EXISTS bio text,
    ADD COLUMN IF NOT EXISTS website text,
    ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS avatar_url text;

    -- Add username format constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'username_format'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT username_format 
        CHECK (username ~* '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$');
    END IF;

    -- Add website format constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'website_format'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT website_format 
        CHECK (
            website IS NULL OR 
            website ~* '^https?://([\w-]+\.)+[\w-]+(/[\w-./?%&=]*)?$'
        );
    END IF;

    -- Update RLS policies for profile updates
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (
            CASE WHEN username IS NOT NULL
                THEN username ~* '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$'
                ELSE TRUE
            END
        )
        AND (
            CASE WHEN website IS NOT NULL
                THEN website ~* '^https?://([\w-]+\.)+[\w-]+(/[\w-./?%&=]*)?$'
                ELSE TRUE
            END
        )
    );
END $$; 