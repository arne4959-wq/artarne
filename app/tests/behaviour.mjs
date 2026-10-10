#!/usr/bin/env node
// behaviour.mjs — the same clicks on the old page and on the React page; the answers must be the same.
//   node tests/behaviour.mjs            (build first: npm run build)
// Nothing is sent anywhere: fetch to the form endpoint is answered in the page, the CAPTCHA script is blocked.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';

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
  'unknown address shows the 404 page': async ({b, base, ev}) => {
    await b.go(`${base}/no-such-page.html`, 1500);
    return ev(`({h1: document.querySelector('h1').textContent, btn: document.getElementById('b').getAttribute('href'), title: document.title})`);
  },
};

const oldSrv = await startServer(SITE), newSrv = await startServer(path.join(APP, 'dist'));
let bad = 0;
try {
  for (const [name, fn] of Object.entries(SCENARIOS)) {
    const run = async base => {
      const b = await launch(); await b.view(1280, 900); await b.lang?.('en');
      await b.send('Network.setBlockedURLs', {urls: ['*challenges.cloudflare.com*']});
      try { const out = await fn({b, base, ev: b.ev}); return {out, logs: b.logs.filter(l => !/cloudflare|ERR_BLOCKED_BY_CLIENT|404 .*no-such-page/.test(l))}; } finally { b.close(); }
    };
    const o = await run(oldSrv.url), n = await run(newSrv.url);
    const same = JSON.stringify(o.out) === JSON.stringify(n.out);
    if (!same || n.logs.length) bad++;
    console.log(`${same && !n.logs.length ? '✓' : '✗'} ${name}`);
    if (!same) console.log('    old:   ' + JSON.stringify(o.out) + '\n    react: ' + JSON.stringify(n.out));
    else if (process.argv.includes('-v')) console.log('    ' + JSON.stringify(n.out));
    if (n.logs.length) console.log('    errors (react): ' + n.logs.join(' | '));
  }
} finally { oldSrv.close(); newSrv.close(); }
console.log(`\n${Object.keys(SCENARIOS).length - bad} same, ${bad} different`);
process.exit(bad ? 1 : 0);
