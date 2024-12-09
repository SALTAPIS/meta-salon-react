-- Drop existing tables and recreate with correct schema
drop table if exists public.artworks cascade;
drop table if exists public.albums cascade;

-- Create albums table with standardized naming
create table public.albums (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    title text not null,
    description text,
    is_default boolean default false,
    is_private boolean default false,
    cover_image text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.albums enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own albums" on public.albums;
drop policy if exists "Users can create their own albums" on public.albums;
drop policy if exists "Users can update their own albums" on public.albums;

-- RLS policies
create policy "Users can view their own albums"
    on public.albums for select
    using (auth.uid() = user_id);

create policy "Users can create their own albums"
    on public.albums for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own albums"
    on public.albums for update
    using (auth.uid() = user_id);

-- Create artworks table
create table public.artworks (
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

-- Function to ensure user has a default album
create or replace function public.ensure_user_has_default_album()
returns trigger
language plpgsql
security definer
as $$
begin
    -- Create default album if user doesn't have one
    insert into public.albums (user_id, title, description, is_default)
    select
        new.id,
        'My First Album',
        'Default album for your artworks',
        true
    where not exists (
        select 1
        from public.albums
        where user_id = new.id
        and is_default = true
    );
    return new;
end;
$$;

-- Trigger to create default album for new users
drop trigger if exists ensure_user_has_default_album_trigger on public.profiles;
create trigger ensure_user_has_default_album_trigger
    after insert on public.profiles
    for each row
    execute function public.ensure_user_has_default_album();

-- Create default albums for existing users
insert into public.albums (user_id, title, description, is_default)
select
    p.id,
    'My First Album',
    'Default album for your artworks',
    true
from public.profiles p
where not exists (
    select 1
    from public.albums a
    where a.user_id = p.id
    and a.is_default = true
); 