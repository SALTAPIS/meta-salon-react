-- Drop existing function if it exists
drop function if exists get_all_profiles_admin();

-- Create admin function to get all profiles with proper typing
create or replace function get_all_profiles_admin()
returns table (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  balance numeric(10,2),
  premium_until timestamptz,
  last_active timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select 
    p.id,
    au.email,
    p.role,
    p.created_at,
    p.balance,
    p.premium_until,
    p.last_active,
    p.updated_at
  from profiles p
  left join auth.users au on au.id = p.id
  order by p.created_at desc;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_all_profiles_admin() to authenticated;

-- Drop old policy if it exists
drop policy if exists "Only admins can execute get_all_profiles_admin" on profiles;

-- Create RLS policy to ensure only admins can execute the function
create policy "Only admins can execute get_all_profiles_admin"
  on profiles
  for select
  using (
    exists (
      select 1
      from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Refresh schema cache
notify pgrst, 'reload schema';