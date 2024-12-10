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