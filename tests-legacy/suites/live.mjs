// Artists who live in Supabase must reach the plain-HTML site, safely.
//  A. tools/merge-live.mjs: a bad artist is skipped (not the whole build), unsafe values are cleaned, the block can be stripped again
//  B. the real pipeline in a scratch copy of the project: merge → tools/build.mjs --site → pages, share images, sitemap exist for the live artists,
//     and nothing an artist wrote can close a <script> tag or break out of an attribute
//  C. the pages in a browser: no errors, nothing an artist wrote runs, the live artist is on the home page and can be donated to (real flow, no demo)
// Slow (it runs the build, ~2 min), so it is part of `all`, not of the default run.   node tests-legacy/run.mjs live
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {launch, startServer, sleep} from '../../tools/browser.mjs';
import {cleanLive, cleanArtist, dropUnreachable, apply, strip, BEGIN} from '../../tools/merge-live.mjs';
export const name = 'live';

const HOSTILE = `<img src=x onerror="window.__xss=1"></script><script>window.__xss=1</script>"'\`\${1+1}{p}&amp;`;
const piece = (t, img, extra = {}) => ({t, tEn: t + ' (en)', y: 2026, m: 'oil', mEn: 'oil', s: '30 × 40', ar: '4/5', img, ...extra});
const normal = {
  id: 'zz-live', name: 'ลิฟ', nameEn: 'Live Tester', disc: 'Illustration', city: 'Luang Prabang', since: 2024, scale: 1.1, kind: 'tower',
  works: ['#112233', '#445566', '#778899'], bio: 'ทดสอบ', bioEn: 'A test artist', email: '',
  pieces: [piece('Work one', 'art/phop-1.svg', {say: 'one line'}), piece('Work two', 'art/phop-2.svg')],
  support: {bank: 'BCEL', name: 'LIVE TESTER', no: '111 222 333'}, live: true,
};
normal.titles = normal.pieces.map(p => p.t);
const hostile = {
  id: 'zz-hostile', name: HOSTILE, nameEn: HOSTILE, nameLo: HOSTILE, disc: HOSTILE, city: HOSTILE, since: 2020, scale: 1, kind: 'evil"kind',
  works: ['red;background:url(x)', '#xyz', '#112233'], bio: HOSTILE, bioEn: HOSTILE, bioLo: HOSTILE, tagline: HOSTILE, taglineEn: HOSTILE, concept: HOSTILE, conceptEn: HOSTILE,
  timeline: [{y: 2020, t: HOSTILE, tEn: HOSTILE}, {y: '<b>1</b>', t: 'not a year'}, {y: 1850, t: 'too early'}], email: '', instagram: 'https://instagram.com/x',
  pieces: [piece(HOSTILE, 'art/pan-1.svg', {concept: {k: HOSTILE}, titleLo: HOSTILE, mLo: HOSTILE, sLo: HOSTILE, q: HOSTILE, qEn: HOSTILE, st: HOSTILE, stEn: HOSTILE, say: HOSTILE, sayEn: HOSTILE, why: HOSTILE, whyEn: HOSTILE, look: HOSTILE, lookEn: HOSTILE})],
  support: {bank: HOSTILE, name: HOSTILE, no: HOSTILE}, live: true,
};
hostile.titles = hostile.pieces.map(p => p.t);
const BREAKOUT = /<script>window\.__xss/i;   // a real <script> from the hostile text; the escaped text has &lt;script&gt; instead
/* how many inline event handlers (onclick=, onerror=…) a saved page has, counted tag by tag so that the word "onerror=" inside an escaped alt="" does not count */
const TAG = /<([a-zA-Z][\w:-]*)((?:\s+[^\s"'<>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const handlers = html => {
  const s = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');
  let n = 0;
  for (const m of s.matchAll(TAG)) for (const a of m[2].replace(/"[^"]*"|'[^']*'/g, '""').matchAll(/\s([^\s"'<>\/=]+)/g)) if (/^on/i.test(a[1])) n++;
  return n;
};
/* the least an artist can save: a name, a discipline, a city and one work (the dashboard allows a work with no picture yet; that one is not shown) */
const minimal = {id: 'zz-min', name: 'มินิ', disc: 'Painting', city: 'Vientiane', scale: 1, kind: 'arch', works: ['#C4958A', '#7A4A40', '#D4CFCA'], email: '', live: true,
  pieces: [{t: 'No picture yet', ar: '1/1'}, {t: 'Only a title', ar: '1/1', img: 'art/pan-2.svg'}]};
minimal.titles = minimal.pieces.map(p => p.t);
/* real names are long: a full Lao or Thai name, a sentence of a title, a long bio. Nothing may spill sideways on a phone. */
const long = {id: 'zz-long', name: 'Souphaphone Vongsouvanh Keomany', nameEn: 'Souphaphone Vongsouvanh Keomany', nameLo: 'ສຸພາພອນ ວົງສຸວັນ ແກ້ວມະນີ', disc: 'Photography', city: 'Luang Prabang', since: 2022,
  scale: 1, kind: 'lens', works: ['#4A6080', '#2D4A6A', '#8A9BB0'], email: '', live: true, bio: 'ภาพถ่ายถนนและตลาดเช้าของหลวงพระบาง '.repeat(10), bioEn: 'Street and morning-market photography from Luang Prabang. '.repeat(8),
  tagline: 'Photographs of the town before the tourists wake up', taglineEn: 'Photographs of the town before the tourists wake up. Bookings: booking@lao-photo.org',
  pieces: [piece('A photograph of the morning market in Luang Prabang taken before the monks walk by with their bowls', 'art/phop-3.svg', {mEn: 'Archival pigment print on cotton rag paper, hand-signed', s: '120 × 80 cm, framed in oak'}), piece('ຕະຫຼາດເຊົ້າ', 'art/pan-3.svg')]};
long.titles = long.pieces.map(p => p.t);
const bad = [
  {...normal, id: 'Bad Id'},                                                           // not a valid address
  {...normal, id: 'zz-badimg', pieces: [piece('x', 'javascript:alert(1)')]},           // an unsafe picture address
  {...normal, id: 'zz-nowork', pieces: []},                                            // nothing to show
  {...normal, id: 'zz-noimg', pieces: [piece('x', undefined)]},                        // the only work has no picture yet
  {...normal, id: 'zz-dup'}, {...normal, id: 'zz-dup'},                                // listed twice
];

export async function run({root, check}) {
  /* ---- A. the cleaning ---- */
  const {live, problems} = cleanLive({artists: [normal, hostile, minimal, long, ...bad], hideDemo: false});
  check('merge-live: the good artists are kept, the 5 bad ones are skipped with a reason (not the whole build)', live.artists.length === 5 && problems.length === 5 && live.artists.map(a => a.id).join() === 'zz-live,zz-hostile,zz-min,zz-long,zz-dup', {kept: live.artists.map(a => a.id), problems});
  check('merge-live: a work without a picture is left out, the work with one stays', live.artists.find(a => a.id === 'zz-min').pieces.length === 1 && live.artists.find(a => a.id === 'zz-min').pieces[0].t === 'Only a title');
  const h = live.artists.find(a => a.id === 'zz-hostile');
  check('merge-live: an unknown building shape and unsafe colours fall back to the defaults', h.kind === 'arch' && h.works.every(c => /^#[0-9a-f]{6}$/i.test(c)), {kind: h.kind, works: h.works});
  check('merge-live: the free-form JSON of the database is cut down to what the pages print (a timeline with a bad year is dropped, a work\'s `concept` block is dropped)', h.timeline.length === 1 && h.timeline[0].y === 2020 && h.pieces.every(p => p.concept === undefined), {timeline: h.timeline});
  check('merge-live: e-mail is always empty and the artist is marked live', live.artists.every(a => a.email === '' && a.live === true), live.artists.map(a => a.email));
  check('merge-live: a picture address with quotes or a javascript: scheme is refused', !!cleanArtist({...normal, id: 'zz-q', pieces: [piece('x', 'https://x.co/a"onerror="1')]}).problem && !!cleanArtist({...normal, id: 'zz-j', pieces: [piece('x', 'javascript:alert(1)')]}).problem);
  /* one broken picture must not stop everybody's deploy (the build fails on any picture that does not load) */
  const flaky = cleanLive({artists: [
    {...normal, id: 'zz-ok', photo: 'https://img.test/photo-ok.webp', pieces: [piece('fine', 'https://img.test/ok-1.webp'), piece('gone', 'https://img.test/gone-2.webp'), piece('local', 'art/phop-1.svg')]},
    {...normal, id: 'zz-allbad', pieces: [piece('gone too', 'https://img.test/gone-3.webp')]},
    {...normal, id: 'zz-photo', photo: 'https://img.test/gone-photo.webp', pieces: [piece('fine', 'https://img.test/ok-4.webp')]},
  ], hideDemo: false}).live;
  const probed = []; const dr = await dropUnreachable(flaky, {probe: async u => { probed.push(u); return !/gone/.test(u); }, local: f => f === 'art/phop-1.svg'});
  check('merge-live --check-images: a work whose picture cannot be fetched is left out, an artist with none left is left out, a dead profile photo is dropped',
    dr.live.artists.map(a => a.id).join() === 'zz-ok,zz-photo' && dr.live.artists[0].pieces.map(p => p.t).join() === 'fine,local' && dr.live.artists[1].photo === undefined && dr.problems.length === 4, {ids: dr.live.artists.map(a => a.id), problems: dr.problems});
  check('merge-live --check-images: every picture is fetched once (not once per use), site files are looked up locally', new Set(probed).size === probed.length && !probed.some(u => u.startsWith('art/')), probed);
  const src = strip(fs.readFileSync(path.join(root, 'artists.js'), 'utf8')), merged = apply(src, live);   // (the working copy may already carry a generated block)
  check('merge-live: the block is added once, applying twice does not stack, and --strip gives the hand-written file back',
    merged.includes(BEGIN) && apply(merged, live) === merged && strip(merged).trimEnd() === src.trimEnd() && !/<\/script/i.test(merged.slice(merged.indexOf(BEGIN))), {len: merged.length});

  /* ---- B. the pipeline in a scratch copy ---- */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'circles-live-'));
  const keepDirs = new Set(['fonts', 'art', 'og', 'people', 'vendor', 'legends', 'tools']);
  for (const n of fs.readdirSync(root)) {
    const from = path.join(root, n), st = fs.statSync(from);
    if (st.isFile() && !/\.(tgz|zip)$/.test(n) && n !== '.DS_Store') fs.copyFileSync(from, path.join(tmp, n));
    else if (st.isDirectory() && keepDirs.has(n)) fs.cpSync(from, path.join(tmp, n), {recursive: true});
  }
  fs.mkdirSync(path.join(tmp, 'app/src/lib'), {recursive: true});
  fs.copyFileSync(path.join(root, 'app/src/lib/manage.js'), path.join(tmp, 'app/src/lib/manage.js'));   // merge-live.mjs reads the building shapes from here
  fs.writeFileSync(path.join(tmp, 'artists.live.json'), JSON.stringify({artists: [normal, hostile, minimal, long, ...bad], hideDemo: false, pulledAt: 'test'}));
  const sh = (args, ms, env = {}) => spawnSync(process.execPath, args, {cwd: tmp, encoding: 'utf8', timeout: ms, env: {...process.env, CHROME_NO_SANDBOX: process.env.CHROME_NO_SANDBOX || '', ...env}});
  try {
    let r = sh(['tools/merge-live.mjs'], 60000);
    check('pipeline: merge-live exits 0, says what it merged and what it skipped', r.status === 0 && /5 live artist/.test(r.stdout) && /SKIPPED/.test(r.stdout), (r.stdout + r.stderr).slice(0, 400));
    r = sh(['tools/build.mjs', '--site', 'https://example.test'], 600000);
    check('pipeline: tools/build.mjs --site builds the pages for the live artists', r.status === 0, (r.stdout + r.stderr).slice(-600));
    const has = f => fs.existsSync(path.join(tmp, f));
    check('pipeline: studio page, profile page and share image exist for the live artists',
      ['studio-zz-live.html', 'profile-zz-live.html', 'og/zz-live.png', 'studio-zz-hostile.html', 'profile-zz-hostile.html', 'og/zz-hostile.png', 'studio-zz-min.html', 'profile-zz-min.html', 'og/zz-min.png'].every(has), ['studio-zz-live.html', 'profile-zz-live.html', 'og/zz-live.png'].filter(f => !has(f)));
    const sitemap = has('sitemap.xml') ? fs.readFileSync(path.join(tmp, 'sitemap.xml'), 'utf8') : '';
    check('pipeline: the sitemap lists the live artist (absolute URLs)', /https:\/\/example\.test\/studio-zz-live\.html/.test(sitemap) && /https:\/\/example\.test\/profile-zz-live\.html/.test(sitemap), sitemap.slice(0, 200));
    const pages = ['studio-zz-hostile.html', 'profile-zz-hostile.html', 'studio-zz-live.html', 'profile-zz-live.html', 'index.html'].filter(has).map(f => [f, fs.readFileSync(path.join(tmp, f), 'utf8')]);
    const baseHandlers = handlers(fs.readFileSync(path.join(root, 'index.html'), 'utf8')), hand = Object.fromEntries(pages.map(([f, s]) => [f, handlers(s)]));
    check('pipeline: nothing an artist wrote becomes a <script> or an inline event handler in a saved page (the home page keeps exactly its own handlers)',
      pages.every(([, s]) => !BREAKOUT.test(s)) && ['studio-zz-hostile.html', 'profile-zz-hostile.html', 'studio-zz-live.html', 'profile-zz-live.html'].every(f => hand[f] === 0) && hand['index.html'] === baseHandlers, {hand, baseHandlers});
    const ldBad = [];
    for (const [f, s] of pages) for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { ldBad.push(f); } }
    check('pipeline: every JSON-LD block of the saved pages is valid JSON', ldBad.length === 0 && pages.some(([, s]) => /application\/ld\+json/.test(s)), ldBad);
    const idx = pages.find(x => x[0] === 'index.html');
    check('pipeline: the saved home page shows the live artist, the owner and the sample artists', !!idx && idx[1].includes('studio-zz-live.html') && idx[1].includes('studio-arne.html') && idx[1].includes('studio-napha.html'));

    /* the release check runs in the deploy build too: an e-mail an artist put in their public words must not stop everybody's deploy there (a warning), while the same text in a committed file is still a failure */
    const ci = sh(['tools/check-release.mjs'], 120000, {CI: 'true'}), local = sh(['tools/check-release.mjs'], 120000, {CI: ''});
    check('pipeline: the release check passes in the deploy build although an artist wrote an e-mail address in their words (a warning), and still fails on it outside CI',
      ci.status === 0 && /booking@lao-photo\.org/.test(ci.stdout) && local.status === 1 && /booking@lao-photo\.org/.test(local.stdout), {ci: ci.status, local: local.status, out: (ci.stdout + ci.stderr).slice(-300)});

    /* ---- C. in a browser ---- */
    const noise = l => /Turnstile|favicon|challenges\.cloudflare|HTTP 404 \S+\/legends\//.test(l);
    const server = await startServer(tmp, {});
    const errs = [];
    let home, xss = [];
    const b = await launch(); await b.lang('th'); await b.view(1280, 800, false);
    for (const p of ['index.html', 'highlights.html', 'donate.html', 'studio-zz-live.html', 'profile-zz-live.html', 'studio-zz-hostile.html', 'profile-zz-hostile.html', 'studio-zz-hostile.html?work=0', 'studio-zz-live.html?work=0', 'studio-zz-min.html', 'profile-zz-min.html', 'studio-arne.html']) {
      await b.go(`${server.url}/${p}`, p === 'index.html' ? 4500 : 3000);
      if (p === 'index.html') home = await b.ev("(()=>({buildings:document.querySelectorAll('#strip-in .bd').length,live:!!document.querySelector('a[href=\"studio-zz-live.html\"]'),overflowX:document.documentElement.scrollWidth>innerWidth,undef:[...document.querySelectorAll('.tile title')].filter(x=>/undefined/.test(x.textContent)).length}))()");
      if (await b.ev('window.__xss === 1') || await b.ev("document.querySelectorAll('[onerror]').length>0")) xss.push(p);
      errs.push(...b.logs.filter(l => !noise(l)).map(l => p + ': ' + l.slice(0, 140)));
      b.logs.length = 0;
    }
    check('browser: no page throws (home, highlights, donate, studio and profile of the live and the hostile artist, work windows)', errs.length === 0, errs.slice(0, 4));
    check('browser: nothing an artist wrote ran or became markup (window.__xss, [onerror])', xss.length === 0, xss);
    check('browser: the home page has the owner, the 5 live artists and the 10 sample buildings, a link to the live artist, nothing sideways, no "undefined" tooltip on a building with fewer than 3 works', home.buildings === 16 && home.live && !home.overflowX && home.undef === 0, home);
    const bare = [];
    for (const p of ['studio-zz-min.html', 'profile-zz-min.html', 'studio-zz-min.html?work=0']) { await b.go(`${server.url}/${p}`, 3000); const x = await b.ev("document.body.innerText"); if (/\bundefined\b|\bNaN\b|\[object /.test(x)) bare.push(p); }
    check('browser: an artist with only a name, discipline, city and one work has clean pages (no "undefined", "NaN" or "[object")', bare.length === 0, bare);
    const txt = await (async () => { await b.go(`${server.url}/studio-zz-hostile.html?work=0`, 3500); return b.ev("document.body.innerText"); })();
    check('browser: the hostile words are shown as plain text (not swallowed, not run)', /onerror/.test(txt), txt.slice(0, 200));

    /* the donation dialog of a live artist with bank details: the real 3-step flow */
    await b.go(`${server.url}/studio-zz-live.html?work=0`, 4500);
    await b.ev("document.getElementById('dlg-sup').click()"); await sleep(1200);   // the 3-step poster window (donate-flow.js), loaded on demand
    await b.ev("document.querySelector('dialog.df .df-brick[data-v=\"5\"]').click(); document.querySelector('dialog.df [data-go2]').click()"); await sleep(600);
    const don = await b.ev("(()=>{const d=document.querySelector('dialog.df');return {sample:!!d.querySelector('.df-sample')||/SAMPLE|ตัวอย่าง \\(SAMPLE\\)/.test(d.innerText),acc:/LIVE TESTER/.test(d.innerText)&&/111 222 333/.test(d.innerText),qr:!!d.querySelector('img[src*=qr], .sup-qr, .sm-qr'),paid:!!d.querySelector('[data-go3]:not([disabled])')}})()");
    check('browser: a live artist with an account number but no QR picture: the account is shown, no demo banner and no made-up QR (3 steps)', !don.sample && don.acc && !don.qr && don.paid, don);
    await b.ev("document.querySelector('dialog.df [data-go3]').click()"); await sleep(900);
    const done = await b.ev("(()=>{const d=document.querySelector('dialog.df');return {form:!!d.querySelector('form'),sample:/SAMPLE|สาธิต|จำลอง|demo/i.test(d.innerText),poster:!!d.querySelector('.df-poster')}})()");
    check('browser: "I have donated" of a live artist goes to the plain thank-you, never to the pretend form', !done.form && !done.sample && done.poster, done);
    b.close();

    /* a phone: long names and titles must not push the page sideways */
    const ph = await launch(); await ph.lang('th'); await ph.view(390, 844, true);
    const wide = [];
    for (const p of ['index.html', 'studio-zz-long.html', 'profile-zz-long.html', 'studio-zz-long.html?work=0', 'studio-zz-long.html?work=1', 'profile-zz-live.html', 'studio-zz-min.html']) {
      await ph.go(`${server.url}/${p}`, p === 'index.html' ? 4500 : 3200);
      const w = await ph.ev("({sw:document.documentElement.scrollWidth,iw:innerWidth,bw:document.body.scrollWidth})");
      if (w.sw > w.iw + 1) wide.push(`${p}: ${w.sw}px in a ${w.iw}px window`);
    }
    check('phone (390px): a long name, title and bio push nothing sideways (home, studio, work windows, profile)', wide.length === 0, wide);
    ph.close();

    /* hideDemo: the sample artists go, the owner and the live artists stay (and an empty city is never produced) */
    const hidden = apply(src, {...live, hideDemo: true}), s2 = await startServer(tmp, {'/artists.js': () => ({type: 'text/javascript; charset=utf-8', body: hidden})});
    const b2 = await launch(); await b2.lang('th'); await b2.view(1280, 800, false);
    await b2.go(`${s2.url}/index.html`, 4500);
    const h2 = await b2.ev("document.querySelectorAll('#strip-in .bd').length");
    check('browser: with hideDemo only the owner and the 5 live artists are in the city', h2 === 6, h2);
    b2.close(); s2.close(); server.close();
  } finally { if (process.env.KEEP) console.log('kept the scratch copy:', tmp); else fs.rmSync(tmp, {recursive: true, force: true}); }   // KEEP=1 node tests-legacy/run.mjs live → look at the built pages
}
