-- Drop existing function
drop function if exists public.cast_vote;

-- Recreate function with correct schema
create or replace function public.cast_vote(
    p_artwork_id uuid,
    p_pack_id uuid,
    p_value integer
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_pack_votes integer;
    v_used_votes integer;
    v_vote_id uuid;
    v_artwork_status text;
    v_expires_at timestamptz;
begin
    -- Get user ID
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Check artwork status
    select vault_status into v_artwork_status
    from public.artworks
    where id = p_artwork_id;

    if v_artwork_status is null then
        raise exception 'Artwork not found';
    end if;

    if v_artwork_status != 'active' then
        raise exception 'Artwork vault is not active';
    end if;

    -- Check vote pack ownership and available votes
    select votes_remaining, expires_at into v_pack_votes, v_expires_at
    from public.vote_packs
    where id = p_pack_id
    and user_id = v_user_id;

    if v_pack_votes is null then
        raise exception 'Vote pack not found';
    end if;

    if v_pack_votes < p_value then
        raise exception 'Insufficient votes remaining';
    end if;

    if v_expires_at is not null and v_expires_at < now() then
        raise exception 'Vote pack has expired';
    end if;

    -- Create vote record
    insert into public.votes (artwork_id, user_id, pack_id, value)
    values (p_artwork_id, v_user_id, p_pack_id, p_value)
    returning id into v_vote_id;

    -- Update vote pack remaining votes
    update public.vote_packs
    set votes_remaining = votes_remaining - p_value,
        updated_at = now()
    where id = p_pack_id;

    return v_vote_id;
end;
$$; 