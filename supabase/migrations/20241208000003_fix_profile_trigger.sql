-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    role,
    balance,
    username,
    display_name,
    email_verified,
    email_notifications,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email,
    'user',
    0,
    split_part(new.email, '@', 1), -- Default username from email
    null,
    false,
    true,
    new.created_at,
    new.created_at
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 