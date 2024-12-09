-- Create function to submit artwork to challenge
create or replace function public.submit_artwork_to_challenge(
  p_artwork_id uuid,
  p_challenge_id uuid,
  p_submission_fee integer
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  -- Get the user_id from the artwork
  select user_id into v_user_id
  from public.artworks
  where id = p_artwork_id;

  -- Check if artwork exists and belongs to the authenticated user
  if v_user_id is null or v_user_id != auth.uid() then
    raise exception 'Artwork not found or unauthorized';
  end if;

  -- Get user's current balance
  select balance into v_balance
  from public.profiles
  where id = v_user_id;

  -- Check if user has enough balance
  if v_balance < p_submission_fee then
    raise exception 'Insufficient balance';
  end if;

  -- Start transaction
  begin
    -- Update artwork status and challenge
    update public.artworks
    set 
      challenge_id = p_challenge_id,
      status = 'submitted',
      updated_at = now()
    where id = p_artwork_id;

    -- Deduct submission fee
    update public.profiles
    set balance = balance - p_submission_fee
    where id = v_user_id;

    -- Record transaction
    insert into public.transactions (
      user_id,
      type,
      amount,
      description,
      reference_id
    )
    select
      v_user_id,
      'submission_fee',
      -p_submission_fee,
      'Artwork submission fee for challenge ' || c.title,
      p_artwork_id
    from public.challenges c
    where c.id = p_challenge_id;

    -- Commit transaction
    return;
  exception
    when others then
      -- Rollback transaction
      raise exception 'Failed to submit artwork: %', sqlerrm;
  end;
end;
$$; 