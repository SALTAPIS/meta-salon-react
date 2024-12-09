-- Check user a15's profile and create default album if needed
do $$
declare
    v_user_id uuid;
begin
    -- Get user a15's ID
    select id into v_user_id
    from auth.users
    where email = 'a15@salt.dev';

    -- Create default album if it doesn't exist
    insert into public.albums (user_id, name, description, is_default)
    select
        v_user_id,
        'My First Album',
        'Default album for your artworks',
        true
    where not exists (
        select 1
        from public.albums
        where user_id = v_user_id
        and is_default = true
    );

    -- Ensure user has enough tokens
    update public.profiles
    set balance = greatest(balance, 100)
    where id = v_user_id;
end $$; 