-- Drop existing function
drop function if exists public.submit_artwork_to_challenge;

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
  v_challenge_title text;
begin
  -- Get the user_id from the artwork
  select user_id into v_user_id
  from public.artworks
  where id = p_artwork_id;

  -- Check if artwork exists and belongs to the authenticated user
  if v_user_id is null then
    raise exception 'Artwork not found';
  end if;

  if v_user_id != auth.uid() then
    raise exception 'Unauthorized: artwork belongs to a different user';
  end if;

  -- Get challenge title
  select title into v_challenge_title
  from public.challenges
  where id = p_challenge_id;

  if v_challenge_title is null then
    raise exception 'Challenge not found';
  end if;

  -- Get user's current balance
  select balance into v_balance
  from public.profiles
  where id = v_user_id;

  if v_balance is null then
    raise exception 'User profile not found';
  end if;

  -- Check if user has enough balance
  if v_balance < p_submission_fee then
    raise exception 'Insufficient balance: have % tokens, need % tokens', v_balance, p_submission_fee;
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

    if not found then
      raise exception 'Failed to update artwork status';
    end if;

    -- Deduct submission fee
    update public.profiles
    set 
      balance = balance - p_submission_fee,
      updated_at = now()
    where id = v_user_id;

    if not found then
      raise exception 'Failed to update user balance';
    end if;

    -- Record transaction with minimal fields first
    insert into public.transactions (
      user_id,
      type,
      amount,
      status
    )
    values (
      v_user_id,
      'submission',
      -p_submission_fee,
      'completed'
    );

    -- Update the transaction with additional fields
    update public.transactions
    set
      description = format('Artwork submission fee for challenge: %s', v_challenge_title),
      reference_id = p_artwork_id,
      metadata = jsonb_build_object(
        'artwork_id', p_artwork_id,
        'challenge_id', p_challenge_id,
        'challenge_title', v_challenge_title
      )
    where user_id = v_user_id
    and type = 'submission'
    and created_at >= (now() - interval '1 second');

    -- Return success
    return;
  exception
    when others then
      -- Log error details with constraint name if available
      raise notice 'Error in submit_artwork_to_challenge: %, %, SQLSTATE: %, CONSTRAINT: %', 
        sqlerrm, 
        sqlstate, 
        sqlstate,
        CASE 
          WHEN sqlerrm LIKE '%violates check constraint%' 
          THEN substring(sqlerrm from 'constraint "(.*?)"')
          ELSE null
        END;
      -- Rollback transaction
      raise exception 'Failed to submit artwork: %', sqlerrm;
  end;
end;
$$; 