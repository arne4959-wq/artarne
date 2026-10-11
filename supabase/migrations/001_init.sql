-- circles: artists, works, payment info, storage. Run once in the Supabase SQL editor (or `supabase db push`).
-- Field names follow artists.js (nameEn -> name_en ...) so the site can turn a row back into the same object.
--
-- Who can do what:
--   anyone (anon)        read approved artists, their works and payment info. Never an e-mail address, never user_id.
--   artist (signed in)   read and edit ONLY their own artist profile, works, payment info, e-mail, and upload to their own folder.
--                        They cannot approve themselves, flag themselves as demo, or hand their profile to someone else.
--   admin                the site owner: app_metadata.role = 'admin' on their auth user (see supabase/README.md). Does everything.
--   Edge Functions       use the service role, which bypasses these rules. Its key never goes in this repo.

-- ───────────────────────── helpers ─────────────────────────

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end
$$;

-- ───────────────────────── artists ─────────────────────────

create table public.artists (
  id            text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),   -- slug, used in studio-<id>.html
  user_id       uuid unique references auth.users (id) on delete set null,             -- who may edit this artist
  name          text not null check (char_length(name) between 1 and 80),
  name_en       text check (char_length(name_en) <= 80),
  name_lo       text check (char_length(name_lo) <= 80),
  disc          text not null check (char_length(disc) <= 60),                          -- discipline, in Thai as in artists.js
  city          text not null check (char_length(city) <= 60),
  since         int  check (since between 1900 and 2100),
  bio           text check (char_length(bio) <= 2000),
  bio_en        text check (char_length(bio_en) <= 2000),
  bio_lo        text check (char_length(bio_lo) <= 2000),
  tagline       text check (char_length(tagline) <= 200),
  tagline_en    text check (char_length(tagline_en) <= 200),
  concept       text check (char_length(concept) <= 400),
  concept_en    text check (char_length(concept_en) <= 400),
  instagram     text check (instagram ~ '^https://[^\s]+\.[^\s]+$'),
  commission_open     boolean not null default false,
  commission_until    text check (char_length(commission_until) <= 30),
  commission_until_en text check (char_length(commission_until_en) <= 30),
  sold_elsewhere int not null default 0 check (sold_elsewhere >= 0),                    -- artists.js `sold`: works sold outside the site
  timeline      jsonb not null default '[]' check (jsonb_typeof(timeline) = 'array' and jsonb_array_length(timeline) <= 12),   -- [{y,t,tEn}]
  -- how the building looks in the city (artists.js scale / kind / works)
  scale         numeric(4,2) not null default 1 check (scale between 0.6 and 1.5),
  kind          text not null default 'arch' check (char_length(kind) <= 20),
  colors        text[] not null default '{}' check (cardinality(colors) <= 6),
  -- set by the site owner only (see the column grants below)
  approved      boolean not null default false,
  demo          boolean not null default false,                                         -- sample data: shown with a "sample" label
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger artists_touch before update on public.artists for each row execute function public.touch_updated_at();

-- E-mail is private: the public table has no e-mail column at all. Inquiries reach the artist through an Edge Function.
create table public.artist_private (
  artist_id  text primary key references public.artists (id) on delete cascade,
  email      text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 120),
  updated_at timestamptz not null default now()
);
create trigger artist_private_touch before update on public.artist_private for each row execute function public.touch_updated_at();

-- Printed on the buy page next to the QR, so this one is public by design (an account number on a QR is already public).
create table public.artist_payment (
  artist_id    text primary key references public.artists (id) on delete cascade,
  bank         text not null default 'BCEL' check (char_length(bank) <= 30),
  account_name text check (char_length(account_name) <= 80),
  account_no   text check (char_length(account_no) <= 40),
  qr_path      text check (qr_path ~ '^[a-z0-9-]+/[A-Za-z0-9._-]+$'),                  -- object in the `qr` bucket: <artist_id>/<file>
  updated_at   timestamptz not null default now()
);
create trigger artist_payment_touch before update on public.artist_payment for each row execute function public.touch_updated_at();

-- ───────────────────────── works ─────────────────────────

create table public.works (
  id         uuid primary key default gen_random_uuid(),
  artist_id  text not null references public.artists (id) on delete cascade,
  position   int  not null check (position between 0 and 99),                            -- order in artists.js pieces[] (the "k" in buy-<id>-<k>.html)
  title      text not null check (char_length(title) between 1 and 120),
  title_en   text check (char_length(title_en) <= 120),
  title_lo   text check (char_length(title_lo) <= 120),
  year       int  check (year between 1900 and 2100),
  medium     text check (char_length(medium) <= 120),
  medium_en  text check (char_length(medium_en) <= 120),
  medium_lo  text check (char_length(medium_lo) <= 120),
  size       text check (char_length(size) <= 60),
  size_lo    text check (char_length(size_lo) <= 60),
  price_usd  numeric(10,2) not null check (price_usd >= 0),
  price_lak  bigint check (price_lak >= 0),                                              -- when set, shown as is on Lao pages (otherwise USD x lakPerUsd)
  ar         text not null default '1/1' check (ar ~ '^[0-9]{1,3}/[0-9]{1,3}$'),         -- aspect ratio
  img        text check (img ~ '^(https://|art/)[^\s]+$'),                               -- Storage URL or a path in the site
  status     text not null default '' check (status in ('', 'reserved', 'sold')),
  edition    int  check (edition > 1),                                                   -- null = one of a kind
  pay        text check (pay ~ '^https://[^\s]+\.[^\s]+$'),                              -- the artist's own payment link (optional)
  quote      text check (char_length(quote) <= 300),
  quote_en   text check (char_length(quote_en) <= 300),
  quote_lo   text check (char_length(quote_lo) <= 300),
  story      text check (char_length(story) <= 3000),
  story_en   text check (char_length(story_en) <= 3000),
  story_lo   text check (char_length(story_lo) <= 3000),
  concept    jsonb check (concept is null or jsonb_typeof(concept) = 'object'),           -- artists.js `concept` block
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_id, position) deferrable initially immediate                            -- checked at the end of each statement, so ONE update can swap two positions (a reorder)
);
create index works_artist_idx on public.works (artist_id, position);
create trigger works_touch before update on public.works for each row execute function public.touch_updated_at();

-- At most 40 works per artist, so a hijacked account cannot fill the database.
create or replace function public.limit_works() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.works where artist_id = new.artist_id) >= 40 then
    raise exception 'an artist can have at most 40 works';
  end if;
  return new;
end $$;
create trigger works_limit before insert on public.works for each row execute function public.limit_works();

-- ───────────────────────── privileges ─────────────────────────
-- Supabase grants new tables to anon/authenticated by default. Start from nothing, then give back exactly what is needed.

revoke all on public.artists, public.artist_private, public.artist_payment, public.works from anon, authenticated;
revoke all on function public.is_admin(), public.touch_updated_at(), public.limit_works() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- anon: read-only, and not user_id.
grant select (id, name, name_en, name_lo, disc, city, since, bio, bio_en, bio_lo, tagline, tagline_en, concept, concept_en,
              instagram, commission_open, commission_until, commission_until_en, sold_elsewhere, timeline, scale, kind, colors,
              approved, demo, created_at, updated_at) on public.artists to anon;
grant select on public.artist_payment, public.works to anon;

-- signed in: the same reads, plus their own rows. They may edit profile fields, but not id, user_id, approved or demo.
grant select on public.artists, public.artist_private, public.artist_payment, public.works to authenticated;
grant update (name, name_en, name_lo, disc, city, since, bio, bio_en, bio_lo, tagline, tagline_en, concept, concept_en,
              instagram, commission_open, commission_until, commission_until_en, sold_elsewhere, timeline, scale, kind, colors)
      on public.artists to authenticated;
grant insert, update, delete on public.artist_private, public.artist_payment to authenticated;
grant insert, update, delete on public.works to authenticated;
-- creating an artist, approving, demo flag and user_id are admin jobs: done with the service role or by an admin through the
-- policies below, which also need the table privilege:
grant insert, delete, update (user_id, approved, demo) on public.artists to authenticated;   -- narrowed by the policies: only is_admin() passes

-- ───────────────────────── row level security ─────────────────────────

alter table public.artists        enable row level security;
alter table public.artist_private enable row level security;
alter table public.artist_payment enable row level security;
alter table public.works          enable row level security;

create or replace function public.owns_artist(aid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.artists a where a.id = aid and a.user_id = auth.uid())
$$;
revoke all on function public.owns_artist(text) from public;
grant execute on function public.owns_artist(text) to anon, authenticated;   -- used inside the read policies, so anon needs it too (auth.uid() is null for anon: always false)

-- artists
create policy artists_read on public.artists for select
  using (approved or user_id = auth.uid() or public.is_admin());
create policy artists_owner_update on public.artists for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy artists_admin_all on public.artists for all
  using (public.is_admin()) with check (public.is_admin());

-- Column privileges let `authenticated` touch user_id/approved/demo, so stop non-admins here as well.
create or replace function public.guard_artist_columns() returns trigger
language plpgsql as $$
begin
  if public.is_admin() or auth.uid() is null then return new; end if;   -- admin, or the service role (no end-user JWT)
  if tg_op = 'INSERT' then raise exception 'only the site owner can create artists'; end if;
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
     or new.approved is distinct from old.approved or new.demo is distinct from old.demo then
    raise exception 'id, user_id, approved and demo can only be changed by the site owner';
  end if;
  return new;
end $$;
create trigger artists_guard before insert or update on public.artists for each row execute function public.guard_artist_columns();

-- artist_private: the owner and the admin only. anon has no privilege on this table at all.
create policy private_owner on public.artist_private for all
  using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));
create policy private_admin on public.artist_private for all
  using (public.is_admin()) with check (public.is_admin());

-- artist_payment: public for approved artists, written by the owner.
create policy payment_read on public.artist_payment for select
  using (exists (select 1 from public.artists a where a.id = artist_id and a.approved) or public.owns_artist(artist_id) or public.is_admin());
create policy payment_owner_write on public.artist_payment for all
  using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));
create policy payment_admin on public.artist_payment for all
  using (public.is_admin()) with check (public.is_admin());

-- works: public for approved artists, written by the owner.
create policy works_read on public.works for select
  using (exists (select 1 from public.artists a where a.id = artist_id and a.approved) or public.owns_artist(artist_id) or public.is_admin());
create policy works_owner_write on public.works for all
  using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));
create policy works_admin on public.works for all
  using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── storage ─────────────────────────
-- Every object lives under <artist_id>/..., and the policies check that first folder against the signed-in artist.
--   art    artwork pictures        public, images only, 5 MB
--   qr     LAO QR images           public, images only, 2 MB
--   slips  transfer slips          private, 5 MB. Uploaded by an Edge Function (service role); the artist can read their own.
-- Public buckets serve files by URL without any policy; the policies below only decide who may write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('art',   'art',   true,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('qr',    'qr',    true,  2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('slips', 'slips', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy art_write on storage.objects for insert to authenticated
  with check (bucket_id in ('art', 'qr') and public.owns_artist((storage.foldername(name))[1]));
create policy art_read_own on storage.objects for select to authenticated   -- the storage API reads the row back after an upload / upsert
  using (bucket_id in ('art', 'qr') and public.owns_artist((storage.foldername(name))[1]));
create policy art_update on storage.objects for update to authenticated
  using (bucket_id in ('art', 'qr') and public.owns_artist((storage.foldername(name))[1]))
  with check (bucket_id in ('art', 'qr') and public.owns_artist((storage.foldername(name))[1]));
create policy art_delete on storage.objects for delete to authenticated
  using (bucket_id in ('art', 'qr') and public.owns_artist((storage.foldername(name))[1]));
create policy slips_read on storage.objects for select to authenticated
  using (bucket_id = 'slips' and (public.owns_artist((storage.foldername(name))[1]) or public.is_admin()));
create policy storage_admin on storage.objects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
