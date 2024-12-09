-- Drop existing votes table if it exists
DROP TABLE IF EXISTS votes CASCADE;

-- Recreate votes table with correct structure
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

-- Add RLS policies for votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_votes_updated_at
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create vault_states table if it doesn't exist
CREATE TABLE IF NOT EXISTS vault_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id UUID REFERENCES artworks(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(artwork_id)
);

-- Add RLS policies for vault_states
ALTER TABLE vault_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON vault_states
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON vault_states
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON vault_states
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add trigger to update updated_at
CREATE TRIGGER update_vault_states_updated_at
    BEFORE UPDATE ON vault_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 