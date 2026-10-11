# supabase/

Database for artists who manage their own works (step 1 of the plan). Nothing in the site reads it yet.

`migrations/001_init.sql` creates the tables `artists`, `artist_private` (e-mail), `artist_payment` (LAO QR + account), `works`, the storage buckets `art`, `qr`, `slips`, and the access rules. Field names follow `artists.js` (`nameEn` is `name_en`, and so on).

## Setup (once, by the site owner)

1. Create a project at supabase.com. Region: closest to your artists and buyers.
2. SQL editor → paste `migrations/001_init.sql` → Run.
3. Authentication → Providers → Email: keep it on. Turn **off** "Allow new users to sign up". Artists are invited, nobody signs up by themselves.
4. Authentication → URL configuration: set the Site URL to the site's address (and `http://localhost:5173` as a redirect for development).
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

## Notes for the code that will use this

- Reorder works with **one** UPDATE statement (`set position = case ...`). The unique `(artist_id, position)` is checked at the end of each statement, so a swap works; two separate updates would collide. `ON CONFLICT` upserts cannot use this constraint.
- Picture URLs from Storage look like `https://<project>.supabase.co/storage/v1/object/public/art/<artist_id>/<file>`. `works.img` accepts that or a site path such as `art/napha-1.svg`.
- `works.edition` is `null` for a one-of-a-kind work. The buy page shows "ONE OF A KIND" only then.
- Admin-only fields on `artists`: `approved`, `demo`, `user_id`, `id`. The column grants plus the `artists_guard` trigger enforce that.

## Tests

```
npx -y -p @electric-sql/pglite node supabase/tests/rls.mjs
```

42 checks in an in-memory Postgres with a stand-in for Supabase's `auth` and `storage` schemas: what anon, an artist, another artist and the admin can read and write, plus the constraints (status, price, https links, e-mail, 40-work limit, reorder). This checks the SQL, **not** the real Supabase service. After step 1 is deployed, repeat three checks by hand on the real project: (1) with the anon key, `select * from artist_private` is refused, (2) an invited artist cannot update another artist's row, (3) an artist cannot upload into someone else's folder.
