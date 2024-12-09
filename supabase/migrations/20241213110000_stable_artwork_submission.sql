-- Milestone: Stable Artwork Submission System
comment on schema public is 'Milestone v2: Stable artwork submission system with two-step process';

comment on table public.artworks is 'Artworks table with draft and submission workflow';
comment on table public.challenges is 'Challenges table supporting open challenges and voting';
comment on table public.transactions is 'Transactions table handling submission fees and rewards';

-- Verify all required functions exist
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'submit_artwork_to_challenge') then
    raise exception 'Missing required function: submit_artwork_to_challenge';
  end if;
end$$; 