# supabase/

Database for artists who manage their own works, and the "I've donated" notices of supporters. The site is donation-only: nothing is sold. The site reads it: `manage.html` (artists sign in and edit) and the QR / account block of the donation dialog.

`migrations/001_init.sql` creates the tables `artists`, `artist_private` (e-mail), `artist_payment` (LAO QR + account), `works`, the storage buckets `art`, `qr`, `slips`, and the access rules. Field names follow `artists.js` (`nameEn` is `name_en`, and so on).

## Setup (once, by the site owner)

1. Create a project at supabase.com. Region: closest to your artists and supporters.
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

The account number and QR are public on purpose: they are shown in the donation dialog, like on any QR payment sign.

## Step 3: "I've donated" notices (donation-only)

Run `migrations/003_donations.sql` after `001` and `002` (they stay as history). It adds `donation_notices` (artist, optional "inspired by" work, donor name and e-mail, amount 1-1000 in USD / LAK / THB, optional private slip, status `pending` / `confirmed` / `rejected`), retires the old `payment_notices` (artists can no longer see them; the admin still can) and retires work prices and the sold / reserved state: `works.status` must stay empty and `works.price_usd` is optional.

1. SQL editor → run `migrations/003_donations.sql`.
2. Install the Supabase CLI, `supabase login`, `supabase link --project-ref <your ref>`.
3. Secrets (the service-role key is added by the platform; never put it in this repo):
   ```
   supabase secrets set TURNSTILE_SECRET=<the secret key of your Cloudflare Turnstile widget>
   supabase secrets set ALLOWED_ORIGIN=https://<your site>        # optional; without it any site may call the function
   supabase secrets set RESEND_API_KEY=<key> MAIL_FROM="circles <notices@your-domain>"   # optional: e-mails the artist
   ```
   Cloudflare → Turnstile: the widget must list the site's host (and `localhost` for development). Its **site key** is already in `CONFIG.turnstileSiteKey`.
4. `supabase functions deploy donation-notice --no-verify-jwt` (visitors are anonymous; the function does its own check, the CAPTCHA). The old `payment-notice` function, if you deployed it, can be deleted.
5. Try it once by hand: an artist with payment details (manage.html → Get paid), open their profile, donate in the dialog, press "I've donated". Expect: it appears in the artist's **Donations** tab as `pending`, and (with Resend) the artist gets an e-mail.

What the function guarantees: it refuses without a valid Turnstile token, for an unknown or unapproved artist, for a named work that is not theirs, more than 5 notices per hour from one e-mail and more than 30 per hour for one artist, and when an artist already has 200 unanswered notices. The amount must be 1-1000 with at most two decimals; no price or work status is involved. A slip is an image of at most 2 MB, stored privately; the artist opens it with a short-lived link. The site's donation dialog is a demo that sends nothing until it is wired to this function.

`functions/donation-notice/logic.js` holds the rules as plain JavaScript and is tested with Node (`supabase/tests/donation-logic.test.mjs`). `index.ts` needs Deno and a real project: it is **not** run by any test here, so step 5 is the check that matters.

## Step 4: real artists on the site (`npm run pull`)

The site is static, so what an artist saves in `manage.html` reaches the public pages when the site is built again:

```
npm run pull              # reads approved artists + their works from Supabase (public columns only), writes artists.live.json
npm run pull -- --hide-demo   # also hide the sample artists once at least one real artist is there (never leaves the city empty)
npm run app:build         # builds the pages: studio-<id>.html, profile-<id>.html for every real artist too
```

- `artists.live.json` is generated; commit it, so a build works without the network. The sample artists of `artists.js` stay until you pass `--hide-demo` (or delete them).
- Real artists come first in the city, oldest first. An approved artist with no works yet is left out until the first work is added.
- The e-mail is never in the file (it is not a public column). Messages go to `CONFIG.contact` until an inquiry function exists. Payment details (account, QR) are not in the file either: the buy page asks for them live, so a changed QR shows at once.
- Run `npm run pull` again after an artist adds a work or you approve someone. Automating it (a scheduled build, or a database webhook) needs the deploy host, which is not chosen yet.
- Test: `node app/tests/live-build.mjs` builds the app with a made-up real artist and opens its pages in Chrome (no network).

## Notes for the code that will use this

- Reorder works with **one** UPDATE statement (`set position = case ...`). The unique `(artist_id, position)` is checked at the end of each statement, so a swap works; two separate updates would collide. `ON CONFLICT` upserts cannot use this constraint.
- Picture URLs from Storage look like `https://<project>.supabase.co/storage/v1/object/public/art/<artist_id>/<file>`. `works.img` accepts that or a site path such as `art/napha-1.svg`.
- `works.edition` is `null` for a one-of-a-kind work. Retired: nothing shows an edition any more.
- Admin-only fields on `artists`: `approved`, `demo`, `user_id`, `id`. The column grants plus the `artists_guard` trigger enforce that.

## Tests

```
npx -y -p @electric-sql/pglite node supabase/tests/rls.mjs
node --test supabase/tests/donation-logic.test.mjs
```

62 checks in an in-memory Postgres with a stand-in for Supabase's `auth` and `storage` schemas: what anon, an artist, another artist and the admin can read and write, plus the constraints (status, price, https links, e-mail, 40-work limit, reorder). This checks the SQL, **not** the real Supabase service. After step 1 is deployed, repeat three checks by hand on the real project: (1) with the anon key, `select * from artist_private` is refused, (2) an invited artist cannot update another artist's row, (3) an artist cannot upload into someone else's folder.
