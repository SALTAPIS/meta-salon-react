-- Drop existing table and recreate with correct schema
drop table if exists public.challenges cascade;

create table public.challenges (
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
    constraint end_time_after_start_time check (end_time > start_time)
);

-- Create index for active challenges
create index idx_active_challenges on public.challenges(status) where status = 'active';

-- Enable RLS
alter table public.challenges enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Challenges are viewable by everyone" on public.challenges;
drop policy if exists "Only admins can create challenges" on public.challenges;
drop policy if exists "Only admins can update challenges" on public.challenges;

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
    now() + interval '365 days',
    id
from public.profiles
where role = 'admin'
limit 1;

-- Create artworks table if not exists
create table if not exists public.artworks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    album_id uuid references public.albums(id) not null,
    title text not null,
    description text,
    image_url text not null,
    metadata jsonb,
    status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
    challenge_id uuid references public.challenges(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on artworks
alter table public.artworks enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view all artworks" on public.artworks;
drop policy if exists "Users can create their own artworks" on public.artworks;
drop policy if exists "Users can update their own artworks" on public.artworks;

-- RLS policies for artworks
create policy "Users can view all artworks"
    on public.artworks for select
    using (true);

create policy "Users can create their own artworks"
    on public.artworks for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own artworks"
    on public.artworks for update
    using (auth.uid() = user_id); 