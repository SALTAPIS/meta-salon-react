-- Drop existing RLS policies for profiles
drop policy if exists "Enable read access for all users" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Enable update for users based on id" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "System can insert profiles" on public.profiles;
drop policy if exists "Profile public read access" on public.profiles;
drop policy if exists "Profile owner update access" on public.profiles;
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Service role can do anything" on public.profiles;
drop policy if exists "Service role full access" on public.profiles;

-- Create new RLS policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Enable profile creation during signup"
    on public.profiles for insert
    to authenticated, anon
    with check (true);

create policy "Users can update own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Service role full access"
    on public.profiles
    to service_role
    using (true)
    with check (true); 