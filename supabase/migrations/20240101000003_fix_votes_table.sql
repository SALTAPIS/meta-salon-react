-- Add artwork_id to votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS artwork_id UUID REFERENCES artworks(id);

-- Create vault_states table
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vault_states_updated_at
    BEFORE UPDATE ON vault_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 