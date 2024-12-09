-- Create default open challenge
insert into public.challenges (
    title,
    description,
    status,
    type,
    start_time,
    end_time,
    created_by
)
select
    'Main Open Challenge',
    'The main open challenge for all artworks. This challenge runs continuously.',
    'active',
    'open',
    now(),
    now() + interval '7 days',
    id
from public.profiles
where role = 'admin'
limit 1;

-- Add challenge_id to artworks table if not exists
do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_name = 'artworks'
        and column_name = 'challenge_id'
    ) then
        alter table public.artworks
        add column challenge_id uuid references public.challenges(id);
    end if;
end $$; 