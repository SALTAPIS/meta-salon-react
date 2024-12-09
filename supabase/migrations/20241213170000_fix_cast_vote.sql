-- Drop existing function if it exists
drop function if exists public.cast_vote;

-- Recreate the cast_vote function
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
    select votes_remaining into v_pack_votes
    from public.vote_packs
    where id = p_pack_id
    and user_id = v_user_id
    and (expires_at is null or expires_at > now());

    if v_pack_votes is null then
        raise exception 'Invalid or expired vote pack';
    end if;

    if v_pack_votes < p_value then
        raise exception 'Insufficient votes in pack. Available: %, Requested: %', 
            v_pack_votes, p_value;
    end if;

    -- Create vote record
    insert into public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,
        created_at,
        updated_at
    )
    values (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,
        now(),
        now()
    )
    returning id into v_vote_id;

    -- Update vote pack
    update public.vote_packs
    set 
        votes_remaining = votes_remaining - p_value,
        updated_at = now()
    where id = p_pack_id;

    -- Update artwork vote count
    update public.artworks
    set 
        vote_count = vote_count + p_value,
        updated_at = now()
    where id = p_artwork_id;

    -- Update or insert vault state
    insert into public.vault_states (
        artwork_id,
        total_votes,
        last_vote_at,
        updated_at
    )
    values (
        p_artwork_id,
        p_value,
        now(),
        now()
    )
    on conflict (artwork_id) do update
    set
        total_votes = vault_states.total_votes + p_value,
        last_vote_at = now(),
        updated_at = now();

    return v_vote_id;
end;
$$; 