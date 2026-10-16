// legacy-site.js — Vite plugin that lets the React app read the plain-HTML site in the folder above,
// so nothing is copied while both versions live side by side (artists.js stays the single source of truth).
//
//   virtual:circles/data             ARTISTS, DISC_EN, CITY_EN, DISC_LO, CITY_LO   from ../artists.js (+ the real artists of ../artists.live.json in front)
//   virtual:circles/strings          STR (th / en / lo)                            from ../circles.js
//   virtual:circles/config           CONFIG                                        from ../circles.js
//   virtual:circles/css/<file>       the raw text of ../<file>.css (no .css on the id, or Vite would run it as a stylesheet)
//   virtual:circles/page-css/<page>  the raw text of the <style> block in ../<page>.html
//   virtual:circles/page-body/<page> the inner HTML of the first <main> in ../<page>.html (long static text: privacy, terms)
//   virtual:circles/sprite/<page>    the inner HTML of the hidden <svg> sprite (#orb, #orb-s …) of ../<page>.html
//
// Dev: every *.html address answers with app/index.html (src/routes.js picks the page from the file name).
//
// CSS comes in as raw text (not processed by Vite), so url(art/...) keeps resolving against the page URL,
// exactly like the old site. The folders the pages point at (art, fonts, og, vendor) are served from the
// folder above in dev and copied into dist/ by the build.
// When the old site is removed at the end of the migration, these files move into app/src and this plugin goes.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readLive} from '../tools/live-data.mjs';

export const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC = ['art', 'fonts', 'og', 'people', 'vendor'];
const STATIC_FILES = ['og.png', 'robots.txt', '.nojekyll'];
const P = 'virtual:circles/', R = '\0' + P;
/* tests only: CIRCLES_FIXTURE=<dir> reads artists.js / circles.js from that folder instead (tests/fixture.mjs makes one) */
const FIXTURE = process.env.CIRCLES_FIXTURE ? path.resolve(process.env.CIRCLES_FIXTURE) : '';
const source = f => FIXTURE && fs.existsSync(path.join(FIXTURE, f)) ? path.join(FIXTURE, f) : path.join(SITE, f);

const grab = (src, re, what, file) => {
  const m = src.match(re);
  if (!m) throw new Error(`legacy-site: could not find ${what} in ${file} (did its layout change?)`);
  return m[0];
};

/* each one returns the module source; `watch` is the file it was read from */
const LOADERS = {
  /* the sample artists of artists.js, after the real ones of artists.live.json (tools/pull-artists.mjs; see tools/live-data.mjs for the merge rule) */
  data: () => ({watch: 'artists.js', code: src => {
    const live = readLive(FIXTURE && fs.existsSync(path.join(FIXTURE, 'artists.live.json')) ? FIXTURE : SITE);
    const merged = live.hideDemo && live.artists.length ? '__LIVE' : '[...__LIVE, ...ARTISTS]';
    return `${src}\nconst __LIVE = ${JSON.stringify(live.artists)};\nconst __ALL = ${merged};\nexport {__ALL as ARTISTS, DISC_EN, CITY_EN, DISC_LO, CITY_LO};`;
  }}),
  strings: () => ({watch: 'circles.js', code: src => `export ${grab(src, /^const STR = \{[\s\S]*?^\};/m, 'const STR', 'circles.js')}`}),
  config: () => ({watch: 'circles.js', code: src => [
    grab(src, /^const CONFIG = \{[\s\S]*?\};/m, 'const CONFIG', 'circles.js'),
    'export {CONFIG};',
  ].join('\n')}),
  css: name => ({watch: name + '.css', code: src => `export default ${JSON.stringify(src)};`}),
  'page-css': name => ({watch: name + '.html', code: src => {
    const m = src.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (!m) throw new Error(`legacy-site: no <style> block in ${name}.html`);
    return `export default ${JSON.stringify(m[1])};`;
  }}),
  'page-body': name => ({watch: name + '.html', code: src => {
    const m = src.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
    if (!m) throw new Error(`legacy-site: no <main> in ${name}.html`);
    return `export default ${JSON.stringify(m[1])};`;
  }}),
  sprite: name => ({watch: name + '.html', code: src => {
    const m = src.match(/<svg width="0" height="0"[^>]*>([\s\S]*?)<\/svg>\s*(?=<nav|<header|<main|<div|<a)/);
    if (!m) throw new Error(`legacy-site: no hidden <svg> sprite in ${name}.html`);
    return `export default ${JSON.stringify(m[1])};`;
  }}),
};

function load(id) {
  const rest = id.slice(R.length), slash = rest.indexOf('/');
  const kind = slash < 0 ? rest : rest.slice(0, slash), arg = slash < 0 ? '' : rest.slice(slash + 1);
  const make = LOADERS[kind];
  if (!make || (kind === 'css' && !/^[\w-]+$/.test(arg)) || (['page-css', 'page-body', 'sprite'].includes(kind) && !/^[\w-]+$/.test(arg))) throw new Error(`legacy-site: unknown module ${id.slice(1)}`);
  const {watch, code} = make(arg), file = source(watch);
  return {file, code: code(fs.readFileSync(file, 'utf8'))};
}

const TYPES = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript', '.txt': 'text/plain'};

export default function legacySite() {
  let outDir;
  return {
    name: 'circles-legacy-site',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    resolveId(id) { return id.startsWith(P) ? '\0' + id : null; },
    load(id) {
      if (!id.startsWith(R)) return null;
      const {file, code} = load(id);
      this.addWatchFile(file);
      if (id === R + 'data' && fs.existsSync(path.join(SITE, 'artists.live.json'))) this.addWatchFile(path.join(SITE, 'artists.live.json'));
      return code;
    },
    // dev: changing artists.js / circles.js / a page's CSS reloads the modules that read it
    configureServer(server) {
      server.watcher.add([path.join(SITE, 'artists.js'), path.join(SITE, 'artists.live.json'), path.join(SITE, 'circles.js'), path.join(SITE, '*.css'), path.join(SITE, '*.html')]);
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '');
        const top = url.split('/')[0];
        // a page address (join.html, studio-dao.html …): serve the app shell, src/routes.js picks the page
        if (/^[\w-]+\.html$/.test(url) && url !== 'index.html') { req.url = '/index.html' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''); return next(); }
        if (!STATIC.includes(top) && !STATIC_FILES.includes(url)) return next();
        const file = path.join(SITE, url);
        if (!file.startsWith(SITE + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
        res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      });
    },
    // build: the same folders go next to the built pages
    writeBundle() {
      for (const d of STATIC) if (fs.existsSync(path.join(SITE, d))) fs.cpSync(path.join(SITE, d), path.join(outDir, d), {recursive: true, filter: s => path.basename(s) !== '.DS_Store'});
      for (const f of STATIC_FILES) if (fs.existsSync(path.join(SITE, f))) fs.copyFileSync(path.join(SITE, f), path.join(outDir, f));
    },
  };
}
