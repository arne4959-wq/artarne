-- circles: "I have paid" notices (step 3). A buyer pays the artist directly (LAO QR), then tells the artist through the site.
-- Nobody but the Edge Function `payment-notice` (service role, bypasses these rules) can create a notice: it checks the CAPTCHA,
-- the work and the rate limit first. The artist sees their own notices and confirms or rejects them. circles never touches the money.
-- Run after 001_init.sql.

create table public.payment_notices (
  id          uuid primary key default gen_random_uuid(),
  artist_id   text not null references public.artists (id) on delete cascade,
  work_id     uuid not null references public.works (id) on delete cascade,
  buyer_name  text not null check (char_length(buyer_name) between 1 and 80),
  buyer_email text not null check (buyer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(buyer_email) <= 120),
  ship_to     text check (char_length(ship_to) <= 300),
  message     text check (char_length(message) <= 1500),
  slip_path   text check (slip_path ~ '^[a-z0-9-]+/[A-Za-z0-9._-]+$'),                 -- object in the private `slips` bucket: <artist_id>/<file>
  price_usd   numeric(10,2) not null check (price_usd >= 0),                             -- the price the buyer saw, kept as it was
  price_lak   bigint check (price_lak >= 0),
  status      text not null default 'new' check (status in ('new', 'confirmed', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index payment_notices_artist_idx on public.payment_notices (artist_id, created_at desc);
create index payment_notices_email_idx on public.payment_notices (buyer_email, created_at desc);   -- the rate limit looks here
create trigger payment_notices_touch before update on public.payment_notices for each row execute function public.touch_updated_at();

revoke all on public.payment_notices from anon, authenticated;
grant select on public.payment_notices to authenticated;
grant update (status) on public.payment_notices to authenticated;                       -- the artist decides; nothing else is editable

alter table public.payment_notices enable row level security;
create policy notices_owner_read on public.payment_notices for select using (public.owns_artist(artist_id));
create policy notices_owner_decide on public.payment_notices for update
  using (public.owns_artist(artist_id)) with check (public.owns_artist(artist_id));
create policy notices_admin on public.payment_notices for all using (public.is_admin()) with check (public.is_admin());
