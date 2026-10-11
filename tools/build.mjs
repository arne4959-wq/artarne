#!/usr/bin/env node
// tools/build.mjs — pre-renders the pages that crawlers, link previews and no-JavaScript visitors need.
//
//   node tools/build.mjs                       static twins with relative URLs (fine for local use)
//   node tools/build.mjs --site https://you.example   also absolute og:image / canonical URLs + sitemap.xml
//
// It opens the REAL pages in headless Chrome (so there is no second copy of the rendering logic), then writes:
//   studio-<id>.html   one static page per artist (full content, meta tags, JSON-LD). Built from cutaway.html.
//   profile-<id>.html  the artist's profile page (own title / description / og, JSON-LD Person). Built from profile.html (tools/apply-profile-page.py).
//   og/<id>.png        1200x630 share image per artist
//   index.html         the block between <!--pre:…--> markers (artwork cards, filters, map, studio links)
//   buy-<id>-<k>.html  the buy page of one work (k = its position in artists.js, from 0). Built from buy.html (tools/apply-buy-page.py).
//   sitemap.xml        only with --site (studio, profile and buy pages)
// Run it again after you change artists.js or any text. Needs Node 22+ and Chrome/Chromium.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const SITE = (arg('--site') || '').replace(/\/+$/, '');
const abs = p => SITE ? `${SITE}/${p}` : p;
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), {recursive: true}); fs.writeFileSync(path.join(ROOT, f), s); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const { ARTISTS, DISC_EN, CITY_EN } = new Function(read('artists.js') + '\n;return {ARTISTS, DISC_EN, CITY_EN};')();

/* ---- artists.js sanity check: the same shape rules circles.js enforces in the browser, but here a mistake stops the build with a plain message ---- */
{
  const bad = [], ids = new Set(), RE = {id: /^[a-z0-9][a-z0-9-]*$/, color: /^#[0-9a-f]{3,8}$/i, ar: /^\d{1,3}\/\d{1,3}$/};
  for (const a of ARTISTS) {
    if (!RE.id.test(String(a.id))) bad.push(`artist id "${a.id}": only a-z, 0-9 and - are allowed`);
    if (ids.has(a.id)) bad.push(`artist id "${a.id}" appears twice`); ids.add(a.id);
    (a.works || []).forEach((c, k) => { if (!RE.color.test(c)) bad.push(`${a.id}: works[${k}] "${c}" is not a #hex colour`); });
    if (!Number.isFinite(Number(a.scale))) bad.push(`${a.id}: scale must be a number`);
    (a.pieces || []).forEach((p, k) => {
      const at = `${a.id}[${k}]`;
      if (!Number.isFinite(Number(p.y))) bad.push(`${at}: y (year) must be a number`);
      if (!Number.isFinite(Number(p.p)) || Number(p.p) < 0) bad.push(`${at}: p (price in USD) must be a number`);
      if (!RE.ar.test(String(p.ar))) bad.push(`${at}: ar must look like 4/3`);
      if (p.img && !fs.existsSync(path.join(ROOT, p.img))) bad.push(`${at}: picture file "${p.img}" does not exist`);
      if (p.status && !['sold', 'reserved'].includes(p.status)) bad.push(`${at}: status must be 'sold' or 'reserved'`);
      if (p.pay && !/^https:\/\/\S+$/.test(p.pay)) bad.push(`${at}: pay must start with https://`);
    });
  }
  if (bad.length) { console.error('artists.js has problems:\n - ' + bad.join('\n - ')); process.exit(1); }
}

/* ---- share-image card (served by the build's own server so fonts and art load from the project) ---- */
const ogCard = id => {
  const a = ARTISTS.find(x => x.id === id), p = a.pieces[0], RS = [['#0E0D0C', '#F4F1E8', 'Anton'], ['#FF2E88', '#0E0D0C', 'Anton'], ['#F4F1E8', '#0E0D0C', '"Special Elite"'], ['#E8B730', '#0E0D0C', 'Chonburi']];
  const letters = [...a.name].map((c, i) => `<span style="background:${RS[i % 4][0]};color:${RS[i % 4][1]};font-family:${RS[i % 4][2]};transform:rotate(${[-3, 2, -2, 3, -1][i % 5]}deg) translateY(${[0, -5, 4, -3, 2][i % 5]}px)">${esc(c)}</span>`).join('');
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/fonts/fonts.css"><style>
*{box-sizing:border-box;margin:0;padding:0}body{width:1200px;height:630px;overflow:hidden;position:relative;background:#E8E4D8;font-family:"Special Elite",monospace;color:#0E0D0C}
.ring{position:absolute;left:-150px;top:-220px;width:620px;height:620px;border:16px solid #0E0D0C;border-radius:50%}
.dot{position:absolute;left:350px;top:40px;width:96px;height:96px;border-radius:50%;background:#FF2E88;border:3px solid #0E0D0C}
.art{position:absolute;left:70px;top:90px;width:${p.ar.split('/').map(Number)[0] / p.ar.split('/').map(Number)[1] >= 1 ? 440 : 330}px;aspect-ratio:${p.ar};max-height:420px;border:12px solid #F4F1E8;outline:4px solid #0E0D0C;box-shadow:14px 14px 0 #FF2E88;background:#8F8C85;overflow:hidden}
.art img{width:100%;height:100%;object-fit:cover;display:block}
.tape{position:absolute;left:230px;top:68px;width:100px;height:30px;background:#FF2E88;border:3px solid #0E0D0C;transform:rotate(-4deg)}
.k{position:absolute;left:600px;top:70px;background:#0E0D0C;color:#E8B730;font:italic 500 26px "Playfair Display",serif;padding:6px 18px}
.rn{position:absolute;left:596px;top:140px;display:flex;flex-wrap:wrap;width:560px}
.rn span{display:inline-block;font-size:${a.name.length > 5 ? 96 : 130}px;line-height:1;padding:6px 14px 2px;margin:0 3px 6px 0;border:3px solid #0E0D0C;box-shadow:3px 4px 0 rgba(14,13,12,.25)}
.l{position:absolute;left:600px;font:400 34px/1.3 "Chonburi",serif;padding:2px 16px}
.s{position:absolute;left:600px;top:480px;font-size:22px;letter-spacing:.06em}
.tp{position:absolute;left:-20px;right:-20px;bottom:30px;height:28px;background:repeating-linear-gradient(135deg,#0E0D0C 0 16px,#E8B730 16px 32px);transform:rotate(-1deg)}
</style><div class="ring"></div><div class="dot"></div><div class="art"><img src="/${p.img}"></div><div class="tape"></div>
<div class="k">CIRCLES · NO.${String(ARTISTS.indexOf(a) + 1).padStart(2, '0')}</div><div class="rn">${letters}</div>
<div class="l" style="top:330px;background:#0E0D0C;color:#F4F1E8">${esc(a.disc)}</div>
<div class="l" style="top:388px;background:#FF2E88">${esc(DISC_EN[a.disc] || '')} · ${esc(CITY_EN[a.city] || a.city)}</div>
<div class="s">${esc(a.pieces.length)} works · from $${Math.min(...a.pieces.map(x => x.p)).toLocaleString('en-US')}</div><div class="tp"></div>`;
};

const server = await startServer(ROOT, Object.fromEntries(ARTISTS.map(a => [`/__og/${a.id}`, () => ogCard(a.id)])));
const b = await launch();
try {
  await b.lang('th');
  await b.view(1280, 900);
  const template = read('cutaway.html');

  /* ---- 1. one static page per artist ---- */
  for (const a of ARTISTS) {
    await b.go(`${server.url}/cutaway.html?id=${a.id}&live`, 3000);
    await b.ev("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));0");
    const got = await b.ev("({main: document.getElementById('main').innerHTML, title: document.title, desc: document.querySelector('meta[name=description]').content})");
    if (!got.main || !/class="(floor|mus)[ "]/.test(got.main)) throw new Error(`render of ${a.id} produced no floors`);
    const noAlt = (got.main.match(/<img\b[^>]*>/g) || []).filter(x => !/\salt=/.test(x));
    if (noAlt.length) throw new Error(`studio ${a.id} has ${noAlt.length} <img> without alt`);
    const url = `studio-${a.id}.html`, ogImg = abs(`og/${a.id}.png`);
    const ld = {'@context': 'https://schema.org', '@type': 'ItemList', name: got.title, itemListElement: a.pieces.map((p, i) => ({'@type': 'ListItem', position: i + 1, item: {
      '@type': 'VisualArtwork', name: p.t, alternateName: p.tEn, creator: {'@type': 'Person', name: a.name, alternateName: a.nameEn, homeLocation: {'@type': 'Place', name: a.city}},
      dateCreated: String(p.y), artMedium: p.mEn, image: abs(p.img), offers: {'@type': 'Offer', price: p.p, priceCurrency: 'USD', availability: 'https://schema.org/InStock'}}}))};
    let html = template
      .replace(/<main id="main">[\s\S]*?<\/main>/, () => `<main id="main" data-pre="1" data-studio="${a.id}">${got.main}</main>`)
      .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(got.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.title) + post)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.title) + post)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
      .replace(/(<meta property="og:image" content=")[^"]*(")/, (m, pre, post) => pre + ogImg + post)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, (m, pre, post) => pre + ogImg + post)
      .replace('</head>', () => `${SITE ? `<link rel="canonical" href="${abs(url)}">\n<meta property="og:url" content="${abs(url)}">\n` : ''}<script type="application/ld+json">${JSON.stringify(ld)}</script>\n</head>`);
    write(url, html);
    console.log('  wrote', url);
  }

  /* ---- 1b. one static profile page per artist (profile-<id>.html, from profile.html) ---- */
  const ptemplate = read('profile.html');
  for (const a of ARTISTS) {
    await b.go(`${server.url}/profile.html?id=${a.id}&live`, 2500);
    const got = await b.ev("({main: document.getElementById('main').innerHTML, title: document.title, desc: document.querySelector('meta[name=description]').content})");
    if (!got.main || !/class="pf[ "]/.test(got.main) || !got.main.includes('class="pf-name"')) throw new Error(`render of profile ${a.id} produced no profile`);
    if (got.title === read('cutaway.html').match(/<title>([\s\S]*?)<\/title>/)[1]) throw new Error(`profile ${a.id} kept the generic title`);
    const noAlt = (got.main.match(/<img\b[^>]*>/g) || []).filter(x => !/\salt=/.test(x));
    if (noAlt.length) throw new Error(`profile ${a.id} has ${noAlt.length} <img> without alt`);
    const url = `profile-${a.id}.html`, ogImg = abs(`og/${a.id}.png`);
    const person = {'@context': 'https://schema.org', '@type': 'Person', name: a.name, alternateName: a.nameEn, jobTitle: `${DISC_EN[a.disc] || a.disc} artist`, description: a.bioEn || a.bio,
      homeLocation: {'@type': 'Place', name: CITY_EN[a.city] || a.city}, image: ogImg, url: abs(url), ...(a.instagram && /^https:\/\//.test(a.instagram) ? {sameAs: [a.instagram]} : {}),
      subjectOf: {'@type': 'WebPage', url: abs(`studio-${a.id}.html`)}};
    let html = ptemplate
      .replace(/<main id="main">[\s\S]*?<\/main>/, () => `<main id="main" data-pre="1" data-profile="${a.id}">${got.main}</main>`)
      .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(got.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.title) + post)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.title) + post)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
      .replace(/(<meta property="og:image" content=")[^"]*(")/, (m, pre, post) => pre + ogImg + post)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, (m, pre, post) => pre + ogImg + post)
      .replace('</head>', () => `${SITE ? `<link rel="canonical" href="${abs(url)}">\n<meta property="og:url" content="${abs(url)}">\n` : ''}<script type="application/ld+json">${JSON.stringify(person)}</script>\n</head>`);
    write(url, html);
    console.log('  wrote', url);
  }

  /* ---- 1c. one static buy page per work (buy-<id>-<k>.html, k = position in artists.js from 0, from buy.html) ---- */
  const btemplate = read('buy.html');
  const AVAIL = {sold: 'https://schema.org/SoldOut', reserved: 'https://schema.org/LimitedAvailability'};
  for (const a of ARTISTS) {
    for (let k = 0; k < a.pieces.length; k++) {
      const p = a.pieces[k];
      await b.go(`${server.url}/buy.html?id=${a.id}&k=${k}&live`, 1800);
      const got = await b.ev("({main: document.getElementById('main').innerHTML, title: document.title, desc: document.querySelector('meta[name=description]').content})");
      got.main = got.main.replace(/<div class="cf-holder">[\s\S]*?<\/div><\/div>(?=<div class="act">)/, '');   // the CAPTCHA widget is mounted again when the page runs, never bake its leftovers
      if (!got.main || !got.main.includes('class="by-title"') || !got.main.includes('class="by-form"')) throw new Error(`render of buy page ${a.id}-${k} produced no buy page`);
      if (/^ซื้อผลงาน — circles$/.test(got.title)) throw new Error(`buy page ${a.id}-${k} kept the generic title`);
      const noAlt = (got.main.match(/<img\b[^>]*>/g) || []).filter(x => !/\salt=/.test(x));
      if (noAlt.length) throw new Error(`buy page ${a.id}-${k} has ${noAlt.length} <img> without alt`);
      const url = `buy-${a.id}-${k}.html`, ogImg = abs(`og/${a.id}.png`);
      const ld = {'@context': 'https://schema.org', '@type': 'VisualArtwork', name: p.t, alternateName: p.tEn, creator: {'@type': 'Person', name: a.name, alternateName: a.nameEn, url: abs(`profile-${a.id}.html`)},
        dateCreated: String(p.y), artMedium: p.mEn, image: abs(p.img), url: abs(url),
        offers: {'@type': 'Offer', price: p.p, priceCurrency: 'USD', availability: AVAIL[p.status] || 'https://schema.org/InStock', url: abs(url)}};
      let html = btemplate
        .replace(/<main id="main">[\s\S]*?<\/main>/, () => `<main id="main" data-pre="1" data-buy-id="${a.id}" data-buy-k="${k}">${got.main}</main>`)
        .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(got.title)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.title) + post)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.title) + post)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, (m, pre, post) => pre + esc(got.desc) + post)
        .replace(/(<meta property="og:image" content=")[^"]*(")/, (m, pre, post) => pre + ogImg + post)
        .replace(/(<meta name="twitter:image" content=")[^"]*(")/, (m, pre, post) => pre + ogImg + post)
        .replace('</head>', () => `${SITE ? `<link rel="canonical" href="${abs(url)}">\n<meta property="og:url" content="${abs(url)}">\n` : ''}<script type="application/ld+json">${JSON.stringify(ld)}</script>\n</head>`);
      write(url, html);
      console.log('  wrote', url);
    }
  }

  /* ---- 2. share image per artist ---- */
  await b.view(1200, 630);
  fs.mkdirSync(path.join(ROOT, 'og'), {recursive: true});
  for (const a of ARTISTS) {
    await b.go(`${server.url}/__og/${a.id}`, 1800);
    await b.ev('document.fonts.ready.then(()=>1)'); await sleep(700);
    await b.shot(path.join(ROOT, 'og', `${a.id}.png`), {x: 0, y: 0, width: 1200, height: 630});
    console.log('  wrote og/' + a.id + '.png');
  }

  /* ---- 3. home page: static twins of the JS-built blocks (cards, filters, map) + studio links ---- */
  await b.view(1280, 900);
  await b.go(`${server.url}/index.html?live`, 4000);
  const frag = await b.ev(`({masonry: document.getElementById('masonry').innerHTML, filters: document.getElementById('filters').innerHTML, map: document.getElementById('map-grid').innerHTML})`);
  const clean = h => h.replace(/class="mi (?:pop|reveal)[^"]*"/g, 'class="mi reveal in"');      // the static cards must be visible without JS
  const list = `<noscript><div class="ns"><p>circles — เมืองของศิลปิน · A city of artists. Pick a building:</p><ul>${ARTISTS.map(a => `<li><a href="studio-${a.id}.html">${esc(a.name)} / ${esc(a.nameEn)} — ${esc(a.disc)} · ${esc(DISC_EN[a.disc] || '')} · ${esc(a.city)}</a></li>`).join('')}</ul></div></noscript>`;
  let idx = read('index.html');
  const fill = (name, content) => { const re = new RegExp(`<!--pre:${name}-->[\\s\\S]*?<!--/pre:${name}-->`); if (!re.test(idx)) throw new Error('marker missing: ' + name); idx = idx.replace(re, () => `<!--pre:${name}-->${content}<!--/pre:${name}-->`); };
  fill('masonry', clean(frag.masonry)); fill('filters', clean(frag.filters)); fill('map', clean(frag.map)); fill('strip', list);
  idx = idx.replace(/<link rel="canonical"[^>]*>\n|<meta property="og:url"[^>]*>\n/g, '');      // index.html is its own source: drop what an earlier --site build added
  if (SITE) idx = idx.replace(/(<meta property="og:image" content=")[^"]*(")/, (m, pre, post) => pre + abs('og.png') + post).replace(/(<meta name="twitter:image" content=")[^"]*(")/, (m, pre, post) => pre + abs('og.png') + post)
    .replace(/(<meta property="og:type"[^>]*>\n)/, (m, tag) => `<link rel="canonical" href="${abs('')}">\n<meta property="og:url" content="${abs('')}">\n${tag}`);
  write('index.html', idx);
  console.log('  updated index.html (pre-rendered blocks)');

  /* ---- 4. sitemap ---- */
  if (SITE) {
    const urls = ['index.html', ...ARTISTS.map(a => `studio-${a.id}.html`), ...ARTISTS.map(a => `profile-${a.id}.html`), ...ARTISTS.flatMap(a => a.pieces.map((_, k) => `buy-${a.id}-${k}.html`)), 'join.html', 'privacy.html', 'terms.html'];
    write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${abs(u === 'index.html' ? '' : u)}</loc></url>`).join('\n')}\n</urlset>\n`);
    const robots = read('robots.txt').replace(/^#? ?Sitemap:.*$/m, '').trimEnd();
    write('robots.txt', `${robots}\nSitemap: ${abs('sitemap.xml')}\n`);
    console.log('  wrote sitemap.xml + robots.txt');
  } else console.log('  (no --site given: sitemap.xml skipped, URLs stay relative)');
  const bad = b.logs.filter(l => !/favicon|\[Cloudflare Turnstile\]/.test(l));   // the buy pages mount the form's Turnstile widget; it refuses the build server's host (error 110200), which says nothing about the pages
  if (bad.length) { console.error('Page errors during build:\n' + bad.join('\n')); process.exitCode = 1; }
} finally { b.close(); server.close(); }
console.log('build done');
