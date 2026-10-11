#!/usr/bin/env node
// tools/compare.mjs — before / after check of the whole site, so a change can be judged on numbers and pictures.
//
//   node tools/compare.mjs snap before            every page, 375px touch + 1280px, Thai + English: screenshots + checks + Lighthouse
//   node tools/compare.mjs snap after --no-lh     the same without Lighthouse (faster)
//   node tools/compare.mjs snap x --pages index.html,buy-napha-0.html
//   node tools/compare.mjs diff before after      writes compare/report.html (side by side) and prints the totals
//
// Results go to compare/<name>/ (not in git). Uses tools/browser.mjs (no npm packages); Lighthouse runs through npx.
// Pages are opened with ?live, so they show what a visitor of the real site sees (no yellow [__] draft marks).
import fs from 'node:fs';
import path from 'node:path';
import {execSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {startServer, launch, findChrome, sleep} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'compare');
const [cmd, A, B] = process.argv.slice(2);
const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const KEY = ['index.html', 'studio-napha.html', 'profile-napha.html', 'buy-napha-0.html'];   // full-page shots + Lighthouse
const VIEWS = [{v: 'mob', w: 375, h: 740, touch: true}, {v: 'desk', w: 1280, h: 800, touch: false}];
const LH = '13.5.0';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/* ---- static checks on the HTML files themselves (what crawlers and link previews read) ---- */
function fileCheck(f) {
  const head = (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/<head>([\s\S]*?)<\/head>/) || ['', ''])[1];
  const metas = [...head.matchAll(/<meta\s[^>]*>/g)].map(m => m[0]);
  const issues = [];
  const count = re => metas.filter(m => re.test(m)).length;
  for (const [n, re] of [['description', /name="description"/], ['og:title', /property="og:title"/], ['og:description', /property="og:description"/], ['og:image', /property="og:image"/]]) {
    const c = count(re); if (c > 1) issues.push(`${n} ×${c}`); if (!c && f !== '404.html') issues.push(`no ${n}`);
  }
  if (/content="[^"]*</.test(head)) issues.push('"<" inside a content attribute');
  if (!/<title>[^<]+<\/title>/.test(head)) issues.push('no <title>');
  return {issues, canonical: /rel="canonical"/.test(head), noindex: /name="robots" content="noindex"/.test(head)};
}

/* ---- in-page checks, run after scrolling through the page so the reveal-on-scroll parts are shown ---- */
const PAGE_CHECK = `(async () => {
  const de = document.documentElement, wait = ms => new Promise(r => setTimeout(r, ms));
  for (let y = 0; y < de.scrollHeight; y += innerHeight * .8) { scrollTo(0, y); await wait(70); }
  scrollTo(0, 0); await wait(700);
  const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && !/^(https?:|mailto:|tel:|#|javascript:|data:)/.test(h)).map(h => h.split(/[?#]/)[0]).filter(Boolean);
  return {
    lang: de.lang, title: document.title, height: de.scrollHeight,
    overflow: Math.max(0, de.scrollWidth - de.clientWidth),
    brokenImgs: [...document.images].filter(i => i.complete && i.src && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    noAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
    todo: (document.body.innerText.match(/\\[__\\]/g) || []).length,
    links: [...new Set(links)],
  };
})()`;

async function snap(name) {
  const dir = path.join(OUT, name), shots = path.join(dir, 'shots');
  fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(shots, {recursive: true});
  const only = arg('--pages');
  const pages = only ? only.split(',') : fs.readdirSync(ROOT).filter(n => n.endsWith('.html')).sort();
  const data = {name, date: new Date().toISOString(), commit: execSync('git rev-parse --short HEAD', {cwd: ROOT}).toString().trim(), files: {}, pages: {}, lighthouse: {}};
  for (const f of pages) data.files[f] = fileCheck(f);
  const server = await startServer(ROOT);
  try {
    for (const lang of ['th', 'en']) {
      const b = await launch();
      try {
        await b.lang(lang);
        for (const {v, w, h, touch} of VIEWS) {
          await b.view(w, h, touch);
          for (const f of pages) {
            b.logs.length = 0;
            await b.go(`${server.url}/${f}?live`, f === 'index.html' ? 3500 : 2000);
            const r = await b.ev(PAGE_CHECK);
            const res = typeof r === 'object' && r ? r : {evalError: String(r)};
            res.missingLinks = (res.links || []).filter(l => !fs.existsSync(path.join(ROOT, l)));
            delete res.links;
            res.errors = b.logs.filter(l => !/NETFAIL https:\/\//.test(l));       // a blocked outside script (e.g. the CAPTCHA) is not the page's fault
            res.external = b.logs.filter(l => /NETFAIL https:\/\//.test(l));
            const base = `${lang}-${v}-${f.replace(/\.html$/, '')}`;
            await jpeg(b, path.join(shots, base + '.jpg'));
            if (KEY.includes(f) && lang === 'th') await jpeg(b, path.join(shots, base + '-full.jpg'), w, res.height);
            data.pages[`${lang} ${v} ${f}`] = res;
            process.stdout.write('.');
          }
        }
      } finally { b.close(); }
    }
    console.log();
    if (!process.argv.includes('--no-lh')) for (const f of KEY.filter(k => pages.includes(k))) for (const form of ['mobile', 'desktop']) {
      data.lighthouse[`${f} ${form}`] = lighthouse(`${server.url}/${f}?live`, form, path.join(dir, `lh-${form}-${f.replace(/\.html$/, '')}.json`));
      console.log(`  lighthouse ${f} ${form}:`, JSON.stringify(data.lighthouse[`${f} ${form}`]));
    }
  } finally { server.close(); }
  fs.writeFileSync(path.join(dir, 'data.json'), JSON.stringify(data, null, 1));
  const t = totals(data);
  console.log(`snap "${name}" (${data.commit}): ${pages.length} pages ×${Object.keys(data.pages).length / pages.length} views →`, JSON.stringify(t));
}

async function jpeg(b, file, w, fullH) {
  const p = fullH ? {format: 'jpeg', quality: 60, captureBeyondViewport: true, clip: {x: 0, y: 0, width: w, height: Math.min(fullH, 16000), scale: 1}} : {format: 'jpeg', quality: 60};
  const r = await b.send('Page.captureScreenshot', p);
  if (r && r.data) fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  if (fullH) { await b.ev('scrollTo(0,0)'); await sleep(200); }
}

function lighthouse(url, form, file) {
  const flags = ['-y', `lighthouse@${LH}`, url, '--output=json', `--output-path=${file}`, '--quiet', '--only-categories=performance,accessibility,best-practices,seo',
    `--chrome-flags=--headless=new${process.env.CI || process.getuid?.() === 0 ? ' --no-sandbox' : ''}`];
  if (form === 'desktop') flags.push('--preset=desktop');
  const r = spawnSync('npx', flags, {env: {...process.env, CHROME_PATH: findChrome()}, encoding: 'utf8', timeout: 180000});
  if (r.status !== 0 || !fs.existsSync(file)) return {error: (r.stderr || r.error?.message || 'lighthouse failed').trim().split('\n').pop().slice(0, 200)};
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = Object.fromEntries(Object.entries(j.categories).map(([k, c]) => [k, Math.round(c.score * 100)]));
  out.lcp = Math.round(j.audits['largest-contentful-paint']?.numericValue || 0);
  out.cls = +(j.audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3);
  return out;
}

function totals(d) {
  const P = Object.values(d.pages), F = Object.values(d.files);
  const sum = fn => P.reduce((n, p) => n + fn(p), 0);
  return {
    jsErrors: sum(p => (p.errors || []).length + (p.evalError ? 1 : 0)),
    brokenImages: sum(p => (p.brokenImgs || []).length),
    missingLinks: sum(p => (p.missingLinks || []).length),
    overflowingViews: P.filter(p => p.overflow > 1).length,
    imgsWithoutAlt: sum(p => p.noAlt || 0),
    visibleTodo: sum(p => p.todo || 0),
    metaIssues: F.reduce((n, f) => n + f.issues.length, 0),
    canonical: F.filter(f => f.canonical).length,
  };
}

function diff(a, b) {
  const load = n => JSON.parse(fs.readFileSync(path.join(OUT, n, 'data.json'), 'utf8'));
  const da = load(a), db = load(b), ta = totals(da), tb = totals(db);
  const LABEL = {jsErrors: 'JavaScript errors', brokenImages: 'Broken images', missingLinks: 'Links to missing pages', overflowingViews: 'Views wider than the screen', imgsWithoutAlt: 'Images without alt text', visibleTodo: 'Visible [__] marks', metaIssues: 'Broken / missing meta tags', canonical: 'Pages with a canonical URL'};
  const better = (k, x, y) => k === 'canonical' ? y >= x : y <= x;
  const row = (l, x, y, ok) => `<tr class="${x === y ? '' : ok ? 'up' : 'down'}"><td>${esc(l)}</td><td>${esc(x)}</td><td>${esc(y)}</td></tr>`;
  let html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>circles — ${esc(a)} vs ${esc(b)}</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0 auto;max-width:1400px;padding:16px;background:#F4F1E8;color:#0E0D0C}table{border-collapse:collapse;margin:8px 0 24px}td,th{border:1px solid #0E0D0C33;padding:4px 10px;text-align:left}
tr.up td:last-child{background:#cfe9c9}tr.down td:last-child{background:#f6c4c4}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0 28px}.pair img{width:100%;border:1px solid #0E0D0C}h3{margin:20px 0 4px}code{background:#0001;padding:0 4px}</style>
<h1>${esc(a)} <small>(${esc(da.commit)})</small> → ${esc(b)} <small>(${esc(db.commit)})</small></h1><h2>Totals (all pages, 375 + 1280 px, TH + EN)</h2><table><tr><th></th><th>${esc(a)}</th><th>${esc(b)}</th></tr>`;
  for (const k of Object.keys(LABEL)) html += row(LABEL[k], ta[k], tb[k], better(k, ta[k], tb[k]));
  html += '</table><h2>Lighthouse</h2><table><tr><th>page</th><th>score</th><th>' + esc(a) + '</th><th>' + esc(b) + '</th></tr>';
  for (const key of new Set([...Object.keys(da.lighthouse), ...Object.keys(db.lighthouse)])) for (const s of ['performance', 'accessibility', 'best-practices', 'seo', 'lcp', 'cls']) {
    const x = da.lighthouse[key]?.[s] ?? '–', y = db.lighthouse[key]?.[s] ?? '–';
    const ok = typeof x !== 'number' || typeof y !== 'number' ? true : (s === 'lcp' || s === 'cls') ? y <= x : y >= x;
    html += `<tr class="${x === y ? '' : ok ? 'up' : 'down'}"><td>${esc(key)}</td><td>${s}</td><td>${esc(x)}</td><td>${esc(y)}</td></tr>`;
  }
  html += '</table><h2>Pages that changed</h2><table><tr><th>view</th><th>' + esc(a) + '</th><th>' + esc(b) + '</th></tr>';
  const brief = p => !p ? 'not checked' : [p.errors?.length && `${p.errors.length} errors`, p.overflow > 1 && `${p.overflow}px too wide`, p.brokenImgs?.length && `${p.brokenImgs.length} broken img`, p.missingLinks?.length && `links: ${p.missingLinks.join(', ')}`, p.todo && `${p.todo}× [__]`].filter(Boolean).join(' · ') || 'ok';
  let n = 0;
  for (const k of new Set([...Object.keys(da.pages), ...Object.keys(db.pages)])) { const x = brief(da.pages[k]), y = brief(db.pages[k]); if (x !== y) { n++; html += `<tr><td>${esc(k)}</td><td>${esc(x)}</td><td>${esc(y)}</td></tr>`; } }
  for (const f of new Set([...Object.keys(da.files), ...Object.keys(db.files)])) { const x = da.files[f]?.issues.join(', ') || 'ok', y = db.files[f]?.issues.join(', ') || 'ok'; if (x !== y) { n++; html += `<tr><td>${esc(f)} &lt;head&gt;</td><td>${esc(x)}</td><td>${esc(y)}</td></tr>`; } }
  html += (n ? '' : '<tr><td colspan="3">no differences</td></tr>') + '</table><h2>Screenshots</h2>';
  for (const f of KEY) for (const v of ['mob', 'desk']) for (const suf of ['', '-full']) {
    const s = `th-${v}-${f.replace(/\.html$/, '')}${suf}.jpg`;
    if (fs.existsSync(path.join(OUT, a, 'shots', s)) || fs.existsSync(path.join(OUT, b, 'shots', s))) html += `<h3>${esc(f)} · ${v}${suf ? ' · whole page' : ''}</h3><div class="pair"><img loading="lazy" src="${esc(a)}/shots/${s}" alt="${esc(a)}"><img loading="lazy" src="${esc(b)}/shots/${s}" alt="${esc(b)}"></div>`;
  }
  html += `<p>Every other page: <code>compare/${esc(a)}/shots/</code> and <code>compare/${esc(b)}/shots/</code> (same file names).</p>`;
  fs.writeFileSync(path.join(OUT, 'report.html'), html);
  console.log('totals', a, JSON.stringify(ta)); console.log('totals', b, JSON.stringify(tb));
  for (const [k, v] of Object.entries(db.lighthouse)) console.log('lighthouse', k, JSON.stringify(da.lighthouse[k] || {}), '→', JSON.stringify(v));
  console.log(`${n} pages changed. Wrote compare/report.html`);
}

if (cmd === 'snap' && A) await snap(A);
else if (cmd === 'diff' && A && B) diff(A, B);
else { console.log('usage: node tools/compare.mjs snap <name> [--no-lh] [--pages a.html,b.html]\n       node tools/compare.mjs diff <a> <b>'); process.exit(1); }
