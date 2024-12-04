-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    role text default 'user' check (role in ('user', 'member', 'moderator', 'admin')),
    balance numeric(10,2) default 0 not null,
    premium_until timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    type text not null check (type in ('grant', 'submission', 'vote_pack', 'reward', 'premium', 'refund')),
    amount numeric(10,2) not null,
    description text,
    reference_id uuid,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create vote packs table
create table if not exists public.vote_packs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    type text not null check (type in ('basic', 'art_lover', 'pro', 'expert', 'elite')),
    votes_remaining integer not null check (votes_remaining >= 0),
    vote_power integer not null check (vote_power > 0),
    expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create challenges table
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

-- Create entries table
create table if not exists public.entries (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    title text not null,
    description text,
    image_url text not null,
    status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
    votes_count integer not null default 0,
    total_power integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create votes table
create table if not exists public.votes (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    entry_id uuid references public.entries(id) on delete cascade not null,
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
alter table public.entries enable row level security;
alter table public.transactions enable row level security;
alter table public.vote_packs enable row level security;

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
with check (exists (
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

-- Entries policies
create policy "Entries are viewable by everyone"
on public.entries for select
using (true);

create policy "Users can create entries"
on public.entries for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own entries"
on public.entries for update
using (auth.uid() = user_id);

-- Votes policies
create policy "Votes are viewable by everyone"
on public.votes for select
using (true);

create policy "Authenticated users can create votes"
on public.votes for insert
to authenticated
with check (
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

-- Transaction policies
create policy "Users can view their own transactions"
on public.transactions for select
using (auth.uid() = user_id);

create policy "System can create transactions"
on public.transactions for insert
with check (true);

-- Vote packs policies
create policy "Users can view their own vote packs"
on public.vote_packs for select
using (auth.uid() = user_id);

create policy "System can manage vote packs"
on public.vote_packs for all
using (true);

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

-- Function to handle new user setup
create or replace function public.handle_new_user()
returns trigger
security definer
as $$
begin
    -- Create profile first
    insert into public.profiles (id, email)
    values (new.id, new.email);

    -- Grant initial tokens (500 SLN = $5.00)
    insert into public.transactions (user_id, type, amount, description)
    values (new.id, 'grant', 500, 'Initial token grant');

    update public.profiles
    set balance = balance + 500
    where id = new.id;

    -- Create initial basic vote pack
    insert into public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    )
    values (
        new.id,
        'basic',
        10,
        1,
        now() + interval '30 days'
    );

    return new;
end;
$$ language plpgsql;

-- Create trigger for new user setup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();