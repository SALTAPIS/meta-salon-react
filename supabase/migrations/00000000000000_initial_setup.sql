-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create tables
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    role text not null default 'guest' check (role in ('guest', 'user', 'member', 'moderator', 'admin')),
    wallet text unique,
    balance numeric(10,2) not null default 0,
    premium_until timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.challenges (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text not null,
    type text not null check (type in ('main', 'public', 'private')),
    status text not null default 'created' check (status in ('created', 'active', 'voting', 'calculating', 'distributing', 'completed')),
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    reward_pool numeric(10,2) not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.votes (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    entry_id uuid not null, -- Will be linked to entries table later
    power integer not null check (power > 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create view for user stats
create or replace view public.user_stats as
select 
    p.id as user_id,
    count(distinct e.id) as total_submissions,
    count(distinct v.id) as total_votes,
    coalesce(sum(c.reward_pool), 0) as total_rewards,
    greatest(
        max(e.created_at),
        max(v.created_at),
        p.created_at
    ) as last_activity
from profiles p
left join entries e on e.user_id = p.id
left join votes v on v.user_id = p.id
left join challenges c on c.id = e.challenge_id
group by p.id;

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.votes enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Challenges policies
create policy "Challenges are viewable by everyone"
on public.challenges for select
using (true);

create policy "Only admins can create challenges"
on public.challenges for insert
to authenticated
using (exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
));

create policy "Only admins can update challenges"
on public.challenges for update
to authenticated
using (exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
));

-- Votes policies
create policy "Votes are viewable by everyone"
on public.votes for select
using (true);

create policy "Authenticated users can create votes"
on public.votes for insert
to authenticated
using (
    auth.uid() = user_id
    and exists (
        select 1 from public.challenges c
        where c.id = challenge_id
        and c.status = 'voting'
    )
);

create policy "Users cannot update votes"
on public.votes for update
using (false);

-- Functions
create or replace function public.get_user_stats(user_id uuid)
returns table (
    total_submissions bigint,
    total_votes bigint,
    total_rewards numeric,
    last_activity timestamp with time zone
) security definer
as $$
    select total_submissions, total_votes, total_rewards, last_activity
    from public.user_stats
    where user_id = $1;
$$ language sql; 