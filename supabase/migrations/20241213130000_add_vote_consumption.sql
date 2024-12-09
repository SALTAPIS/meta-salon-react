-- Function to calculate vote value based on time and other factors
create or replace function public.calculate_vote_value(
    p_vote_age interval,
    p_artwork_total_votes integer,
    p_vote_value integer
)
returns integer
language plpgsql
as $$
declare
    v_base_multiplier decimal := 1.0;
    v_time_multiplier decimal;
    v_volume_multiplier decimal;
    v_final_value integer;
begin
    -- Time-based multiplier (votes become more valuable over time)
    -- Maximum 2x multiplier after 7 days
    v_time_multiplier := least(2.0, 1.0 + extract(epoch from p_vote_age) / (7 * 24 * 60 * 60));

    -- Volume-based multiplier (votes become more valuable as total votes increase)
    -- Maximum 1.5x multiplier at 1000 votes
    v_volume_multiplier := least(1.5, 1.0 + (p_artwork_total_votes::decimal / 1000.0));

    -- Calculate final value
    v_final_value := floor(
        p_vote_value::decimal * 
        v_base_multiplier * 
        v_time_multiplier * 
        v_volume_multiplier
    )::integer;

    return v_final_value;
end;
$$;

-- Function to consume votes and update vault value
create or replace function public.consume_votes(
    p_artwork_id uuid,
    p_max_votes integer default 100
)
returns integer
language plpgsql
security definer
as $$
declare
    v_consumed_count integer := 0;
    v_vote record;
    v_vote_value integer;
    v_total_value integer := 0;
    v_artwork_total_votes integer;
begin
    -- Get artwork's total votes
    select vote_count into v_artwork_total_votes
    from public.artworks
    where id = p_artwork_id;

    -- Process unconsumed votes
    for v_vote in (
        select id, value, created_at
        from public.votes
        where artwork_id = p_artwork_id
        and consumed = false
        order by created_at asc
        limit p_max_votes
        for update skip locked
    )
    loop
        -- Calculate vote value based on age and other factors
        v_vote_value := public.calculate_vote_value(
            now() - v_vote.created_at,
            v_artwork_total_votes,
            v_vote.value
        );

        -- Update vote as consumed
        update public.votes
        set 
            consumed = true,
            consumed_at = now()
        where id = v_vote.id;

        -- Add to totals
        v_consumed_count := v_consumed_count + 1;
        v_total_value := v_total_value + v_vote_value;
    end loop;

    -- If any votes were consumed, update artwork vault value
    if v_consumed_count > 0 then
        -- Update artwork vault value
        update public.artworks
        set 
            vault_value = vault_value + v_total_value,
            updated_at = now()
        where id = p_artwork_id;

        -- Update vault state
        update public.vault_states
        set
            accumulated_value = accumulated_value + v_total_value,
            updated_at = now()
        where artwork_id = p_artwork_id;
    end if;

    return v_consumed_count;
end;
$$;

-- Function to process vote consumption for all artworks
create or replace function public.process_vote_consumption()
returns integer
language plpgsql
security definer
as $$
declare
    v_processed_count integer := 0;
    v_artwork record;
    v_consumed integer;
begin
    -- Process each artwork with unconsumed votes
    for v_artwork in (
        select distinct a.id
        from public.artworks a
        join public.votes v on v.artwork_id = a.id
        where v.consumed = false
        and a.vault_status = 'active'
        limit 100
    )
    loop
        v_consumed := public.consume_votes(v_artwork.id, 100);
        v_processed_count := v_processed_count + v_consumed;
    end loop;

    return v_processed_count;
end;
$$;

-- Create scheduled job for vote consumption
select
  cron.schedule(
    'process-vote-consumption',
    '*/15 * * * *', -- Every 15 minutes
    $$
    select public.process_vote_consumption();
    $$
  );

-- Add index for vote consumption queries
create index if not exists idx_votes_unconsumed_by_artwork 
on public.votes (artwork_id, consumed, created_at)
where consumed = false; 