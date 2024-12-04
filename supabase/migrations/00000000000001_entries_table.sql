-- Create entries table
create table if not exists public.entries (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    title text not null,
    description text,
    image_url text not null,
    ordinal_id text unique,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.entries enable row level security;

-- Entries policies
create policy "Entries are viewable by everyone"
on public.entries for select
using (true);

create policy "Users can create entries for active challenges"
on public.entries for insert
to authenticated
using (
    auth.uid() = user_id
    and exists (
        select 1 from public.challenges c
        where c.id = challenge_id
        and c.status = 'active'
    )
);

create policy "Users can update their own entries"
on public.entries for update
to authenticated
using (
    auth.uid() = user_id
    and status = 'pending'
)
with check (
    status = 'pending'
);

-- Add foreign key to votes table
alter table public.votes
add constraint votes_entry_id_fkey
foreign key (entry_id) references public.entries(id)
on delete cascade; 