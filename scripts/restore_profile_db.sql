-- Reset database to profile enhancements state
-- Drop existing tables and functions
drop schema if exists public cascade;
create schema public;

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create profiles table
create table public.profiles (
    id uuid references auth.users(id) primary key,
    email text,
    role text default 'user',
    created_at timestamptz default now(),
    balance integer default 0,
    updated_at timestamptz default now(),
    username text unique,
    display_name text,
    bio text,
    avatar_url text,
    email_verified boolean default false,
    email_notifications boolean default true
);

-- Create vote_packs table
create table public.vote_packs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) not null,
    votes_remaining integer default 0,
    vote_power integer default 1,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Set up RLS policies for profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
    on profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on profiles for update
    using (auth.uid() = id);

-- Set up RLS policies for vote packs
alter table public.vote_packs enable row level security;

create policy "Users can view their own vote packs"
    on vote_packs for select
    using (auth.uid() = user_id);

create policy "Users can update their own vote packs"
    on vote_packs for update
    using (auth.uid() = user_id);

-- Set up storage policies
create policy "Avatar images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
    on storage.objects for insert
    with check (
        bucket_id = 'avatars' 
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "Users can update their own avatar"
    on storage.objects for update
    using (
        bucket_id = 'avatars' 
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "Users can delete their own avatar"
    on storage.objects for delete
    using (
        bucket_id = 'avatars' 
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create profile trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'user');
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Create profile update trigger
create or replace function public.handle_profile_update()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

create trigger before_profile_update
    before update on public.profiles
    for each row execute procedure public.handle_profile_update();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant select, update on public.vote_packs to authenticated;

-- Enable realtime
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table vote_packs; 