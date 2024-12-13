-- Fix public access to vote counts and vault states
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can create their own votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can view vault states" ON public.vault_states;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.votes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.votes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vault_states;

-- Create new policies for votes
CREATE POLICY "Public can view vote counts"
ON public.votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create votes"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create new policies for vault states
CREATE POLICY "Public can view vault states"
ON public.vault_states FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update vault states"
ON public.vault_states FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT SELECT ON public.votes TO anon;
GRANT SELECT ON public.vault_states TO anon; 