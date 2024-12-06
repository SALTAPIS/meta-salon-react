-- Create vote_packs table
create table if not exists vote_packs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  votes_remaining integer not null default 0,
  vote_power integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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