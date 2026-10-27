#!/usr/bin/env node
// tools/merge-live.mjs — puts the artists who live in Supabase onto the plain-HTML site.
//
// Every page, tools/build.mjs and the tests read ARTISTS from artists.js. `npm run pull` writes the artists from the database to
// artists.live.json, but nothing in the plain-HTML site read that file. This tool closes the gap: it appends a small block to artists.js that
// merges artists.live.json into ARTISTS (live artists replace a hand-written artist with the same id). It runs in the deploy build
// (.github/workflows/deploy.yml) between `npm run pull` and `npm run build`. The artists.js in git stays hand-written: never commit the block.
//
//   node tools/merge-live.mjs            apply (replaces the block of an earlier run)
//   node tools/merge-live.mjs --check-images   also fetch every picture once and leave out the works whose picture cannot be fetched (the deploy build uses this)
//   node tools/merge-live.mjs --strip    remove the block again
//   node tools/merge-live.mjs --dry      print the block, change nothing
//
// Order on the site: hand-written real artists (the owner, no *.example e-mail) first, then the live artists (oldest first, as pulled), then the sample ones.
// `hideDemo` (npm run pull -- --hide-demo) drops the *sample* artists once somebody real is on the site; it never empties the city.
//
// The database is trusted to keep out the worst (https-only links, lengths) but not to keep the site's drawing code safe, so every live artist
// is checked here and a bad one is skipped with a warning instead of breaking the build for everybody.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {readLive} from './live-data.mjs';
import {KIND_LIST, DEFAULT_COLORS} from '../app/src/lib/manage.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BEGIN = '/*LIVE:BEGIN';
export const END = '/*LIVE:END*/';

const ID = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const AR = /^[0-9]{1,3}\/[0-9]{1,3}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const IMG = /^(https:\/\/|art\/)[^\s"'<>\\]+$/;   // the database allows more (it only forbids spaces); the pages should not have to trust that
const HTTPS = /^https:\/\/[^\s"'<>\\]+\.[^\s"'<>\\]+$/;
const str = v => (typeof v === 'string' ? v : '');

/* → {artist} (cleaned copy) or {problem}. Only what the pages read is kept. */
export function cleanArtist(a) {
  if (!a || typeof a !== 'object') return {problem: 'not an object'};
  if (!ID.test(str(a.id))) return {problem: `bad id ${JSON.stringify(a.id)}`};
  if (!str(a.name).trim() || !str(a.disc).trim() || !str(a.city).trim()) return {problem: `${a.id}: name, discipline and city are required`};
  if (!Array.isArray(a.pieces) || a.pieces.length === 0 || a.pieces.length > 40) return {problem: `${a.id}: needs 1 to 40 works`};
  const pieces = [];
  for (const [i, p] of a.pieces.entries()) {
    if (!p || !str(p.t).trim()) return {problem: `${a.id}: work ${i} has no title`};
    if (p.img != null && p.img !== '' && !IMG.test(str(p.img))) return {problem: `${a.id}: work ${i} has an unsafe picture address`};
    if (!AR.test(str(p.ar || '1/1'))) return {problem: `${a.id}: work ${i} has a bad aspect ratio`};
    if (p.img) { const q = {...p, ar: p.ar || '1/1'}; delete q.concept; pieces.push(q); }   // `concept` is a free-form block of hand-written artists; the dashboard has no field for it, so a live work never carries one   // a work without a picture is not shown yet: the cards, the studio and the share image all need one (the dashboard lets an artist save it before uploading)
  }
  if (!pieces.length) return {problem: `${a.id}: no work has a picture yet`};
  const o = {...a, pieces};
  o.email = '';                                            // never public
  o.live = true;
  o.kind = KIND_LIST.includes(a.kind) ? a.kind : 'arch';   // an unknown building shape would break the city drawing
  const sc = Number(a.scale); o.scale = sc >= 0.6 && sc <= 1.5 ? sc : 1;
  const cols = Array.isArray(a.works) ? a.works.slice(0, 3) : [];
  o.works = cols.length === 3 && cols.every(c => HEX.test(str(c))) ? cols : DEFAULT_COLORS;   // colours go into style attributes and SVG
  o.titles = pieces.map(p => p.t);
  /* timeline is free-form JSON in the database: keep only the three fields the pages print, as a year and two short strings */
  const tl = (Array.isArray(a.timeline) ? a.timeline : []).slice(0, 12).map(x => ({y: Number.isInteger(Number(x && x.y)) ? Number(x.y) : 0, t: str(x && x.t).slice(0, 120), tEn: str(x && x.tEn).slice(0, 120)})).filter(x => x.y >= 1900 && x.y <= 2100 && (x.t || x.tEn));
  if (tl.length) o.timeline = tl; else delete o.timeline;
  if (o.instagram && !HTTPS.test(str(o.instagram))) delete o.instagram;
  if (o.photo && !HTTPS.test(str(o.photo))) delete o.photo;
  if (o.support) {
    const s = o.support, q = s.qr && HTTPS.test(str(s.qr)) ? s.qr : undefined;
    o.support = {bank: str(s.bank), name: str(s.name), no: str(s.no), ...(q ? {qr: q} : {})};
    if (!o.support.no && !o.support.qr) delete o.support;
  }
  delete o.wave; delete o.sample; delete o.demo;           // flags only hand-written artists carry
  return {artist: o};
}

export function cleanLive(live) {
  const artists = [], problems = [], seen = new Set();
  for (const a of live.artists || []) {
    const r = cleanArtist(a);
    if (r.problem) { problems.push(r.problem); continue; }
    if (seen.has(r.artist.id)) { problems.push(`${r.artist.id}: listed twice`); continue; }
    seen.add(r.artist.id); artists.push(r.artist);
  }
  return {live: {artists, hideDemo: !!live.hideDemo}, problems};
}

/* tools/build.mjs opens every page in a browser and fails when anything on it fails to load. One artist whose picture was deleted from Storage (or a Storage hiccup at the wrong moment)
   would then stop EVERYBODY's deploy. So before the build every picture is fetched once (twice before giving up); a work whose picture cannot be fetched is left out of this
   build, an artist left with no work is left out, an unreachable profile photo is dropped. `probe(url)` → true when the picture can be fetched; `local(path)` → true when a site file exists. */
const httpProbe = async url => {
  for (let i = 0; i < 2; i++) {
    try { const r = await fetch(url, {method: 'HEAD', signal: AbortSignal.timeout(15000)}); if (r.ok) return true; } catch (e) { /* try again */ }
  }
  return false;
};
export async function dropUnreachable(live, {probe = httpProbe, local = f => fs.existsSync(path.join(ROOT, f))} = {}) {
  const problems = [], seen = new Map();
  const ok = u => { if (!seen.has(u)) seen.set(u, /^https:/.test(u) ? probe(u) : Promise.resolve(local(u))); return seen.get(u); };
  const urls = [...new Set(live.artists.flatMap(a => [...a.pieces.map(p => p.img), a.photo].filter(Boolean)))];
  for (let i = 0; i < urls.length; i += 10) await Promise.all(urls.slice(i, i + 10).map(ok));   // ten at a time: fast, and friendly to the storage server
  const artists = [];
  for (const a of live.artists) {
    const pieces = [];
    for (const [i, p] of a.pieces.entries()) { if (await ok(p.img)) pieces.push(p); else problems.push(`${a.id}: work ${i} "${p.t}": its picture cannot be fetched (${p.img})`); }
    if (!pieces.length) { problems.push(`${a.id}: no picture can be fetched, the artist is left out of this build`); continue; }
    const o = {...a, pieces, titles: pieces.map(p => p.t)};
    if (o.photo && !(await ok(o.photo))) { problems.push(`${a.id}: the profile photo cannot be fetched, left out`); delete o.photo; }
    artists.push(o);
  }
  return {live: {...live, artists}, problems};
}

/* the code that is appended to artists.js; plain old JavaScript, it runs in browsers and in tools/build.mjs's new Function() */
export function liveBlock(live) {
  const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);   // line/paragraph separators are legal in JSON but not in older JavaScript strings
  const json = JSON.stringify(live).replace(/</g, '\\u003c').replace(/\//g, '\\/').split(LS).join('\\u2028').split(PS).join('\\u2029');   // no "</script>" and no "*/" can come out of an artist's text
  return `${BEGIN} generated by tools/merge-live.mjs from artists.live.json; never commit this block */
(function (live) {
  var real = live.artists || [], mine = Object.create(null);
  real.forEach(function (a) { mine[a.id] = 1; });
  var isSample = function (a) { return /\\.example$/i.test(String(a.email || '')); };
  var kept = ARTISTS.filter(function (a) { return !mine[a.id]; });
  var own = kept.filter(function (a) { return !isSample(a); });
  var samples = kept.filter(isSample);
  var hide = live.hideDemo && (real.length || own.length);
  ARTISTS.splice.apply(ARTISTS, [0, ARTISTS.length].concat(own, real, hide ? [] : samples));
})(${json});
${END}
`;
}

export const strip = src => src.replace(/\n*\/\*LIVE:BEGIN[\s\S]*?\/\*LIVE:END\*\/\n?/, '\n');
export const apply = (src, live) => strip(src).replace(/\s*$/, '\n') + '\n' + liveBlock(live);

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const file = path.join(ROOT, 'artists.js'), src = fs.readFileSync(file, 'utf8'), has = src.includes(BEGIN);
  if (process.argv.includes('--strip')) {
    if (has) { fs.writeFileSync(file, strip(src)); console.log('merge-live: block removed, artists.js is hand-written only again'); } else console.log('merge-live: no block in artists.js');
  } else {
    let {live, problems} = cleanLive(readLive(ROOT));
    if (process.argv.includes('--check-images')) { const r = await dropUnreachable(live); live = r.live; problems = problems.concat(r.problems); }
    for (const p of problems) console.log(`merge-live: SKIPPED ${p}`);
    if (process.argv.includes('--dry')) process.stdout.write(liveBlock(live));
    else if (!live.artists.length && !live.hideDemo) {
      if (has) fs.writeFileSync(file, strip(src));
      console.log('merge-live: no live artists, artists.js left hand-written');
    } else {
      fs.writeFileSync(file, apply(src, live));
      console.log(`merge-live: ${live.artists.length} live artist(s) merged into artists.js${live.hideDemo ? ' (sample artists hidden)' : ''}${problems.length ? `, ${problems.length} skipped` : ''}`);
    }
  }
}
