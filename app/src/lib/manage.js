/* manage.js — the artist dashboard's data rules, without React or the network, so they can be tested alone.
   Database rows use snake_case (supabase/migrations/001_init.sql); the forms use plain strings. */

export const isHttps = u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.includes('.'); } catch (e) { return false; } };
export const isEmail = s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 120;

const s = v => (v == null ? '' : String(v));
const n = v => (v === '' || v == null ? null : Number(v));
const text = (v, max) => { const x = s(v).trim(); return x ? x.slice(0, max) : null; };

/* ---- profile ---- */
export const PROFILE_TEXT = [   // [column, max length]
  ['name', 80], ['name_en', 80], ['name_lo', 80], ['disc', 60], ['city', 60], ['tagline', 200], ['tagline_en', 200],
  ['concept', 400], ['concept_en', 400], ['bio', 2000], ['bio_en', 2000], ['bio_lo', 2000]];

export function profileToForm(a) {
  const f = {since: s(a.since), instagram: s(a.instagram)};
  for (const [k] of PROFILE_TEXT) f[k] = s(a[k]);
  return f;
}

/* returns {update} to send, or {errors:{field:key}} */
export function formToProfile(f) {
  const errors = {}, update = {};
  for (const [k, max] of PROFILE_TEXT) update[k] = text(f[k], max);
  if (!update.name) errors.name = 'er_required';
  if (!update.disc) errors.disc = 'er_required';
  if (!update.city) errors.city = 'er_required';
  const since = n(f.since);
  if (since !== null && !(Number.isInteger(since) && since >= 1900 && since <= 2100)) errors.since = 'er_year'; else update.since = since;
  const ig = s(f.instagram).trim();
  if (ig && !isHttps(ig)) errors.instagram = 'er_https'; else update.instagram = ig || null;
  return Object.keys(errors).length ? {errors} : {update};
}

/* ---- works (donation-only: no price, status, edition or pay link) ---- */
export const WORK_TEXT = [['title', 120], ['title_en', 120], ['title_lo', 120], ['medium', 120], ['medium_en', 120], ['medium_lo', 120],
  ['size', 60], ['size_lo', 60], ['quote', 300], ['quote_en', 300], ['quote_lo', 300], ['story', 3000], ['story_en', 3000], ['story_lo', 3000],
  ['say', 300], ['say_en', 300], ['say_lo', 300], ['why', 1500], ['why_en', 1500], ['why_lo', 1500], ['look', 800], ['look_en', 800], ['look_lo', 800]];   // say / why / look = "the artist tells it"

export const emptyWork = () => {
  const f = {year: String(new Date().getFullYear()), ar: '1/1', img: ''};
  for (const [k] of WORK_TEXT) f[k] = '';
  return f;
};
export function workToForm(w) {
  const f = {year: s(w.year), ar: s(w.ar || '1/1'), img: s(w.img)};
  for (const [k] of WORK_TEXT) f[k] = s(w[k]);
  return f;
}

export function formToWork(f) {
  const errors = {}, row = {};
  for (const [k, max] of WORK_TEXT) row[k] = text(f[k], max);
  if (!row.title) errors.title = 'er_required';
  const year = n(f.year);
  if (year !== null && !(Number.isInteger(year) && year >= 1900 && year <= 2100)) errors.year = 'er_year'; else row.year = year;
  if (!/^[0-9]{1,3}\/[0-9]{1,3}$/.test(s(f.ar).trim())) errors.ar = 'er_ratio'; else row.ar = s(f.ar).trim();
  const img = s(f.img).trim();
  row.img = img || null;
  return Object.keys(errors).length ? {errors} : {row};
}

/* the first free position: works are shown in this order, and unique (artist_id, position) forbids two at the same place */
export const nextPosition = works => works.reduce((m, w) => Math.max(m, w.position), -1) + 1;

/* ---- payment ---- */
export function formToPayment(f) {
  const errors = {};
  const row = {bank: text(f.bank, 30) || 'BCEL', account_name: text(f.account_name, 80), account_no: text(f.account_no, 40)};
  if (row.account_no && !/^[0-9 \-]{4,40}$/.test(row.account_no)) errors.account_no = 'er_account';
  return Object.keys(errors).length ? {errors} : {row};
}
export function formToEmail(v) { const e = s(v).trim().toLowerCase(); return isEmail(e) ? {email: e} : {errors: {email: 'er_email'}}; }

/* ---- uploads ---- */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const fileKey = ext => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;   // matches ^[A-Za-z0-9._-]+$ of artist_payment.qr_path
/* the size to scale to so the longest side is at most `max` (never enlarges) */
export function fitSize(w, h, max) { const k = Math.min(1, max / Math.max(w, h)); return {w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k))}; }
/* an aspect ratio string like "4/5" for the `ar` field, from a picture's size */
export function ratioOf(w, h) {
  const g = (a, b) => (b ? g(b, a % b) : a);
  let a = w, b = h; const d = g(a, b); a /= d; b /= d;
  while (a > 999 || b > 999) { a = Math.round(a / 2); b = Math.round(b / 2); }   // odd sizes: keep it inside the 3 digits the database accepts
  return `${Math.max(1, a)}/${Math.max(1, b)}`;
}
