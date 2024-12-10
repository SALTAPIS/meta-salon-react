-- Create default open challenge
DO $$
DECLARE
    v_admin_id uuid;
    v_table_exists boolean;
BEGIN
    -- Check if challenges table exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'challenges'
    ) INTO v_table_exists;

    IF NOT v_table_exists THEN
        RAISE EXCEPTION 'Table public.challenges does not exist';
    END IF;

    -- Get the first admin user's ID
    SELECT id INTO v_admin_id
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;

    -- Create the default challenge
    INSERT INTO public.challenges (
        title,
        description,
        status,
        type,
        start_time,
        end_time,
        created_by
    )
    VALUES (
        'Main Open Challenge',
        'The main open challenge for all artworks. This challenge runs continuously.',
        'active',
        'open',
        now(),
        now() + interval '7 days',
        v_admin_id
    );
END $$;

-- Add challenge_id to artworks table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'artworks'
        AND column_name = 'challenge_id'
    ) THEN
        ALTER TABLE public.artworks
        ADD COLUMN challenge_id uuid REFERENCES public.challenges(id);
    END IF;
END $$; 