-- Drop existing policies
drop policy if exists "Enable read access for all users" on votes;
drop policy if exists "Enable insert for authenticated users only" on votes;

-- Create new policies
create policy "Enable read access for all users"
  on votes
  for select
  using (true); -- Allow all authenticated users to read all votes

create policy "Enable insert for authenticated users only"
  on votes
  for insert
  with check (auth.uid() = user_id);

-- Grant permissions
grant select on votes to authenticated;
grant insert on votes to authenticated; 