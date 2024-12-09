-- Update handle_new_user function to create initial vote pack
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
    -- Create profile
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

    -- Create initial basic vote pack
    insert into public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    )
    values (
        new.id,
        'basic',
        10,
        1,
        now() + interval '30 days'
    );

    return new;
end;
$$; 