// Intro that can be skipped, one Join entry, accessible names, h1, lang, tap targets >= 44px and text >= 12px, sticky donate button,
// centred picture in the artwork window, one footer row on Highlights / Legends. Runs on the built pages.
import {launch, sleep} from '../../tools/browser.mjs';
export const name = 'a11y';
/* every visible link/button/field: unnamed ones, ones under 44px (the hall's 3D pictures are skipped: their box is the projected wall), and text under 12px */
const AUDIT = `(()=>{
  const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)return false;return !(e.closest('[inert],[hidden],.loader')&&!e.closest('dialog[open]'));};
  const nm=e=>{let n=e.getAttribute('aria-label');if(n)return n;const l=e.getAttribute('aria-labelledby');if(l){const x=document.getElementById(l);if(x&&x.textContent.trim())return 1;}if(e.labels&&e.labels.length)return 1;if(/^(SELECT|INPUT|TEXTAREA)$/.test(e.tagName))return e.title||'';return (e.textContent||'').trim()||(e.querySelector('img[alt]')||{}).alt||e.title||'';};
  const ints=[...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab]')].filter(vis);
  const d=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+'.'+String(e.className).slice(0,24);
  const noname=ints.filter(e=>!nm(e)).map(d);
  const small=ints.filter(e=>!e.classList.contains('mus-art')&&!e.classList.contains('tw-win')).filter(e=>{const r=e.getBoundingClientRect();return r.width<43.5||r.height<43.5}).map(e=>d(e)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
  const tiny=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while(n=w.nextNode()){if(!n.textContent.trim())continue;const e=n.parentElement;if(!e||!vis(e)||e.closest('script,style,noscript,svg'))continue;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<11.99)tiny.push(d(e)+' '+fs);}
  return {noname,small:small.slice(0,8),tiny:tiny.slice(0,8),h1:document.querySelectorAll('h1').length,lang:document.documentElement.lang};
})()`;
export async function run({url, check}) {
  /* intro: has a skip button, the button leaves at once, and left alone the intro is over well inside a second */
  let b = await launch(); await b.view(1280, 800);
  await b.go(`${url}/index.html`, 0); await sleep(180);
  check('intro: a "skip the intro" button is on the black screen', await b.ev("!!document.getElementById('loader-skip') && document.getElementById('loader-skip').getBoundingClientRect().height >= 44"));
  await b.ev("document.getElementById('loader-skip').click()"); await sleep(120);
  check('intro: the skip button lets the visitor in at once', await b.ev("!document.getElementById('loader') || document.getElementById('loader').classList.contains('done')"));
  await sleep(500);
  check('intro: after skipping, the loader is gone and the page is shown', await b.ev("!document.getElementById('loader') && !document.documentElement.classList.contains('pre')"));
  b.close();
  b = await launch(); await b.view(1280, 800);
  await b.go(`${url}/index.html`, 0); await sleep(1100);
  check('intro: left alone it is over in about half a second (gone by 1.1 s from navigation, count never negative)', await b.ev("!document.getElementById('loader')"));
  b.close();

  /* home: cards and the artist of the week come before the Manifesto; Join lives in the footer and menu, not as a pink nav button */
  b = await launch(); await b.lang('th'); await b.view(1280, 800);
  await b.go(`${url}/index.html`, 3500);
  const order = await b.ev("(()=>{const i=id=>[...document.querySelectorAll('main > section')].findIndex(s=>s.id===id);return {f:i('featured'),s:i('spotlight'),m:i('manifesto')}})()");
  check('home: work cards and artist of the week are above the Manifesto', order.f > -1 && order.f < order.s && order.s < order.m, order);
  check('home: no pink Join button in the nav (Join stays in the footer and the phone menu)', await b.ev("!document.querySelector('nav .links .join') && !!document.querySelector('footer .btn[onclick*=openJoin]') && !!document.querySelector('#mnav a[href=\"join.html\"]')"));
  let r = await b.ev(AUDIT);
  check('home desktop: every link/button has a name', r.noname.length === 0, r.noname);
  check('home desktop: links and buttons are at least 44px', r.small.length === 0, r.small);
  check('home desktop: text is at least 12px', r.tiny.length === 0, r.tiny);
  b.close();

  /* language: <html lang> follows the chosen language on every kind of page */
  for (const l of ['th', 'en', 'lo']) {
    b = await launch(); await b.lang(l); await b.view(1280, 800);
    const got = [];
    for (const p of ['index.html', 'studio-napha.html', 'profile-napha.html', 'highlights.html', 'join.html']) { await b.go(`${url}/${p}`, 1800); got.push(await b.ev('document.documentElement.lang')); }
    check(`<html lang> is "${l}" on home, studio, profile, highlights and join`, got.every(x => x === l), got);
    b.close();
  }

  /* phone: studio and profile */
  for (const p of ['studio-napha.html', 'profile-napha.html']) {
    b = await launch(); await b.lang('th'); await b.view(375, 812, true);
    await b.go(`${url}/${p}`, 3500); r = await b.ev(AUDIT);
    check(`phone ${p}: named, >= 44px, >= 12px, one h1`, !r.noname.length && !r.small.length && !r.tiny.length && r.h1 === 1, r);
    b.close();
  }
  b = await launch(); await b.lang('th'); await b.view(1280, 800);
  await b.go(`${url}/profile-napha.html`, 3000);
  check('profile has one h1 holding the artist name', (await b.ev("document.querySelectorAll('h1').length")) === 1 && (await b.ev("document.querySelector('h1').textContent")).includes('นภา'));
  check('profile / studio nav: no pink Join button', await b.ev("!document.querySelector('nav .links .join')"));

  /* donation window on a 1280x800 screen: the "I have donated / Close" row is on screen without scrolling the window */
  await b.ev("document.querySelector('.pf-sbtn').click()"); await sleep(700);
  await b.ev("document.querySelector('[data-pf-tip=\"5\"]').click()"); await sleep(800);
  const don = await b.ev("(()=>{const d=document.querySelector('#dlg-tip').getBoundingClientRect(),x=document.querySelector('[data-sm-sent]').getBoundingClientRect();return {dlgBottom:Math.round(d.bottom),btnBottom:Math.round(x.bottom),vh:innerHeight}})()");
  check('donate window: the "I have donated" button sits inside the window (sticky at the bottom)', don.btnBottom <= don.dlgBottom && don.btnBottom <= don.vh, don);
  b.close();

  /* artwork window: the picture is in the middle of the wall, not at the bottom of a tall window */
  b = await launch(); await b.lang('th'); await b.view(1280, 800);
  await b.go(`${url}/cutaway.html?id=napha&work=0`, 4500);
  const art = await b.ev("(()=>{const w=document.querySelector('.dlg-art').getBoundingClientRect(),f=document.querySelector('.dlg-art .frame').getBoundingClientRect(),d=document.getElementById('dlg').getBoundingClientRect();return {top:Math.round(f.top-Math.max(w.top,d.top+110)),bottom:Math.round(Math.min(w.bottom,d.bottom)-f.bottom)}})()");
  check('artwork window: the picture is centred in the part you can see (space above ~ space below)', Math.abs(art.top - art.bottom) <= 60, art);
  b.close();

  /* Highlights / Legends: one footer row, light-on-dark links (not the browser's blue) */
  for (const p of ['highlights.html', 'legends.html']) {
    b = await launch(); await b.lang('th'); await b.view(1280, 800);
    await b.go(`${url}/${p}`, 2500);
    const f = await b.ev("(()=>{const a=[...document.querySelectorAll('.mini-foot a')];return {rows:document.querySelectorAll('.mini-foot').length,dupes:document.querySelectorAll('a[href=\"privacy.html\"]').length,old:document.querySelectorAll('.pl-foot').length,color:getComputedStyle(a[1]).color,under:getComputedStyle(a[1]).textDecorationLine}})()");
    check(`${p}: a single, styled footer row (privacy and terms once, not blue)`, f.rows === 1 && f.old === 0 && f.dupes === 1 && f.color !== 'rgb(0, 0, 238)' && f.under === 'underline', f);
    b.close();
  }

  /* the showcase pages (donate for a living artist; legend intro; legend work): one h1, named, >= 44px, >= 12px, no sideways scroll, no donate on legends, snap-in finishes */
  for (const [w, h, touch] of [[1280, 800, false], [375, 812, true]]) for (const p of ['donate.html?a=napha', 'legend.html?id=monet', 'legend-work.html?id=vangogh&k=0']) {
    b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    await b.go(`${url}/${p}`, 3200); r = await b.ev(AUDIT);
    const over = await b.ev('document.documentElement.scrollWidth > innerWidth');
    const don = await b.ev("!!document.querySelector('[data-amt],[data-support],.sc-amt,#dlg-tip')");
    const shown = await b.ev("[...document.querySelectorAll('.sc-in')].every(e => getComputedStyle(e).opacity === '1')");
    check(`${p} @${w}: one h1, named, >= 44px, >= 12px, no sideways scroll, entrance finished`, r.h1 === 1 && !r.noname.length && !r.small.length && !r.tiny.length && !over && shown, {...r, over, shown});
    if (p.startsWith('legend')) check(`${p}: a legend has no donate control`, !don);
    b.close();
  }
}
