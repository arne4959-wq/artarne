-- 008: a bank account or QR is shown to visitors only after the site owner has checked it.
-- Why: an artist logs in with a link sent to their e-mail. Whoever gets into that mailbox could put their own QR on the artist's page, and the
-- site rebuilds every 30 minutes, so donations would go to them. Now a new or changed account waits (checked = false) until an admin looks at it.
-- The artist still sees their own details in manage.html. The owner checks a row in the SQL editor:
--   update public.artist_payment set checked = true where artist_id = '<id>';
-- Also: the donation amount ceiling is per currency (1,000 kip is only a few cents). Run after 001..007.

alter table public.artist_payment add column if not exists checked boolean not null default false;
update public.artist_payment set checked = true;   -- what is there today was put in by the owner: keep it visible. RUN THIS FILE ONCE: a second run would tick every account, checked or not

-- anyone but an admin (or the service role / SQL editor: no end-user JWT) who sets or changes an account puts it back to "not checked",
-- and can never tick it themselves
create or replace function public.guard_payment_checked() returns trigger
language plpgsql as $$
begin
  if public.is_admin() or auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' or new.bank is distinct from old.bank or new.account_name is distinct from old.account_name
     or new.account_no is distinct from old.account_no or new.qr_path is distinct from old.qr_path then
    new.checked = false;
  else
    new.checked = old.checked;
  end if;
  return new;
end $$;
revoke all on function public.guard_payment_checked() from public;
drop trigger if exists artist_payment_guard on public.artist_payment;
create trigger artist_payment_guard before insert or update on public.artist_payment for each row execute function public.guard_payment_checked();

-- visitors (and so `npm run pull` and the donation dialog) read only checked accounts; the owner and admins see everything
drop policy if exists payment_read on public.artist_payment;
create policy payment_read on public.artist_payment for select
  using ((checked and exists (select 1 from public.artists a where a.id = artist_id and a.approved)) or public.owns_artist(artist_id) or public.is_admin());

-- the same ceilings as MAX_BY_CURRENCY in supabase/functions/donation-notice/logic.js
alter table public.donation_notices drop constraint if exists donation_notices_amount_check;
alter table public.donation_notices add constraint donation_notices_amount_check
  check (amount >= 1 and amount <= case currency when 'USD' then 1000 when 'THB' then 35000 when 'LAK' then 22000000 end);

-- an artist may add a QR image but never replace or delete one: overwriting the file at the same path would change what visitors see without touching qr_path, so the trigger above could not notice.
-- To change a QR the artist uploads a new file (new name) and the account goes back to "not checked". Admins keep full access through storage_admin.
drop policy if exists art_update on storage.objects;
create policy art_update on storage.objects for update to authenticated
  using (bucket_id = 'art' and public.owns_artist((storage.foldername(name))[1]))
  with check (bucket_id = 'art' and public.owns_artist((storage.foldername(name))[1]));
drop policy if exists art_delete on storage.objects;
create policy art_delete on storage.objects for delete to authenticated
  using (bucket_id = 'art' and public.owns_artist((storage.foldername(name))[1]));
