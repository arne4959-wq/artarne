// scripts/pages.mjs — after `vite build`: one .html file per page address, so any static host serves them
// (GitHub Pages, Netlify, Cloudflare Pages …, no rewrite rules needed). Each is a copy of the app shell;
// src/routes.js picks the page from the file name. Pre-rendered content replaces these copies in a later step.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readLive, mergeArtists} from '../../tools/live-data.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(APP, process.env.CIRCLES_DIST || 'dist');                       // tests build a second copy elsewhere
const DATA = process.env.CIRCLES_FIXTURE && fs.existsSync(path.join(process.env.CIRCLES_FIXTURE, 'artists.js')) ? path.join(process.env.CIRCLES_FIXTURE, 'artists.js') : path.join(APP, '..', 'artists.js');
const demo = new Function(fs.readFileSync(DATA, 'utf8') + '\nreturn {ARTISTS};')().ARTISTS;
const ARTISTS = mergeArtists(demo, readLive(path.dirname(DATA)));   // the real artists of artists.live.json come first, like in the app
export const PAGES = ['join.html', 'manage.html', 'privacy.html', 'terms.html', '404.html', 'cutaway.html', 'buy.html', 'profile.html',
  ...ARTISTS.map(a => `studio-${a.id}.html`), ...ARTISTS.map(a => `profile-${a.id}.html`),
  ...ARTISTS.flatMap(a => a.pieces.map((_, k) => `buy-${a.id}-${k}.html`))];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const shell = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  for (const f of PAGES) fs.writeFileSync(path.join(DIST, f), shell);
  console.log(`pages: ${PAGES.length} page files next to index.html`);
}
