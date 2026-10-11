#!/usr/bin/env node
// behaviour.mjs — the same clicks on the old page and on the React page; the answers must be the same.
//   node tests/behaviour.mjs            (build first: npm run build)
// Nothing is sent anywhere: fetch to the form endpoint is answered in the page, the CAPTCHA script is blocked.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';
import {makeFixture} from './fixture.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SITE = path.resolve(APP, '..');

/* each scenario gets {b, base, ev} and returns plain data; old and new must return the same data */
const SCENARIOS = {
  'language button cycles th → en → lo → th and is remembered': async ({b, base, ev}) => {
    await b.go(`${base}/privacy.html?lang=th`, 1500);
    const seen = [];
    for (let i = 0; i < 3; i++) {
      seen.push(await ev(`({lang: document.documentElement.lang, btn: document.getElementById('lang').textContent, aria: document.getElementById('lang').getAttribute('aria-label'), h1: [...document.querySelectorAll('main h1')].find(h => h.offsetParent).textContent, title: document.title, city: document.querySelector('nav .links a').textContent})`));
      await ev(`document.getElementById('lang').click()`); await sleep(300);
    }
    await b.go(`${base}/terms.html`, 1500);
    seen.push(await ev(`({saved: localStorage.getItem('circles-lang'), lang: document.documentElement.lang})`));
    return seen;
  },
  'logo coin spins on hover and when the language changes': async ({b, base, ev}) => {
    await b.go(`${base}/join.html?lang=th`, 1500);
    const coin = `document.querySelector('nav .brand .c3-coin')`;
    const r = {faces: await ev(`document.querySelectorAll('nav .brand .c3-face use').length`), edges: await ev(`document.querySelectorAll('nav .brand .c3-edge').length`)};
    await ev(`document.getElementById('lang').click()`); await sleep(50);
    r.afterLang = await ev(`${coin}.classList.contains('c3-once')`);
    await sleep(1200);
    r.settled = await ev(`${coin}.classList.contains('c3-once')`);
    await ev(`document.querySelector('nav .brand').dispatchEvent(new PointerEvent('pointerover', {bubbles: true}));document.querySelector('nav .brand').dispatchEvent(new PointerEvent('pointerenter'))`); await sleep(50);
    r.afterHover = await ev(`${coin}.classList.contains('c3-once')`);
    return r;
  },
  'phone menu: opens, closes on Escape, outside click and link click': async ({b, base, ev}) => {
    await b.view(375, 812, true);
    await b.go(`${base}/join.html?lang=en`, 1500);
    const st = () => ev(`({exp: document.getElementById('menu-btn').getAttribute('aria-expanded'), open: document.getElementById('mnav').classList.contains('open'), inert: document.getElementById('mnav').hasAttribute('inert'), links: [...document.querySelectorAll('#mnav a')].map(a => a.getAttribute('href') + ' ' + a.textContent)})`);
    const r = {start: await st()};
    await ev(`document.getElementById('menu-btn').click()`); await sleep(200); r.opened = await st();
    await b.key('Escape', 'Escape', 27); await sleep(200); r.esc = await st();
    await ev(`document.getElementById('menu-btn').click()`); await sleep(200);
    await ev(`document.querySelector('.perks').click()`); await sleep(200); r.outside = await st();
    await ev(`document.getElementById('menu-btn').click()`); await sleep(200);
    await ev(`(()=>{const a=document.querySelector('#mnav a[href="join.html"]');a.addEventListener('click',e=>e.preventDefault(),{once:true});a.click()})()`); await sleep(200); r.link = await st();
    await b.view(1280, 900);
    return r;
  },
  'Join dialog: opens, fields, Esc / ✕ / backdrop close, reopens fresh': async ({b, base, ev}) => {
    await b.go(`${base}/join.html?lang=en`, 1500);
    await ev(`document.querySelector('.jn-cta .btn').click()`); await sleep(300);
    const d = `document.getElementById('dlg-join')`;
    const r = {open: await ev(`${d}.open`), h2: await ev(`${d}.querySelector('h2').innerHTML`), privacy: await ev(`!!${d}.querySelector('.note a[href="privacy.html"]')`),
      fields: await ev(`[...${d}.querySelectorAll('input,select,textarea')].map(e => e.name + ':' + (e.type||e.tagName) + ':' + e.required)`),
      options: await ev(`[...${d}.querySelectorAll('option')].map(o => o.value + '=' + o.textContent)`), cf: await ev(`!!${d}.querySelector('.cf-holder')`)};
    await ev(`${d}.querySelector('input[name=name]').value = 'typed'`);
    await b.key('Escape', 'Escape', 27); await sleep(300); r.esc = await ev(`${d}.open`);
    await ev(`document.querySelector('.jn-cta .btn').click()`); await sleep(300);
    r.fresh = await ev(`${d}.querySelector('input[name=name]').value`);
    await ev(`${d}.querySelector('.cdlg-x').click()`); await sleep(200); r.x = await ev(`${d}.open`);
    await ev(`document.querySelector('.jn-cta .btn').click()`); await sleep(300);
    await ev(`${d}.dispatchEvent(new MouseEvent('click', {bubbles: true}))`); await sleep(200); r.backdrop = await ev(`${d}.open`);
    r.dialogs = await ev(`document.querySelectorAll('dialog').length`);
    return r;
  },
  'Join submit: honeypot, CAPTCHA wait, then sent (fetch answered in the page)': async ({b, base, ev}) => {
    await b.go(`${base}/join.html?lang=en`, 1500);
    await ev(`window.__sent = []; window.fetch = async (u, o) => { window.__sent.push({u, body: JSON.parse(o.body)}); return {ok: true}; }`);
    const d = `document.getElementById('dlg-join')`;
    const fill = `(()=>{const f=${d}.querySelector('form');f.name.value='New Artist';f.email.value='a@example.com';f.link.value='https://example.com/me';f.message.value='I make things.';return f})()`;
    await ev(`document.querySelector('.jn-cta .btn').click()`); await sleep(300);
    await ev(`(()=>{const f=${fill};f.website.value='bot';f.requestSubmit()})()`); await sleep(400);
    const r = {honeypotSent: await ev(`window.__sent.length`), honeypotToast: await ev(`document.getElementById('toast')?.textContent || ''`)};
    await ev(`(()=>{const f=${fill};f.website.value='';f.requestSubmit()})()`); await sleep(400);
    r.captchaToast = await ev(`document.getElementById('toast')?.textContent || ''`); r.captchaSent = await ev(`window.__sent.length`);
    // pretend the CAPTCHA was solved: Turnstile adds this hidden field to the form
    await ev(`(()=>{const f=${d}.querySelector('form');const i=document.createElement('input');i.type='hidden';i.name='cf-turnstile-response';i.value='tok';f.appendChild(i);${fill}.requestSubmit()})()`); await sleep(600);
    r.sent = await ev(`window.__sent`);
    r.done = await ev(`({h2: ${d}.querySelector('h2').textContent, intro: ${d}.querySelector('.intro').textContent, pre: !!document.getElementById('done-pre'), buttons: [...${d}.querySelectorAll('.act button')].map(x => x.textContent), role: ${d}.querySelector('.cdlg-done')?.getAttribute('role')})`);
    await ev(`window.fetch = async () => ({ok: false})`);
    await ev(`document.querySelector('.jn-cta .btn').click()`); await sleep(300);
    await ev(`(()=>{const f=${d}.querySelector('form');const i=document.createElement('input');i.type='hidden';i.name='cf-turnstile-response';i.value='tok';f.appendChild(i);${fill}.requestSubmit()})()`); await sleep(600);
    r.failed = await ev(`({h2: ${d}.querySelector('h2').textContent, note: ${d}.querySelector('.note').textContent, pre: document.getElementById('done-pre')?.textContent, buttons: [...${d}.querySelectorAll('.act button')].map(x => x.textContent)})`);
    return r;
  },
  'page curtain: covers the jump, lifts on arrival': async ({b, base, ev}) => {
    await b.send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'no-preference'}]});
    await b.go(`${base}/privacy.html?lang=en`, 1500);
    await ev(`document.querySelector('.legal-foot a[href="terms.html"]').click()`); await sleep(120);
    const r = {covering: await ev(`({on: !!document.querySelector('.pgc.on'), coin: !!document.querySelector('.pgc .c3-coin'), key: sessionStorage.getItem('circles-pgc')})`)};
    await sleep(700);
    r.arrived = await ev(`({path: location.pathname.split('/').pop(), pgc: document.querySelectorAll('.pgc').length, pgcIn: document.documentElement.classList.contains('pgc-in'), key: sessionStorage.getItem('circles-pgc')})`);
    await sleep(900);
    r.lifted = await ev(`document.querySelectorAll('.pgc').length`);
    await ev(`location.hash = ''; document.querySelector('nav .links a').href`);
    return r;
  },
  'buy: "ask" link scrolls to the form and puts the cursor in the message': async ({b, base, ev}) => {
    await b.go(`${base}/buy-dao-1.html?lang=en`, 1800);
    await ev(`document.querySelector('[data-by-ask]').click()`); await sleep(1200);
    return ev(`({hash: location.hash, focus: document.activeElement.name, msg: document.activeElement.value, top: Math.round(document.getElementById('by-ask').getBoundingClientRect().top) < 200, title: document.title})`);
  },
  'buy: form — honeypot, CAPTCHA wait, sent, send another, failed': async ({b, base, ev}) => {
    await b.go(`${base}/buy-thara-1.html?lang=th`, 1800);
    await ev(`window.__sent = []; window.fetch = async (u, o) => { window.__sent.push({u, body: JSON.parse(o.body)}); return {ok: true}; }`);
    const f = `document.querySelector('.by-form')`;
    const fill = `(()=>{const f=${f};f.name.value='Buyer';f.email.value='b@example.com';f.ship_to.value='Laos';return f})()`;
    await ev(`(()=>{const f=${fill};f.website.value='bot';f.requestSubmit()})()`); await sleep(300);
    const r = {honeypot: await ev(`window.__sent.length`), prefill: await ev(`${f}.message.value`), cf: await ev(`!!${f}.querySelector('.cf-holder')`)};
    await ev(`(()=>{const f=${fill};f.website.value='';f.requestSubmit()})()`); await sleep(300);
    r.captcha = await ev(`document.getElementById('toast')?.textContent`);
    const solve = `(()=>{const f=${fill};const i=document.createElement('input');i.type='hidden';i.name='cf-turnstile-response';i.value='tok';f.appendChild(i);f.requestSubmit()})()`;
    await ev(solve); await sleep(500);
    r.sent = await ev(`window.__sent`); r.done = await ev(`document.querySelector('.by-box').innerHTML`);
    await ev(`document.querySelector('[data-by-again]').click()`); await sleep(200);
    r.again = await ev(`({form: !!${f}, msg: ${f}.message.value, name: ${f}.name.value})`);
    await ev(`window.fetch = async () => ({ok: false})`); await ev(solve); await sleep(500);
    r.failed = await ev(`document.querySelector('.by-box').innerHTML`);
    return r;
  },
  'buy: changing language rebuilds the page (form starts over in the new language)': async ({b, base, ev}) => {
    await b.go(`${base}/buy-mali-2.html?lang=th`, 1800);
    await ev(`document.querySelector('.by-form').name.value = 'typed'`);
    await ev(`document.getElementById('lang').click()`); await sleep(400);
    return ev(`({name: document.querySelector('.by-form').name.value, msg: document.querySelector('.by-form').message.value, title: document.title, h1: document.getElementById('by-title').textContent, back: document.querySelector('.by-back').getAttribute('href')})`);
  },
  'buy / profile: unknown or missing ids': async ({b, base, ev}) => {
    const r = {};
    for (const u of ['buy.html', 'buy.html?id=zzz', 'buy.html?id=dao&k=7', 'buy.html?id=dao&k=1x', 'profile.html', 'profile.html?id=zzz']) {
      await b.go(`${base}/${u}${u.includes('?') ? '&' : '?'}lang=en`, 1500);
      r[u] = await ev(`({title: document.title, h1: document.querySelector('main h1, main h2')?.textContent, nf: !!document.querySelector('main .nf'), byPage: document.body.classList.contains('by-page')})`);
    }
    return r;
  },
  'profile: ask opens the inquiry dialog; copy and share report back': async ({b, base, ev}) => {
    await b.go(`${base}/profile-napha.html?lang=en`, 2200);
    await ev(`document.querySelector('[data-pf-ask]').click()`); await sleep(400);
    const d = `document.getElementById('dlg-inquiry')`;
    const r = {open: await ev(`${d}.open`), h2: await ev(`${d}.querySelector('h2').innerHTML`), msg: await ev(`${d}.querySelector('textarea').value`), send: await ev(`${d}.querySelector('button[type=submit]').className`)};
    await ev(`window.__sent = []; window.fetch = async (u, o) => { window.__sent.push(JSON.parse(o.body)); return {ok: true}; }`);
    await ev(`(()=>{const f=${d}.querySelector('form');f.name.value='Q';f.email.value='q@example.com';const i=document.createElement('input');i.type='hidden';i.name='cf-turnstile-response';i.value='tok';f.appendChild(i);f.requestSubmit()})()`); await sleep(500);
    r.sent = await ev(`window.__sent`); r.done = await ev(`${d}.querySelector('h2').textContent`);
    await b.key('Escape', 'Escape', 27); await sleep(200);
    await ev(`navigator.clipboard.writeText = async t => { window.__copied = t; }`);
    await ev(`document.querySelector('[data-pf-copy]').click()`); await sleep(200);
    r.copied = await ev(`[window.__copied, document.querySelector('.pf-live').textContent]`);
    await ev(`navigator.share = async o => { window.__shared = o; }`);
    await ev(`document.querySelector('[data-pf-share]').click()`); await sleep(200);
    r.shared = await ev(`window.__shared`);
    return r;
  },
  'fixture · email-app path: join, buy and inquiry show the copyable message': {fixture: true, fn: async ({b, base, ev}) => {
    const r = {};
    await b.go(`${base}/buy-napha-1.html?lang=en`, 1800);
    await ev(`(()=>{const f=document.querySelector('.by-form');f.name.value='M';f.email.value='m@example.com';f.requestSubmit()})()`); await sleep(500);
    r.buy = await ev(`({done: document.querySelector('.by-box').innerHTML.replace(/\s+/g, ' '), href: location.href.split('/').pop()})`);
    await b.go(`${base}/profile-napha.html?lang=th`, 2000);
    await ev(`document.querySelector('[data-pf-ask]').click()`); await sleep(300);
    await ev(`(()=>{const f=document.querySelector('#dlg-inquiry form');f.name.value='M';f.email.value='m@example.com';f.requestSubmit()})()`); await sleep(500);
    r.inquiry = await ev(`({h2: document.querySelector('#dlg-inquiry h2').textContent, note: document.querySelector('#dlg-inquiry .note').textContent, pre: document.getElementById('done-pre').textContent})`);
    await b.go(`${base}/join.html?lang=en`, 1500);
    await ev(`document.querySelector('.jn-cta .btn').click()`); await sleep(300);
    r.mailtoNote = await ev(`[...document.querySelectorAll('#dlg-join .note')].map(n => n.textContent)`);
    return r;
  }},
  'fixture · pay link: buy page offers both pay and ask': {fixture: true, fn: async ({b, base, ev}) => {
    await b.go(`${base}/buy-napha-1.html?lang=en`, 1800);
    return ev(`({btns: [...document.querySelectorAll('.by-cta a')].map(a => a.className + ' ' + a.getAttribute('href') + ' ' + (a.target||'') + ' ' + a.textContent), steps: [...document.querySelectorAll('.by-step')].map(x => x.textContent), paynote: document.querySelector('.by-safe').innerText})`);
  }},
  /* ---------- the home page ---------- */
  'home: loader counts and lifts, html.pre is removed': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 0); await sleep(500);
    const r = {atStart: await ev(`({loader: !!document.getElementById('loader'), pre: document.documentElement.classList.contains('pre'), count: /^\d{3}$/.test(document.getElementById('loader-count')?.textContent || '')})`)};
    await sleep(3200);
    r.after = await ev(`({loader: !!document.getElementById('loader'), pre: document.documentElement.classList.contains('pre'), seen: sessionStorage.getItem('circles-seen')})`);
    await b.go(`${base}/index.html?lang=en`, 1500);
    r.again = await ev(`({loader: !!document.getElementById('loader'), pre: document.documentElement.classList.contains('pre')})`);
    return r;
  },
  'home: drag scrolls the city, a drag does not open a studio, a click does': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    await ev("document.getElementById('strip').scrollIntoView({block:'center'});0"); await sleep(1800);
    const at = id => ev(`(()=>{const e=document.querySelector('.bd[data-id=${id}] .mon').getBoundingClientRect();return {x:Math.round(e.left+e.width/2),y:Math.round(e.top+e.height*.55)}})()`);
    const pt = await at('napha'), r = {};
    await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: pt.x, y: pt.y}); await sleep(400);
    r.cursor = await ev("document.getElementById('cursor-label').textContent");
    const before = await ev("document.getElementById('strip').scrollLeft");
    await b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1});
    for (let i = 1; i <= 25; i++) { await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: pt.x - i * 12, y: pt.y, button: 'left'}); await sleep(14); }
    r.dragging = await ev("document.getElementById('strip').classList.contains('drag')");
    await b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: pt.x - 300, y: pt.y, button: 'left', clickCount: 1}); await sleep(900);
    r.scrolled = (await ev("document.getElementById('strip').scrollLeft")) > before + 100; r.stayed = (await ev('location.pathname')).endsWith('index.html'); r.dragEnded = !(await ev("document.getElementById('strip').classList.contains('drag')"));
    await ev("document.getElementById('strip').scrollLeft=0;0"); await sleep(600);
    const p2 = await at('napha');
    await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: p2.x, y: p2.y}); await sleep(200);
    await b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: p2.x, y: p2.y, button: 'left', clickCount: 1});
    await b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: p2.x, y: p2.y, button: 'left', clickCount: 1}); await sleep(2800);
    r.clicked = (await ev('location.pathname')).split('/').pop();
    return r;
  },
  'home: arrow keys and the pager scroll the strip, the progress bar follows': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    await ev("document.getElementById('strip').scrollIntoView({block:'center'});0"); await sleep(1500);
    const r = {start: await ev("document.getElementById('strip').scrollLeft")};
    await ev("document.getElementById('strip').focus()");
    await b.key('ArrowRight', 'ArrowRight', 39); await sleep(1400);
    r.right = Math.round(await ev("document.getElementById('strip').scrollLeft") / 10);
    await b.key('ArrowLeft', 'ArrowLeft', 37); await sleep(1400);
    r.left = await ev("document.getElementById('strip').scrollLeft");
    await ev("document.querySelector('.pager button:last-child').click()"); await sleep(1400);
    r.pager = Math.round(await ev("document.getElementById('strip').scrollLeft") / 10);
    r.progress = await ev("document.getElementById('progress-i').style.transform.startsWith('translateX(')");
    r.parallax = await ev("[...document.querySelectorAll('#strip-in .far,#strip-in .mid,#strip-in .sky,#strip-in .sun')].every(e => e.style.getPropertyValue('--sx') !== '')");
    return r;
  },
  'home: filters light buildings and districts, the note follows, wave filter, clear': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    const st = () => ev(`({lit: [...document.querySelectorAll('.bd.lit')].map(e => e.dataset.id).join(), dim: document.querySelectorAll('.bd.dim').length, on: [...document.querySelectorAll('.fbtn.on')].map(e => e.dataset.d), pressed: document.querySelectorAll('.fbtn[aria-pressed=true]').length,
      dists: [...document.querySelectorAll('.dist.on')].map(e => e.dataset.id).join(), mapF: document.getElementById('map-grid').classList.contains('f'), note: document.getElementById('fnote').className, inert: document.getElementById('fnote').hasAttribute('inert'),
      txt: document.getElementById('fnote').classList.contains('off') ? '' : document.getElementById('fnote-t').textContent,   /* the old page leaves the last sentence in the hidden note */ enter: document.getElementById('fnote-in').hidden ? '' : document.getElementById('fnote-in').getAttribute('href'), delay: document.querySelector('.bd').style.transitionDelay})`);
    const r = {start: await st()};
    await ev(`document.querySelector('.fbtn[data-d="เซรามิก"]').click()`); await sleep(1500); r.discipline = await st(); r.scrolled = (await ev("document.getElementById('strip').scrollLeft")) > 0;
    await ev(`document.querySelector('.fbtn[data-d="*wave"]').click()`); await sleep(1200); r.wave = await st();
    await ev("document.getElementById('fnote-x').click()"); await sleep(600); r.cleared = await st();
    return r;
  },
  'home: buildings or map, "#map" opens the map, a district opens its studio': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    const st = () => ev(`({map: !document.getElementById('map').hidden, strip: !document.getElementById('strip').hidden, progress: !document.getElementById('progress').hidden, pager: !document.querySelector('.city .pager').hidden, on: [...document.querySelectorAll('.vt.on')].map(e => e.dataset.v).join(), pressed: [...document.querySelectorAll('.vt')].map(e => e.getAttribute('aria-pressed')).join()})`);
    const r = {start: await st()};
    await ev("document.querySelector('.vt[data-v=map]').click()"); await sleep(300); r.map = await st();
    await ev("document.querySelector('.vt[data-v=city]').click()"); await sleep(300); r.city = await st();
    await b.go(`${base}/index.html?lang=en#map`, 4500); r.hash = await st();
    r.top = await ev("Math.abs(document.querySelector('.city-tools').getBoundingClientRect().top - 96) < 40");
    await ev("document.querySelector('.dist[data-id=kwan]').click()"); await sleep(2800);
    r.district = (await ev('location.pathname')).split('/').pop();
    return r;
  },
  'home: featured works — sort, show all, sold last, headings and counts': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    const st = () => ev(`({h: document.getElementById('feat-h').textContent, count: document.getElementById('feat-count').textContent, btn: document.getElementById('all-btn').textContent, pressed: document.getElementById('all-btn').getAttribute('aria-pressed'),
      titles: [...document.querySelectorAll('.card .pn')].map(e => e.textContent).join('|'), classes: [...new Set([...document.querySelectorAll('#masonry > div')].map(e => e.className.replace(/ in\b/, '')))].join(), strike: document.querySelectorAll('.card .pp.strike').length, stamps: document.querySelectorAll('.card .stamp').length})`);
    const r = {start: await st()};
    const sort = v => ev(`(()=>{const s=document.getElementById('sort');s.value='${v}';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await sort('low'); await sleep(700); r.low = await st();
    await sort('high'); await sleep(700); r.high = await st();
    await sort('new'); await sleep(700); r.new = await st();
    await sort('cur'); await ev("document.getElementById('all-btn').click()"); await sleep(900); r.all = await st();
    await ev("document.getElementById('all-btn').click()"); await sleep(700); r.back = await st();
    await ev("document.querySelector('.card[data-id=thara]').click()"); await sleep(2800);
    r.card = (await ev('location.pathname')).split('/').pop() + (await ev('location.search'));
    return r;
  },
  'home: the numbers count up to the data when scrolled into view': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    const r = {before: await ev("[...document.querySelectorAll('[data-count]')].map(e => e.textContent).join()"), data: await ev("[...document.querySelectorAll('[data-count]')].map(e => e.dataset.count).join()")};
    await ev("document.getElementById('stats').scrollIntoView({block:'center'});0"); await sleep(2600);
    r.after = await ev("[...document.querySelectorAll('[data-count]')].map(e => e.textContent).join()");
    return r;
  },
  'home: language switch re-renders everything with words': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=th`, 4500);
    const st = () => ev(`({lang: document.documentElement.lang, title: document.title, hero: [...document.querySelectorAll('.hl')].map(e => e.textContent).join('|'), mq: document.querySelector('#mq span').textContent, filters: [...document.querySelectorAll('.fbtn')].slice(0, 4).map(e => e.textContent).join('|'),
      card: document.querySelector('.card .pn').textContent, name: document.querySelector('.bd .nm').getAttribute('aria-label'), mon: document.querySelector('.bd .mon').getAttribute('aria-label'), spot: document.getElementById('spot-meta').textContent, cta: document.querySelector('.spot-qa .btn').textContent,
      classes: [...new Set([...document.querySelectorAll('#masonry > div')].map(e => e.className))].join()})`);
    const r = [await st()];
    for (let i = 0; i < 3; i++) { await ev("document.getElementById('lang').click()"); await sleep(700); r.push(await st()); }
    return r;
  },
  'home: newsletter — honeypot, fetch answered in the page': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    await ev("window.__sent = []; window.fetch = async (u, o) => { window.__sent.push(JSON.parse(o.body)); return {ok: true}; }");
    await ev("document.querySelector('.fold-foot').open = true");
    const sub = () => ev("document.querySelector('.news').requestSubmit()");
    await ev("document.querySelector('.hp-n').value='bot';document.getElementById('news-em').value='spam@example.com'"); await sub(); await sleep(500);
    const r = {honeypot: await ev('window.__sent.length')};
    await ev("document.querySelector('.hp-n').value='';document.getElementById('news-em').value='me@example.com'"); await sub(); await sleep(700);
    r.sent = await ev('window.__sent'); r.toast = await ev("document.getElementById('toast')?.textContent || ''"); r.reset = await ev("document.getElementById('news-em').value");
    return r;
  },
  'home: lite mode has fewer walkers and birds; people stand at every door': async ({b, base, ev}) => {
    const r = {};
    for (const q of ['full', 'lite']) {
      await b.go(`${base}/index.html?lang=en&${q}`, 3500);
      r[q] = await ev("({walkers: document.querySelectorAll('.walker').length, birds: document.querySelectorAll('.bird').length, stand: document.querySelectorAll('.bd .stand').length, bd: document.querySelectorAll('.bd').length, lite: document.documentElement.classList.contains('lite'), spr: document.querySelectorAll('.spr canvas').length})");
    }
    return r;
  },
  'home: hero coin spins on click and by itself, mobile menu anchors scroll': async ({b, base, ev}) => {
    await b.go(`${base}/index.html?lang=en`, 4500);
    const r = {role: await ev("(()=>{const c=document.querySelector('#arch-par .c3');return c.getAttribute('role') + c.tabIndex + c.getAttribute('aria-hidden')})()"), auto: await ev("document.querySelector('#arch-par .c3-coin').classList.contains('c3-settle')")};
    await sleep(2500);
    await ev("document.querySelector('#arch-par .c3').click()"); await sleep(100);
    r.click = await ev("document.querySelector('#arch-par .c3-coin').classList.contains('c3-settle')");
    await ev("document.querySelector('.hero .btn').click()"); await sleep(2800);
    r.anchor = await ev("Math.abs(document.getElementById('city').getBoundingClientRect().top - 70) < 60");
    return r;
  },
  'unknown address shows the 404 page': async ({b, base, ev}) => {
    await b.go(`${base}/no-such-page.html`, 1500);
    return ev(`({h1: document.querySelector('h1').textContent, btn: document.getElementById('b').getAttribute('href'), title: document.title})`);
  },
};

const oldSrv = await startServer(SITE), newSrv = await startServer(path.join(APP, 'dist'));
const FIX = Object.values(SCENARIOS).some(s => s.fixture) ? makeFixture() : null;
const oldFix = FIX && await startServer(SITE, FIX.routes), newFix = FIX && await startServer(FIX.dist);
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
let bad = 0, ran = 0;
try {
  for (const [name, sc] of Object.entries(SCENARIOS)) {
    if (only.length && !only.some(w => name.includes(w))) continue;
    ran++;
    const fn = sc.fn || sc, [oURL, nURL] = sc.fixture ? [oldFix.url, newFix.url] : [oldSrv.url, newSrv.url];
    const run = async base => {
      const b = await launch(); await b.view(1280, 900); await b.lang?.('en');
      await b.send('Network.setBlockedURLs', {urls: ['*challenges.cloudflare.com*']});
      try { const out = JSON.parse(JSON.stringify(await fn({b, base, ev: b.ev}) ?? null).split(base).join('BASE')); return {out, logs: b.logs.filter(l => !/cloudflare|ERR_BLOCKED_BY_CLIENT|404 .*no-such-page|ViewTransition opt-in disabled/.test(l))}; } finally { b.close(); }
    };
    const o = await run(oURL), n = await run(nURL);
    const same = JSON.stringify(o.out) === JSON.stringify(n.out);
    if (!same || n.logs.length) bad++;
    console.log(`${same && !n.logs.length ? '✓' : '✗'} ${name}`);
    if (!same) console.log('    old:   ' + JSON.stringify(o.out) + '\n    react: ' + JSON.stringify(n.out));
    else if (process.argv.includes('-v')) console.log('    ' + JSON.stringify(n.out));
    if (n.logs.length) console.log('    errors (react): ' + n.logs.join(' | '));
  }
} finally { oldSrv.close(); newSrv.close(); oldFix?.close(); newFix?.close(); }
console.log(`\n${ran - bad} same, ${bad} different`);
process.exit(bad ? 1 : 0);
