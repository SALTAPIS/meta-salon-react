-- Fix artist payouts table and function
-- Drop existing table and function if they exist
drop table if exists public.artist_payouts cascade;
drop function if exists public.calculate_artist_payout cascade;

-- Create artist payouts table
create table if not exists public.artist_payouts (
    id uuid primary key default gen_random_uuid(),
    artist_id uuid references auth.users(id) not null,
    artwork_id uuid references public.artworks(id) not null,
    amount numeric not null check (amount > 0),
    status text not null default 'pending',
    transaction_id uuid,
    created_at timestamptz default now(),
    processed_at timestamptz,
    constraint valid_status check (status in ('pending', 'processing', 'completed', 'failed'))
);

-- Enable RLS on artist payouts
alter table public.artist_payouts enable row level security;

-- Artists can view their own payouts
create policy "Artists can view their own payouts"
    on public.artist_payouts
    for select
    to authenticated
    using (artist_id = auth.uid());

-- Artists can create payout requests
create policy "Artists can create payout requests"
    on public.artist_payouts
    for insert
    to authenticated
    with check (artist_id = auth.uid());

-- Function to calculate available payout
create or replace function public.calculate_artist_payout(p_artwork_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
    v_available_amount numeric;
    v_artist_id uuid;
begin
    -- Get artist ID and verify ownership
    select user_id into v_artist_id
    from artworks
    where id = p_artwork_id;

    if v_artist_id != auth.uid() then
        raise exception 'Not authorized to calculate payout for this artwork';
    end if;

    -- Calculate available amount (vault_value minus already processed payouts)
    select coalesce(vault_value, 0) - coalesce(
        (select sum(amount) 
         from artist_payouts 
         where artwork_id = p_artwork_id 
         and status in ('pending', 'processing', 'completed')),
        0
    )
    into v_available_amount
    from artworks
    where id = p_artwork_id;
    
    return v_available_amount;
end;
$$;

-- Function to request payout
create or replace function public.request_artist_payout(
    p_artwork_id uuid,
    p_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_payout_id uuid;
    v_available_amount numeric;
    v_artist_id uuid;
begin
    -- Get artist ID and verify ownership
    select user_id into v_artist_id
    from artworks
    where id = p_artwork_id;

    if v_artist_id != auth.uid() then
        raise exception 'Not authorized to request payout for this artwork';
    end if;

    -- Calculate available amount
    v_available_amount := calculate_artist_payout(p_artwork_id);
    
    if v_available_amount < p_amount then
        raise exception 'Insufficient funds. Available: %, Requested: %', 
            v_available_amount, p_amount;
    end if;
    
    -- Create payout record
    insert into artist_payouts (
        artist_id,
        artwork_id,
        amount,
        status
    )
    values (
        auth.uid(),
        p_artwork_id,
        p_amount,
        'pending'
    )
    returning id into v_payout_id;

    -- Record transaction
    insert into transactions (
        user_id,
        type,
        amount,
        description,
        payout_id,
        metadata
    )
    values (
        auth.uid(),
        'payout_request',
        p_amount,
        format('Payout request for artwork %s', p_artwork_id),
        v_payout_id,
        jsonb_build_object(
            'artwork_id', p_artwork_id,
            'available_balance', v_available_amount,
            'requested_amount', p_amount
        )
    );
    
    return v_payout_id;
end;
$$;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on public.artist_payouts to authenticated;
grant all on public.transactions to authenticated; 