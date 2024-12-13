-- Create function to get vote counts for artworks
create or replace function get_artwork_vote_counts(artwork_ids uuid[])
returns table (
  artwork_id uuid,
  vote_count bigint
)
language sql
security definer
as $$
  select artwork_id, count(*) as vote_count
  from votes
  where artwork_id = any(artwork_ids)
  group by artwork_id;
$$; 