-- Backup script for v1.1.0-stable (Profile Settings Milestone)
-- Drop existing schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table with all current fields
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    email text,
    role text DEFAULT 'user',
    balance integer DEFAULT 0,
    username text UNIQUE,
    display_name text,
    bio text,
    avatar_url text,
    email_verified boolean DEFAULT false,
    email_notifications boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create vote_packs table
CREATE TABLE public.vote_packs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    type text NOT NULL,
    votes_remaining integer DEFAULT 0,
    vote_power integer DEFAULT 1,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    description text,
    reference_id uuid,
    created_at timestamptz DEFAULT now()
);

-- Set up RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Set up RLS policies for vote packs
ALTER TABLE public.vote_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vote packs"
    ON vote_packs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own vote packs"
    ON vote_packs FOR UPDATE
    USING (auth.uid() = user_id);

-- Set up RLS policies for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create profile trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create profile update trigger
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_profile_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated; 