-- Drop existing policies
drop policy if exists "Users can view votes" on votes;
drop policy if exists "Users can create votes" on votes;
drop policy if exists "Users can view their own votes" on votes;
drop policy if exists "Users can create their own votes" on votes;

-- Create new policies
create policy "Enable read access for all users"
  on votes
  for select
  using (
    auth.uid() = user_id -- Regular users can see their own votes
    or
    auth.jwt()->>'role' = 'admin' -- Admins can see all votes
  );

create policy "Enable insert for authenticated users only"
  on votes
  for insert
  with check (auth.uid() = user_id); 