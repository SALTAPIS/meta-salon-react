-- Add vault_status column to artworks table
alter table public.artworks
add column if not exists vault_status text default 'active'::text,
add column if not exists vote_count integer default 0,
add column if not exists vault_value integer default 0;

-- Update existing artworks to have active vault status
update public.artworks
set vault_status = 'active'
where vault_status is null;

-- Add constraint to ensure valid vault status values
alter table public.artworks
add constraint artworks_vault_status_check
check (vault_status in ('active', 'locked', 'closed')); 