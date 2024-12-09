-- Drop existing policies
drop policy if exists "Users can upload their own artworks" on storage.objects;
drop policy if exists "Users can update their own artworks" on storage.objects;
drop policy if exists "Users can delete their own artworks" on storage.objects;
drop policy if exists "Anyone can view artworks" on storage.objects;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Create RLS policies
create policy "Users can upload their own artworks"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'artworks'
);

create policy "Users can update their own artworks"
on storage.objects for update
to authenticated
using (
    bucket_id = 'artworks'
    and owner = auth.uid()
);

create policy "Users can delete their own artworks"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'artworks'
    and owner = auth.uid()
);

create policy "Anyone can view artworks"
on storage.objects for select
to public
using (bucket_id = 'artworks'); 