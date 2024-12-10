-- Drop existing function
drop function if exists public.cast_vote cascade;

-- Create cast_vote function with better error handling
create or replace function public.cast_vote(
    p_artwork_id uuid,
    p_pack_id uuid,
    p_value integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_pack_votes integer;
    v_vote_power integer;
    v_vote_id uuid;
    v_artwork_status text;
    v_total_value integer;
    v_sln_value numeric;
    v_result jsonb;
begin
    -- Input validation
    if p_value <= 0 then
        return jsonb_build_object(
            'success', false,
            'error', 'Vote value must be greater than 0'
        );
    end if;

    -- Get user ID
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object(
            'success', false,
            'error', 'Not authenticated'
        );
    end if;

    -- Check artwork status
    select vault_status into v_artwork_status
    from public.artworks
    where id = p_artwork_id;

    if v_artwork_status is null then
        return jsonb_build_object(
            'success', false,
            'error', 'Artwork not found'
        );
    end if;

    if v_artwork_status != 'active' then
        return jsonb_build_object(
            'success', false,
            'error', 'Artwork vault is not active'
        );
    end if;

    -- Check vote pack ownership and available votes
    select votes_remaining, vote_power into v_pack_votes, v_vote_power
    from public.vote_packs
    where id = p_pack_id
    and user_id = v_user_id
    and (expires_at is null or expires_at > now());

    if v_pack_votes is null then
        return jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired vote pack'
        );
    end if;

    if v_pack_votes < p_value then
        return jsonb_build_object(
            'success', false,
            'error', format('Insufficient votes in pack. Available: %s, Requested: %s', 
                v_pack_votes, p_value)
        );
    end if;

    -- Calculate total vote value and SLN value
    v_total_value := p_value * v_vote_power;
    -- Each vote is worth 0.1 SLN, multiplied by vote power
    v_sln_value := (p_value * 0.1) * v_vote_power;

    -- Create vote record with SLN value
    insert into public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,
        vote_power,
        total_value,
        sln_value,
        created_at,
        updated_at
    )
    values (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,
        v_vote_power,
        v_total_value,
        v_sln_value,
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

    -- Update artwork vote count and SLN value
    update public.artworks
    set 
        vote_count = coalesce(vote_count, 0) + v_total_value,
        vault_value = coalesce(vault_value, 0) + v_sln_value,
        updated_at = now()
    where id = p_artwork_id;

    -- Update or insert vault state with SLN value
    insert into public.vault_states (
        artwork_id,
        vote_count,
        accumulated_value,
        last_vote_at,
        updated_at
    )
    values (
        p_artwork_id,
        v_total_value,
        v_sln_value,
        now(),
        now()
    )
    on conflict (artwork_id) do update
    set
        vote_count = vault_states.vote_count + v_total_value,
        accumulated_value = vault_states.accumulated_value + v_sln_value,
        last_vote_at = now(),
        updated_at = now();

    -- Record SLN token transaction
    insert into public.transactions (
        user_id,
        artwork_id,
        type,
        amount,
        description,
        created_at
    )
    values (
        v_user_id,
        p_artwork_id,
        'vote',
        v_sln_value,
        format('Vote cast: %s votes with %sx power', p_value, v_vote_power),
        now()
    );

    -- Build success response
    return jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'total_value', v_total_value,
        'sln_value', v_sln_value,
        'votes_remaining', v_pack_votes - p_value
    );

exception when others then
    return jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
end;
$$; 