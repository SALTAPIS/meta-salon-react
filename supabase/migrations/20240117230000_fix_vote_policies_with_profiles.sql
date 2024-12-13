-- Drop existing policies
drop policy if exists "Users can view votes" on votes;
drop policy if exists "Users can create votes" on votes;
drop policy if exists "Users can view their own votes" on votes;
drop policy if exists "Users can create their own votes" on votes;
drop policy if exists "Enable read access for all users" on votes;
drop policy if exists "Enable insert for authenticated users only" on votes;

-- Create new policies
create policy "Enable read access for all users"
  on votes
  for select
  using (
    auth.uid() = user_id -- Regular users can see their own votes
    or
    exists ( -- Admins can see all votes
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Enable insert for authenticated users only"
  on votes
  for insert
  with check (auth.uid() = user_id); 