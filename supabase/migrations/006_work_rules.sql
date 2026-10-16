-- circles: house rules for works. Run once in the Supabase SQL editor, after 001..005.
--   1. works.rights_confirmed_at   the moment the artist ticked "this is my own work" when adding it (a record, not a legal proof)
--   2. works.hidden                an admin can hide one work (a complaint, a copied picture) without deleting it or the artist.
--                                  Visitors no longer get the row at all (row rule below); the artist still sees it (marked hidden) and CANNOT un-hide it herself.
--   3. admin_set_work_hidden()     the only way to change `hidden`, and only for admins (app_metadata.role = 'admin')

alter table public.works add column if not exists rights_confirmed_at timestamptz;
alter table public.works add column if not exists hidden boolean not null default false;

-- artists may not write `hidden`: take table-wide UPDATE away and give it back column by column (everything except hidden, id, artist_id, created_at)
revoke update on public.works from authenticated;
grant update (position, title, title_en, title_lo, year, medium, medium_en, medium_lo, size, size_lo, price_usd, price_lak,
              ar, img, status, edition, pay, quote, quote_en, quote_lo, story, story_en, story_lo, concept, rights_confirmed_at,
              say, say_en, say_lo, why, why_en, why_lo, look, look_en, look_lo)
  on public.works to authenticated;
-- a new work cannot be inserted already hidden by someone trying to confuse the list: hidden is false unless an admin sets it
revoke insert on public.works from authenticated;
grant insert (artist_id, position, title, title_en, title_lo, year, medium, medium_en, medium_lo, size, size_lo, price_usd, price_lak,
              ar, img, status, edition, pay, quote, quote_en, quote_lo, story, story_en, story_lo, concept, rights_confirmed_at,
              say, say_en, say_lo, why, why_en, why_lo, look, look_en, look_lo)
  on public.works to authenticated;

-- visitors: only works that are not hidden; the owner and admins see all
drop policy if exists works_read on public.works;
create policy works_read on public.works for select
  using ((not hidden and exists (select 1 from public.artists a where a.id = artist_id and a.approved))
         or public.owns_artist(artist_id) or public.is_admin());

create or replace function public.admin_set_work_hidden(p_work uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.works set hidden = p_hidden where id = p_work;
end $$;
revoke all on function public.admin_set_work_hidden(uuid, boolean) from public, anon;
grant execute on function public.admin_set_work_hidden(uuid, boolean) to authenticated;
