-- Create profiles table first
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    role text default 'user',
    balance numeric(10,2) default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    type text not null check (type in ('grant', 'submission', 'vote_pack', 'reward', 'premium', 'refund')),
    amount numeric(10,2) not null,
    description text,
    reference_id uuid,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create vote packs table
create table if not exists public.vote_packs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    type text not null check (type in ('basic', 'art_lover', 'pro', 'expert', 'elite')),
    votes_remaining integer not null check (votes_remaining >= 0),
    vote_power integer not null check (vote_power > 0),
    expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.vote_packs enable row level security;

-- Drop existing policies
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own transactions" on public.transactions;
drop policy if exists "System can create transactions" on public.transactions;
drop policy if exists "Users can view their own vote packs" on public.vote_packs;
drop policy if exists "System can manage vote packs" on public.vote_packs;

-- RLS policies
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Users can view their own transactions"
on public.transactions for select
using (auth.uid() = user_id);

create policy "System can create transactions"
on public.transactions for insert
with check (true);

create policy "Users can view their own vote packs"
on public.vote_packs for select
using (auth.uid() = user_id);

create policy "System can manage vote packs"
on public.vote_packs for all
with check (true);

-- Function to handle new user setup
create or replace function public.handle_new_user()
returns trigger
security definer
as $$
declare
    v_transaction_id uuid;
begin
    -- Create profile first with initial balance
    insert into public.profiles (id, email, balance)
    values (new.id, new.email, 500);

    -- Record the initial token grant transaction
    insert into public.transactions (
        user_id,
        type,
        amount,
        description
    )
    values (
        new.id,
        'grant',
        500,
        'Initial token grant'
    )
    returning id into v_transaction_id;

    -- Create initial basic vote pack
    insert into public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    )
    values (
        new.id,
        'basic',
        10,
        1,
        now() + interval '30 days'
    );

    return new;
end;
$$ language plpgsql;

-- Create trigger for new user setup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- Function to process transactions
create or replace function public.process_transaction(
    p_user_id uuid,
    p_type text,
    p_amount numeric,
    p_description text default null,
    p_reference_id uuid default null
)
returns uuid
security definer
as $$
declare
    v_transaction_id uuid;
begin
    -- Create transaction
    insert into public.transactions (
        user_id,
        type,
        amount,
        description,
        reference_id
    )
    values (
        p_user_id,
        p_type,
        p_amount,
        p_description,
        p_reference_id
    )
    returning id into v_transaction_id;

    -- Update user balance
    update public.profiles
    set 
        balance = balance + p_amount,
        updated_at = now()
    where id = p_user_id;

    return v_transaction_id;
end;
$$ language plpgsql;

-- Function to purchase vote pack
create or replace function public.purchase_vote_pack(
    p_user_id uuid,
    p_type text,
    p_amount numeric
)
returns uuid
security definer
as $$
declare
    v_vote_power integer;
    v_votes_count integer;
    v_pack_id uuid;
    v_user_balance numeric;
begin
    -- Get user's current balance
    select balance into v_user_balance
    from public.profiles
    where id = p_user_id;

    if v_user_balance < p_amount then
        raise exception 'Insufficient balance';
    end if;

    -- Set vote pack parameters based on type
    case p_type
        when 'basic' then
            v_vote_power := 1;
            v_votes_count := 10;
        when 'art_lover' then
            v_vote_power := 1;
            v_votes_count := 100;
        when 'pro' then
            v_vote_power := 2;
            v_votes_count := 10;
        when 'expert' then
            v_vote_power := 5;
            v_votes_count := 10;
        when 'elite' then
            v_vote_power := 10;
            v_votes_count := 10;
        else
            raise exception 'Invalid vote pack type';
    end case;

    -- Process payment
    perform public.process_transaction(
        p_user_id,
        'vote_pack',
        -p_amount,
        'Purchase ' || p_type || ' vote pack'
    );

    -- Create vote pack
    insert into public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    )
    values (
        p_user_id,
        p_type,
        v_votes_count,
        v_vote_power,
        now() + interval '30 days'
    )
    returning id into v_pack_id;

    return v_pack_id;
end;
$$ language plpgsql; 