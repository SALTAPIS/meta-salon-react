DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for all users" ON votes;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON votes;
    DROP POLICY IF EXISTS "Enable read access for all users" ON vault_states;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON vault_states;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON vault_states;

    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_votes_updated_at ON votes;
    DROP TRIGGER IF EXISTS update_vault_states_updated_at ON vault_states;

    -- Drop existing tables if they exist
    DROP TABLE IF EXISTS votes CASCADE;
    DROP TABLE IF EXISTS vault_states CASCADE;

    -- Create votes table with correct structure
    CREATE TABLE votes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        artwork_id UUID REFERENCES artworks(id) NOT NULL,
        pack_id UUID REFERENCES vote_packs(id) NOT NULL,
        value INTEGER NOT NULL,
        consumed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create vault_states table
    CREATE TABLE vault_states (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        artwork_id UUID REFERENCES artworks(id) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(artwork_id)
    );

    -- Create or replace the update_updated_at_column function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Enable RLS on votes
    ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

    -- Add RLS policies for votes
    CREATE POLICY "Enable read access for all users" ON votes
        FOR SELECT USING (true);

    CREATE POLICY "Enable insert for authenticated users only" ON votes
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Add trigger to update updated_at for votes
    CREATE TRIGGER update_votes_updated_at
        BEFORE UPDATE ON votes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Enable RLS on vault_states
    ALTER TABLE vault_states ENABLE ROW LEVEL SECURITY;

    -- Add RLS policies for vault_states
    CREATE POLICY "Enable read access for all users" ON vault_states
        FOR SELECT USING (true);

    CREATE POLICY "Enable insert for authenticated users only" ON vault_states
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Enable update for authenticated users only" ON vault_states
        FOR UPDATE USING (auth.uid() IS NOT NULL);

    -- Add trigger to update updated_at for vault_states
    CREATE TRIGGER update_vault_states_updated_at
        BEFORE UPDATE ON vault_states
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Create initial vault states for existing artworks
    INSERT INTO vault_states (artwork_id, status)
    SELECT id, 'pending'
    FROM artworks
    WHERE id NOT IN (SELECT artwork_id FROM vault_states)
    ON CONFLICT (artwork_id) DO NOTHING;

END $$; 