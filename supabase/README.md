# supabase/

Database for artists who manage their own works, and the "I've donated" notices of supporters. The site is donation-only: nothing is sold. The site reads it: `manage.html` (artists sign in and edit) and the QR / account block of the donation dialog.

`migrations/001_init.sql` creates the tables `artists`, `artist_private` (e-mail), `artist_payment` (LAO QR + account), `works`, the storage buckets `art`, `qr`, `slips`, and the access rules. Field names follow `artists.js` (`nameEn` is `name_en`, and so on).

## Setup (once, by the site owner)

The short, ordered version for this site is in `docs/SETTINGS.md` ("ใส่ให้ใช้งานจริง"). The details:

1. Create a project at supabase.com. Region: closest to your artists and supporters.
2. SQL editor → paste `migrations/001_init.sql` → Run. Then the rest in one go: `npm run db:bundle | pbcopy` and paste (migrations 002–009 as one `begin; … commit;` transaction: if anything fails, nothing changes). `npm run doctor` shows what is still missing.
3. Authentication → Providers → Email: keep it on. Turn **off** "Allow new users to sign up". Artists are invited, nobody signs up by themselves.
3b. **Authentication → SMTP Settings: set your own SMTP server.** Supabase's built-in mail only delivers to members of *your Supabase organisation* ("Email address not authorized") and has a very low hourly limit, so without this no artist ever receives the sign-in link. (Brevo, Resend with your own domain, or a Gmail App Password all work; with a custom server the default limit is 30 mails an hour.) Test with an address that is not yours.
4. Authentication → URL configuration: set the Site URL to the site's address, and add every address of `manage.html` under **Redirect URLs** (for example `http://localhost:5173/manage.html` while developing, and the real address later). The sign-in link in the e-mail only works for addresses on this list.
5. Project settings → API: copy the **Project URL** and the **anon public** key. These two go into the site's `CONFIG` later; they are safe in the browser because of the access rules. **Never** commit the `service_role` key. Edge Functions get it from the platform, not from this repo.

## Make yourself the admin

The admin is a user whose `app_metadata.role` is `admin`. An artist cannot set this on themselves (only the server can write `app_metadata`).

1. Authentication → Users → Add user (your own e-mail).
2. SQL editor, or let `npm run db:seed -- arne you@example.com --admin | pbcopy` print this *and* your building (see `docs/SETTINGS.md`):
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}') || '{"role":"admin"}'
   where email = 'you@example.com';
   ```
3. Sign out and in again so the new token carries the role.

## Add an artist

An artist is created by the admin, then linked to a login:

```sql
-- 1. invite them first (Authentication → Users → Invite user; needs your own SMTP, see Setup 3b). No user id to copy: the row is linked by e-mail.
insert into artists (id, user_id, name, name_en, disc, city, approved)
select 'mali', id, 'มะลิ', 'Mali', 'ศิลปะดิจิทัล', 'เวียงจันทน์', true from auth.users where lower(email) = lower('their@email');
insert into artist_private (artist_id, email) values ('mali', 'their@email');   -- fails (and nothing is created) if that login does not exist yet
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

## Step 4: real artists on the site

The site is static, so what an artist saves in `manage.html` reaches the public pages when the site is built again. `.github/workflows/deploy.yml` does that every 30 minutes (switch-on steps: `docs/SETTINGS.md`). The chain it runs, in order, and what you can run yourself:

```
npm run pull                 # approved artists + their works from Supabase (public columns only) → artists.live.json
npm run pull -- --hide-demo  # same, and hide the sample artists once at least one real artist is there (never leaves the city empty)
node tools/merge-live.mjs    # puts them into artists.js for this build (a generated block; never commit it, `--strip` removes it again)
node tools/build.mjs --site https://your.site   # studio-<id>.html, profile-<id>.html, og/<id>.png and sitemap.xml for every artist
npm run dist                 # the dist/ folder that is published, with manage.html
```

- Before `merge-live.mjs` nothing in the plain-HTML site read `artists.live.json` (only the React app did), so artists saved in the database never reached the pages. The merge also checks every artist and skips a bad one (bad id, no works, an unsafe picture address) with a warning in the log, instead of failing the build for everybody; unknown building shapes and colours fall back to the defaults.
- `artists.live.json` is generated: the deploy build pulls it fresh. Real artists come first in the city (the owner's hand-written building, then the live artists oldest first, then the sample artists). An approved artist with no works yet is left out until the first work is added.
- The e-mail is never in the file (it is not a public column). Messages go to `CONFIG.contact` until an inquiry function exists. The bank details are public by design (they are printed next to a QR) and are copied into the artist's `support`; a real artist without a QR picture shows the account only, never a made-up QR.
- Run it again (or wait up to 30 minutes) after an artist adds a work or you approve someone.
- Tests: `node tests-legacy/run.mjs live` runs the whole chain on a scratch copy with made-up live artists, one of them hostile (markup in every text field, bad addresses, bad colours); `node app/tests/live-build.mjs` does the same for the React app.

## Notes for the code that will use this

- Reorder works with **one** UPDATE statement (`set position = case ...`). The unique `(artist_id, position)` is checked at the end of each statement, so a swap works; two separate updates would collide. `ON CONFLICT` upserts cannot use this constraint.
- Picture URLs from Storage look like `https://<project>.supabase.co/storage/v1/object/public/art/<artist_id>/<file>`. `works.img` accepts that or a site path such as `art/napha-1.svg`.
- `works.edition` is `null` for a one-of-a-kind work. Retired: nothing shows an edition any more.
- Admin-only fields on `artists`: `approved`, `demo`, `user_id`, `id`. The column grants plus the `artists_guard` trigger enforce that.

## Tests

```
npm i --no-save --prefix supabase/tests @electric-sql/pglite    # once (npx -p does not work: ES modules only look next to the file)
npm run test:db                                                 # node supabase/tests/rls.mjs
node --test supabase/tests/donation-logic.test.mjs
```

133 checks in an in-memory Postgres with a stand-in for Supabase's `auth` and `storage` schemas, running migrations 001–009: what anon, an artist, another artist and the admin can read and write, the constraints (links, e-mail, text lengths, 40-work limit, reorder), the work rules (a hidden work, the own-work tick), the artist's own words, the profile photo, asking for a building and approving it (009), **that every column the dashboard writes (`app/src/lib/manage.js`) is allowed by the grants**, that `tools/seed-sql.mjs` puts the owner's building in cleanly, and that the paste-in bundle `npm run db:bundle` equals running the files one by one and is all-or-nothing. This checks the SQL, **not** the real Supabase service. After the migrations are on the real project, repeat three checks by hand: (1) with the anon key, `select * from artist_private` is refused, (2) an invited artist cannot update another artist's row, (3) an artist cannot upload into someone else's folder. `npm run doctor` checks the rest from outside.

## Checking a new bank account or QR (migration 008)

When an artist adds or changes their account or QR in manage.html, visitors do not see it until you check it (so a stolen login cannot quietly swap the QR and take the donations).
Look at the new details (Table editor → `artist_payment`, rows with `checked = false`; open the QR through Storage → `qr`), ask the artist if anything looks odd, then in the SQL editor:

```sql
update public.artist_payment set checked = true where artist_id = '<id>';
```

The next deploy (at most 30 minutes) puts it on the site.
