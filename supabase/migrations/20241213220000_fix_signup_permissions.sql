-- Drop existing trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Ensure auth schema exists
create schema if not exists auth;

-- Grant necessary permissions
grant usage on schema auth to postgres, anon, authenticated, service_role;
grant all on all tables in schema auth to postgres, service_role;
grant all on all sequences in schema auth to postgres, service_role;
grant all on all routines in schema auth to postgres, service_role;

-- Ensure profiles table has correct permissions
grant all on table public.profiles to postgres, service_role;
grant select on table public.profiles to anon;
grant select, update on table public.profiles to authenticated;

-- Recreate the handle_new_user function with proper permissions
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
    insert into public.profiles (
        id,
        email,
        role,
        balance,
        email_verified,
        created_at,
        updated_at
    )
    values (
        new.id,
        new.email,
        'user',
        500,
        false,
        now(),
        now()
    );
    return new;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- Ensure RLS is enabled
alter table public.profiles enable row level security;

-- Drop existing policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Enable profile creation during signup" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create new policies
create policy "Profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Enable profile creation during signup"
    on public.profiles for insert
    with check (true);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Grant execute permission on the function
grant execute on function public.handle_new_user to postgres, service_role; 