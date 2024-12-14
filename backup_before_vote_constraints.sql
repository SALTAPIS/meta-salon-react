

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."admin_reset_all_votes"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_deleted_votes INTEGER;
    v_updated_artworks INTEGER;
    v_user_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = v_user_id 
        AND raw_user_meta_data->>'role' = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only admins can reset votes';
    END IF;

    -- Delete all votes and count them
    WITH deleted AS (
        DELETE FROM public.votes
        WHERE id IS NOT NULL  -- This satisfies the WHERE clause requirement
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_votes FROM deleted;

    -- Reset vote counts and vault values for active artworks
    WITH updated AS (
        UPDATE public.artworks
        SET vote_count = 0,
            vault_value = 0,
            updated_at = now()
        WHERE id IS NOT NULL  -- This satisfies the WHERE clause requirement
        RETURNING *
    )
    SELECT COUNT(*) INTO v_updated_artworks FROM updated;

    -- Return the results
    RETURN jsonb_build_object(
        'success', true,
        'deleted_votes', v_deleted_votes,
        'updated_artworks', v_updated_artworks
    );
END;
$$;


ALTER FUNCTION "public"."admin_reset_all_votes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_artist_payout"("p_artwork_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_available_amount numeric;
    v_artist_id uuid;
    v_is_admin boolean;
    v_user_id uuid;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Check if user is admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = v_user_id;

    -- Log authentication info
    RAISE NOTICE 'User ID: %, Is Admin: %', v_user_id, v_is_admin;

    -- Get artist ID
    SELECT user_id INTO v_artist_id
    FROM artworks
    WHERE id = p_artwork_id;

    -- Log artwork info
    RAISE NOTICE 'Artwork ID: %, Artist ID: %', p_artwork_id, v_artist_id;

    -- Allow access if user is admin or artwork owner
    IF NOT (v_is_admin OR v_artist_id = v_user_id) THEN
        RAISE EXCEPTION 'Not authorized to calculate payout for this artwork. User: %, Artist: %', v_user_id, v_artist_id;
    END IF;

    -- Calculate available amount (vault_value minus already processed payouts)
    SELECT COALESCE(vault_value, 0) - COALESCE(
        (SELECT SUM(amount) 
         FROM artist_payouts 
         WHERE artwork_id = p_artwork_id 
         AND status IN ('pending', 'processing', 'completed')),
        0
    )
    INTO v_available_amount
    FROM artworks
    WHERE id = p_artwork_id;

    -- Log calculated amount
    RAISE NOTICE 'Calculated available amount: %', v_available_amount;
    
    RETURN v_available_amount;
END;
$$;


ALTER FUNCTION "public"."calculate_artist_payout"("p_artwork_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_win_ratio"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (NEW.wins + NEW.losses) > 0 THEN
        NEW.win_ratio := ROUND((NEW.wins::DECIMAL / (NEW.wins + NEW.losses) * 100)::DECIMAL, 2);
    ELSE
        NEW.win_ratio := 0;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_win_ratio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cast_vote"("p_artwork_id" "uuid", "p_pack_id" "uuid", "p_value" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_pack_votes integer;
    v_vote_power integer;
    v_vote_id uuid;
    v_artwork_status text;
    v_sln_value numeric;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check artwork status
    SELECT vault_status INTO v_artwork_status
    FROM public.artworks
    WHERE id = p_artwork_id;

    IF v_artwork_status IS NULL THEN
        RAISE EXCEPTION 'Artwork not found';
    END IF;

    IF v_artwork_status != 'active' THEN
        RAISE EXCEPTION 'Artwork vault is not active';
    END IF;

    -- Check vote pack ownership and available votes
    SELECT votes_remaining, vote_power INTO v_pack_votes, v_vote_power
    FROM public.vote_packs
    WHERE id = p_pack_id
    AND user_id = v_user_id
    AND (expires_at IS NULL OR expires_at > now());

    IF v_pack_votes IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired vote pack';
    END IF;

    IF v_pack_votes < p_value THEN
        RAISE EXCEPTION 'Insufficient votes in pack. Available: %, Requested: %', 
            v_pack_votes, p_value;
    END IF;

    -- Calculate SLN value (vote power affects SLN value only)
    v_sln_value := p_value * v_vote_power;

    -- Create vote record
    INSERT INTO public.votes (
        user_id,
        artwork_id,
        pack_id,
        value,          -- Raw vote count
        vote_power,     -- Power of the vote pack used
        total_value,    -- Same as raw vote count
        sln_value,      -- Vote count * vote power
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        p_artwork_id,
        p_pack_id,
        p_value,        -- Raw vote count
        v_vote_power,   -- Power of the vote pack used
        p_value,        -- Same as raw vote count
        v_sln_value,    -- Vote count * vote power
        now(),
        now()
    )
    RETURNING id INTO v_vote_id;

    -- Update vote pack
    UPDATE public.vote_packs
    SET 
        votes_remaining = votes_remaining - p_value,
        updated_at = now()
    WHERE id = p_pack_id;

    -- Update artwork vote count and vault value
    UPDATE public.artworks
    SET 
        vote_count = COALESCE(vote_count, 0) + 1,
        vault_value = COALESCE(vault_value, 0) + v_sln_value,
        updated_at = now()
    WHERE id = p_artwork_id;

    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'raw_votes', p_value,
        'sln_value', v_sln_value,
        'votes_remaining', v_pack_votes - p_value
    );
END;
$$;


ALTER FUNCTION "public"."cast_vote"("p_artwork_id" "uuid", "p_pack_id" "uuid", "p_value" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_epoch"("p_epoch_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Mark epoch as completed
    UPDATE public.epochs
    SET 
        status = 'completed',
        updated_at = now()
    WHERE id = p_epoch_id;

    -- Unlock all vault tokens from this epoch
    UPDATE public.vault_states
    SET 
        is_locked = false,
        updated_at = now()
    WHERE epoch_id = p_epoch_id;
END;
$$;


ALTER FUNCTION "public"."complete_epoch"("p_epoch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_epoch"("p_duration" interval DEFAULT '7 days'::interval) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_epoch_id UUID;
BEGIN
    INSERT INTO public.epochs (
        start_date,
        end_date
    ) VALUES (
        now(),
        now() + p_duration
    )
    RETURNING id INTO v_epoch_id;

    RETURN v_epoch_id;
END;
$$;


ALTER FUNCTION "public"."create_epoch"("p_duration" interval) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_initial_profile"("user_id" "uuid", "user_email" "text", "user_role" "text", "initial_balance" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    role,
    balance,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_role,
    initial_balance,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    balance = EXCLUDED.balance,
    updated_at = now()
  WHERE profiles.id = EXCLUDED.id;
END;
$$;


ALTER FUNCTION "public"."create_initial_profile"("user_id" "uuid", "user_email" "text", "user_role" "text", "initial_balance" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_has_default_album"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    -- Create default album if user doesn't have one
    insert into public.albums (user_id, title, description, is_default)
    select
        new.id,
        'My First Album',
        'Default album for your artworks',
        true
    where not exists (
        select 1
        from public.albums
        where user_id = new.id
        and is_default = true
    );
    return new;
end;
$$;


ALTER FUNCTION "public"."ensure_user_has_default_album"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exec_sql"("sql" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE sql;
END;
$$;


ALTER FUNCTION "public"."exec_sql"("sql" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_username"("email" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    base_username text;
    test_username text;
    counter integer := 0;
BEGIN
    -- Extract everything before the @ symbol and remove special characters
    base_username := lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    
    -- Initial try with just the base username
    test_username := base_username;
    
    -- Keep trying with incrementing numbers until we find a unique username
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = test_username) LOOP
        counter := counter + 1;
        test_username := base_username || counter::text;
    END LOOP;
    
    RETURN test_username;
END;
$$;


ALTER FUNCTION "public"."generate_unique_username"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_profiles_admin"() RETURNS TABLE("id" "uuid", "email" "text", "role" "text", "created_at" timestamp with time zone, "balance" numeric, "username" "text", "display_name" "text", "avatar_url" "text", "updated_at" timestamp with time zone, "email_verified" boolean, "premium_until" timestamp with time zone, "artwork_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return all profiles with email from auth.users and artwork count
  RETURN QUERY
  SELECT 
    p.id,
    CAST(au.email AS text),
    CAST(p.role AS text),
    p.created_at,
    p.balance,
    CAST(p.username AS text),
    CAST(p.display_name AS text),
    CAST(p.avatar_url AS text),
    p.updated_at,
    p.email_verified,
    p.premium_until,
    COALESCE(COUNT(a.id), 0)::bigint as artwork_count
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN artworks a ON a.user_id = p.id
  GROUP BY p.id, au.email, p.role, p.created_at, p.balance, p.username, 
           p.display_name, p.avatar_url, p.updated_at, p.email_verified, p.premium_until
  ORDER BY p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_all_profiles_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_epoch"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select id 
  from epochs 
  where status = 'active' 
  order by start_date desc 
  limit 1;
$$;


ALTER FUNCTION "public"."get_current_epoch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_epoch_stats"("epoch_id_param" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  stats json;
begin
  select json_build_object(
    'total_votes', 0,
    'unique_voters', 0,
    'participating_artworks', 0,
    'highest_vote', 0,
    'lowest_vote', 0,
    'avg_vote_size', 0,
    'total_tokens_distributed', 0,
    'rewarded_artists', 0,
    'highest_reward', 0,
    'lowest_reward', 0,
    'avg_reward', 0,
    'artworks_with_votes', 0,
    'avg_votes_per_artwork', 0,
    'most_votes_artwork', 0,
    'least_votes_artwork', 0,
    'completion_percentage', case 
      when (select end_date from epochs where id = epoch_id_param) > now() then
        (extract(epoch from (now() - start_date)) / extract(epoch from (end_date - start_date)) * 100)
      else 100
    end
  ) into stats
  from epochs
  where id = epoch_id_param;

  return stats;
end;
$$;


ALTER FUNCTION "public"."get_epoch_stats"("epoch_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_stats"("user_id" "uuid") RETURNS TABLE("total_submissions" bigint, "total_votes" bigint, "total_rewards" numeric, "last_activity" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $_$
    select total_submissions, total_votes, total_rewards, last_activity
    from public.user_stats
    where user_id = $1;
$_$;


ALTER FUNCTION "public"."get_user_stats"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_balance_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_log_id uuid;
BEGIN
    -- Update updated_at timestamp
    NEW.updated_at = now();
    
    -- Log the trigger execution with more details
    INSERT INTO public.trigger_logs (
        trigger_name,
        table_name,
        operation,
        old_data,
        new_data
    ) VALUES (
        'handle_balance_update',
        'profiles',
        TG_OP,
        row_to_json(OLD)::jsonb,
        row_to_json(NEW)::jsonb
    ) RETURNING id INTO v_log_id;
    
    -- Log attempt to notify
    INSERT INTO public.trigger_logs (
        trigger_name,
        table_name,
        operation,
        old_data,
        new_data
    ) VALUES (
        'balance_notification',
        'profiles',
        'NOTIFY',
        jsonb_build_object(
            'log_id', v_log_id,
            'old_balance', OLD.balance,
            'new_balance', NEW.balance
        ),
        jsonb_build_object(
            'channel', 'balance_updates',
            'payload', json_build_object(
                'user_id', NEW.id,
                'old_balance', OLD.balance,
                'new_balance', NEW.balance,
                'timestamp', extract(epoch from now())
            )
        )
    );
    
    -- Notify about balance change
    IF OLD.balance IS DISTINCT FROM NEW.balance THEN
        PERFORM pg_notify(
            'balance_updates',
            json_build_object(
                'user_id', NEW.id,
                'old_balance', OLD.balance,
                'new_balance', NEW.balance,
                'timestamp', extract(epoch from now())
            )::text
        );
        
        -- Log successful notification
        INSERT INTO public.trigger_logs (
            trigger_name,
            table_name,
            operation,
            old_data,
            new_data
        ) VALUES (
            'balance_notification',
            'profiles',
            'NOTIFY_SENT',
            jsonb_build_object(
                'log_id', v_log_id,
                'status', 'success'
            ),
            jsonb_build_object(
                'channel', 'balance_updates',
                'user_id', NEW.id,
                'timestamp', extract(epoch from now())
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_balance_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.username IS NULL AND NEW.email IS NOT NULL THEN
        NEW.username := generate_unique_username(NEW.email);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
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
    return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_profile_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = now();
  
  -- Ensure username is lowercase and trimmed
  IF NEW.username IS NOT NULL THEN
    NEW.username = lower(trim(NEW.username));
  END IF;

  -- Ensure display_name is trimmed
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name = trim(NEW.display_name);
  END IF;

  -- Ensure bio is trimmed
  IF NEW.bio IS NOT NULL THEN
    NEW.bio = trim(NEW.bio);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_profile_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_transaction_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Notify about new transaction
    PERFORM pg_notify(
        'transaction_updates',
        json_build_object(
            'user_id', NEW.user_id,
            'type', NEW.type,
            'amount', NEW.amount,
            'timestamp', extract(epoch from now())
        )::text
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_transaction_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_production"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN current_database() = 'postgres';
END;
$$;


ALTER FUNCTION "public"."is_production"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_vault_tokens"("p_artwork_id" "uuid", "p_epoch_id" "uuid", "p_value" numeric, "p_lock_duration" interval DEFAULT '7 days'::interval) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update vault state with locked tokens
    UPDATE public.vault_states
    SET 
        locked_until = COALESCE(locked_until, now()) + p_lock_duration,
        is_locked = true,
        epoch_id = p_epoch_id,
        locked_value = COALESCE(locked_value, 0) + p_value,
        updated_at = now()
    WHERE artwork_id = p_artwork_id;

    -- Update epoch totals
    UPDATE public.epochs
    SET
        total_votes = total_votes + 1,
        total_value = total_value + p_value,
        curator_reward_pool = curator_reward_pool + (p_value * 0.1), -- 10% for curator rewards
        updated_at = now()
    WHERE id = p_epoch_id;
END;
$$;


ALTER FUNCTION "public"."lock_vault_tokens"("p_artwork_id" "uuid", "p_epoch_id" "uuid", "p_value" numeric, "p_lock_duration" interval) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_balance_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    if old.balance is distinct from new.balance then
        perform pg_notify(
            'balance_updates',
            json_build_object(
                'user_id', new.id,
                'old_balance', old.balance,
                'new_balance', new.balance,
                'timestamp', extract(epoch from now())
            )::text
        );
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."notify_balance_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text" DEFAULT NULL::"text", "p_reference_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    v_transaction_id uuid;
begin
    -- Check valid user
    if not exists (select 1 from public.profiles where id = p_user_id) then
        raise exception 'Invalid user ID';
    end if;

    -- Create transaction
    insert into public.transactions (user_id, type, amount, description, reference_id)
    values (p_user_id, p_type, p_amount, p_description, p_reference_id)
    returning id into v_transaction_id;

    -- Update user balance
    update public.profiles
    set balance = balance + p_amount,
        updated_at = now()
    where id = p_user_id;

    return v_transaction_id;
end;
$$;


ALTER FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text", "p_reference_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purchase_vote_pack"("p_type" "text", "p_amount" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
    v_user_balance numeric;
    v_pack_id uuid;
    v_votes_remaining integer;
    v_vote_power integer;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user's current balance
    SELECT balance INTO v_user_balance
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_user_balance IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    IF v_user_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %', p_amount, v_user_balance;
    END IF;

    -- Set vote pack parameters based on type
    CASE p_type
        WHEN 'basic' THEN
            v_votes_remaining := 10;
            v_vote_power := 1;
        WHEN 'art_lover' THEN
            v_votes_remaining := 100;
            v_vote_power := 1;
        WHEN 'pro' THEN
            v_votes_remaining := 25;
            v_vote_power := 2;
        WHEN 'expert' THEN
            v_votes_remaining := 30;
            v_vote_power := 5;
        WHEN 'elite' THEN
            v_votes_remaining := 50;
            v_vote_power := 10;
        ELSE
            RAISE EXCEPTION 'Invalid vote pack type: %', p_type;
    END CASE;

    -- Create transaction record
    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        description,
        status
    ) VALUES (
        v_user_id,
        'vote_pack',
        -p_amount,
        'Purchase ' || p_type || ' vote pack',
        'completed'
    );

    -- Update user balance
    UPDATE public.profiles
    SET 
        balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Create vote pack
    INSERT INTO public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    ) VALUES (
        v_user_id,
        p_type,
        v_votes_remaining,
        v_vote_power,
        NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO v_pack_id;

    RETURN v_pack_id;
END;
$$;


ALTER FUNCTION "public"."purchase_vote_pack"("p_type" "text", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    v_vote_power integer;
    v_votes_count integer;
    v_pack_id uuid;
    v_user_balance numeric;
begin
    -- Check user balance first
    select balance into v_user_balance
    from public.profiles
    where id = p_user_id;

    if v_user_balance < p_amount then
        raise exception 'Insufficient balance to purchase vote pack';
    end if;

    -- Set vote pack parameters based on type
    case p_type
        when 'basic' then
            v_vote_power := 1;
            v_votes_count := 10;
        when 'art_lover' then
            v_vote_power := 1;
            v_votes_count := 100;
        when 'pro' then
            v_vote_power := 2;
            v_votes_count := 25;
        when 'expert' then
            v_vote_power := 5;
            v_votes_count := 50;
        when 'elite' then
            v_vote_power := 10;
            v_votes_count := 100;
        else
            raise exception 'Invalid vote pack type';
    end case;

    -- Process payment
    perform public.process_transaction(
        p_user_id,
        'vote_pack'::text,
        -p_amount,
        'Purchase ' || p_type || ' vote pack'
    );

    -- Create vote pack
    insert into public.vote_packs (
        user_id,
        type,
        votes_remaining,
        vote_power,
        expires_at
    )
    values (
        p_user_id,
        p_type,
        v_votes_count,
        v_vote_power,
        now() + interval '30 days'
    )
    returning id into v_pack_id;

    return v_pack_id;
end;
$$;


ALTER FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_artwork_vault_values"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_artwork record;
    v_total_sln numeric;
BEGIN
    FOR v_artwork IN SELECT id FROM public.artworks LOOP
        -- Calculate total SLN value from votes
        SELECT COALESCE(SUM(value * vote_power), 0)
        INTO v_total_sln
        FROM public.votes
        WHERE artwork_id = v_artwork.id;

        -- Update artwork vault value
        UPDATE public.artworks
        SET 
            vault_value = v_total_sln,
            updated_at = now()
        WHERE id = v_artwork.id;

        -- Update vault state
        UPDATE public.vault_states
        SET 
            vote_count = v_total_sln,
            updated_at = now()
        WHERE artwork_id = v_artwork.id;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."recalculate_artwork_vault_values"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_artist_payout"("p_artwork_id" "uuid", "p_amount" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_payout_id uuid;
    v_available_amount numeric;
    v_artist_id uuid;
begin
    -- Get artist ID and verify ownership
    select user_id into v_artist_id
    from artworks
    where id = p_artwork_id;

    if v_artist_id != auth.uid() then
        raise exception 'Not authorized to request payout for this artwork';
    end if;

    -- Calculate available amount
    v_available_amount := calculate_artist_payout(p_artwork_id);
    
    if v_available_amount < p_amount then
        raise exception 'Insufficient funds. Available: %, Requested: %', 
            v_available_amount, p_amount;
    end if;
    
    -- Create payout record
    insert into artist_payouts (
        artist_id,
        artwork_id,
        amount,
        status
    )
    values (
        auth.uid(),
        p_artwork_id,
        p_amount,
        'pending'
    )
    returning id into v_payout_id;

    -- Record transaction
    insert into transactions (
        user_id,
        type,
        amount,
        description,
        payout_id,
        metadata
    )
    values (
        auth.uid(),
        'payout_request',
        p_amount,
        format('Payout request for artwork %s', p_artwork_id),
        v_payout_id,
        jsonb_build_object(
            'artwork_id', p_artwork_id,
            'available_balance', v_available_amount,
            'requested_amount', p_amount
        )
    );
    
    return v_payout_id;
end;
$$;


ALTER FUNCTION "public"."request_artist_payout"("p_artwork_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_vote_value_test"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result text;
BEGIN
    v_result := public.test_vote_value_calculations();
    RAISE NOTICE '%', v_result;
END;
$$;


ALTER FUNCTION "public"."run_vote_value_test"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_user_id uuid;
  v_balance integer;
  v_challenge_title text;
  v_transaction_type text := 'submission'::text;
begin
  -- Get the user_id from the artwork
  select user_id into v_user_id
  from public.artworks
  where id = p_artwork_id;

  -- Check if artwork exists and belongs to the authenticated user
  if v_user_id is null then
    raise exception 'Artwork not found';
  end if;

  if v_user_id != auth.uid() then
    raise exception 'Unauthorized: artwork belongs to a different user';
  end if;

  -- Get challenge title
  select title into v_challenge_title
  from public.challenges
  where id = p_challenge_id;

  if v_challenge_title is null then
    raise exception 'Challenge not found';
  end if;

  -- Get user's current balance
  select balance into v_balance
  from public.profiles
  where id = v_user_id;

  if v_balance is null then
    raise exception 'User profile not found';
  end if;

  -- Check if user has enough balance
  if v_balance < p_submission_fee then
    raise exception 'Insufficient balance: have % tokens, need % tokens', v_balance, p_submission_fee;
  end if;

  -- Start transaction
  begin
    -- Update artwork status and challenge
    update public.artworks
    set 
      challenge_id = p_challenge_id,
      status = 'submitted',
      updated_at = now()
    where id = p_artwork_id;

    if not found then
      raise exception 'Failed to update artwork status';
    end if;

    -- Deduct submission fee
    update public.profiles
    set 
      balance = balance - p_submission_fee,
      updated_at = now()
    where id = v_user_id;

    if not found then
      raise exception 'Failed to update user balance';
    end if;

    -- Record transaction with minimal fields first
    insert into public.transactions (
      user_id,
      type,
      amount,
      status,
      description,
      reference_id,
      metadata
    )
    values (
      v_user_id,
      v_transaction_type,
      -p_submission_fee,
      'completed',
      format('Artwork submission fee for challenge: %s', v_challenge_title),
      p_artwork_id,
      jsonb_build_object(
        'artwork_id', p_artwork_id,
        'challenge_id', p_challenge_id,
        'challenge_title', v_challenge_title
      )
    );

    -- Return success
    return;
  exception
    when others then
      -- Log error details with constraint name if available
      raise notice 'Error in submit_artwork_to_challenge: %, %, SQLSTATE: %, CONSTRAINT: %', 
        sqlerrm, 
        sqlstate, 
        sqlstate,
        CASE 
          WHEN sqlerrm LIKE '%violates check constraint%' 
          THEN substring(sqlerrm from 'constraint "(.*?)"')
          ELSE null
        END;
      -- Rollback transaction
      raise exception 'Failed to submit artwork: %', sqlerrm;
  end;
end;
$$;


ALTER FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_vote_value_calculations"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_test_artwork_id uuid;
    v_test_user_id uuid;
    v_basic_pack_id uuid;
    v_pro_pack_id uuid;
    v_expert_pack_id uuid;
    v_elite_pack_id uuid;
    v_result jsonb;
    v_total_sln numeric;
BEGIN
    -- Create test data
    INSERT INTO public.profiles (id, role) 
    VALUES (gen_random_uuid(), 'user') 
    RETURNING id INTO v_test_user_id;

    INSERT INTO public.artworks (id, title, vault_status) 
    VALUES (gen_random_uuid(), 'Test Artwork', 'active') 
    RETURNING id INTO v_test_artwork_id;

    -- Create test vote packs
    INSERT INTO public.vote_packs (id, user_id, type, votes_remaining, vote_power)
    VALUES 
        (gen_random_uuid(), v_test_user_id, 'basic', 10, 1),
        (gen_random_uuid(), v_test_user_id, 'pro', 10, 2),
        (gen_random_uuid(), v_test_user_id, 'expert', 10, 5),
        (gen_random_uuid(), v_test_user_id, 'elite', 10, 10)
    RETURNING id INTO v_basic_pack_id;

    SELECT id INTO v_pro_pack_id FROM vote_packs WHERE vote_power = 2 AND user_id = v_test_user_id;
    SELECT id INTO v_expert_pack_id FROM vote_packs WHERE vote_power = 5 AND user_id = v_test_user_id;
    SELECT id INTO v_elite_pack_id FROM vote_packs WHERE vote_power = 10 AND user_id = v_test_user_id;

    -- Test scenario: 5 votes from different packs
    -- Expected calculation:
    -- 1x 1 SLN weight (basic) = 1
    PERFORM cast_vote(v_test_artwork_id, v_basic_pack_id, 1);
    
    -- 1x 2 SLN weight (pro) = 2
    PERFORM cast_vote(v_test_artwork_id, v_pro_pack_id, 1);
    
    -- 1x 5 SLN weight (expert) = 5
    PERFORM cast_vote(v_test_artwork_id, v_expert_pack_id, 1);
    
    -- 1x 10 SLN weight (elite) = 10
    PERFORM cast_vote(v_test_artwork_id, v_elite_pack_id, 1);
    
    -- 1x 1 SLN weight (basic again) = 1
    PERFORM cast_vote(v_test_artwork_id, v_basic_pack_id, 1);

    -- Get total SLN value
    SELECT vault_value INTO v_total_sln
    FROM artworks
    WHERE id = v_test_artwork_id;

    -- Clean up test data
    DELETE FROM votes WHERE artwork_id = v_test_artwork_id;
    DELETE FROM vote_packs WHERE user_id = v_test_user_id;
    DELETE FROM artworks WHERE id = v_test_artwork_id;
    DELETE FROM profiles WHERE id = v_test_user_id;

    -- Verify result (expected total: 1 + 2 + 5 + 10 + 1 = 19 SLN)
    IF v_total_sln = 19 THEN
        RETURN 'Test passed: Total SLN value is correct (19)';
    ELSE
        RETURN format('Test failed: Expected 19 SLN, got %s', v_total_sln);
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    DELETE FROM votes WHERE artwork_id = v_test_artwork_id;
    DELETE FROM vote_packs WHERE user_id = v_test_user_id;
    DELETE FROM artworks WHERE id = v_test_artwork_id;
    DELETE FROM profiles WHERE id = v_test_user_id;
    
    RETURN format('Test error: %s', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."test_vote_value_calculations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile"("p_username" "text" DEFAULT NULL::"text", "p_display_name" "text" DEFAULT NULL::"text", "p_website" "text" DEFAULT NULL::"text", "p_avatar_url" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID from the session
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update only the provided fields
  UPDATE public.profiles
  SET
    username = COALESCE(p_username, username),
    display_name = COALESCE(p_display_name, display_name),
    website = COALESCE(p_website, website),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = NOW()
  WHERE id = v_user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Username already taken';
  WHEN check_violation THEN
    RAISE EXCEPTION 'Invalid input values';
  WHEN others THEN
    RAISE EXCEPTION 'Error updating profile: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."update_profile"("p_username" "text", "p_display_name" "text", "p_website" "text", "p_avatar_url" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'user'::"text",
    "balance" numeric(10,2) DEFAULT 0 NOT NULL,
    "premium_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_active" timestamp with time zone,
    "username" "text",
    "bio" "text",
    "website" "text",
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "display_name" "text",
    "avatar_url" "text",
    "email_verified" boolean DEFAULT false,
    "email_notifications" boolean DEFAULT true,
    CONSTRAINT "bio_length" CHECK ((("bio" IS NULL) OR ("length"("bio") <= 500))),
    CONSTRAINT "display_name_length" CHECK ((("display_name" IS NULL) OR (("length"("display_name") >= 1) AND ("length"("display_name") <= 50)))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'artist'::"text", 'moderator'::"text"]))),
    CONSTRAINT "username_check" CHECK (("username" ~* '^[a-zA-Z0-9_]{3,30}$'::"text")),
    CONSTRAINT "username_format" CHECK (("username" ~ '^[a-zA-Z][a-zA-Z0-9_-]{2,29}$'::"text")),
    CONSTRAINT "website_format" CHECK ((("website" IS NULL) OR ("website" ~* '^https?://([\w-]+\.)+[\w-]+(/[\w-./?%&=]*)?$'::"text")))
);

ALTER TABLE ONLY "public"."profiles" REPLICA IDENTITY FULL;

ALTER TABLE ONLY "public"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with balance and role management';



CREATE OR REPLACE FUNCTION "public"."update_profile"("profile_id" "uuid", "username_arg" "text" DEFAULT NULL::"text", "display_name_arg" "text" DEFAULT NULL::"text", "bio_arg" "text" DEFAULT NULL::"text", "website_arg" "text" DEFAULT NULL::"text", "avatar_url_arg" "text" DEFAULT NULL::"text") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  profile_record public.profiles;
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Update the profile
  UPDATE public.profiles
  SET
    username = COALESCE(username_arg, username),
    display_name = COALESCE(display_name_arg, display_name),
    bio = COALESCE(bio_arg, bio),
    website = COALESCE(website_arg, website),
    avatar_url = COALESCE(avatar_url_arg, avatar_url),
    updated_at = now()
  WHERE id = profile_id
  RETURNING * INTO profile_record;

  RETURN profile_record;
END;
$$;


ALTER FUNCTION "public"."update_profile"("profile_id" "uuid", "username_arg" "text", "display_name_arg" "text", "bio_arg" "text", "website_arg" "text", "avatar_url_arg" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_role"("new_role" "text", "target_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result json;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR auth.jwt() ->> 'role' = 'admin'
      OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Validate new role
  IF new_role NOT IN ('user', 'admin', 'artist', 'moderator') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be one of: user, admin, artist, moderator', new_role;
  END IF;

  -- Update the profiles table
  UPDATE profiles
  SET 
    role = new_role,
    updated_at = now()
  WHERE id = target_user_id
  RETURNING json_build_object(
    'id', id,
    'role', role,
    'updated_at', updated_at
  ) INTO result;

  -- Update auth.users metadata
  UPDATE auth.users
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role),
    updated_at = now()
  WHERE id = target_user_id;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_user_role"("new_role" "text", "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_profile_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  -- Only validate fields that are being updated
  IF NEW.username IS NOT NULL AND NEW.username != OLD.username THEN
    IF NOT (NEW.username ~ '^[a-zA-Z0-9_]{3,30}$') THEN
      RAISE EXCEPTION 'Username must be 3-30 characters long and can only contain letters, numbers, and underscores';
    END IF;
  END IF;

  IF NEW.website IS NOT NULL AND NEW.website != OLD.website THEN
    IF NOT (NEW.website ~ '^https?://[^\s/$.?#].[^\s]*$' OR NEW.website = '') THEN
      RAISE EXCEPTION 'Invalid website URL format';
    END IF;
  END IF;

  IF NEW.display_name IS NOT NULL AND NEW.display_name != OLD.display_name THEN
    IF NOT (length(NEW.display_name) BETWEEN 1 AND 50) THEN
      RAISE EXCEPTION 'Display name must be between 1 and 50 characters';
    END IF;
  END IF;

  IF NEW.bio IS NOT NULL AND NEW.bio != OLD.bio THEN
    IF NOT (length(NEW.bio) <= 500) THEN
      RAISE EXCEPTION 'Bio must not exceed 500 characters';
    END IF;
  END IF;

  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."validate_profile_update"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."albums" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "is_private" boolean DEFAULT false,
    "cover_image" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alert_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "alert_type" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid"
);


ALTER TABLE "public"."alert_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artist_payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "artwork_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    CONSTRAINT "artist_payouts_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."artist_payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artworks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "album_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text" NOT NULL,
    "metadata" "jsonb",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "challenge_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "vault_status" "text" DEFAULT 'active'::"text",
    "vote_count" integer DEFAULT 0,
    "vault_value" integer DEFAULT 0,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "win_ratio" numeric DEFAULT 0,
    "current_epoch_id" "uuid",
    CONSTRAINT "artworks_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "artworks_vault_status_check" CHECK (("vault_status" = ANY (ARRAY['active'::"text", 'locked'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."artworks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" NOT NULL,
    "type" "text" NOT NULL,
    "submission_fee" integer DEFAULT 99 NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "challenges_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "challenges_type_check" CHECK (("type" = ANY (ARRAY['open'::"text", 'public'::"text", 'private'::"text"]))),
    CONSTRAINT "end_time_after_start_time" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "votes_count" integer DEFAULT 0 NOT NULL,
    "total_power" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "entries_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."epochs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "total_votes" integer DEFAULT 0,
    "total_value" numeric DEFAULT 0,
    "curator_reward_pool" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "epochs_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('completed'::character varying)::"text", ('cancelled'::character varying)::"text"])))
);


ALTER TABLE "public"."epochs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "error_time" timestamp with time zone DEFAULT "now"(),
    "error_message" "text",
    "error_details" "text",
    "context" "text"
);

ALTER TABLE ONLY "public"."error_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schema_versions" (
    "version" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."schema_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_metrics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "metric_type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "description" "text",
    "reference_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['grant'::"text", 'submission'::"text", 'vote_pack'::"text", 'reward'::"text", 'premium'::"text", 'refund'::"text"])))
);

ALTER TABLE ONLY "public"."transactions" REPLICA IDENTITY FULL;

ALTER TABLE ONLY "public"."transactions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'Token transaction history';



CREATE TABLE IF NOT EXISTS "public"."trigger_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "trigger_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."trigger_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_vote_packs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "pack_type" "text" NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "user_vote_packs_pack_type_check" CHECK (("pack_type" = ANY (ARRAY['basic'::"text", 'premium'::"text", 'exclusive'::"text"])))
);


ALTER TABLE "public"."user_vote_packs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vault_states" (
    "artwork_id" "uuid" NOT NULL,
    "vote_count" integer DEFAULT 0,
    "accumulated_value" numeric DEFAULT 0,
    "last_vote_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."vault_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vote_packs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "votes_remaining" integer NOT NULL,
    "vote_power" integer NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "vote_packs_type_check" CHECK (("type" = ANY (ARRAY['basic'::"text", 'art_lover'::"text", 'pro'::"text", 'expert'::"text", 'elite'::"text"]))),
    CONSTRAINT "vote_packs_vote_power_check" CHECK (("vote_power" > 0)),
    CONSTRAINT "vote_packs_votes_remaining_check" CHECK (("votes_remaining" >= 0))
);


ALTER TABLE "public"."vote_packs" OWNER TO "postgres";


COMMENT ON TABLE "public"."vote_packs" IS 'Vote packs with remaining votes and power';



CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "artwork_id" "uuid" NOT NULL,
    "pack_id" "uuid" NOT NULL,
    "value" integer NOT NULL,
    "vote_power" integer DEFAULT 1,
    "total_value" integer DEFAULT 0,
    "sln_value" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alert_history"
    ADD CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_payouts"
    ADD CONSTRAINT "artist_payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."epochs"
    ADD CONSTRAINT "epochs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."schema_versions"
    ADD CONSTRAINT "schema_versions_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."system_metrics"
    ADD CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trigger_logs"
    ADD CONSTRAINT "trigger_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_vote_packs"
    ADD CONSTRAINT "user_vote_packs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vault_states"
    ADD CONSTRAINT "vault_states_pkey" PRIMARY KEY ("artwork_id");



ALTER TABLE ONLY "public"."vote_packs"
    ADD CONSTRAINT "vote_packs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_active_challenges" ON "public"."challenges" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_alert_history_created_at" ON "public"."alert_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_last_active" ON "public"."profiles" USING "btree" ("last_active" DESC);



CREATE INDEX "idx_system_metrics_type_created" ON "public"."system_metrics" USING "btree" ("metric_type", "created_at" DESC);



CREATE INDEX "idx_transactions_status" ON "public"."transactions" USING "btree" ("status");



CREATE INDEX "idx_transactions_type" ON "public"."transactions" USING "btree" ("type");



CREATE INDEX "idx_transactions_user_created" ON "public"."transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_vote_packs_user_id" ON "public"."vote_packs" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "ensure_profile_username" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_profile"();



CREATE OR REPLACE TRIGGER "ensure_user_has_default_album_trigger" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_user_has_default_album"();



CREATE OR REPLACE TRIGGER "on_balance_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_balance_update"();



CREATE OR REPLACE TRIGGER "on_profile_created" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_profile"();



CREATE OR REPLACE TRIGGER "on_profile_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_profile_update"();



CREATE OR REPLACE TRIGGER "update_win_ratio" BEFORE UPDATE OF "wins", "losses" ON "public"."artworks" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_win_ratio"();



CREATE OR REPLACE TRIGGER "validate_profile_update_trigger" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile_update"();



ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."alert_history"
    ADD CONSTRAINT "alert_history_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artist_payouts"
    ADD CONSTRAINT "artist_payouts_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artist_payouts"
    ADD CONSTRAINT "artist_payouts_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_current_epoch_id_fkey" FOREIGN KEY ("current_epoch_id") REFERENCES "public"."epochs"("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vote_packs"
    ADD CONSTRAINT "user_vote_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vault_states"
    ADD CONSTRAINT "vault_states_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id");



ALTER TABLE ONLY "public"."vote_packs"
    ADD CONSTRAINT "vote_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."vote_packs"("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can delete profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update all vote packs" ON "public"."vote_packs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all vote packs" ON "public"."vote_packs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view error logs" ON "public"."error_logs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view trigger logs" ON "public"."trigger_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Anyone can view vault states" ON "public"."vault_states" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Artists can create payout requests" ON "public"."artist_payouts" FOR INSERT TO "authenticated" WITH CHECK (("artist_id" = "auth"."uid"()));



CREATE POLICY "Artists can view their own payouts" ON "public"."artist_payouts" FOR SELECT TO "authenticated" USING (("artist_id" = "auth"."uid"()));



CREATE POLICY "Challenges are viewable by everyone" ON "public"."challenges" FOR SELECT USING (true);



CREATE POLICY "Enable delete for users based on id" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Enable insert for admin users only" ON "public"."epochs" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable profile creation during signup" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."epochs" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."votes" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "Enable update for admin users only" ON "public"."epochs" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "Entries are viewable by everyone" ON "public"."entries" FOR SELECT USING (true);



CREATE POLICY "Only admins can create challenges" ON "public"."challenges" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Only admins can update challenges" ON "public"."challenges" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Only admins can update transactions" ON "public"."transactions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Profile owner update access" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Profile public read access" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Service role can do anything" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can do anything" ON "public"."transactions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can do anything with error_logs" ON "public"."error_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can do anything with transactions" ON "public"."transactions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System can create transactions" ON "public"."transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert vote packs" ON "public"."user_vote_packs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert vote packs" ON "public"."vote_packs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Transactions are viewable by authenticated users" ON "public"."transactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create entries" ON "public"."entries" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own albums" ON "public"."albums" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own artworks" ON "public"."artworks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only insert their own transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own entries" ON "public"."entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own vote packs" ON "public"."user_vote_packs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own albums" ON "public"."albums" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own artworks" ON "public"."artworks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own vote packs" ON "public"."vote_packs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all artworks" ON "public"."artworks" FOR SELECT USING (true);



CREATE POLICY "Users can view own vote packs" ON "public"."user_vote_packs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own albums" ON "public"."albums" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own vote packs" ON "public"."vote_packs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_read_all_profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "admin_update_all_profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artist_payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artworks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."epochs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_own_profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trigger_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own_profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."user_vote_packs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vault_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote_packs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;


CREATE PUBLICATION "salon_realtime" WITH (publish = 'insert, update, delete');


ALTER PUBLICATION "salon_realtime" OWNER TO "postgres";




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "salon_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "salon_realtime" ADD TABLE ONLY "public"."transactions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."admin_reset_all_votes"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_reset_all_votes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_reset_all_votes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_artist_payout"("p_artwork_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_artist_payout"("p_artwork_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_artist_payout"("p_artwork_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_win_ratio"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_win_ratio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_win_ratio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cast_vote"("p_artwork_id" "uuid", "p_pack_id" "uuid", "p_value" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cast_vote"("p_artwork_id" "uuid", "p_pack_id" "uuid", "p_value" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cast_vote"("p_artwork_id" "uuid", "p_pack_id" "uuid", "p_value" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_epoch"("p_epoch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_epoch"("p_epoch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_epoch"("p_epoch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_epoch"("p_duration" interval) TO "anon";
GRANT ALL ON FUNCTION "public"."create_epoch"("p_duration" interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_epoch"("p_duration" interval) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_initial_profile"("user_id" "uuid", "user_email" "text", "user_role" "text", "initial_balance" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_initial_profile"("user_id" "uuid", "user_email" "text", "user_role" "text", "initial_balance" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_initial_profile"("user_id" "uuid", "user_email" "text", "user_role" "text", "initial_balance" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_has_default_album"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_has_default_album"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_has_default_album"() TO "service_role";



GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_username"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_username"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_username"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_profiles_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_profiles_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_profiles_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_epoch"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_epoch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_epoch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_epoch_stats"("epoch_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_epoch_stats"("epoch_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_epoch_stats"("epoch_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_stats"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_stats"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_stats"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_balance_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_balance_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_balance_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_profile_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_transaction_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_transaction_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_transaction_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_production"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_production"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_production"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_vault_tokens"("p_artwork_id" "uuid", "p_epoch_id" "uuid", "p_value" numeric, "p_lock_duration" interval) TO "anon";
GRANT ALL ON FUNCTION "public"."lock_vault_tokens"("p_artwork_id" "uuid", "p_epoch_id" "uuid", "p_value" numeric, "p_lock_duration" interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_vault_tokens"("p_artwork_id" "uuid", "p_epoch_id" "uuid", "p_value" numeric, "p_lock_duration" interval) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_balance_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_balance_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_balance_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text", "p_reference_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text", "p_reference_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text", "p_reference_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_type" "text", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_type" "text", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_type" "text", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_artwork_vault_values"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_artwork_vault_values"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_artwork_vault_values"() TO "service_role";



GRANT ALL ON FUNCTION "public"."request_artist_payout"("p_artwork_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."request_artist_payout"("p_artwork_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_artist_payout"("p_artwork_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."run_vote_value_test"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_vote_value_test"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_vote_value_test"() TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."test_vote_value_calculations"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_vote_value_calculations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_vote_value_calculations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile"("p_username" "text", "p_display_name" "text", "p_website" "text", "p_avatar_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile"("p_username" "text", "p_display_name" "text", "p_website" "text", "p_avatar_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile"("p_username" "text", "p_display_name" "text", "p_website" "text", "p_avatar_url" "text") TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("username") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("website") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("display_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_profile"("profile_id" "uuid", "username_arg" "text", "display_name_arg" "text", "bio_arg" "text", "website_arg" "text", "avatar_url_arg" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile"("profile_id" "uuid", "username_arg" "text", "display_name_arg" "text", "bio_arg" "text", "website_arg" "text", "avatar_url_arg" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile"("profile_id" "uuid", "username_arg" "text", "display_name_arg" "text", "bio_arg" "text", "website_arg" "text", "avatar_url_arg" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_role"("new_role" "text", "target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_role"("new_role" "text", "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_role"("new_role" "text", "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_profile_update"() TO "service_role";


















GRANT ALL ON TABLE "public"."albums" TO "anon";
GRANT ALL ON TABLE "public"."albums" TO "authenticated";
GRANT ALL ON TABLE "public"."albums" TO "service_role";



GRANT ALL ON TABLE "public"."alert_history" TO "service_role";



GRANT ALL ON TABLE "public"."artist_payouts" TO "anon";
GRANT ALL ON TABLE "public"."artist_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_payouts" TO "service_role";



GRANT ALL ON TABLE "public"."artworks" TO "anon";
GRANT ALL ON TABLE "public"."artworks" TO "authenticated";
GRANT ALL ON TABLE "public"."artworks" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."entries" TO "anon";
GRANT ALL ON TABLE "public"."entries" TO "authenticated";
GRANT ALL ON TABLE "public"."entries" TO "service_role";



GRANT ALL ON TABLE "public"."epochs" TO "anon";
GRANT ALL ON TABLE "public"."epochs" TO "authenticated";
GRANT ALL ON TABLE "public"."epochs" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."schema_versions" TO "anon";
GRANT ALL ON TABLE "public"."schema_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_versions" TO "service_role";



GRANT ALL ON TABLE "public"."system_metrics" TO "anon";
GRANT ALL ON TABLE "public"."system_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."system_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."trigger_logs" TO "anon";
GRANT ALL ON TABLE "public"."trigger_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."trigger_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_vote_packs" TO "anon";
GRANT ALL ON TABLE "public"."user_vote_packs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vote_packs" TO "service_role";



GRANT ALL ON TABLE "public"."vault_states" TO "anon";
GRANT ALL ON TABLE "public"."vault_states" TO "authenticated";
GRANT ALL ON TABLE "public"."vault_states" TO "service_role";



GRANT ALL ON TABLE "public"."vote_packs" TO "anon";
GRANT ALL ON TABLE "public"."vote_packs" TO "authenticated";
GRANT ALL ON TABLE "public"."vote_packs" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
