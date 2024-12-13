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
    (auth.jwt()->>'role' = 'admin') -- JWT has admin role
    or
    exists ( -- Profile has admin role
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Enable insert for authenticated users only"
  on votes
  for insert
  with check (auth.uid() = user_id);

-- Grant permissions
grant select on votes to authenticated;
grant insert on votes to authenticated; 