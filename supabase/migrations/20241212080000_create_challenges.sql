-- Create challenges table
create table if not exists public.challenges (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    status text not null default 'draft',
    type text not null default 'open',
    start_time timestamptz not null default now(),
    end_time timestamptz not null,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint challenges_status_check check (status in ('draft', 'active', 'completed', 'cancelled')),
    constraint challenges_type_check check (type in ('open', 'curated', 'special'))
);

-- Enable RLS
alter table public.challenges enable row level security;

-- Drop existing policies
drop policy if exists "Challenges are viewable by everyone" on public.challenges;
drop policy if exists "Only admins can create challenges" on public.challenges;
drop policy if exists "Only admins can update challenges" on public.challenges;
drop policy if exists "Only admins can delete challenges" on public.challenges;

-- Create policies
create policy "Challenges are viewable by everyone"
on public.challenges for select
using (true);

create policy "Only admins can create challenges"
on public.challenges for insert
with check (
    exists (
        select 1
        from public.profiles
        where id = auth.uid()
        and role = 'admin'
    )
);

create policy "Only admins can update challenges"
on public.challenges for update
using (
    exists (
        select 1
        from public.profiles
        where id = auth.uid()
        and role = 'admin'
    )
);

create policy "Only admins can delete challenges"
on public.challenges for delete
using (
    exists (
        select 1
        from public.profiles
        where id = auth.uid()
        and role = 'admin'
    )
); 