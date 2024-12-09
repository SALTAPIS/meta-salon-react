-- Check user a15's profile and create default album if needed
do $$
declare
    v_user_id uuid;
begin
    -- Get user a15's ID
    select id into v_user_id
    from auth.users
    where email = 'a15@sln.io';

    -- Check if user exists
    if v_user_id is null then
        raise exception 'User with email a15@sln.io not found';
    end if;

    -- Create default album if it doesn't exist
    insert into public.albums (user_id, title, description, is_default)
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

    -- Log success
    raise notice 'Successfully updated user % with default album and tokens', v_user_id;
end $$; 