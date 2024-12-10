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