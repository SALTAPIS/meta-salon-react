-- Milestone: Stable Artwork Submission System V2
comment on schema public is 'Milestone: Stable artwork submission system v2 with two-step process and album support';

-- Document the two-step process
comment on table public.artworks is E'Artworks table with two-step submission workflow:\n1. Create draft artwork with image upload\n2. Submit to challenge with fee';

comment on column public.artworks.status is E'Artwork status:\n- draft: Initial state after creation\n- submitted: Submitted to challenge\n- approved: Approved by moderators\n- rejected: Rejected by moderators';

comment on column public.artworks.album_id is 'Reference to the album containing this artwork. Each artwork must belong to an album.';

-- Verify all required functions exist
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'submit_artwork_to_challenge') then
    raise exception 'Missing required function: submit_artwork_to_challenge';
  end if;
end$$; 