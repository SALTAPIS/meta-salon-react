-- Create challenges table
create table if not exists public.challenges (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    status text not null check (status in ('draft', 'active', 'completed', 'cancelled')),
    type text not null check (type in ('open', 'public', 'private')),
    submission_fee integer not null default 99,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    created_by uuid references auth.users(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Ensure end_time is after start_time
    constraint end_time_after_start_time check (end_time > start_time)
);

-- Create index for active challenges
create index idx_active_challenges on public.challenges(status) where status = 'active';

-- Enable RLS
alter table public.challenges enable row level security;

-- RLS policies
create policy "Challenges are viewable by everyone"
    on public.challenges for select
    using (true);

create policy "Only admins can create challenges"
    on public.challenges for insert
    with check (
        exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

create policy "Only admins can update challenges"
    on public.challenges for update
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

-- Create default open challenge
insert into public.challenges (
    title,
    description,
    status,
    type,
    submission_fee,
    start_time,
    end_time,
    created_by
)
select
    'Main Open Challenge',
    'The main open challenge for all artworks. This challenge runs continuously.',
    'active',
    'open',
    99,
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