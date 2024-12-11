-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.admin_reset_all_votes();

-- Create the function
CREATE OR REPLACE FUNCTION public.admin_reset_all_votes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reset votes';
  END IF;

  -- Delete all votes
  DELETE FROM votes;
  
  -- Reset all vault states
  UPDATE vault_states
  SET vault_status = 'available',
      last_vote_time = NULL;

  -- Reset all entry stats
  UPDATE entry_stats
  SET total_votes = 0,
      total_value = 0,
      average_value = 0;

  -- Reset all challenge stats
  UPDATE challenge_stats
  SET total_votes = 0,
      total_value = 0,
      average_value = 0;

END;
$$; 