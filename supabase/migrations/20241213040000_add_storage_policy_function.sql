-- Create function to apply storage policies
create or replace function public.apply_storage_policies()
returns void
language plpgsql
security definer
as $$
begin
    -- Drop existing policies
    drop policy if exists "Users can upload their own artworks" on storage.objects;
    drop policy if exists "Users can update their own artworks" on storage.objects;
    drop policy if exists "Users can delete their own artworks" on storage.objects;
    drop policy if exists "Anyone can view artworks" on storage.objects;

    -- Create storage bucket if it doesn't exist
    insert into storage.buckets (id, name, public)
    values ('artworks', 'artworks', true)
    on conflict (id) do nothing;

    -- Allow users to upload their own artworks
    create policy "Users can upload their own artworks"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'artworks' 
        and (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Allow users to update their own artworks
    create policy "Users can update their own artworks"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'artworks'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Allow users to delete their own artworks
    create policy "Users can delete their own artworks"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'artworks'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

    -- Allow public access to view artworks
    create policy "Anyone can view artworks"
    on storage.objects for select
    to public
    using (bucket_id = 'artworks');
end;
$$; 