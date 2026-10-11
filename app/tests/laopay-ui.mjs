// The LAO QR block on a buy page, in a headless Chrome with Supabase answered inside the page (nothing leaves the machine).
// Needs `npm run app:build` first.  Usage: node app/tests/laopay-ui.mjs [folder for screenshots]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), DIST = path.resolve(HERE, '..', 'dist');
const out = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'laopay-ui-'));
const {ARTISTS} = new Function(fs.readFileSync(path.resolve(HERE, '..', '..', 'artists.js'), 'utf8') + '\nreturn {ARTISTS};')();
const a = ARTISTS.find(x => x.pieces.some(p => !p.status && !p.pay)), k = a.pieces.findIndex(p => !p.status && !p.pay);
const REF = 'lgkqvfmnqdpajddishio';
const mock = `
(() => {
  const calls = (window.__calls = []), cfg = {pay: true, notice: 'ok'};
  window.__cfg = cfg;
  const json = (b, status = 200) => new Response(JSON.stringify(b), {status, headers: {'Content-Type': 'application/json'}});
  const real = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url, method = (init.method || 'GET').toUpperCase();
    if (!url.includes('${REF}.supabase.co')) return real(input, init);
    calls.push({method, url: url.replace(/^https:\\/\\/[^/]+/, ''), body: typeof init.body === 'string' ? init.body : null});
    if (url.includes('/rest/v1/artist_payment')) return cfg.pay ? json({bank: 'BCEL', account_name: 'Napha S.', account_no: '010 12 345 678', qr_path: 'x/qr.png'}) : json({code: 'PGRST116', details: 'The result contains 0 rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned'}, 406);
    if (url.includes('/functions/v1/payment-notice')) return cfg.notice === 'ok' ? json({ok: true, id: 'n1'}) : json({error: cfg.notice}, cfg.notice === 'rate' ? 429 : 409);
    return json({});
  };
})();`;
const html = fs.readFileSync(DIST + '/buy.html', 'utf8').replace('<head>', `<head><script>${mock.replace(/<\/script>/g, '<\\/script>')}</script>`);
const srv = await startServer(DIST, {'/buy.html': () => html});
const b = await launch(); await b.lang('th');
const ev = e => b.ev(e);
let ok = 0, bad = 0; const check = (n, c, x = '') => { c ? ok++ : bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '  ' + x)); };
const setVal = (sel, v) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'NOEL ${sel}';Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(v)});e.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`);
const send = async () => { await ev(`(()=>{const f=document.querySelector('.lp-form form');let i=f.querySelector('[name=cf-turnstile-response]');if(!i){i=document.createElement('input');i.type='hidden';i.name='cf-turnstile-response';f.appendChild(i)}i.value='tok';f.querySelector('button[type=submit]').click()})()`); await sleep(500); };
const calls = async () => JSON.parse(await ev('JSON.stringify(window.__calls)'));
const url = `${srv.url}/buy.html?id=${a.id}&k=${k}`;

await b.view(1280, 900);
await b.go(url + '&nopay', 0); await ev("1");
// 1) an artist without payment details: no block at all
await b.go(`${srv.url}/buy.html?id=${a.id}&k=${k}`, 1500);
check('the block shows when the artist has payment details', await ev("!!document.querySelector('.by-lao')"));
check('amount in kip is shown (and the dollar price small)', /₭/.test(await ev("document.querySelector('.lp-amount b').textContent")) && /\$/.test(await ev("document.querySelector('.lp-amount small').textContent")), await ev("document.querySelector('.lp-amount').textContent"));
check('account name and number are shown', /Napha S\./.test(await ev("document.querySelector('.by-lao').textContent")) && /010 12 345 678/.test(await ev("document.querySelector('.by-lao').textContent")));
check('QR image comes from the public qr bucket', /storage\/v1\/object\/public\/qr\/x\/qr\.png/.test(await ev("document.querySelector('.lp-qr')?.src||''")));
await b.scrollTo('#by-lao', 80).catch(() => {}); await b.shot(`${out}/laopay-desk.png`);
// 2) notice: sent with the right fields, work position, no price from the browser
await setVal('.lp-form [name=name]', 'Somchai'); await setVal('.lp-form [name=email]', 'somchai@mail.com'); await setVal('.lp-form [name=ship_to]', 'Vientiane');
await send();
const c1 = (await calls()).find(c => /payment-notice/.test(c.url));
const body = c1 && JSON.parse(c1.body);
check('"I have paid" posts to the function with artist, position, buyer and captcha', body && body.artist_id === a.id && body.position === k && body.buyer_name === 'Somchai' && body.buyer_email === 'somchai@mail.com' && body.captcha === 'tok', JSON.stringify(c1));
check('the browser sends no price and no status', body && !('price_usd' in body) && !('status' in body) && !('work_id' in body));
check('then the thank-you shows and the form is gone', await ev("!!document.querySelector('.lp-form .by-done') && !document.querySelector('.lp-form form')"));
await b.shot(`${out}/laopay-done.png`);
// 3) error answers show a message and keep the form
for (const [code, key] of [['sold', 'lp_e_sold'], ['rate', 'lp_e_rate']]) {
  await b.go(url, 1500); await ev(`window.__cfg.notice=${JSON.stringify(code)}`);
  await setVal('.lp-form [name=name]', 'S'); await setVal('.lp-form [name=email]', 's@mail.com'); await send();
  check(`function says ${code}: an error shows and the form stays`, await ev("!!document.querySelector('.lp-err') && !!document.querySelector('.lp-form form')"), await ev("document.querySelector('.lp-form')?.textContent"));
}
// 4) the phone layout
await b.view(390, 844, true); await b.go(url, 1500);
check('phone: one column, no sideways scroll', await ev("document.documentElement.scrollWidth<=innerWidth"), await ev("document.documentElement.scrollWidth"));
await b.scrollTo('#by-lao', 20).catch(() => {}); await b.shot(`${out}/laopay-phone.png`);
// 5) no payment details: nothing extra on the page
await b.view(1280, 900);
const srv2 = await startServer(DIST, {'/buy.html': () => html.replace('cfg = {pay: true', 'cfg = {pay: false')});
await b.go(`${srv2.url}/buy.html?id=${a.id}&k=${k}`, 1500);
check('artist without payment details: no LAO QR block, no extra CSS', await ev("!document.querySelector('.by-lao') && ![...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.selectorText&&r.selectorText.includes('.lp-qr'))}catch(e){return false}})"));
// 6) sold and pay-link works never show it
const sold = ARTISTS.flatMap(x => x.pieces.map((p, i) => [x.id, i, p])).find(([, , p]) => p.status === 'sold');
await b.go(`${srv.url}/buy.html?id=${sold[0]}&k=${sold[1]}`, 1500);
check('a sold work has no LAO QR block', await ev("!document.querySelector('.by-lao')"));
console.log(b.logs.filter(l => !/favicon|Cloudflare|turnstile/i.test(l)).slice(0, 6).join('\n') || '(no console errors)');
console.log(`${ok} passed, ${bad} failed`);
b.close(); srv.close(); srv2.close();
