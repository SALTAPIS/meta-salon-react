-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Enable real-time for specific tables
drop publication if exists meta_salon_realtime;
create publication meta_salon_realtime for table
    profiles,
    transactions,
    vote_packs;

-- Enable real-time for profiles table
drop publication if exists salon_realtime;
create publication salon_realtime for table profiles;

-- Create profiles table if not exists
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    role text not null default 'user',
    balance integer not null default 0,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    constraint valid_role check (role in ('user', 'admin', 'artist', 'moderator'))
);

-- Create transactions table if not exists
create table if not exists public.transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    type text not null,
    amount integer not null,
    description text,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Create vote_packs table if not exists
create table if not exists public.vote_packs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    votes_remaining integer not null default 0,
    vote_power integer not null default 1,
    expires_at timestamptz,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.vote_packs enable row level security;

-- Drop existing policies
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own transactions" on public.transactions;
drop policy if exists "System can create transactions" on public.transactions;
drop policy if exists "Users can view their own vote packs" on public.vote_packs;
drop policy if exists "System can manage vote packs" on public.vote_packs;

-- Create RLS policies
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can view their own transactions"
    on public.transactions for select
    using (auth.uid() = user_id);

create policy "System can create transactions"
    on public.transactions for insert
    with check (true);

create policy "Users can view their own vote packs"
    on public.vote_packs for select
    using (auth.uid() = user_id);

create policy "System can manage vote packs"
    on public.vote_packs for all
    using (true)
    with check (true);

-- Create or replace the update_updated_at_column function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Drop existing triggers
drop trigger if exists update_profiles_updated_at on public.profiles;
drop trigger if exists update_transactions_updated_at on public.transactions;
drop trigger if exists update_vote_packs_updated_at on public.vote_packs;

-- Create triggers for updated_at
create trigger update_profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at_column();

create trigger update_transactions_updated_at
    before update on transactions
    for each row
    execute function update_updated_at_column();

create trigger update_vote_packs_updated_at
    before update on vote_packs
    for each row
    execute function update_updated_at_column();
 