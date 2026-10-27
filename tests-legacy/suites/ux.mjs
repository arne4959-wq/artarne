// First screen and floating buttons: the first picture is on the first screen (studio + profile, every artist, desktop and phone);
// only ONE button floats (Donate) and it covers no text; Pause and Share live in the footer. Runs on the built pages.
import {demoArtists} from '../demo.mjs';
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS} = new Function(demoArtists(__root) + '\n;return {ARTISTS};')();
export const name = 'ux';
const FIRST = (sel, vh) => `(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {top:Math.round(r.top),visible:Math.round(Math.min(r.bottom,${vh})-Math.max(r.top,0))};})()`;
/* the floating Donate button against every piece of text on screen (decorative aria-hidden text, the moving strips and the picture labels excluded) */
const OVERLAP = `(()=>{
  const fab=document.querySelector('.fab-wrap .fab-sup'); if(!fab) return {fab:false};
  const fr=fab.getBoundingClientRect(); if(!fr.width) return {fab:true,hidden:true,hits:[]};
  const hits=[];
  for(const el of document.querySelectorAll('body *')){
    if(fab.contains(el)||el.closest('.fab-wrap,script,style,svg,canvas,[aria-hidden=true],[inert],dialog:not([open]),.pf-marq,.marquee,.mus-ctl,.mus-label'))continue;
    const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1); if(!own)continue;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)continue;
    for(const r of el.getClientRects()){ if(r.width<2||r.height<2)continue; const w=Math.min(r.right,fr.right)-Math.max(r.left,fr.left), h=Math.min(r.bottom,fr.bottom)-Math.max(r.top,fr.top); if(w>2&&h>2)hits.push(el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0]+':'+el.textContent.trim().slice(0,24)); }
  }
  return {fab:true,hidden:false,hits:[...new Set(hits)].slice(0,5)};
})()`;
const FIXED = `[...document.querySelectorAll('button,a[href]')].filter(e=>{const cs=getComputedStyle(e),r=e.getBoundingClientRect();return cs.position==='fixed'&&r.width>0&&!e.classList.contains('skip')&&!e.closest('nav')&&!e.closest('dialog')&&getComputedStyle(e).display!=='none'}).map(e=>e.className+':'+e.textContent.trim().slice(0,20))`;
export async function run({url, check}) {
  /* ---------- the first picture is on the first screen (studio: the tower is, its windows follow as you scroll; profile: the first picture) ---------- */
  for (const [W, H, touch, label] of [[1280, 800, false, '1280×800'], [375, 812, true, '375×812']]) {
    const b = await launch(); await b.lang('en'); await b.view(W, H, touch);
    const bad = [];
    for (const kind of ['studio', 'profile']) for (const A of ARTISTS) {
      await b.go(`${url}/${kind === 'studio' ? 'studio' : 'profile'}-${A.id}.html`, 2800);
      const f = await b.ev(FIRST(kind === 'studio' ? '#tw-bld' : '.pf-pk', H));
      if (!f || f.visible < 40) bad.push(`${kind}-${A.id}: first picture top ${f ? f.top : 'missing'} (visible ${f ? f.visible : 0}px)`);
    }
    check(`${label}: the first picture is on the first screen of every studio and profile (10 artists)`, bad.length === 0, bad.slice(0, 8));
    b.close();
  }

  /* ---------- one floating button, covering nothing; Pause and Share are in the footer ---------- */
  for (const [W, H, label] of [[375, 812, '375×812'], [390, 844, '390×844'], [1280, 800, '1280×800']]) {
    const b = await launch(); await b.lang('en'); await b.view(W, H, W < 500);
    const bad = [], extra = [];
    const pages = ['index.html', 'studio-napha.html', 'studio-pan.html', 'profile-napha.html', 'profile-pan.html'];
    for (const p of pages) {
      await b.go(`${url}/${p}`, 2800);
      const fixed = await b.ev(FIXED);
      if (fixed.length > 1 || (fixed.length === 1 && !/fab-sup/.test(fixed[0]))) extra.push(`${p}: ${fixed.join(' | ')}`);
      for (const where of ['top', 'bottom']) {
        await b.ev(where === 'top' ? 'scrollTo(0,0)' : 'scrollTo(0,document.documentElement.scrollHeight)'); await sleep(900);
        const o = await b.ev(OVERLAP);
        if (o.hits && o.hits.length) bad.push(`${p} (${where}): covers ${o.hits.join(', ')}`);
      }
      const inFoot = await b.ev("(()=>{const c=document.querySelector('.calm');return !!c&&!!c.closest('footer')&&getComputedStyle(c).position!=='fixed'})()");
      if (!inFoot) extra.push(`${p}: Pause is not in the footer`);
      if (/^(studio|profile)/.test(p) && !(await b.ev("!!document.querySelector('.share-foot')&&!!document.querySelector('.share-foot').closest('footer')"))) extra.push(`${p}: Share is not in the footer`);
    }
    check(`${label}: only the Donate button floats; Pause and Share are in the footer`, extra.length === 0, extra);
    check(`${label}: the floating Donate button covers no text (top and bottom of home, studio, profile)`, bad.length === 0, bad);
    b.close();
  }
}
