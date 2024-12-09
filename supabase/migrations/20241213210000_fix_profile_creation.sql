-- Drop existing RLS policies for profiles
drop policy if exists "Enable read access for all users" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Enable update for users based on id" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "System can insert profiles" on public.profiles;

-- Create new RLS policies
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

-- Create trigger to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, role, balance, email_verified)
    values (
        new.id,
        new.email,
        'user',
        500,  -- Initial balance
        false
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create the trigger if it doesn't exist
do $$
begin
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'on_auth_user_created'
    ) then
        create trigger on_auth_user_created
            after insert on auth.users
            for each row
            execute function public.handle_new_user();
    end if;
end
$$; 