-- Drop the existing vote_packs table
drop table if exists vote_packs;

-- Recreate vote_packs table with correct schema
create table if not exists vote_packs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('basic', 'art_lover', 'pro', 'expert', 'elite')),
    votes_remaining integer not null check (votes_remaining >= 0),
    vote_power integer not null check (vote_power > 0),
    expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for better query performance
create index if not exists idx_vote_packs_user_id on vote_packs(user_id);

-- Enable RLS
alter table vote_packs enable row level security;

-- Create RLS policies
create policy "Users can view their own vote packs"
    on vote_packs for select
    using (auth.uid() = user_id);

create policy "Users can update their own vote packs"
    on vote_packs for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "System can insert vote packs"
    on vote_packs for insert
    with check (true);

create policy "Admins can view all vote packs"
    on vote_packs for select
    using (
        exists (
            select 1
            from profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

create policy "Admins can update all vote packs"
    on vote_packs for update
    using (
        exists (
            select 1
            from profiles
            where id = auth.uid()
            and role = 'admin'
        )
    )
    with check (
        exists (
            select 1
            from profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

-- Recreate initial packs for all users
do $$
declare
    user_record record;
begin
    for user_record in select id, email from auth.users loop
        insert into vote_packs (
            user_id,
            type,
            votes_remaining,
            vote_power,
            expires_at
        )
        values (
            user_record.id,
            'basic',
            10,
            1,
            now() + interval '30 days'
        );
    end loop;
end;
$$ language plpgsql; 