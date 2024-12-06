drop trigger if exists "on_album_deleted" on "public"."albums";

drop trigger if exists "on_profile_created" on "public"."profiles";

drop trigger if exists "on_profile_created_album" on "public"."profiles";

drop trigger if exists "on_transaction_insert" on "public"."transactions";

drop policy "Users can manage their own albums" on "public"."albums";

drop policy "Users can view public albums" on "public"."albums";

drop policy "Challenges are viewable by everyone" on "public"."challenges";

drop policy "Only admins can create challenges" on "public"."challenges";

drop policy "Only admins can update challenges" on "public"."challenges";

drop policy "Entries are viewable by everyone" on "public"."entries";

drop policy "Users can create entries" on "public"."entries";

drop policy "Users can update own entries" on "public"."entries";

drop policy "Users can manage their own images" on "public"."images";

drop policy "Users can view images in accessible albums" on "public"."images";

drop policy "Admins can delete profiles" on "public"."profiles";

drop policy "Admins can update all profiles" on "public"."profiles";

drop policy "Admins can view all profiles" on "public"."profiles";

drop policy "System can insert profiles" on "public"."profiles";

drop policy "Users can update own profile" on "public"."profiles";

drop policy "Users can view own profile" on "public"."profiles";

drop policy "Only admins can update transactions" on "public"."transactions";

drop policy "Transactions are viewable by authenticated users" on "public"."transactions";

drop policy "Users can only insert their own transactions" on "public"."transactions";

drop policy "Authenticated users can create votes" on "public"."votes";

drop policy "Users cannot update votes" on "public"."votes";

drop policy "Votes are viewable by everyone" on "public"."votes";

revoke delete on table "public"."albums" from "anon";

revoke insert on table "public"."albums" from "anon";

revoke references on table "public"."albums" from "anon";

revoke select on table "public"."albums" from "anon";

revoke trigger on table "public"."albums" from "anon";

revoke truncate on table "public"."albums" from "anon";

revoke update on table "public"."albums" from "anon";

revoke delete on table "public"."albums" from "authenticated";

revoke insert on table "public"."albums" from "authenticated";

revoke references on table "public"."albums" from "authenticated";

revoke select on table "public"."albums" from "authenticated";

revoke trigger on table "public"."albums" from "authenticated";

revoke truncate on table "public"."albums" from "authenticated";

revoke update on table "public"."albums" from "authenticated";

revoke delete on table "public"."albums" from "service_role";

revoke insert on table "public"."albums" from "service_role";

revoke references on table "public"."albums" from "service_role";

revoke select on table "public"."albums" from "service_role";

revoke trigger on table "public"."albums" from "service_role";

revoke truncate on table "public"."albums" from "service_role";

revoke update on table "public"."albums" from "service_role";

revoke delete on table "public"."alert_history" from "anon";

revoke insert on table "public"."alert_history" from "anon";

revoke references on table "public"."alert_history" from "anon";

revoke select on table "public"."alert_history" from "anon";

revoke trigger on table "public"."alert_history" from "anon";

revoke truncate on table "public"."alert_history" from "anon";

revoke update on table "public"."alert_history" from "anon";

revoke delete on table "public"."alert_history" from "authenticated";

revoke insert on table "public"."alert_history" from "authenticated";

revoke references on table "public"."alert_history" from "authenticated";

revoke select on table "public"."alert_history" from "authenticated";

revoke trigger on table "public"."alert_history" from "authenticated";

revoke truncate on table "public"."alert_history" from "authenticated";

revoke update on table "public"."alert_history" from "authenticated";

revoke delete on table "public"."alert_history" from "service_role";

revoke insert on table "public"."alert_history" from "service_role";

revoke references on table "public"."alert_history" from "service_role";

revoke select on table "public"."alert_history" from "service_role";

revoke trigger on table "public"."alert_history" from "service_role";

revoke truncate on table "public"."alert_history" from "service_role";

revoke update on table "public"."alert_history" from "service_role";

revoke delete on table "public"."challenges" from "anon";

revoke insert on table "public"."challenges" from "anon";

revoke references on table "public"."challenges" from "anon";

revoke select on table "public"."challenges" from "anon";

revoke trigger on table "public"."challenges" from "anon";

revoke truncate on table "public"."challenges" from "anon";

revoke update on table "public"."challenges" from "anon";

revoke delete on table "public"."challenges" from "authenticated";

revoke insert on table "public"."challenges" from "authenticated";

revoke references on table "public"."challenges" from "authenticated";

revoke select on table "public"."challenges" from "authenticated";

revoke trigger on table "public"."challenges" from "authenticated";

revoke truncate on table "public"."challenges" from "authenticated";

revoke update on table "public"."challenges" from "authenticated";

revoke delete on table "public"."challenges" from "service_role";

revoke insert on table "public"."challenges" from "service_role";

revoke references on table "public"."challenges" from "service_role";

revoke select on table "public"."challenges" from "service_role";

revoke trigger on table "public"."challenges" from "service_role";

revoke truncate on table "public"."challenges" from "service_role";

revoke update on table "public"."challenges" from "service_role";

revoke delete on table "public"."entries" from "anon";

revoke insert on table "public"."entries" from "anon";

revoke references on table "public"."entries" from "anon";

revoke select on table "public"."entries" from "anon";

revoke trigger on table "public"."entries" from "anon";

revoke truncate on table "public"."entries" from "anon";

revoke update on table "public"."entries" from "anon";

revoke delete on table "public"."entries" from "authenticated";

revoke insert on table "public"."entries" from "authenticated";

revoke references on table "public"."entries" from "authenticated";

revoke select on table "public"."entries" from "authenticated";

revoke trigger on table "public"."entries" from "authenticated";

revoke truncate on table "public"."entries" from "authenticated";

revoke update on table "public"."entries" from "authenticated";

revoke delete on table "public"."entries" from "service_role";

revoke insert on table "public"."entries" from "service_role";

revoke references on table "public"."entries" from "service_role";

revoke select on table "public"."entries" from "service_role";

revoke trigger on table "public"."entries" from "service_role";

revoke truncate on table "public"."entries" from "service_role";

revoke update on table "public"."entries" from "service_role";

revoke delete on table "public"."images" from "anon";

revoke insert on table "public"."images" from "anon";

revoke references on table "public"."images" from "anon";

revoke select on table "public"."images" from "anon";

revoke trigger on table "public"."images" from "anon";

revoke truncate on table "public"."images" from "anon";

revoke update on table "public"."images" from "anon";

revoke delete on table "public"."images" from "authenticated";

revoke insert on table "public"."images" from "authenticated";

revoke references on table "public"."images" from "authenticated";

revoke select on table "public"."images" from "authenticated";

revoke trigger on table "public"."images" from "authenticated";

revoke truncate on table "public"."images" from "authenticated";

revoke update on table "public"."images" from "authenticated";

revoke delete on table "public"."images" from "service_role";

revoke insert on table "public"."images" from "service_role";

revoke references on table "public"."images" from "service_role";

revoke select on table "public"."images" from "service_role";

revoke trigger on table "public"."images" from "service_role";

revoke truncate on table "public"."images" from "service_role";

revoke update on table "public"."images" from "service_role";

revoke delete on table "public"."votes" from "anon";

revoke insert on table "public"."votes" from "anon";

revoke references on table "public"."votes" from "anon";

revoke select on table "public"."votes" from "anon";

revoke trigger on table "public"."votes" from "anon";

revoke truncate on table "public"."votes" from "anon";

revoke update on table "public"."votes" from "anon";

revoke delete on table "public"."votes" from "authenticated";

revoke insert on table "public"."votes" from "authenticated";

revoke references on table "public"."votes" from "authenticated";

revoke select on table "public"."votes" from "authenticated";

revoke trigger on table "public"."votes" from "authenticated";

revoke truncate on table "public"."votes" from "authenticated";

revoke update on table "public"."votes" from "authenticated";

revoke delete on table "public"."votes" from "service_role";

revoke insert on table "public"."votes" from "service_role";

revoke references on table "public"."votes" from "service_role";

revoke select on table "public"."votes" from "service_role";

revoke trigger on table "public"."votes" from "service_role";

revoke truncate on table "public"."votes" from "service_role";

revoke update on table "public"."votes" from "service_role";

alter table "public"."albums" drop constraint "albums_privacy_check";

alter table "public"."albums" drop constraint "albums_user_id_fkey";

alter table "public"."alert_history" drop constraint "alert_history_resolved_by_fkey";

alter table "public"."challenges" drop constraint "challenges_status_check";

alter table "public"."challenges" drop constraint "challenges_type_check";

alter table "public"."entries" drop constraint "entries_challenge_id_fkey";

alter table "public"."entries" drop constraint "entries_status_check";

alter table "public"."entries" drop constraint "entries_user_id_fkey";

alter table "public"."images" drop constraint "images_album_id_fkey";

alter table "public"."images" drop constraint "images_user_id_fkey";

alter table "public"."profiles" drop constraint "profiles_username_key";

alter table "public"."profiles" drop constraint "username_format";

alter table "public"."profiles" drop constraint "website_format";

alter table "public"."transactions" drop constraint "transactions_status_check";

alter table "public"."votes" drop constraint "votes_challenge_id_fkey";

alter table "public"."votes" drop constraint "votes_entry_id_fkey";

alter table "public"."votes" drop constraint "votes_power_check";

alter table "public"."votes" drop constraint "votes_user_id_fkey";

alter table "public"."transactions" drop constraint "transactions_user_id_fkey";

drop function if exists "public"."delete_storage_object"();

drop function if exists "public"."ensure_default_album"();

drop function if exists "public"."generate_unique_username"(email text);

drop function if exists "public"."get_user_stats"(user_id uuid);

drop function if exists "public"."handle_new_profile"();

drop function if exists "public"."handle_transaction_insert"();

drop function if exists "public"."notify_balance_change"();

drop view if exists "public"."user_stats";

drop function if exists "public"."get_all_profiles_admin"();

alter table "public"."albums" drop constraint "albums_pkey";

alter table "public"."alert_history" drop constraint "alert_history_pkey";

alter table "public"."challenges" drop constraint "challenges_pkey";

alter table "public"."entries" drop constraint "entries_pkey";

alter table "public"."images" drop constraint "images_pkey";

alter table "public"."votes" drop constraint "votes_pkey";

drop index if exists "public"."albums_pkey";

drop index if exists "public"."alert_history_pkey";

drop index if exists "public"."challenges_pkey";

drop index if exists "public"."entries_pkey";

drop index if exists "public"."idx_alert_history_created_at";

drop index if exists "public"."idx_profiles_last_active";

drop index if exists "public"."idx_system_metrics_type_created";

drop index if exists "public"."idx_transactions_status";

drop index if exists "public"."idx_transactions_type";

drop index if exists "public"."idx_transactions_user_created";

drop index if exists "public"."images_pkey";

drop index if exists "public"."profiles_username_key";

drop index if exists "public"."votes_pkey";

drop table "public"."albums";

drop table "public"."alert_history";

drop table "public"."challenges";

drop table "public"."entries";

drop table "public"."images";

drop table "public"."votes";

alter table "public"."profiles" drop column "bio";

alter table "public"."profiles" drop column "display_name";

alter table "public"."profiles" drop column "last_active";

alter table "public"."profiles" drop column "social_links";

alter table "public"."profiles" drop column "username";

alter table "public"."profiles" drop column "website";

alter table "public"."profiles" add column "wallet" text;

alter table "public"."system_metrics" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."system_metrics" alter column "created_at" set not null;

alter table "public"."system_metrics" alter column "metadata" set default '{}'::jsonb;

alter table "public"."system_metrics" enable row level security;

alter table "public"."transactions" drop column "metadata";

alter table "public"."transactions" drop column "status";

alter table "public"."transactions" drop column "updated_at";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
 RETURNS TABLE(id uuid, email character varying, role character varying, created_at timestamp with time zone, balance bigint, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
begin
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Check if the current user is an admin
  if not exists (
    select 1 from profiles p
    where p.id = v_user_id
    and p.role = 'admin'
  ) then
    raise exception 'Access denied. Admin privileges required.';
  end if;

  -- Return all profiles with email from auth.users
  return query
  select 
    p.id::uuid,
    au.email::varchar,
    p.role::varchar,
    p.created_at::timestamp with time zone,
    p.balance::bigint,
    p.updated_at::timestamp with time zone
  from profiles p
  left join auth.users au on au.id = p.id
  order by p.created_at desc;
end;
$function$
;

create policy "System can create profiles"
on "public"."profiles"
as permissive
for insert
to public
with check (true);


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Authenticated users can view metrics"
on "public"."system_metrics"
as permissive
for select
to authenticated
using (true);


create policy "System can create metrics"
on "public"."system_metrics"
as permissive
for insert
to public
with check (true);



