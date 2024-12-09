-- Create albums table if not exists
create table if not exists public.albums (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    title text not null,
    description text,
    is_default boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.albums enable row level security;

-- Add is_default column if it doesn't exist
do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_name = 'albums'
        and column_name = 'is_default'
    ) then
        alter table public.albums add column is_default boolean default false;
    end if;
end $$;

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

-- Ensure at least one active challenge exists
do $$
begin
    if not exists (
        select 1
        from public.challenges
        where status = 'active'
    ) then
        -- Get first admin user
        with first_admin as (
            select id
            from public.profiles
            where role = 'admin'
            limit 1
        )
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
        from first_admin;
    end if;
end $$; 