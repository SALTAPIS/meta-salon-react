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
  username text,
  full_name text,
  avatar_url text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if the current user is an admin
  if not exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  ) then
    raise exception 'Access denied. Admin privileges required.';
  end if;

  -- Return all profiles with email from auth.users
  return query
  select 
    p.id,
    au.email,
    p.role,
    p.created_at,
    p.balance,
    p.username,
    p.full_name,
    p.avatar_url,
    p.updated_at
  from profiles p
  left join auth.users au on au.id = p.id
  order by p.created_at desc;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_all_profiles_admin() to authenticated;

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema'; 