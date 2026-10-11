// pull-artists.mjs — reads the approved artists and their works from Supabase (public, read-only, with the publishable key)
// and writes artists.live.json. The site build merges it with the sample artists of artists.js.
//   node tools/pull-artists.mjs              pull, write artists.live.json
//   node tools/pull-artists.mjs --hide-demo  also hide the sample artists once there is at least one real one
//   node tools/pull-artists.mjs --dry        print what would be written
// Needs Node 22. Reads supabaseUrl / supabaseKey from CONFIG in circles.js.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ARTIST_COLUMNS, WORK_COLUMNS, rowsToArtists, readLive} from './live-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const cfg = fs.readFileSync(path.join(ROOT, 'circles.js'), 'utf8');
const pick = k => (cfg.match(new RegExp(`${k}:\\s*'([^']*)'`)) || [])[1] || '';
const URL_ = pick('supabaseUrl').replace(/\/+$/, ''), KEY = pick('supabaseKey');
if (!URL_ || !KEY) { console.error('pull-artists: supabaseUrl / supabaseKey are not set in CONFIG (circles.js)'); process.exit(1); }
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(URL_)) { console.error(`pull-artists: odd supabaseUrl "${URL_}"`); process.exit(1); }
if (/service_role|sb_secret_/.test(KEY)) { console.error('pull-artists: the key in circles.js is a SECRET key. Remove it from the repo and rotate it in Supabase now.'); process.exit(1); }

const get = async q => {
  const r = await fetch(`${URL_}/rest/v1/${q}`, {headers: {apikey: KEY, Authorization: `Bearer ${KEY}`}, signal: AbortSignal.timeout(20000)});
  if (!r.ok) throw new Error(`${q.split('?')[0]}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

try {
  const artists = await get(`artists?select=${ARTIST_COLUMNS}&approved=eq.true&demo=eq.false&order=created_at`);
  const ids = artists.map(a => a.id);
  const works = ids.length ? await get(`works?select=${WORK_COLUMNS}&artist_id=in.(${ids.join(',')})&order=artist_id,position`) : [];
  const live = rowsToArtists(artists, works);
  const keepHide = args.has('--hide-demo') || (!args.has('--show-demo') && readLive(ROOT).hideDemo);
  const out = {pulledAt: new Date().toISOString(), hideDemo: keepHide, artists: live};
  const skipped = artists.length - live.length;
  console.log(`pull-artists: ${live.length} artist(s) with works${skipped ? `, ${skipped} approved artist(s) skipped (no works yet)` : ''}, ${live.reduce((n, a) => n + a.pieces.length, 0)} work(s); sample artists ${keepHide && live.length ? 'hidden' : 'kept'}`);
  if (args.has('--dry')) console.log(JSON.stringify(out, null, 2));
  else { fs.writeFileSync(path.join(ROOT, 'artists.live.json'), JSON.stringify(out, null, 2) + '\n'); console.log('wrote artists.live.json'); }
} catch (e) { console.error('pull-artists failed:', e.message); process.exit(1); }
