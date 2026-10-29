-- circles: artists sign in (Google) and ask for a building themselves; the site owner approves it with one button. Run after 001..008.
--   1. artist_private.apply_note   what the artist wrote when asking (links, a few words). Private: the artist and admins only.
--   2. claim_building()            a signed-in login WITHOUT a building creates ONE, unapproved. Visitors see nothing of it
--                                  (artists_read / works_read already need approved) until an admin sets approved = true.
-- Approving and refusing need nothing new: an admin may already update artists.approved and delete an artist (001, artists_admin_all).
-- So "Allow new users to sign up" may stay ON: a stranger who logs in can only make one hidden building of their own.

alter table public.artist_private add column if not exists apply_note text check (char_length(apply_note) <= 500);

-- The guard of 001 refuses every INSERT by a non-admin. claim_building() runs as its owner (security definer), so let the
-- function's role through; anything coming straight from the API still runs as anon / authenticated and is refused as before.
create or replace function public.guard_artist_columns() returns trigger
language plpgsql as $$
begin
  if public.is_admin() or auth.uid() is null or current_user not in ('anon', 'authenticated') then return new; end if;
  if tg_op = 'INSERT' then raise exception 'only the site owner can create artists'; end if;
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
     or new.approved is distinct from old.approved or new.demo is distinct from old.demo then
    raise exception 'id, user_id, approved and demo can only be changed by the site owner';
  end if;
  return new;
end $$;

create or replace function public.claim_building(p_id text, p_name text, p_disc text, p_city text, p_note text default null) returns text
language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := auth.uid();
  mail text := lower(auth.jwt() ->> 'email');
  aid  text := lower(trim(p_id));
begin
  if uid is null then raise exception 'sign in first'; end if;
  if exists (select 1 from artists where user_id = uid) then raise exception 'this login already has a building'; end if;
  -- shortcut: one global cap on waiting requests so a flood of throwaway logins cannot fill the table; raise it if real artists hit it
  if (select count(*) from artists where not approved and not demo) >= 50 then raise exception 'too many requests are waiting'; end if;
  insert into artists (id, user_id, name, disc, city, approved) values (aid, uid, trim(p_name), trim(p_disc), trim(p_city), false);
  if mail is not null then
    insert into artist_private (artist_id, email, apply_note) values (aid, mail, nullif(left(trim(coalesce(p_note, '')), 500), ''));
  end if;
  return aid;
end $$;
revoke all on function public.claim_building(text, text, text, text, text) from public, anon;
grant execute on function public.claim_building(text, text, text, text, text) to authenticated;
