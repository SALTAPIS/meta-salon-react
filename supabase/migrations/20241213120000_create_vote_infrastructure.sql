-- Create votes table
create table if not exists public.votes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    artwork_id uuid references public.artworks(id) not null,
    pack_id uuid references public.vote_packs(id) not null,
    value integer not null check (value > 0),
    consumed boolean default false,
    created_at timestamptz default now(),
    consumed_at timestamptz,
    -- Ensure votes can't be consumed before they're created
    constraint votes_consumption_time_check check (consumed_at is null or consumed_at >= created_at)
);

-- Create vault states table
create table if not exists public.vault_states (
    artwork_id uuid references public.artworks(id) primary key,
    accumulated_value integer default 0,
    total_votes integer default 0,
    last_vote_at timestamptz,
    updated_at timestamptz default now()
);

-- Add vault fields to artworks
alter table public.artworks 
add column if not exists vault_status text default 'active'
    check (vault_status in ('active', 'locked', 'distributed')),
add column if not exists vote_count integer default 0,
add column if not exists vault_value integer default 0;

-- Create indexes
create index if not exists idx_votes_artwork_id on public.votes(artwork_id);
create index if not exists idx_votes_user_id on public.votes(user_id);
create index if not exists idx_votes_pack_id on public.votes(pack_id);
create index if not exists idx_votes_consumed on public.votes(consumed) where consumed = false;

-- Enable RLS
alter table public.votes enable row level security;
alter table public.vault_states enable row level security;

-- RLS Policies for votes
create policy "Users can view all votes"
    on public.votes for select
    using (true);

create policy "Users can create votes for active artworks"
    on public.votes for insert
    with check (
        exists (
            select 1 from public.artworks a
            where a.id = artwork_id
            and a.vault_status = 'active'
        )
        and
        auth.uid() = user_id
    );

-- RLS Policies for vault states
create policy "Everyone can view vault states"
    on public.vault_states for select
    using (true);

-- Function to cast a vote
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
    select votes into v_pack_votes
    from public.vote_packs
    where id = p_pack_id
    and user_id = v_user_id
    and status = 'active';

    if v_pack_votes is null then
        raise exception 'Invalid or inactive vote pack';
    end if;

    -- Calculate used votes from this pack
    select coalesce(sum(value), 0) into v_used_votes
    from public.votes
    where pack_id = p_pack_id;

    if (v_used_votes + p_value) > v_pack_votes then
        raise exception 'Insufficient votes in pack. Available: %, Requested: %', 
            (v_pack_votes - v_used_votes), p_value;
    end if;

    -- Create vote record
    insert into public.votes (
        user_id,
        artwork_id,
        pack_id,
        value
    )
    values (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value
    )
    returning id into v_vote_id;

    -- Update artwork vote count
    update public.artworks
    set 
        vote_count = vote_count + p_value,
        updated_at = now()
    where id = p_artwork_id;

    -- Update or insert vault state
    insert into public.vault_states (
        artwork_id,
        accumulated_value,
        total_votes,
        last_vote_at,
        updated_at
    )
    values (
        p_artwork_id,
        p_value, -- Initial accumulated value equals vote value
        p_value,
        now(),
        now()
    )
    on conflict (artwork_id) do update
    set
        accumulated_value = vault_states.accumulated_value + p_value,
        total_votes = vault_states.total_votes + p_value,
        last_vote_at = now(),
        updated_at = now();

    return v_vote_id;
end;
$$; 