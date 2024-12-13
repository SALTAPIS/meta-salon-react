-- Grant admin users bypass RLS
alter table votes force row level security;

grant select on votes to authenticated;
grant insert on votes to authenticated;

-- Allow admin role to bypass RLS
alter default privileges in schema public grant all on tables to authenticated;
grant all privileges on all tables in schema public to authenticated; 