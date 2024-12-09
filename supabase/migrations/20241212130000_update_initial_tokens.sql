-- Update initial token amount in the trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
    -- Create profile
    insert into public.profiles (id, username, avatar_url, role, balance)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'avatar_url', 'https://www.gravatar.com/avatar/' || md5(lower(trim(new.email))) || '?d=mp'),
        'user',
        500  -- Updated initial balance to 500 SLN
    );

    -- Create initial token pack record
    insert into public.token_packs (
        user_id,
        amount,
        price,
        status,
        type
    ) values (
        new.id,
        500,  -- Updated initial amount to 500 SLN
        0,
        'completed',
        'initial'
    );

    -- Create transaction record
    insert into public.transactions (
        user_id,
        type,
        amount,
        description
    ) values (
        new.id,
        'initial_grant',
        500,  -- Updated initial amount to 500 SLN
        'Initial token grant'
    );

    return new;
end;
$$; 