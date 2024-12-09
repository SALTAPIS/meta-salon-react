-- Create or replace the function to handle new user setup
create or replace function public.handle_new_user()
returns trigger
security definer
as $$
begin
    -- Create profile first with initial balance
    insert into public.profiles (id, email, balance)
    values (new.id, new.email, 500);

    -- Record the initial token grant transaction
    insert into public.transactions (
        user_id,
        type,
        amount,
        description
    )
    values (
        new.id,
        'grant',
        500,
        'Initial token grant'
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
$$ language plpgsql;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger for new user setup
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user(); 