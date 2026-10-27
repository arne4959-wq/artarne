// Four layout promises: ransom words never split, pixel people at the doors, a building + its tag fit one screen, a clear break before the Manifesto.
import {demoArtists} from '../demo.mjs';
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS} = new Function(demoArtists(__root) + '\n;return {ARTISTS};')();
const N = ARTISTS.length, WORKS = ARTISTS.reduce((n, a) => n + a.pieces.length, 0), FEATURED = 8;
export const name = 'layout';
export async function run({url, check}) {
  /* 1 — a ransom-note WORD is never broken across lines (a split would put its letters ≥ one line apart) */
  for (const [lang, w, h, touch] of [['th', 1440, 900, false], ['th', 375, 812, true], ['en', 1440, 900, false], ['en', 375, 812, true]]) {
    const b = await launch(); await b.lang(lang); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    const words = await b.ev(`[...document.querySelectorAll('.mani-lines .rw')].map(rw=>{const ys=[...rw.children].map(c=>{const r=c.getBoundingClientRect();return r.top+r.height/2});return {word:rw.textContent,spread:Math.round(Math.max(...ys)-Math.min(...ys))}})`);
    check(`Manifesto (${lang} ${w}px): every word stays on one line`, words.length >= 8 && words.every(x => x.spread < 24), words.filter(x => x.spread >= 24));
    const wrapperLooks = await b.ev("(()=>{const s=getComputedStyle(document.querySelector('.rw'));return s.borderTopWidth==='0px'&&s.boxShadow==='none'&&s.paddingTop==='0px'})()");
    check(`Manifesto (${lang} ${w}px): the word wrapper adds no box of its own`, wrapperLooks);
    b.close();
  }

  /* 2 — pixel people instead of the vector silhouettes */
  let b = await launch(); await b.lang('th'); await b.view(1440, 900);
  await b.go(`${url}/index.html`, 4500);
  const st = await b.ev(`(()=>{const out={vector:0,stands:0,bad:[]};document.querySelectorAll('.bd').forEach(bd=>{out.vector+=bd.querySelectorAll('svg circle[r="4.4"]').length;const s=bd.querySelector('.stand');if(!s){out.bad.push(bd.dataset.id+': no sprite');return}out.stands++;const cs=[...s.querySelectorAll('canvas')];if(cs.length!==2||cs.some(c=>c.width!==16||c.height!==16||getComputedStyle(c).imageRendering!=='pixelated'))out.bad.push(bd.dataset.id+': not 2 pixelated 16x16 frames');const r=s.getBoundingClientRect(),m=bd.querySelector('.mon').getBoundingClientRect();if(r.left<m.left||r.right>m.right||r.bottom>m.bottom+2)out.bad.push(bd.dataset.id+': outside its building')});return out})()`);
  check('every building has a pixel person at its door and no vector silhouette is left', st.stands === N && st.vector === 0 && st.bad.length === 0, st);
  const pal = await b.ev(`(()=>{const ok=new Set(['14,13,12','244,241,232','255,46,136','232,183,48','163,24,44','232,228,216']);const bad=new Set();for(const c of document.querySelectorAll('.stand canvas')){const d=c.getContext('2d').getImageData(0,0,16,16).data;for(let i=0;i<d.length;i+=4)if(d[i+3]>0&&!ok.has(d[i]+','+d[i+1]+','+d[i+2]))bad.add(d[i]+','+d[i+1]+','+d[i+2])}return [...bad]})()`);
  check('standing people use only the site palette', pal.length === 0, pal);
  b.close();

  /* 3 — the tallest building + its name tag fit in one screen */
  const widths = {};
  for (const [w, h, touch] of [[1440, 800, false], [1280, 800, false], [1440, 1080, false], [375, 812, true], [390, 700, true]]) {
    b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    await b.ev("(()=>{const s=document.getElementById('strip');window.scrollTo(0,s.getBoundingClientRect().top+scrollY-62);s.scrollLeft=0;document.querySelectorAll('.bd').forEach(x=>x.classList.add('in'))})()"); await sleep(2300);
    const r = await b.ev(`(()=>{const nav=document.getElementById('nav').getBoundingClientRect().bottom;const rows=[...document.querySelectorAll('.bd')].map(x=>({top:x.querySelector('.mon').getBoundingClientRect().top,tag:x.querySelector('.tag').getBoundingClientRect().bottom}));return {nav:Math.round(nav),top:Math.round(Math.min(...rows.map(x=>x.top))),tagBottom:Math.round(Math.max(...rows.map(x=>x.tag))),vh:innerHeight,bw:Math.round(parseFloat(getComputedStyle(document.querySelector('.bd')).width)/1.12)}})()`);
    widths[h + (touch ? 'm' : 'd')] = r.bw;
    check(`${w}x${h}: tallest building + name tags fit one screen`, r.top >= r.nav - 1 && r.tagBottom <= r.vh, r);
    b.close();
  }
  check('the city scales with the screen height (taller screen, bigger buildings)', widths['1080d'] > widths['800d'], widths);

  /* 4 — a visible break under the tartan street, then the 3-step how-it-works (moved up on 2026-10-18 so a first-time visitor sees how donating works early), then the work cards and the artist of the week, all before the Manifesto, which keeps its own tape above it */
  for (const [w, h, touch] of [[1440, 900, false], [375, 812, true]]) {
    b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    const r = await b.ev(`(()=>{const g=document.querySelector('.ground').getBoundingClientRect(),p=document.getElementById('progress').getBoundingClientRect(),t=document.querySelector('.tape-wrap'),tr=t.getBoundingClientRect(),m=document.getElementById('how').getBoundingClientRect();return {adjacent:t.nextElementSibling===document.getElementById('how')&&t.previousElementSibling.classList.contains('city')&&document.getElementById('manifesto').previousElementSibling.classList.contains('tape-wrap'),gap:Math.round(tr.top-g.bottom),aboveProgress:Math.round(tr.top-p.bottom),overlapsManifesto:Math.round(m.top-tr.top)}})()`);
    check(`${w}px: hazard tape between the street and the first section (how it works) (and another one before the Manifesto), with a gap`, r.adjacent && r.gap >= 24 && r.aboveProgress >= 6 && r.overlapsManifesto > 0, r);
    b.close();
  }
  /* 6 — phones: the Donate button is a bar on the bottom edge (studio page after the first screen, and inside the work window); desktop keeps the old layout */
  {
    const b = await launch(); await b.lang('th'); await b.view(390, 844, true);
    await b.go(`${url}/studio-napha.html`, 4000);
    const top = await b.ev("(()=>{const w=document.querySelector('.fab-wrap');return !!w&&getComputedStyle(w).display==='none'})()");
    await b.ev('window.scrollTo(0,document.documentElement.scrollHeight)'); await sleep(1500);   // past the lobby, which has its own Support button (the bar steps aside while that is on screen)
    const bar = await b.ev("(()=>{const w=document.querySelector('.fab-wrap');if(!w)return null;const r=w.getBoundingClientRect(),f=[...document.querySelectorAll('footer a')].filter(e=>e.offsetParent).pop();return {gap:Math.round(innerHeight-r.bottom),w:Math.round(r.width),vw:innerWidth,h:Math.round(r.height),overflow:document.documentElement.scrollWidth>innerWidth}})()");
    await b.ev('window.scrollTo(0,document.documentElement.scrollHeight)'); await sleep(1500);
    const foot = await b.ev("(()=>{const w=document.querySelector('.fab-wrap').getBoundingClientRect(),l=[...document.querySelectorAll('footer a,footer button')].filter(e=>e.offsetParent).pop().getBoundingClientRect();return {lastBottom:Math.round(l.bottom),barTop:Math.round(w.top)}})()");
    check('390px studio page: no Donate bar on the first screen, a full-width bar flush with the bottom edge after scrolling, nothing sideways',
      top === true && !!bar && bar.gap === 0 && bar.w === bar.vw && bar.h >= 56 && bar.h <= 90 && !bar.overflow, {top, bar});
    check('390px studio page: the bar does not cover the last footer link', foot.lastBottom <= foot.barTop, foot);
    await b.go(`${url}/studio-napha.html?work=0`, 4500);
    const wb = await b.ev("(()=>{const d=document.querySelector('dialog[open]'),bar=document.getElementById('dlg-bar'),bt=document.getElementById('dlg-sup');if(!d||!bar)return null;const r=bar.getBoundingClientRect(),dr=d.getBoundingClientRect();return {inView:r.bottom<=dr.bottom+1&&r.top>=0&&r.top<innerHeight,support:bt.dataset.support,work:bt.dataset.for,text:bt.textContent}})()");
    check('390px work window: the Donate bar is on screen without scrolling and names the artist and the work', !!wb && wb.inView && wb.support === 'napha' && !!wb.work && /นภา/.test(wb.text), wb);
    await b.ev("(()=>{const d=document.querySelector('dialog[open]');d.style.scrollBehavior='auto';d.scrollTop=d.scrollHeight})()"); await sleep(500);
    const end = await b.ev("(()=>{const d=document.querySelector('dialog[open]'),r=document.getElementById('dlg-bar').getBoundingClientRect(),dr=d.getBoundingClientRect();return r.bottom<=dr.bottom+1&&r.top>=0})()");
    await b.ev("document.getElementById('dlg-sup').click()"); await sleep(800);
    const dn = await b.ev("(()=>{const d=document.getElementById('dlg-tip');return !!d&&d.open&&/นภา/.test(d.querySelector('h2').textContent)&&/เช้าหมอก/.test((d.querySelector('.sm-for')||{}).textContent||'')})()");
    check('390px work window: the bar stays on screen at the end of the window, and tapping it opens the donation dialog for this artist and work', end === true && dn === true, {end, dn});
    b.close();
    for (const [w, h] of [[1280, 800], [1440, 900], [1280, 700]]) {
      const d2 = await launch(); await d2.lang('th'); await d2.view(w, h, false);
      await d2.go(`${url}/studio-napha.html?work=0`, 4500);
      const dk = await d2.ev("(()=>{const bar=document.getElementById('dlg-bar').getBoundingClientRect(),body=document.querySelector('.dlg-body').getBoundingClientRect(),fr=document.querySelector('.dlg-art .frame').getBoundingClientRect(),dr=document.querySelector('dialog[open]').getBoundingClientRect();return {underStory:Math.abs(bar.left-body.left)<=1,coversPicture:bar.left<fr.right&&bar.top<fr.bottom,inWindow:bar.bottom<=dr.bottom+1&&bar.top>=0,note:getComputedStyle(document.getElementById('dlg-supn')).display!=='none',vtb:!!document.querySelector('.v-tb'),like:document.getElementById('dlg-res').textContent.trim()}})()");
      check(`${w}x${h} work window: the Donate bar sits under the story column, inside the window, never over the picture; the repeated by-line row is gone; the like button says "ถูกใจ"`,
        dk.underStory && !dk.coversPicture && dk.inWindow && dk.note && !dk.vtb && /ถูกใจ/.test(dk.like), dk);
      d2.close();
    }
  }
  /* 7 — home: the main action is pink with a quiet one beside it and a trust line above the tape; the 10 discipline chips open from one "Art form" button */
  for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
    const b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    const hero = await b.ev("(()=>{const k=document.querySelector('.hero-cta .btn.pk'),g=document.querySelector('.hero-cta .btn.ghost'),t=document.querySelector('.hero-trust'),tr=t.getBoundingClientRect(),pts=[[tr.left+20,tr.top+tr.height/2],[tr.left+tr.width/2,tr.top+tr.height/2]].map(p=>{const e=document.elementFromPoint(p[0],p[1]);return !!e&&!!e.closest('.hero-trust')});return {pink:getComputedStyle(k).backgroundColor,toCity:k.getAttribute('href'),toFeatured:g&&g.getAttribute('href'),trust:t.querySelectorAll('li').length,strip:tr.bottom<=innerHeight,stripOnTop:pts.every(Boolean),overflow:document.documentElement.scrollWidth>innerWidth}})()");
    check(`${w}px home: pink "enter the city" + quiet "featured work" + two-point trust line that nothing covers`, hero.pink === 'rgb(255, 46, 136)' && hero.toCity === '#city' && hero.toFeatured === '#featured' && hero.trust === 2 && hero.strip && hero.stripOnTop && !hero.overflow, hero);
    await b.ev("document.getElementById('all-artists').scrollIntoView()"); await sleep(1500);
    const f0 = await b.ev("(()=>({panelHidden:document.getElementById('fpanel').hidden,visibleChips:[...document.querySelectorAll('#filters .fbtn[data-d]')].filter(e=>e.getBoundingClientRect().width>0).length,expanded:document.getElementById('ftog').getAttribute('aria-expanded')}))()");
    await b.ev("document.getElementById('ftog').click()"); await sleep(400);
    const f1 = await b.ev("(()=>({open:!document.getElementById('fpanel').hidden,chips:[...document.querySelectorAll('#fpanel .fbtn')].filter(e=>e.getBoundingClientRect().width>0).length,expanded:document.getElementById('ftog').getAttribute('aria-expanded')}))()");
    await b.ev("document.querySelector('.fbtn[data-d=\"เซรามิก\"]').click()"); await sleep(1200);
    const f2 = await b.ev("(()=>({closed:document.getElementById('fpanel').hidden,label:document.querySelector('#ftog .ft-l').textContent,on:document.getElementById('ftog').classList.contains('on'),lit:document.querySelectorAll('.bd.lit').length}))()");
    check(`${w}px city filters: closed = "All", "New wave" and one "Art form" button; open lists the disciplines; picking one closes the panel and the button names it`,
      f0.panelHidden && f0.visibleChips === 2 && f0.expanded === 'false' && f1.open && f1.chips >= 9 && f1.expanded === 'true' && f2.closed && /เซรามิก/.test(f2.label) && f2.on && f2.lit === 1, {f0, f1, f2});
    b.close();
  }
  /* 8 — studio page: the tower ends in a lobby (bio, "Support circles", a link that says what the profile is); the floating bar gives way while a Support button is on screen */
  for (const [w, h, touch] of [[1280, 800, false], [390, 844, true]]) {
    const b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    await b.go(`${url}/studio-napha.html`, 4500);
    const lr = await b.ev("(()=>{const s=document.querySelector('.tw-lobby');if(!s)return null;const btn=s.querySelector('[data-support]'),prof=s.querySelector('.lr-prof'),foot=document.querySelector('.tower-foot'),bld=document.querySelector('.tw-fl');return {support:btn&&btn.dataset.support,prof:prof&&prof.textContent,href:prof&&prof.getAttribute('href'),afterFloors:(bld.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING)>0,beforeFoot:(s.compareDocumentPosition(foot)&Node.DOCUMENT_POSITION_FOLLOWING)>0,bio:s.querySelector('p').textContent.length>20}})()");
    await b.ev("document.querySelector('.tw-lobby').scrollIntoView({block:'center',behavior:'instant'})"); await sleep(1800);
    const fab = await b.ev("(()=>{const w=document.querySelector('.fab-wrap');return !w||getComputedStyle(w).display==='none'})()");
    await b.ev("document.querySelector('.tw-lobby [data-support]').click()"); await sleep(800);
    const dn = await b.ev("(()=>{const d=document.getElementById('dlg-sc');return !!d&&d.open})()");
    check(`${w}px studio page: lobby after the floors with the bio, a Support circles button, "เรื่องของนภา" links to the profile, the floating bar steps aside, tapping opens the circles support window`,
      !!lr && lr.support === 'site' && lr.prof === 'เรื่องของนภา' && lr.href === 'profile-napha.html' && lr.afterFloors && lr.beforeFoot && lr.bio && fab === true && dn === true, {lr, fab, dn});
    b.close();
  }
  /* 5 — the new colour: map icons never sit on the text, patterns exist (the card tapes are hidden now: their old check is gone) */
  for (const [w, h, touch] of [[1280, 900, false], [375, 812, true]]) {
    const b = await launch(); await b.lang('en'); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    await b.ev("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))"); await sleep(1500);
    const r = await b.ev(`(()=>{const tapes=[...document.querySelectorAll('.card .tape')].map(t=>Math.round(t.getBoundingClientRect().height));const hit=[];document.querySelectorAll('.dist').forEach(d=>{const s=d.querySelector('svg').getBoundingClientRect();[...d.querySelectorAll('span')].forEach(t=>{const range=document.createRange();range.selectNodeContents(t);for(const q of range.getClientRects()){if(q.width&&q.left<s.right&&q.right>s.left&&q.top<s.bottom&&q.bottom>s.top)hit.push(d.dataset.d+': "'+t.textContent.slice(0,16)+'"')}})});const cs=getComputedStyle(document.documentElement);return {tapes,hit,tokens:['--checker','--tt-red','--tt-pink','--tt-gold','--tt-black'].map(k=>cs.getPropertyValue(k).trim().length>20),kerb:getComputedStyle(document.querySelector('.dist'),'::before').backgroundImage!=='none',statsChecker:getComputedStyle(document.querySelector('.stats'),'::before').backgroundImage.includes('conic'),floorChecker:true}})()`);
    check(`${w}px: map icons do not sit on the district names`, r.hit.length === 0, r.hit);
    check(`${w}px: checker + four tartan colourways exist and are used`, r.tokens.every(Boolean) && r.kerb && r.statsChecker, r);
    b.close();
  }
}

