-- circles: a profile photo for each artist (shown in the round portrait on profile-<id>.html).
-- Run once in the Supabase SQL editor, after 001..004. The picture itself is uploaded by the artist from manage.html into the
-- public `art` bucket under <artist_id>/ (the rules in 001 already allow that); this column only stores its https address.

alter table public.artists
  add column if not exists photo text
  check (photo is null or (char_length(photo) <= 500 and photo ~ '^https://[^[:space:]]+$'));

-- visitors may read it, the artist may change it (the same as the other profile columns)
grant select (photo) on public.artists to anon;
grant update (photo) on public.artists to authenticated;
