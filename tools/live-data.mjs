// live-data.mjs — the artists who live in Supabase, turned into the shape of artists.js, and merged with the sample artists.
// Pure functions (no network, no files except readLive), shared by tools/pull-artists.mjs, app/legacy-site.js and app/scripts/pages.mjs.
import fs from 'node:fs';
import path from 'node:path';

/* the columns the public may read (supabase/migrations/001_init.sql: user_id is not one of them, and there is no e-mail column at all) */
export const ARTIST_COLUMNS = 'id,name,name_en,name_lo,disc,city,since,bio,bio_en,bio_lo,tagline,tagline_en,concept,concept_en,instagram,photo,timeline,scale,kind,colors,created_at';
export const WORK_COLUMNS = 'artist_id,position,title,title_en,title_lo,year,medium,medium_en,medium_lo,size,size_lo,ar,img,quote,quote_en,quote_lo,story,story_en,story_lo,say,say_en,say_lo,why,why_en,why_lo,look,look_en,look_lo,concept';
const DEFAULT_COLORS = ['#C4958A', '#7A4A40', '#D4CFCA'];   // the building's three colours when the artist has set none

const put = (o, k, v) => { if (v !== null && v !== undefined && v !== '') o[k] = v; };   // missing stays missing, so pk() falls back to Thai

export function workToPiece(w) {
  const p = {};
  put(p, 't', w.title); put(p, 'tEn', w.title_en); put(p, 'titleLo', w.title_lo);
  put(p, 'y', w.year); put(p, 'm', w.medium); put(p, 'mEn', w.medium_en); put(p, 'mLo', w.medium_lo);
  put(p, 's', w.size); put(p, 'sLo', w.size_lo);
  p.ar = w.ar || '1/1'; put(p, 'img', w.img);
  put(p, 'q', w.quote); put(p, 'qEn', w.quote_en); put(p, 'qLo', w.quote_lo);
  put(p, 'st', w.story); put(p, 'stEn', w.story_en); put(p, 'stLo', w.story_lo);
  put(p, 'say', w.say); put(p, 'sayEn', w.say_en); put(p, 'sayLo', w.say_lo);                 // "the artist tells it": written by the artist, shown as is
  put(p, 'why', w.why); put(p, 'whyEn', w.why_en); put(p, 'whyLo', w.why_lo);
  put(p, 'look', w.look); put(p, 'lookEn', w.look_en); put(p, 'lookLo', w.look_lo);
  put(p, 'concept', w.concept);
  return p;
}

/* the artist's bank details (artist_payment is public by design: it is printed next to a QR, like any payment sign) → the `support` field the donation dialog reads.
   qr_path is a object in the `qr` bucket: <artist_id>/<file>. No account number and no QR = no support (a real artist without bank details cannot be donated to yet). */
export function payToSupport(p, baseUrl) {
  if (!p || (!p.account_no && !p.qr_path)) return null;
  const s = {}; put(s, 'bank', p.bank); put(s, 'name', p.account_name); put(s, 'no', p.account_no);
  if (p.qr_path && baseUrl && /^[a-z0-9-]+\/[A-Za-z0-9._-]+$/.test(p.qr_path)) s.qr = `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/public/qr/${p.qr_path.split('/').map(encodeURIComponent).join('/')}`;
  return s.no || s.qr ? s : null;
}

export function rowToArtist(a, works, pay, baseUrl) {
  const mine = works.filter(w => w.artist_id === a.id).sort((x, y) => x.position - y.position);
  const o = {id: a.id};
  put(o, 'name', a.name); put(o, 'nameEn', a.name_en); put(o, 'nameLo', a.name_lo); put(o, 'disc', a.disc);
  o.scale = Number(a.scale) || 1; o.kind = a.kind || 'arch';
  o.works = Array.isArray(a.colors) && a.colors.length >= 3 ? a.colors.slice(0, 3) : DEFAULT_COLORS;
  o.titles = mine.map(w => w.title);
  put(o, 'since', a.since); put(o, 'city', a.city);
  o.email = '';   // never public: buyers' messages reach the artist through the site (circles.js uses CONFIG.contact until then)
  put(o, 'concept', a.concept); put(o, 'conceptEn', a.concept_en);
  put(o, 'bio', a.bio); put(o, 'bioEn', a.bio_en); put(o, 'bioLo', a.bio_lo);
  put(o, 'tagline', a.tagline); put(o, 'taglineEn', a.tagline_en); put(o, 'instagram', a.instagram); put(o, 'photo', a.photo);
  if (Array.isArray(a.timeline) && a.timeline.length) o.timeline = a.timeline;
  o.pieces = mine.map(workToPiece);
  const sup = payToSupport((pay || []).find(x => x.artist_id === a.id), baseUrl); if (sup) o.support = sup;
  o.live = true;
  return o;
}

/* the oldest artist first, like their order of joining */
export const rowsToArtists = (artistRows, workRows, payRows = [], baseUrl = '') =>
  [...artistRows].sort((x, y) => String(x.created_at || '').localeCompare(String(y.created_at || ''))).map(a => rowToArtist(a, workRows, payRows, baseUrl)).filter(a => a.pieces.length > 0);

/* real artists first, then the sample ones. hideDemo only counts once there is at least one real artist (an empty city would be worse). */
export function mergeArtists(demo, live) {
  const real = (live && live.artists) || [];
  const mine = new Set(real.map(a => a.id));   // a hand-written entry in artists.js (like the city maker's own building) gives way to the same id coming live from Supabase
  return live && live.hideDemo && real.length ? real : [...real, ...demo.filter(a => !mine.has(a.id))];
}

/* artists.live.json next to artists.js (or in `dir`): {artists: [...], hideDemo, pulledAt}; a missing file means "no real artists yet" */
export function readLive(dir) {
  try { const j = JSON.parse(fs.readFileSync(path.join(dir, 'artists.live.json'), 'utf8')); return {artists: Array.isArray(j.artists) ? j.artists : [], hideDemo: !!j.hideDemo}; }
  catch (e) { return {artists: [], hideDemo: false}; }
}
