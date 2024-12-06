-- Add last_active column to profiles for basic user activity tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC); 