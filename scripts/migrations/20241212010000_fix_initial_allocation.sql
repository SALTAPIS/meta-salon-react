-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create user_vote_packs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_vote_packs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_type text NOT NULL CHECK (pack_type IN ('basic', 'premium', 'exclusive')),
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update or create the function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create initial profile with 500 SLN balance
  INSERT INTO public.profiles (
    id,
    email,
    role,
    balance,
    created_at,
    updated_at,
    email_verified,
    email_notifications
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    500, -- Initial balance of 500 SLN
    NOW(),
    NOW(),
    false,
    true
  );

  -- Add 1 Basic Vote Pack
  INSERT INTO public.user_vote_packs (
    user_id,
    pack_type,
    quantity,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'basic',
    1,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Ensure the profiles table exists and has correct permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Ensure the user_vote_packs table exists and has correct permissions
GRANT ALL ON public.user_vote_packs TO authenticated;
GRANT ALL ON public.user_vote_packs TO service_role;
``` 