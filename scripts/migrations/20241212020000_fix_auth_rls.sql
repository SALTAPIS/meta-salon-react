-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything with profiles" ON public.profiles;

-- Create simplified policies
CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Grant permissions to roles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- Enable RLS on user_vote_packs table
ALTER TABLE public.user_vote_packs ENABLE ROW LEVEL SECURITY;

-- Create policies for user_vote_packs
CREATE POLICY "Users can view own vote packs" ON public.user_vote_packs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert vote packs" ON public.user_vote_packs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own vote packs" ON public.user_vote_packs
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions for user_vote_packs
GRANT ALL ON public.user_vote_packs TO authenticated;
GRANT ALL ON public.user_vote_packs TO service_role; 