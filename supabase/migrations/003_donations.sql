-- circles: donation-only (step 5). Nothing is sold any more, so a visitor does not "pay for a work": they DONATE to an artist, optionally naming
-- the work that inspired the gift, and tell the artist through the site ("I've donated"). circles never touches the money.
-- Nobody but the Edge Function `donation-notice` (service role, bypasses these rules) can create a notice: it checks the CAPTCHA, the artist
-- and the rate limits first. The artist sees their own notices and confirms or rejects them. Run after 001 and 002 (kept as history).

-- ───────────────────────── donation_notices ─────────────────────────

create table public.donation_notices (
  id          uuid primary key default gen_random_uuid(),
  artist_id   text not null references public.artists (id) on delete cascade,
  work_id     uuid references public.works (id) on delete set null,                     -- optional: the work that inspired the gift ("for: <title>")
  donor_name  text not null check (char_length(donor_name) between 1 and 80),
  donor_email text not null check (donor_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(donor_email) <= 120),
  amount      numeric(10,2) not null check (amount between 1 and 1000),
  currency    text not null default 'USD' check (currency in ('USD', 'LAK', 'THB')),
  message     text check (char_length(message) <= 1500),
  slip_path   text check (slip_path ~ '^[a-z0-9-]+/[A-Za-z0-9._-]+$'),                  -- object in the private `slips` bucket: <artist_id>/<file>
  status      text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index donation_notices_artist_idx on public.donation_notices (artist_id, created_at desc);
create index donation_notices_email_idx on public.donation_notices (donor_email, created_at desc);   -- the rate limit looks here
create trigger donation_notices_touch before update on public.donation_notices for each row execute function public.touch_updated_at();

revoke all on public.donation_notices from anon, authenticated;
grant select on public.donation_notices to authenticated;
grant update (status) on public.donation_notices to authenticated;                      -- the artist decides; nothing else is editable

alter table public.donation_notices enable row level security;
create policy donations_owner_read on public.donation_notices for select using (public.owns_artist(artist_id));
create policy donations_owner_decide on public.donation_notices for update
  using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));
create policy donations_admin on public.donation_notices for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── retire "payment notices" and the sold / reserved path ─────────────────────────

-- The old table stays as history (any rows are kept) but artists can no longer see or decide them; only the service role and the admin can.
drop policy notices_owner_read on public.payment_notices;
drop policy notices_owner_decide on public.payment_notices;
comment on table public.payment_notices is 'RETIRED by 003 (donation-only). Kept as history. New notices go to donation_notices.';

-- A work has no price and no sale state any more.
update public.works set status = '' where status <> '';
alter table public.works alter column price_usd drop not null;
comment on column public.works.price_usd is 'RETIRED (nothing is for sale). Kept for old data; new works leave it empty.';
comment on column public.works.price_lak  is 'RETIRED (nothing is for sale).';
comment on column public.works.status     is 'RETIRED: always empty (no sold / reserved).';
comment on column public.works.pay        is 'RETIRED: donations go through the artist payment info and donation_notices.';

create or replace function public.works_no_sale() returns trigger language plpgsql as $$
begin
  if new.status <> '' then raise exception 'works.status is retired: nothing is sold or reserved (donation-only)'; end if;
  return new;
end $$;
create trigger works_no_sale before insert or update on public.works for each row execute function public.works_no_sale();
