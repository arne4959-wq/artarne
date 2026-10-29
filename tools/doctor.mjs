// doctor.mjs — "is my Supabase backend set up right?" Read-only: it only uses the PUBLIC (publishable) key from circles.js, the same one every visitor's browser has.
//   npm run doctor
// It never writes, never signs in, and never needs a secret. Each line says OK / WARN / FAIL and what to do.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = fs.readFileSync(path.join(ROOT, 'circles.js'), 'utf8');
const pick = k => (cfg.match(new RegExp(`${k}:\\s*'([^']*)'`)) || [])[1] || '';
const URL_ = pick('supabaseUrl').replace(/\/+$/, ''), KEY = pick('supabaseKey');
const out = [];
const say = (level, msg, fix) => { out.push(level); console.log(`${level.padEnd(4)}  ${msg}${fix ? '\n      → ' + fix : ''}`); };

if (!URL_ || !KEY) { say('FAIL', 'supabaseUrl / supabaseKey are empty in CONFIG (circles.js)', 'copy them from Supabase → Project settings → API (the publishable key only)'); process.exit(1); }
if (/service_role|sb_secret_/.test(KEY)) { say('FAIL', 'the key in circles.js is a SECRET key', 'remove it from the repo now and rotate it in Supabase'); process.exit(1); }
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(URL_)) { say('FAIL', `odd supabaseUrl "${URL_}"`); process.exit(1); }

const H = {apikey: KEY, Authorization: `Bearer ${KEY}`};
const get = async (p, opt = {}) => {
  try { const r = await fetch(URL_ + p, {headers: H, signal: AbortSignal.timeout(15000), ...opt}); let j = null; try { j = await r.json(); } catch (e) { /* not json */ } return {status: r.status, json: j, headers: r.headers}; }
  catch (e) { return {status: 0, error: e.message}; }
};

const main = await get('/rest/v1/artists?select=id&limit=1');
if (main.status === 0) { say('FAIL', `cannot reach ${URL_} (${main.error})`, 'check the internet connection and that the project is not paused (Supabase dashboard)'); process.exit(1); }
if (main.status === 404 || (main.json && /relation .* does not exist|Could not find the table/.test(JSON.stringify(main.json)))) say('FAIL', 'table "artists" is missing', 'run supabase/migrations/001_init.sql in the SQL editor');
else if (main.status >= 400) say('FAIL', `artists: HTTP ${main.status} ${JSON.stringify(main.json).slice(0, 120)}`, 'check the access rules (migration 001) and the key');
else say('OK', 'table artists is reachable');

const cols = {photo: '005_artist_photo.sql'};
for (const [c, m] of Object.entries(cols)) {
  const r = await get(`/rest/v1/artists?select=${c}&limit=1`);
  if (r.status === 200) say('OK', `column artists.${c} exists`);
  else say('FAIL', `column artists.${c} is missing`, `run supabase/migrations/${m}`);
}
const works = await get('/rest/v1/works?select=artist_id&limit=1');
say(works.status === 200 ? 'OK' : 'FAIL', works.status === 200 ? 'table works is reachable' : `works: HTTP ${works.status}`, works.status === 200 ? '' : 'run migration 001');
const wcols = {say: '004_artist_tells.sql', rights_confirmed_at: '006_work_rules.sql', hidden: '006_work_rules.sql', idea: '007_work_process.sql'};   // without these the dashboard cannot save a work and `npm run pull` fails with HTTP 400
for (const [c, m] of Object.entries(wcols)) {
  const r = await get(`/rest/v1/works?select=${c}&limit=1`);
  if (r.status === 200) say('OK', `column works.${c} exists`);
  else say('FAIL', `column works.${c} is missing`, `run supabase/migrations/${m} (002-007 in order: they are all needed before artists can post)`);
}

const claim = await get('/rest/v1/rpc/claim_building', {method: 'POST', headers: {...H, 'Content-Type': 'application/json'}, body: '{"p_id":"doctor-probe","p_name":"x","p_disc":"x","p_city":"x"}'});   // anon may not run it: 401/403 = it exists
if (claim.status === 404) say('FAIL', 'function claim_building is missing: new artists cannot ask for a building', 'run supabase/migrations/009_self_signup.sql');
else say('OK', 'function claim_building exists');

const notices = await get('/rest/v1/donation_notices?select=id&limit=1');
if (notices.status === 200 && Array.isArray(notices.json) && notices.json.length) say('FAIL', 'donation_notices is readable by the PUBLIC (donor e-mails would leak)', 'check the rules in migration 003 (the table must be private)');
else if (notices.status === 404) say('WARN', 'table donation_notices is missing', 'run migration 003 (the "I\'ve donated" notices)');
else say('OK', 'donation_notices is not readable by the public');

const pub = await get('/rest/v1/artists?select=id,name&approved=eq.true&demo=eq.false');
const real = Array.isArray(pub.json) ? pub.json.length : 0;
say(real ? 'OK' : 'WARN', `${real} approved real artist(s) visible to visitors`, real ? '' : 'add your own building first: docs/SETTINGS.md, ค. (steps 5ข-6)');
if (real) {
  const w = await get('/rest/v1/works?select=artist_id');
  const have = new Set((Array.isArray(w.json) ? w.json : []).map(x => x.artist_id));
  const empty = pub.json.filter(a => !have.has(a.id)).map(a => a.id);
  if (empty.length) say('WARN', `artist(s) with no works yet will not show in the city: ${empty.join(', ')}`, 'they must add at least one work in manage.html');
}

const auth = await get('/auth/v1/settings');
if (auth.status === 200 && auth.json) {
  // since 009 a new login is safe (it can only make one hidden building), and Google sign-in needs sign-up ON for a first visit
  if (auth.json.disable_signup === true) say('FAIL', 'public sign-up is OFF: a new artist cannot sign in with Google', 'Authentication → Sign In / Providers → turn ON "Allow new users to sign up" (safe since migration 009)');
  else say('OK', 'public sign-up is ON (a new login can only ask for a hidden building)');
  if (auth.json.external && auth.json.external.google === true) say('OK', 'Google sign-in is on');
  else say('FAIL', 'Google sign-in is off: artists have no way in except the e-mail link (which needs a custom SMTP)', 'docs/SETTINGS.md, ข. (steps 3-5)');
  if (auth.json.external && auth.json.external.email === false) say('FAIL', 'e-mail login is switched off', 'Authentication → Providers → Email: keep it on');
} else say('WARN', `could not read the auth settings (HTTP ${auth.status})`);

for (const b of ['art', 'qr']) {
  const r = await get(`/storage/v1/object/public/${b}/__doctor_probe__`);
  const msg = JSON.stringify(r.json || {});
  if (/Bucket not found/i.test(msg)) say('FAIL', `storage bucket "${b}" is missing`, 'run migration 001 (it creates the buckets)');
  else say('OK', `storage bucket "${b}" exists`);
}

const fn = await get('/functions/v1/donation-notice', {method: 'POST', headers: {...H, 'Content-Type': 'application/json'}, body: '{}'});
if (fn.status === 404) say('WARN', 'edge function donation-notice is not deployed', 'supabase functions deploy donation-notice --no-verify-jwt (supabase/README.md, Step 3)');
else if (fn.status === 0) say('WARN', 'could not call donation-notice');
else say('OK', `edge function donation-notice answers (HTTP ${fn.status} to an empty request, which is correct: it refuses)`);

console.log('');
const f = out.filter(x => x === 'FAIL').length, w = out.filter(x => x === 'WARN').length;
console.log(f ? `${f} FAIL, ${w} WARN: fix the FAIL lines first.` : w ? `no FAIL, ${w} WARN.` : 'all good.');
console.log(`
Cannot be checked from outside, do these once in the Supabase dashboard (docs/SETTINGS.md, "Putting it live"):
  - Only if you keep the e-mail link as a way in: Authentication → SMTP, a custom SMTP server. Supabase's built-in mail only reaches
    members of YOUR Supabase organisation ("Email address not authorized"). Google sign-in does not need it.
  - Authentication → URL configuration: the Site URL and a Redirect URL for manage.html (the address of the published site + /manage.html).
  - Your own login: sign in once on manage.html with Google, then run tools/seed-sql.mjs to make it admin and create your building.`);
process.exit(f ? 1 : 0);
