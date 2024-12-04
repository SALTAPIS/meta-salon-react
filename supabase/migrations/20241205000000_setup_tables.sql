-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    role text default 'user' check (role in ('user', 'member', 'moderator', 'admin')),
    balance numeric(10,2) default 0 not null,
    premium_until timestamp with time zone,
    avatar_url text,
    wallet text,
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

-- Create system_metrics table
create table if not exists public.system_metrics (
    id uuid default uuid_generate_v4() primary key,
    metric_type text not null,
    value numeric not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.vote_packs enable row level security;
alter table public.system_metrics enable row level security;

-- RLS policies
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "System can create profiles"
on public.profiles for insert
with check (true);

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

-- System metrics policies
create policy "Authenticated users can view metrics"
on public.system_metrics for select
to authenticated
using (true);

create policy "System can create metrics"
on public.system_metrics for insert
with check (true);

-- Function to handle new user setup
create or replace function public.handle_new_user()
returns trigger
security definer
as $$
begin
    -- Create profile first
    insert into public.profiles (id, email)
    values (new.id, new.email);

    -- Grant initial tokens (500 SLN = $5.00)
    insert into public.transactions (user_id, type, amount, description)
    values (new.id, 'grant', 500, 'Initial token grant');

    update public.profiles
    set balance = balance + 500
    where id = new.id;

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

-- Monitoring functions
create or replace function public.record_metric(
    p_type text,
    p_value numeric,
    p_context jsonb default null
)
returns uuid
security definer
as $$
declare
    v_metric_id uuid;
begin
    insert into public.system_metrics (
        metric_type,
        value,
        metadata
    )
    values (
        p_type,
        p_value,
        p_context
    )
    returning id into v_metric_id;

    return v_metric_id;
end;
$$ language plpgsql;

create or replace function public.get_system_health()
returns table (
    component text,
    status text,
    last_check timestamp with time zone,
    details jsonb
)
security definer
as $$
begin
    return query
    select 
        'database'::text as component,
        case 
            when pg_is_in_recovery() then 'degraded'
            else 'healthy'
        end as status,
        now() as last_check,
        jsonb_build_object(
            'connections', (select count(*) from pg_stat_activity)
        ) as details;
end;
$$ language plpgsql;

-- Vote pack management functions
create or replace function public.purchase_vote_pack(
    p_user_id uuid,
    p_type text,
    p_amount numeric
) returns uuid
security definer
as $$
declare
    v_vote_power integer;
    v_votes_count integer;
    v_pack_id uuid;
    v_user_balance numeric;
begin
    -- Check user balance first
    select balance into v_user_balance
    from public.profiles
    where id = p_user_id;

    if v_user_balance < p_amount then
        raise exception 'Insufficient balance to purchase vote pack';
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
            v_votes_count := 25;
        when 'expert' then
            v_vote_power := 5;
            v_votes_count := 50;
        when 'elite' then
            v_vote_power := 10;
            v_votes_count := 100;
        else
            raise exception 'Invalid vote pack type';
    end case;

    -- Process payment
    perform public.process_transaction(
        p_user_id,
        'vote_pack'::text,
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