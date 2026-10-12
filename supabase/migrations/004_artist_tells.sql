-- 004: "the artist tells it". Three fields per work, written by the artist in the first person (circles never edits or interprets them):
--   say  = what the work says (ONE sentence, shown under the picture)   why = where it came from   look = where to look.
-- Each has a Thai, English and Lao version like the other work texts. All optional. Run after 001-003. Nothing else changes.
alter table public.works
  add column if not exists say     text check (char_length(say)     <= 300),
  add column if not exists say_en  text check (char_length(say_en)  <= 300),
  add column if not exists say_lo  text check (char_length(say_lo)  <= 300),
  add column if not exists why     text check (char_length(why)     <= 1500),
  add column if not exists why_en  text check (char_length(why_en)  <= 1500),
  add column if not exists why_lo  text check (char_length(why_lo)  <= 1500),
  add column if not exists look    text check (char_length(look)    <= 800),
  add column if not exists look_en text check (char_length(look_en) <= 800),
  add column if not exists look_lo text check (char_length(look_lo) <= 800);
