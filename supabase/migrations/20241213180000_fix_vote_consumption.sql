-- Drop existing function if it exists
drop function if exists public.get_vote_consumption_stats;

-- Create vote consumption stats function
create or replace function public.get_vote_consumption_stats(
    p_artwork_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
    v_stats json;
begin
    select json_build_object(
        'totalVotes', coalesce(sum(value), 0),
        'consumedVotes', coalesce(sum(case when consumed then value else 0 end), 0),
        'unconsumedVotes', coalesce(sum(case when not consumed then value else 0 end), 0),
        'vaultValue', a.vault_value
    ) into v_stats
    from public.artworks a
    left join public.votes v on v.artwork_id = a.id
    where a.id = p_artwork_id
    group by a.id, a.vault_value;

    return coalesce(v_stats, json_build_object(
        'totalVotes', 0,
        'consumedVotes', 0,
        'unconsumedVotes', 0,
        'vaultValue', 0
    ));
end;
$$; 