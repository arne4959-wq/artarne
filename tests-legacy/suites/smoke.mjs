// Every page × both languages × desktop and phone: no errors, no horizontal overflow, accessible names, no leftover Thai in EN, images load.
import {launch} from '../../tools/browser.mjs';
export const name = 'smoke';
const IDS = ['napha', 'thara', 'kwan', 'phum', 'irene', 'dao'];
const PAGES = ['index.html', ...IDS.map(i => `studio-${i}.html`), 'cutaway.html?id=thara', 'cutaway.html?id=zzz', 'privacy.html', 'terms.html', 'join.html', '404.html'];
const A11Y = `(()=>{const r=[];
 document.querySelectorAll('a:not([href]):not([hidden])').forEach(e=>r.push('a without href: '+e.textContent.trim().slice(0,24)));
 document.querySelectorAll('img:not([alt])').forEach(e=>r.push('img without alt: '+e.src.split('/').pop()));
 const ids={};document.querySelectorAll('[id]').forEach(e=>ids[e.id]=(ids[e.id]||0)+1);Object.entries(ids).filter(e=>e[1]>1).forEach(e=>r.push('duplicate id: '+e[0]));
 document.querySelectorAll('button,[role=button],a[href]').forEach(e=>{const n=(e.getAttribute('aria-label')||e.textContent||'').trim();if(!n&&!e.querySelector('img[alt]'))r.push('no accessible name: '+(e.id||e.className||e.tagName));});
 document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(e=>{if(!e.labels?.length&&!e.getAttribute('aria-label')&&!e.closest('label'))r.push('input without label: '+(e.name||e.id));});
 if(!document.querySelector('h1,[role=heading][aria-level="1"]'))r.push('no <h1>');
 return r;})()`;
const THAI_LEFT = `[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&/[\\u0E00-\\u0E7F]/.test(e.textContent)&&e.getClientRects().length>0&&!e.closest('script,style,.nm,.rn,svg,title,#rn-title,noscript')).map(e=>e.tagName+'.'+(e.className||e.id)+': '+e.textContent.trim().slice(0,30))`;
export async function run({url, check}) {
  for (const [lang, w, h, touch, label] of [['th', 1280, 900, false, 'TH desktop'], ['en', 1280, 900, false, 'EN desktop'], ['th', 375, 812, true, 'TH 375px'], ['en', 375, 812, true, 'EN 375px']]) {
    const b = await launch(); await b.lang(lang); await b.view(w, h, touch);
    for (const p of PAGES) {
      await b.go(`${url}/${p}`, 2800);
      if (p.startsWith('cutaway') || p.startsWith('studio')) await b.ev("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))");
      const ox = await b.ev('document.documentElement.scrollWidth-innerWidth');
      const a11y = await b.ev(A11Y);
      const imgs = await b.ev("[...document.images].filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.src.split('/').pop())");
      const thai = lang === 'en' && p !== '404.html' ? await b.ev(THAI_LEFT) : [];
      const bad = {...(ox > 0 ? {overflowX: ox} : {}), ...(a11y.length ? {a11y} : {}), ...(imgs.length ? {brokenImages: imgs} : {}), ...(thai.length ? {thaiInEnglish: thai} : {})};
      check(`${label} · ${p}`, !Object.keys(bad).length, bad);
    }
    check(`${label} · no console / network errors`, !b.logs.length, b.logs);
    b.close();
  }
}
