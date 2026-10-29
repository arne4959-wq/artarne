#!/usr/bin/env node
// tools/seed-sql.mjs — prints the SQL that puts a hand-written artist of artists.js (the owner's building) into Supabase, and optionally makes
// the owner's login the site admin. It only PRINTS: nothing is sent anywhere. Paste the output into Supabase → SQL editor → Run.
//
//   node tools/seed-sql.mjs arne you@example.com            building + its works, linked to the login with that e-mail
//   node tools/seed-sql.mjs arne you@example.com --admin    also makes that login the admin (then sign out and in again)
//   node tools/seed-sql.mjs arne you@example.com | pbcopy   straight to the clipboard on a Mac
//
// Run it after migrations 001-006 and after the login exists (Authentication → Users → Add user). The script stops with a clear message
// if the login is missing, and it is one transaction: either everything is created or nothing. The works keep their picture paths (art/...),
// so no upload is needed; the artist's words (say / why / look) are copied if artists.js has them. Bank details are copied without the QR
// (a QR must be uploaded in manage.html → "รับเงิน", it lives in the `qr` bucket).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ratioOf} from '../app/src/lib/manage.js';   // the same rule the dashboard uses to keep an aspect ratio inside the 3 digits the database accepts

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter(a => !a.startsWith('--')), flags = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const [id, email] = args;
if (!id || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { console.error('usage: node tools/seed-sql.mjs <artist id> <login e-mail> [--admin]'); process.exit(1); }
const {ARTISTS} = new Function(fs.readFileSync(path.join(ROOT, 'artists.js'), 'utf8') + '\n;return {ARTISTS};')();
const a = ARTISTS.find(x => x.id === id);
if (!a) { console.error(`no artist "${id}" in artists.js (${ARTISTS.map(x => x.id).join(', ')})`); process.exit(1); }
if (/\.example$/i.test(String(a.email || ''))) { console.error(`"${id}" is a sample artist (e-mail ${a.email}); only a real artist should be put in the database`); process.exit(1); }

/* the database limits of supabase/migrations (001, 004, 005): a value that is too long would fail the whole script, so say so here */
const MAX = {name: 80, name_en: 80, name_lo: 80, disc: 60, city: 60, bio: 2000, bio_en: 2000, bio_lo: 2000, tagline: 200, tagline_en: 200, concept: 400, concept_en: 400,
  title: 120, title_en: 120, title_lo: 120, medium: 120, medium_en: 120, medium_lo: 120, size: 60, size_lo: 60, quote: 300, quote_en: 300, quote_lo: 300,
  story: 3000, story_en: 3000, story_lo: 3000, say: 300, say_en: 300, say_lo: 300, why: 1500, why_en: 1500, why_lo: 1500, look: 800, look_en: 800, look_lo: 800, idea: 600, idea_en: 600, idea_lo: 600};
const problems = [];
const lit = (col, v) => {   // a SQL literal, or NULL for a missing value
  if (v === undefined || v === null || v === '') return 'null';
  if (typeof v === 'number') return String(v);
  const s = String(v);
  if (s.includes('$seed$')) throw new Error(`${col} contains "$seed$"`);
  if (MAX[col] && s.length > MAX[col]) problems.push(`${col} is ${s.length} characters, the database allows ${MAX[col]}`);
  return `'${s.replace(/'/g, "''")}'`;
};
const num = (col, v, lo, hi) => { if (v == null || v === '') return 'null'; const n = Number(v); if (!Number.isFinite(n) || n < lo || n > hi) { problems.push(`${col} ${v} is outside ${lo}..${hi}`); return 'null'; } return String(n); };

const A = [['name', a.name], ['name_en', a.nameEn], ['name_lo', a.nameLo], ['disc', a.disc], ['city', a.city], ['bio', a.bio], ['bio_en', a.bioEn], ['bio_lo', a.bioLo],
  ['tagline', a.tagline], ['tagline_en', a.taglineEn], ['concept', a.concept], ['concept_en', a.conceptEn]];
const colors = Array.isArray(a.works) && a.works.length >= 3 && a.works.every(c => /^#[0-9a-fA-F]{6}$/.test(c)) ? a.works.slice(0, 3) : ['#C4958A', '#7A4A40', '#D4CFCA'];
const timeline = (Array.isArray(a.timeline) ? a.timeline : []).slice(0, 12).map(x => ({y: x.y, t: x.t, tEn: x.tEn}));
const insta = a.instagram && /^https:\/\/[^\s]+\.[^\s]+$/.test(a.instagram) ? a.instagram : null;
const photo = a.photo && /^https:\/\/[^\s]+$/.test(a.photo) ? a.photo : null;
const artistCols = ['id', 'user_id', ...A.map(x => x[0]), 'since', 'instagram', 'photo', 'timeline', 'scale', 'kind', 'colors', 'approved'];
const artistVals = [lit('id', a.id), 'uid', ...A.map(([c, v]) => lit(c, v)), num('since', a.since, 1900, 2100), lit('instagram', insta), lit('photo', photo),
  `'${JSON.stringify(timeline).replace(/'/g, "''")}'::jsonb`, num('scale', a.scale == null ? 1 : a.scale, 0.6, 1.5), lit('kind', a.kind || 'arch'), `'{${colors.map(c => `"${c}"`).join(',')}}'::text[]`, 'true'];

const W = [['title', 't'], ['title_en', 'tEn'], ['title_lo', 'titleLo'], ['medium', 'm'], ['medium_en', 'mEn'], ['medium_lo', 'mLo'], ['size', 's'], ['size_lo', 'sLo'],
  ['quote', 'q'], ['quote_en', 'qEn'], ['quote_lo', 'qLo'], ['story', 'st'], ['story_en', 'stEn'], ['story_lo', 'stLo'], ['say', 'say'], ['say_en', 'sayEn'], ['say_lo', 'sayLo'],
  ['why', 'why'], ['why_en', 'whyEn'], ['why_lo', 'whyLo'], ['look', 'look'], ['look_en', 'lookEn'], ['look_lo', 'lookLo'], ['idea', 'idea'], ['idea_en', 'ideaEn'], ['idea_lo', 'ideaLo']];
const works = (a.pieces || []).map((p, k) => {
  if (p.img && !/^(https:\/\/|art\/)[^\s]+$/.test(p.img)) problems.push(`work ${k}: picture address ${p.img} is not art/... or https://...`);
  const m = /^([0-9]+)\/([0-9]+)$/.exec(String(p.ar || '1/1'));
  if (!m || !+m[1] || !+m[2]) problems.push(`work ${k}: aspect ratio ${p.ar} is not like 4/5`);
  const ar = m && +m[1] && +m[2] ? ratioOf(+m[1], +m[2]) : '1/1';   // 1001/550 becomes 91/50: the same shape, three digits at most
  const cols = ['artist_id', 'position', ...W.map(x => x[0]), 'year', 'ar', 'img', 'rights_confirmed_at'];
  const vals = [lit('artist_id', a.id), String(k), ...W.map(([c, f]) => lit(c, p[f])), num('year', p.y, 1900, 2100), lit('ar', ar), lit('img', p.img), 'now()'];
  return `    insert into public.works (${cols.join(', ')}) values (${vals.join(', ')});`;
});
const pay = a.support && (a.support.no || a.support.name) ? a.support : null;

if (problems.length) { console.error('Fix these in artists.js first:\n - ' + problems.join('\n - ')); process.exit(1); }
const e = email.replace(/'/g, "''");
const sql = `-- circles: put "${a.id}" (${a.name}) into Supabase, linked to the login ${email}
-- Generated by tools/seed-sql.mjs from artists.js. Run in Supabase → SQL editor, AFTER migrations 001-006 and AFTER the login exists
-- (Authentication → Users → Add user). One transaction: if anything is wrong nothing is created.
${flags.has('--admin') ? `
-- 1. this login becomes the site admin (can approve artists, hide a work). Sign out and in again afterwards so the new role is in the token.
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where lower(email) = lower('${e}');
` : ''}
-- ${flags.has('--admin') ? '2' : '1'}. the building and its ${works.length} work(s)
do $seed$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower('${e}');
  if uid is null then raise exception 'There is no login for ${e} yet: Authentication → Users → Add user, then run this again'; end if;
  insert into public.artists (${artistCols.join(', ')})
    values (${artistVals.join(', ')});
  insert into public.artist_private (artist_id, email) values (${lit('id', a.id)}, '${e}');
${pay ? `  insert into public.artist_payment (artist_id, bank, account_name, account_no, checked) values (${lit('id', a.id)}, ${lit('bank', pay.bank || 'BCEL')}, ${lit('account_name', pay.name)}, ${lit('account_no', pay.no)}, true);   -- checked: the owner seeds it (migration 008). The QR: upload it in manage.html → รับเงิน\n` : ''}${works.join('\n')}
end
$seed$;

-- check: should show 1 building and ${works.length} work(s)
select (select count(*) from public.artists where id = ${lit('id', a.id)}) as buildings, (select count(*) from public.works where artist_id = ${lit('id', a.id)}) as works;
`;
process.stdout.write(sql);
if (!pay) console.error(`note: ${a.id} has no bank details in artists.js, so none are created. Add them in manage.html → รับเงิน (bank, account name, number, QR).`);
