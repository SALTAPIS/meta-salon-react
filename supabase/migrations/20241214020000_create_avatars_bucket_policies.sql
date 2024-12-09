-- Create policies for the avatars bucket
DO $$
BEGIN
  -- Allow authenticated users to upload their own avatars
  EXECUTE format(
    'CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]);'
  );

  -- Allow authenticated users to update their own avatars
  EXECUTE format(
    'CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]);'
  );

  -- Allow public to view avatars
  EXECUTE format(
    'CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = ''avatars'');'
  );

  -- Allow users to delete their own avatars
  EXECUTE format(
    'CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]);'
  );
END
$$; 