-- Drop existing foreign key constraint
ALTER TABLE public.artwork_views
DROP CONSTRAINT IF EXISTS artwork_views_user_id_fkey;

-- Add new foreign key constraint that references auth.users
ALTER TABLE public.artwork_views
ADD CONSTRAINT artwork_views_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE; 