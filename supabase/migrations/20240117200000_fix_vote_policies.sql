-- Drop existing policies
drop policy if exists "Users can view their own votes" on votes;
drop policy if exists "Users can create their own votes" on votes;

-- Create new policies
create policy "Users can view votes"
  on votes
  for select
  using (
    auth.uid() = user_id -- Users can see their own votes
    or
    exists ( -- Admins can see all votes
      select 1 from profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.role = 'moderator')
    )
  );

create policy "Users can create votes"
  on votes
  for insert
  with check (auth.uid() = user_id); 