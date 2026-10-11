# supabase/

Database for artists who manage their own works, and the "I have paid" notices of buyers. The site reads it: `manage.html` (artists sign in and edit) and the LAO QR block of the buy pages.

`migrations/001_init.sql` creates the tables `artists`, `artist_private` (e-mail), `artist_payment` (LAO QR + account), `works`, the storage buckets `art`, `qr`, `slips`, and the access rules. Field names follow `artists.js` (`nameEn` is `name_en`, and so on).

## Setup (once, by the site owner)

1. Create a project at supabase.com. Region: closest to your artists and buyers.
2. SQL editor → paste `migrations/001_init.sql` → Run.
3. Authentication → Providers → Email: keep it on. Turn **off** "Allow new users to sign up". Artists are invited, nobody signs up by themselves.
4. Authentication → URL configuration: set the Site URL to the site's address, and add every address of `manage.html` under **Redirect URLs** (for example `http://localhost:5173/manage.html` while developing, and the real address later). The sign-in link in the e-mail only works for addresses on this list.
5. Project settings → API: copy the **Project URL** and the **anon public** key. These two go into the site's `CONFIG` later; they are safe in the browser because of the access rules. **Never** commit the `service_role` key. Edge Functions get it from the platform, not from this repo.

## Make yourself the admin

The admin is a user whose `app_metadata.role` is `admin`. An artist cannot set this on themselves (only the server can write `app_metadata`).

1. Authentication → Users → Add user → Send invitation (your own e-mail).
2. SQL editor:
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}') || '{"role":"admin"}'
   where email = 'you@example.com';
   ```
3. Sign out and in again so the new token carries the role.

## Add an artist

An artist is created by the admin, then linked to a login:

```sql
-- 1. invite them first (Authentication → Users → Send invitation), then copy their user id
insert into artists (id, user_id, name, name_en, disc, city, approved)
values ('mali', '<their user id>', 'มะลิ', 'Mali', 'ศิลปะดิจิทัล', 'เวียงจันทน์', true);
insert into artist_private (artist_id, email) values ('mali', 'their@email');
```

`id` is the address slug (`studio-mali.html`): lowercase letters, digits and `-`, 3–40 characters. `approved = false` keeps an artist invisible to visitors while they fill in their profile. `demo = true` marks sample data.

## What the rules guarantee

| Who | Can |
|---|---|
| Visitor (anon) | Read approved artists, their works and payment info. Cannot read `user_id`, e-mail or anything unapproved. Cannot write. |
| Artist | Edit their own profile fields, works, payment info and e-mail; upload pictures and QR into their own `<artist_id>/` folder. Cannot approve themselves, set `demo`, change `id` or `user_id`, create or delete artists, touch anyone else's rows, or have more than 40 works. |
| Admin | Everything. |
| Edge Functions (service role) | Everything, bypassing the rules. Used for inquiries and transfer slips (step 3). |

The account number and QR are public on purpose: they are printed on the buy page, like on any QR payment sign.

## Step 3: "I have paid" notices (LAO QR)

1. SQL editor → run `migrations/002_payment_notices.sql` (after `001`).
2. Install the Supabase CLI, `supabase login`, `supabase link --project-ref <your ref>`.
3. Secrets (the service-role key is added by the platform; never put it in this repo):
   ```
   supabase secrets set TURNSTILE_SECRET=<the secret key of your Cloudflare Turnstile widget>
   supabase secrets set ALLOWED_ORIGIN=https://<your site>        # optional; without it any site may call the function
   supabase secrets set RESEND_API_KEY=<key> MAIL_FROM="circles <notices@your-domain>"   # optional: e-mails the artist
   ```
   Cloudflare → Turnstile: the widget must list the site's host (and `localhost` for development). Its **site key** is already in `CONFIG.turnstileSiteKey`.
4. `supabase functions deploy payment-notice --no-verify-jwt` (visitors are anonymous; the function does its own check, the CAPTCHA).
5. Try it once by hand: an artist with payment details (manage.html → Get paid), open the buy page of one of their works that is for sale, send a notice. Expect: it appears in the artist's **Payments** tab, the work is on hold ("ON HOLD"), and (with Resend) the artist gets an e-mail.

What the function guarantees: it refuses without a valid Turnstile token, for an unknown, unapproved or sold work, more than 5 notices per hour from one e-mail, and more than 10 unanswered notices on one work. The price, status and work come from the database, never from the visitor. A slip is an image of at most 2 MB, stored privately; the artist opens it with a short-lived link.

`functions/payment-notice/logic.js` holds the rules as plain JavaScript and is tested with Node (`supabase/tests/notice-logic.test.mjs`). `index.ts` needs Deno and a real project: it is **not** run by any test here, so step 5 is the check that matters.

## Notes for the code that will use this

- Reorder works with **one** UPDATE statement (`set position = case ...`). The unique `(artist_id, position)` is checked at the end of each statement, so a swap works; two separate updates would collide. `ON CONFLICT` upserts cannot use this constraint.
- Picture URLs from Storage look like `https://<project>.supabase.co/storage/v1/object/public/art/<artist_id>/<file>`. `works.img` accepts that or a site path such as `art/napha-1.svg`.
- `works.edition` is `null` for a one-of-a-kind work. The buy page shows "ONE OF A KIND" only then.
- Admin-only fields on `artists`: `approved`, `demo`, `user_id`, `id`. The column grants plus the `artists_guard` trigger enforce that.

## Tests

```
npx -y -p @electric-sql/pglite node supabase/tests/rls.mjs
node --test supabase/tests/notice-logic.test.mjs
```

54 checks in an in-memory Postgres with a stand-in for Supabase's `auth` and `storage` schemas: what anon, an artist, another artist and the admin can read and write, plus the constraints (status, price, https links, e-mail, 40-work limit, reorder). This checks the SQL, **not** the real Supabase service. After step 1 is deployed, repeat three checks by hand on the real project: (1) with the anon key, `select * from artist_private` is refused, (2) an invited artist cannot update another artist's row, (3) an artist cannot upload into someone else's folder.
