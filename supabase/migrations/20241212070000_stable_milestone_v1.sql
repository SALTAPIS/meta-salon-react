-- MILESTONE: v1.0.0 - Stable Release
-- Features:
-- 1. User authentication and profiles
-- 2. Initial token grant (500 SLN)
-- 3. Vote packs system
-- 4. Automatic basic pack allocation for new users
-- 5. Working purchase flow

-- This is a marker migration to indicate a stable state.
-- If we need to rollback, we can restore to this point.

comment on database postgres is 'Milestone v1.0.0 - Stable release with working token and vote pack system';

-- Add comments to document the current state of critical tables
comment on table public.profiles is 'User profiles with balance and role management';
comment on table public.transactions is 'Token transaction history';
comment on table public.vote_packs is 'Vote packs with remaining votes and power';

-- Document the current schema version
create table if not exists public.schema_versions (
    version text primary key,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.schema_versions (version, description)
values (
    'v1.0.0',
    'Stable release with working token and vote pack system. Features: user auth, profiles, initial token grant (500 SLN), vote packs, automatic basic pack allocation.'
)
on conflict (version) do update
set description = excluded.description; 