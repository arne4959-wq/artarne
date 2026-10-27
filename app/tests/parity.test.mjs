// parity.test.mjs — the React helpers must give exactly what the old circles.js gives, for every string key,
// artist and work, in th / en / lo. Run: npm test (in app/).
// The old helpers are cut out of ../circles.js and run with LANG as a parameter; the new ones load through Vite.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SITE = path.resolve(APP, '..');
const read = f => fs.readFileSync(path.join(SITE, f), 'utf8');
let vite, lang, art, data, strings, config, React, renderToStaticMarkup, artJsx, i18n;

/* the old helpers, unchanged, with LANG passed in */
const OLD = read('circles.js');
const cut = (re, what) => { const m = OLD.match(re); assert.ok(m, `old circles.js: ${what} not found`); return m[0]; };
const oldCode = [
  cut(/^const STR = \{[\s\S]*?^\};/m, 'STR'),
  cut(/^const CONFIG = \{[\s\S]*?\};/m, 'CONFIG'),
  cut(/^const NF = [\s\S]*?^const esc = .*$/m, 'money + esc'),
  cut(/^const t = \(k, v\)[\s\S]*?^const fmtSize = .*$/m, 't … fmtSize'),
  cut(/^const RS = \[[\s\S]*?^function ransom[\s\S]*?^}$/m, 'ransom'),
  cut(/^function artBg[\s\S]*?^}$/m, 'artBg'),
].join('\n');
const oldFor = (LANG, A) => new Function('LANG', 'ARTISTS', 'DISC_EN', 'CITY_EN', 'DISC_LO', 'CITY_LO', 'window',
  oldCode + '\nreturn {STR, t, pk, nameL, discL, cityL, titleL, bldgL, fmtSize, money, esc, ransom, artBg};'
)(LANG, A.ARTISTS, A.DISC_EN, A.CITY_EN, A.DISC_LO, A.CITY_LO, globalThis);
const oldData = new Function(read('artists.js') + '\nreturn {ARTISTS, DISC_EN, CITY_EN, DISC_LO, CITY_LO};')();

before(async () => {
  vite = await createServer({root: APP, configFile: path.join(APP, 'vite.config.js'), logLevel: 'error', server: {middlewareMode: true, hmr: false}, appType: 'custom'});
  [lang, art, data, strings, config, artJsx, i18n] = await Promise.all(['/src/lib/lang.js', '/src/lib/art.js', 'virtual:circles/data', 'virtual:circles/strings', 'virtual:circles/config', '/src/components/art.jsx', '/src/lib/i18n.jsx'].map(m => vite.ssrLoadModule(m)));
  React = await import('react');                 // plain Node import: Vite's SSR loader leaves react external, so this is the same copy
  ({renderToStaticMarkup} = await import('react-dom/server'));
});
after(() => vite && vite.close());

test('artists.js data reaches React unchanged', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(data.ARTISTS)), JSON.parse(JSON.stringify(oldData.ARTISTS)));
  for (const k of ['DISC_EN', 'CITY_EN', 'DISC_LO', 'CITY_LO']) assert.deepEqual(data[k], oldData[k], k);
  assert.ok(data.ARTISTS.length >= 1);   // hideDemo: only the real artist(s) are left
});

test('strings and config reach React unchanged', () => {
  const o = oldFor('th', oldData);
  assert.deepEqual(strings.STR, o.STR);
  assert.deepEqual(Object.keys(strings.STR), ['th', 'en', 'lo']);
  assert.ok(config.CONFIG.lakPerUsd > 0 && 'endpoint' in config.CONFIG);
  assert.ok(!('SHIPPING' in config) && !('RATES' in config));   // nothing is sold: no shipping terms, no rates
});

for (const L of ['th', 'en', 'lo']) test(`helpers match circles.js in ${L}`, () => {
  const o = oldFor(L, oldData), n = lang.makeLang(L), vars = {a: 'A<b>', n: 3, t: 'T', d: 'D', p: '$9', k: 'K', s: 'S'};
  let checks = 0;
  for (const k of new Set([...Object.keys(o.STR.th), ...Object.keys(o.STR[L])])) {
    assert.deepEqual(n.t(k), o.t(k), `t(${k})`);
    assert.deepEqual(n.t(k, vars), o.t(k, vars), `t(${k}, vars)`); checks += 2;
  }
  assert.equal(n.t('no_such_key'), o.t('no_such_key'));
  for (const a of data.ARTISTS) {
    for (const f of ['nameL', 'discL', 'cityL', 'bldgL']) { assert.equal(n[f](a), o[f](a), `${f}(${a.id})`); checks++; }
    for (const k of ['bio', 'concept', 'name']) assert.deepEqual(n.pk(a, k), o.pk(a, k), `pk(${a.id}, ${k})`);
    a.pieces.forEach((p, i) => {
      const id = `${a.id}-${i}`;
      assert.equal(n.titleL(p), o.titleL(p), `titleL ${id}`);
      assert.equal(n.fmtSize(p), o.fmtSize(p), `fmtSize ${id}`);
      for (const k of ['m', 'q']) assert.deepEqual(n.pk(p, k), o.pk(p, k), `pk ${id} ${k}`);
      assert.ok(!('workStatus' in art) && !('payLink' in art));
      assert.equal(art.artBg(a.works, i), o.artBg(a.works, i));
      checks += 9;
    });
  }
  // kip rounding edge cases
  for (const v of [0, 1, 44, 45, 450, 1234, 99999]) assert.equal(n.money(v), o.money(v), `money(${v})`);
  assert.ok(checks > 600, `only ${checks} checks ran`);
});

test('<Ransom> gives the same chips as ransom()', () => {
  const o = oldFor('th', oldData);
  // compare what a browser would read: the chip structure, the text, and each style="…" cut where its quote ends
  // (the old markup has a quote bug in font-family:"Special Elite", see OLD_QUOTE_BUG in components/art.jsx)
  const styles = h => [...h.matchAll(/style="([^"]*)"/g)].map(m => m[1].replace(/&quot;/g, '"').split(';').map(d => d.trim()).filter(d => /:\s*\S/.test(d)).map(d => d.replace(/\s*:\s*/, ':')).join(';'));
  const shape = h => h.replace(/<span[^>]*?class="(sp|rw)"[^>]*>/g, '<$1>').replace(/<span[^>]*>/g, '<s>').replace(/<\/span>/g, '</>').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const cases = [['circles', 0, false], ['เมืองของศิลปิน', 3, false], ['ไม่มี\u200bหอศิลป์ no gallery', 1, true], ['ที่ไม่ยอมเงียบ', 2, true], ['A & <b>', 0, false], ['GET A BUILDING', 2, true]];
  for (const [text, seed, wrap] of cases) {
    const el = {innerHTML: ''}; o.ransom(el, text, seed, wrap);
    const html = renderToStaticMarkup(React.createElement(artJsx.Ransom, {text, seed, wrap})).replace(/^<span>|<\/span>$/g, '');
    assert.deepEqual(styles(html), styles(el.innerHTML), `styles of ransom("${text}", ${seed}, ${wrap})`);
    assert.equal(shape(html.replace(/ style="[^"]*"/g, '')), shape(el.innerHTML.replace(/ style="[^"]*"[^>]*/g, '')), `chips of ransom("${text}", ${seed}, ${wrap})`);
  }
});

test('<ArtImg> matches artImg (no stamp or status chip any more: nothing is sold)', () => {
  for (const L of ['th', 'en', 'lo']) {
    const n = lang.makeLang(L), wrap = el => renderToStaticMarkup(React.createElement(i18n.LangProvider, {initial: L}, el));
    for (const a of data.ARTISTS) a.pieces.forEach((p, k) => {
      const img = wrap(React.createElement(artJsx.ArtImg, {a, k}));
      if (p.img) assert.ok(img.startsWith(`<img src="${p.img}" alt="${lang.esc(n.titleL(p)).replace(/&#39;/g, '&#x27;')}" loading="lazy" decoding="async" draggable="false"`), img);
      else assert.equal(img, '');
    });
  }
});

test('detectLang: ?lang, then saved, then browser language', () => {
  const d = lang.detectLang;
  assert.equal(d({search: '?lang=lo', saved: 'en', navLang: 'th'}), 'lo');
  assert.equal(d({search: '?lang=xx', saved: 'en', navLang: 'th'}), 'en');
  assert.equal(d({saved: 'nope', navLang: 'th-TH'}), 'th');
  assert.equal(d({navLang: 'lo-LA'}), 'lo');
  assert.equal(d({navLang: 'fr'}), 'en');
});

test('every old page has CSS for its route, in the old order', async () => {
  const pages = {home: 'index', studio: 'cutaway', profile: 'profile', join: 'join', privacy: 'privacy', terms: 'terms', notFound: '404'};
  for (const [mod, html] of Object.entries(pages)) {
    const list = (await vite.ssrLoadModule(`/src/styles/${mod}.js`)).default, src = read(html + '.html');
    // the order the browser applies them: every <link rel="stylesheet"> and the page's first <style>, as they stand in the HTML
    // (index.html links punk.css AFTER its <style>; the other pages link everything before it)
    const first = src.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const links = [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].filter(m => m[1] !== 'fonts/fonts.css').map(m => ({at: m.index, css: read(m[1])}));
    const want = [...links, {at: first.index, css: first[1]}].sort((a, b) => a.at - b.at).map(x => x.css);
    assert.deepEqual(list, want, `${mod} (${html}.html)`);
  }
});

test('routes: old .html names and the dynamic ?id= forms', async () => {
  const {route} = await vite.ssrLoadModule('/src/lib/routes.js');
  const cases = [
    ['/', '', {page: 'home'}], ['/index.html', '', {page: 'home'}], ['/sub/dir/', '', {page: 'home'}],
    ['/join.html', '', {page: 'join'}], ['/privacy.html', '', {page: 'privacy'}], ['/terms.html', '', {page: 'terms'}], ['/404.html', '', {page: 'notFound'}],
    ['/studio-dao.html', '', {page: 'studio', id: 'dao'}], ['/cutaway.html', '?id=thara&work=1', {page: 'studio', id: 'thara'}], ['/cutaway.html', '', {page: 'studio', id: ''}],
    ['/cutaway-napha.html', '?work=2', {redirect: 'studio-napha.html?work=2'}],
    ['/profile-kwan.html', '', {page: 'profile', id: 'kwan'}], ['/profile.html', '?id=pan', {page: 'profile', id: 'pan'}],
    ['/buy-thara-3.html', '', {redirect: 'profile-thara.html#pf-tips'}], ['/buy.html', '?id=mali&k=2', {redirect: 'profile-mali.html#pf-tips'}], ['/buy.html', '', {redirect: 'index.html'}],   // buying was removed: old addresses land on the donation block
    ['/nothing.html', '', {page: 'notFound'}], ['/studio-.html', '', {page: 'notFound'}], ['/x/../evil', '', {page: 'notFound'}],
  ];
  for (const [p, q, want] of cases) assert.deepEqual(route(p, q), want, p + q);
  // every page file the build writes is a real route (nothing falls through to 404 by accident)
  const {PAGES} = await import('../scripts/pages.mjs');
  for (const f of PAGES) if (f !== '404.html') assert.notEqual(route('/' + f, '').page, 'notFound', f);
});
