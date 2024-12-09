

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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    base_username text;
    final_username text;
    counter integer := 0;
BEGIN
    -- Extract part before @ and remove special characters
    base_username := lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    
    -- Ensure it starts with a letter or number
    IF base_username !~ '^[a-zA-Z0-9]' THEN
        base_username := 'user' || base_username;
    END IF;
    
    -- Ensure minimum length
    WHILE length(base_username) < 3 LOOP
        base_username := base_username || 'x';
    END LOOP;
    
    -- Truncate if too long
    base_username := substring(base_username, 1, 25);
    
    -- Try the base username first
    final_username := base_username;
    
    -- Add numbers until we find a unique username
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::text;
    END LOOP;
    
    RETURN final_username;
EXCEPTION WHEN OTHERS THEN
    -- Fallback to a guaranteed unique username
    RETURN 'user' || gen_random_uuid();
END;
$$;


ALTER FUNCTION "public"."generate_unique_username"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_profiles_admin"() RETURNS TABLE("id" "uuid", "email" "text", "role" "text", "created_at" timestamp with time zone, "balance" numeric, "username" "text", "full_name" "text", "avatar_url" "text", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_all_profiles_admin"() OWNER TO "postgres";


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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Generate username if not provided
    IF NEW.username IS NULL THEN
        NEW.username := generate_unique_username(NEW.email);
    END IF;

    -- Set display_name if not provided
    IF NEW.display_name IS NULL THEN
        NEW.display_name := split_part(NEW.email, '@', 1);
    END IF;

    -- Initialize social_links if null
    IF NEW.social_links IS NULL THEN
        NEW.social_links := '{}'::jsonb;
    END IF;

    -- Initialize balance if null
    IF NEW.balance IS NULL THEN
        NEW.balance := 0;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.error_logs (
        id,
        error_time,
        error_message,
        error_details,
        context
    )
    VALUES (
        gen_random_uuid(),
        now(),
        SQLERRM,
        SQLSTATE,
        format(
            'Error in handle_new_profile for email: %s',
            NEW.email
        )
    );
    RETURN NEW; -- Still try to proceed with the profile creation
END;
$$;


ALTER FUNCTION "public"."handle_new_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_profile_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- Validate display name
  IF NEW.display_name IS NOT NULL AND (length(NEW.display_name) < 1 OR length(NEW.display_name) > 50) THEN
    RAISE EXCEPTION 'Display name must be between 1 and 50 characters';
  END IF;

  -- Validate username
  IF NEW.username IS NOT NULL AND (
    length(NEW.username) < 3 OR 
    length(NEW.username) > 30 OR 
    NEW.username !~ '^[a-zA-Z0-9_-]+$'
  ) THEN
    RAISE EXCEPTION 'Username must be between 3 and 30 characters and contain only letters, numbers, underscores, and hyphens';
  END IF;

  -- Validate bio
  IF NEW.bio IS NOT NULL AND length(NEW.bio) > 500 THEN
    RAISE EXCEPTION 'Bio must not exceed 500 characters';
  END IF;

  -- Set updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$_$;


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
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'member'::"text", 'moderator'::"text", 'admin'::"text"]))),
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
    CONSTRAINT "artworks_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'approved'::"text", 'rejected'::"text"])))
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
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "power" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "votes_power_check" CHECK (("power" > 0))
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alert_history"
    ADD CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entries"
    ADD CONSTRAINT "entries_pkey" PRIMARY KEY ("id");



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



CREATE OR REPLACE TRIGGER "ensure_user_has_default_album_trigger" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_user_has_default_album"();



CREATE OR REPLACE TRIGGER "on_balance_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_balance_update"();



CREATE OR REPLACE TRIGGER "on_profile_created" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_profile"();



CREATE OR REPLACE TRIGGER "on_profile_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_profile_update"();



CREATE OR REPLACE TRIGGER "validate_profile_update_trigger" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile_update"();



ALTER TABLE ONLY "public"."albums"
    ADD CONSTRAINT "albums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."alert_history"
    ADD CONSTRAINT "alert_history_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id");



ALTER TABLE ONLY "public"."artworks"
    ADD CONSTRAINT "artworks_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id");



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



ALTER TABLE ONLY "public"."vote_packs"
    ADD CONSTRAINT "vote_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



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



CREATE POLICY "Challenges are viewable by everyone" ON "public"."challenges" FOR SELECT USING (true);



CREATE POLICY "Enable delete for users based on id" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable update for users based on id" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



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



CREATE POLICY "Users can update own vote packs" ON "public"."user_vote_packs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own albums" ON "public"."albums" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own artworks" ON "public"."artworks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own vote packs" ON "public"."vote_packs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all artworks" ON "public"."artworks" FOR SELECT USING (true);



CREATE POLICY "Users can view own vote packs" ON "public"."user_vote_packs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own albums" ON "public"."albums" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own vote packs" ON "public"."vote_packs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users cannot update votes" ON "public"."votes" FOR UPDATE USING (false);



CREATE POLICY "Votes are viewable by everyone" ON "public"."votes" FOR SELECT USING (true);



ALTER TABLE "public"."albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artworks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trigger_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_vote_packs" ENABLE ROW LEVEL SECURITY;


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



GRANT ALL ON FUNCTION "public"."notify_balance_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_balance_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_balance_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text", "p_reference_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text", "p_reference_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_transaction"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text", "p_reference_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchase_vote_pack"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_artwork_to_challenge"("p_artwork_id" "uuid", "p_challenge_id" "uuid", "p_submission_fee" integer) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."validate_profile_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_profile_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_profile_update"() TO "service_role";


















GRANT ALL ON TABLE "public"."albums" TO "anon";
GRANT ALL ON TABLE "public"."albums" TO "authenticated";
GRANT ALL ON TABLE "public"."albums" TO "service_role";



GRANT ALL ON TABLE "public"."alert_history" TO "service_role";



GRANT ALL ON TABLE "public"."artworks" TO "anon";
GRANT ALL ON TABLE "public"."artworks" TO "authenticated";
GRANT ALL ON TABLE "public"."artworks" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."entries" TO "anon";
GRANT ALL ON TABLE "public"."entries" TO "authenticated";
GRANT ALL ON TABLE "public"."entries" TO "service_role";



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
