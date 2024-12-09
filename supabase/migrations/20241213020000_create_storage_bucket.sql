-- Create storage bucket for artworks if it doesn't exist
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files
create policy "Authenticated users can upload artworks"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'artworks' 
    and auth.role() = 'authenticated'
);

-- Allow public access to view artworks
create policy "Anyone can view artworks"
on storage.objects for select
to public
using (bucket_id = 'artworks'); 