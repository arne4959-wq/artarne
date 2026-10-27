-- 007: "the process of a work". Optional, written / uploaded by the artist, shown by the studio tower (idea / sketch / draft / final stages).
--   idea (+ _en, _lo)   a few lines of text      sketch, draft   a picture in the `art` bucket (an https address, like works.img)
--   idea_on / sketch_on / draft_on / final_on   when each stage happened: 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD'
-- Everything is nullable: an empty stage shows an honest empty window on the site. Run after 001..006. Nothing else changes.
alter table public.works
  add column if not exists idea      text check (char_length(idea)    <= 600),
  add column if not exists idea_en   text check (char_length(idea_en) <= 600),
  add column if not exists idea_lo   text check (char_length(idea_lo) <= 600),
  add column if not exists sketch    text check (sketch ~ '^https://[^\s]+$' and char_length(sketch) <= 500),
  add column if not exists draft     text check (draft  ~ '^https://[^\s]+$' and char_length(draft)  <= 500),
  add column if not exists idea_on   text check (idea_on   ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'),
  add column if not exists sketch_on text check (sketch_on ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'),
  add column if not exists draft_on  text check (draft_on  ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'),
  add column if not exists final_on  text check (final_on  ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$');

-- artists write these columns like the other work texts (006 gave column-by-column rights: add the new ones to both lists)
grant update (idea, idea_en, idea_lo, sketch, draft, idea_on, sketch_on, draft_on, final_on) on public.works to authenticated;
grant insert (idea, idea_en, idea_lo, sketch, draft, idea_on, sketch_on, draft_on, final_on) on public.works to authenticated;
