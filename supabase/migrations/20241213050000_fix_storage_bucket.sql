-- Drop existing policies
drop policy if exists "Users can upload their own artworks" on storage.objects;
drop policy if exists "Users can update their own artworks" on storage.objects;
drop policy if exists "Users can delete their own artworks" on storage.objects;
drop policy if exists "Anyone can view artworks" on storage.objects;

-- Ensure storage schema exists
create schema if not exists storage;

-- Ensure storage_schema version exists
create table if not exists storage.schema_version (
    version text primary key,
    inserted_at timestamptz default now()
);

-- Create buckets table if it doesn't exist
create table if not exists storage.buckets (
    id text primary key,
    name text not null,
    owner uuid references auth.users,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    public boolean default false,
    avif_autodetection boolean default false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

-- Create objects table if it doesn't exist
create table if not exists storage.objects (
    id uuid default gen_random_uuid() primary key,
    bucket_id text references storage.buckets on delete cascade,
    name text,
    owner uuid references auth.users,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_accessed_at timestamptz default now(),
    metadata jsonb,
    path_tokens text[] generated always as (string_to_array(name, '/')) stored,
    version text
);

-- Create artworks bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'artworks',
    'artworks',
    true,
    10485760,  -- 10MB
    array['image/jpeg', 'image/png', 'image/gif']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif'],
    updated_at = now();

-- Create RLS policies
create policy "Users can upload their own artworks"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'artworks' 
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own artworks"
on storage.objects for update
to authenticated
using (
    bucket_id = 'artworks'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own artworks"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'artworks'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view artworks"
on storage.objects for select
to public
using (bucket_id = 'artworks'); 