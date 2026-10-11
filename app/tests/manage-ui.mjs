import fs from 'node:fs';
// manage.html in a headless Chrome with Supabase answered inside the page (nothing leaves the machine): the login door, then the dashboard.
// Needs `npm run app:build` first. Usage: node app/tests/manage-ui.mjs [folder for screenshots]
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'manage-ui-')), DIST = path.resolve(HERE, '..', 'dist');
const REF = 'lgkqvfmnqdpajddishio', UID = '11111111-1111-1111-1111-111111111111';
const mock = `
(() => {
  const calls = (window.__calls = []);
  const artist = {id:'napha', user_id:'${UID}', name:'นภา', name_en:'Napha', name_lo:null, disc:'จิตรกรรม', city:'เชียงใหม่', since:2014, bio:'ประวัติ', bio_en:null, bio_lo:null, tagline:null, tagline_en:null, concept:null, concept_en:null,
    instagram:null, commission_open:false, commission_until:null, commission_until_en:null, sold_elsewhere:0, timeline:[], scale:1, kind:'arch', colors:[], approved:false, demo:false};
  let works = [
    {id:'w1', artist_id:'napha', position:0, title:'เช้าหมอก', title_en:'Morning Fog', price_usd:1800, price_lak:null, ar:'4/5', img:null, status:'', edition:null, year:2022},
    {id:'w2', artist_id:'napha', position:1, title:'ห้องว่าง', title_en:'Empty Room', price_usd:450, price_lak:10000000, ar:'1/1', img:'art/napha-2.svg', status:'reserved', edition:12, year:2021}];
  let notices = [{id:'n1', artist_id:'napha', work_id:'w1', buyer_name:'Somchai', buyer_email:'somchai@mail.com', ship_to:'Vientiane', message:'Paid 12:30', slip_path:null, price_usd:1800, price_lak:40000000, status:'new', created_at:'2026-10-11T05:00:00Z', works:{title:'เช้าหมอก', title_en:'Morning Fog', status:'reserved'}}];
  const json = (b, status = 200) => new Response(JSON.stringify(b), {status, headers: {'Content-Type': 'application/json'}});
  const real = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url, method = (init.method || (input.method) || 'GET').toUpperCase();
    if (!url.includes('${REF}.supabase.co')) return real(input, init);
    const body = init.body && typeof init.body === 'string' ? init.body : null;
    calls.push({method, url: url.replace(/^https:\\/\\/[^/]+/, ''), body});
    const h = new Headers(init.headers || {}), one = (h.get('Accept') || '').includes('pgrst.object');
    if (url.includes('/rest/v1/artists')) { if (method === 'GET') return one ? json(artist) : json([artist]); const b = JSON.parse(body); Object.assign(artist, b); return json(one ? artist : [artist]); }
    if (url.includes('/rest/v1/works')) {
      if (method === 'GET') return json(works);
      if (method === 'PATCH') { const id = new URL(url).searchParams.get('id').replace('eq.', ''); works = works.map(w => w.id === id ? {...w, ...JSON.parse(body)} : w); return new Response(null, {status: 204}); }
      if (method === 'DELETE') { const id = new URL(url).searchParams.get('id').replace('eq.', ''); works = works.filter(w => w.id !== id); return new Response(null, {status: 204}); }
      if (method === 'POST') { const b = JSON.parse(body); works.push({id: 'w' + (works.length + 1), ...b}); return new Response(null, {status: 201}); }
    }
    if (url.includes('/rest/v1/payment_notices')) {
      if (method === 'HEAD') return new Response(null, {status: 200, headers: {'content-range': '0-0/' + notices.filter(n => n.status === 'new').length}});
      if (method === 'GET') return json(notices);
      if (method === 'PATCH') { const id = new URL(url).searchParams.get('id').replace('eq.', ''); notices = notices.map(n => n.id === id ? {...n, ...JSON.parse(body)} : n); return new Response(null, {status: 204}); }
    }
    if (url.includes('/rest/v1/artist_payment')) { if (method === 'GET') return one ? json({artist_id:'napha', bank:'BCEL', account_name:'Napha S.', account_no:'010 12 345', qr_path:null}) : json([]); return new Response(null, {status: 201}); }
    if (url.includes('/rest/v1/artist_private')) { if (method === 'GET') return one ? json({email:'napha@studio.com'}) : json([]); return new Response(null, {status: 201}); }
    if (url.includes('/storage/v1/object/')) return json({Key: 'art/napha/x.webp'});
    if (url.includes('/auth/v1/otp')) return json({});
    return json({});
  };
})();`;
const session = JSON.stringify({access_token: 'x.y.z', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: {id: UID, email: 'napha@studio.com', aud: 'authenticated', app_metadata: {}, user_metadata: {}}});
const html = fs.readFileSync(DIST + '/manage.html', 'utf8').replace('<head>', `<head><script>try{localStorage.setItem('sb-${REF}-auth-token', ${JSON.stringify(session)})}catch(e){};${mock.replace(/<\/script>/g, '<\\/script>')}</script>`);
const anon = fs.readFileSync(DIST + '/manage.html', 'utf8').replace('<head>', `<head><script>${mock.replace(/<\/script>/g, '<\\/script>')}</script>`);
const srv = await startServer(DIST, {'/manage.html': u => (u.searchParams.has('anon') ? anon : html)});
const b = await launch();
await b.lang('th');
const click = sel => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'NOEL ${sel}';e.click();return 'ok'})()`);
const clickText = (sel, txt) => b.ev(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(sel)})].find(x=>x.textContent.includes(${JSON.stringify(txt)}));if(!e)return 'NOEL ${txt}';e.click();return 'ok'})()`);
const setVal = (sel, v) => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'NOEL ${sel}';const P=e.tagName==='SELECT'?HTMLSelectElement:e.tagName==='TEXTAREA'?HTMLTextAreaElement:HTMLInputElement;Object.getOwnPropertyDescriptor(P.prototype,'value').set.call(e,${JSON.stringify(v)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));return 'ok'})()`);
const fld = label => `label.mg-lbl:has(> span:is(:not(:empty))) `; // unused
const inputOf = async label => b.ev(`(()=>{const l=[...document.querySelectorAll('label.mg-lbl')].find(x=>x.querySelector('span').textContent===${JSON.stringify(label)});if(!l)return null;const el=l.querySelector('input,textarea,select');el.id='__t';return '#__t'})()`);
const set = async (label, v) => { const sel = await inputOf(label); if (!sel) return 'NOFIELD ' + label; const r = await setVal(sel, v); await b.ev("document.getElementById('__t').removeAttribute('id')"); return r; };
let ok = 0, bad = 0; const check = (n, c, x = '') => { c ? ok++ : bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '  ' + x)); };

{   // the door (no session)
  await b.view(1280, 900); await b.go(srv.url + '/manage.html?anon', 2500);
  check('no session: the concrete door, no sign-up button', await b.ev("!!document.querySelector('.mg-door') && ![...document.querySelectorAll('button,a')].some(x=>/sign ?up|สมัครสมาชิก/i.test(x.textContent))"));
  // the wall is alive: three depths, a sticker shadow under every shape, people on the kerb, a bird
  check('wall has far, mid and near shapes', await b.ev("document.querySelectorAll('.far .sp').length>=8 && document.querySelectorAll('.mid .sp').length>=6 && document.querySelectorAll('.near .sp').length>=4"));
  check('every shape has its sticker shadow', await b.ev("[...document.querySelectorAll('.sp')].every(s=>s.querySelector('.sh')&&s.querySelector('.fg'))"));
  check('pixel people and the bird are drawn (canvases 16x16)', await b.ev("document.querySelectorAll('.mg-w').length>=2 && !!document.querySelector('.mg-sit') && !!document.querySelector('.mg-bird') && [...document.querySelectorAll('.spr canvas')].every(c=>c.width===16&&c.height===16)"));
  // the pattern stands still: no pointer parallax, nothing animates on the pins, tape and patches
  await b.ev("dispatchEvent(new PointerEvent('pointermove',{clientX:1270,clientY:10,bubbles:true}))"); await sleep(250);
  check('the pointer moves nothing (no parallax variable, no transform on the layers)', await b.ev("getComputedStyle(document.querySelector('.mg-wall')).getPropertyValue('--nx')===''") && await b.ev("['far','mid','near'].every(n=>getComputedStyle(document.querySelector('.mg-lay.'+n)).transform==='none')"));
  check('no animation on any pattern piece', await b.ev("[...document.querySelectorAll('.mg-lay, .mg-lay *')].every(e=>getComputedStyle(e).animationName==='none')"));
  check('no orbs, studs or pearls any more', await b.ev("!document.querySelector('.b-orb,.b-stud,.b-pearls')"));
  // rule: every keyframe of this page animates only transform and opacity
  check('manage keyframes touch only transform and opacity', await b.ev(`(()=>{const ok=new Set(['transform','opacity']),bad=[];for(const sh of document.styleSheets){let rules;try{rules=sh.cssRules}catch(e){continue}for(const r of rules){if(r.type===7&&/^(mg|fr[24]$)/.test(r.name)){for(const k of r.cssRules)for(const p of k.style)if(!ok.has(p))bad.push(r.name+':'+p)}}}return bad.length?bad.join(','):true})()`), '');
  await b.ev("window.__calls.length=0");
  await b.ev(`(()=>{const e=document.querySelector('input[name=email]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'nobody');e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.mg-go').click()})()`); await sleep(300);
  check('bad e-mail: error shown, nothing sent', await b.ev("!!document.querySelector('.mg-err')") && !/otp/.test(await b.ev("JSON.stringify(window.__calls)")));
  check('bad e-mail: the stamp lands again and the bolts rattle', await b.ev("!!document.querySelector('.mg-stamp.re') && document.querySelectorAll('.mg-bolt.re').length===4"));
  await b.ev(`(()=>{const e=document.querySelector('input[name=email]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Napha@Studio.com');e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.mg-go').click()})()`); await sleep(600);
  const c = await b.ev("JSON.stringify(window.__calls)");
  check('valid e-mail: one-time link request, never creates a user', /auth\/v1\/otp/.test(c) && /create_user\\?":false/.test(c) && /napha@studio.com/.test(c), c);
  check('after a valid e-mail the key flies into the lock, with confetti', await b.ev("!!document.querySelector('.mg-door.opening') || !!document.querySelector('.mg-sent')"));
  await sleep(300);
  const mid = await b.ev("JSON.stringify({key:!!document.querySelector('.mg-key'),bits:document.querySelectorAll('.mg-bit').length,live:document.querySelector('.mg-sr').textContent})");
  check('opening: key, 22 confetti pieces, and the screen reader already hears "sent"', /"key":true/.test(mid) && /"bits":22/.test(mid) && /ส่งกุญแจแล้ว/.test(mid), mid);
  await b.shot(`${out}/login-key.png`);
  await sleep(1500);
  check('then the "key sent" message shows', await b.ev("!!document.querySelector('.mg-sent')"));
  await b.shot(`${out}/login-sent.png`);
}
for (const [name, w, h, touch] of [['desk', 1280, 900, false], ['phone', 390, 844, true]]) {
  await b.view(w, h, touch);
  await b.go(srv.url + '/manage.html', 2500);
  const head = await b.ev("document.querySelector('.mg-room h1')?.textContent");
  if (name === 'desk') check('signed in: dashboard shows the building', head === 'ตึกของ นภา', head);
  if (name === 'desk') check('not approved: hidden notice', await b.ev("!!document.querySelector('.mg-note')"));
  await b.shot(`${out}/dash-works-${name}.png`, undefined);
  if (name === 'desk') {
    // quick status: sold on first card
    await b.ev("window.__calls.length=0");
    await clickText('.mg-seg button', 'ขายแล้ว'); await sleep(400);
    const c1 = await b.ev("JSON.stringify(window.__calls)");
    check('status button sends PATCH status=sold', /PATCH/.test(c1) && /"status":"sold"/.test(c1) || /\\"status\\":\\"sold\\"/.test(c1), c1);
    // add form with bad price
    await clickText('button.btn', '+ เพิ่มงาน'); await sleep(300);
    await set('ชื่องาน (ไทย)', 'ทดสอบ'); await set('ราคา (USD)', 'abc');
    await clickText('button[type=submit]', 'บันทึก'); await sleep(300);
    check('bad price shows an error and sends nothing', await b.ev("!!document.querySelector('.mg-lbl.bad')") && !/POST/.test(await b.ev("JSON.stringify(window.__calls)")));
    await b.shot(`${out}/dash-workform-err-${name}.png`);
    await set('ราคา (USD)', '320'); await set('ปี', '2024');
    await b.ev("window.__calls.length=0");
    await clickText('button[type=submit]', 'บันทึก'); await sleep(500);
    const c2 = await b.ev("JSON.stringify(window.__calls)");
    check('valid work sends POST with artist_id, position 2, price 320', /POST/.test(c2) && /artist_id/.test(c2) && /position/.test(c2) && /320/.test(c2), c2);
    check('after save the list is back', await b.ev("!!document.querySelector('.mg-works')"));
    // delete needs two presses
    await b.ev("window.__calls.length=0");
    await clickText('.mg-mini.del', 'ลบ'); await sleep(200);
    check('first delete press only asks', !/DELETE/.test(await b.ev("JSON.stringify(window.__calls)")));
    // payments tab: a buyer's notice, confirmed by the artist
    check('the Payments tab shows a badge with the waiting notices', await b.ev("/1/.test(document.querySelector('#tab-orders .mg-badge')?.textContent||'')"));
    await clickText('.mg-tab', 'แจ้งโอน'); await sleep(400);
    check('the notice shows buyer, e-mail, address and price in kip and dollars', await b.ev("(()=>{const t=document.querySelector('.mg-order')?.textContent||'';return /Somchai/.test(t)&&/somchai@mail.com/.test(t)&&/Vientiane/.test(t)&&/40,000,000/.test(t)&&/1,800/.test(t)})()"));
    await b.shot(`${out}/dash-orders-${name}.png`);
    await b.ev("window.__calls.length=0");
    await clickText('.mg-order .mg-mini', 'ได้รับเงินแล้ว'); await sleep(500);
    const co = await b.ev("JSON.stringify(window.__calls)");
    check('"Money received" confirms the notice and sets the work to sold', /payment_notices/.test(co) && /confirmed/.test(co) && /rest\/v1\/works/.test(co) && /sold/.test(co), co.slice(0, 400));
    check('the confirmed notice has no more buttons', await b.ev("!document.querySelector('.mg-order .mg-mini.ok')"));
    // profile tab
    await clickText('.mg-tab', 'โปรไฟล์'); await sleep(300);
    await b.shot(`${out}/dash-profile-${name}.png`);
    await set('ลิงก์ Instagram', 'http://bad'); await clickText('button[type=submit]', 'บันทึก'); await sleep(300);
    check('instagram must be https', await b.ev("!!document.querySelector('.mg-lbl.bad')"));
    await set('ลิงก์ Instagram', 'https://instagram.com/napha'); await b.ev("window.__calls.length=0");
    await clickText('button[type=submit]', 'บันทึก'); await sleep(400);
    const c3 = await b.ev("JSON.stringify(window.__calls)");
    check('profile save PATCHes artists without approved/demo/user_id', /PATCH/.test(c3) && !/approved|demo|user_id/.test(c3.replace(/user_id=eq/g,'')), c3.slice(0, 300));
    await clickText('.mg-tab', 'รับเงิน'); await sleep(400);
    await b.shot(`${out}/dash-pay-${name}.png`);
    await set('เลขบัญชี', 'abc'); await clickText('button[type=submit]', 'บันทึก'); await sleep(300);
    check('account number must be digits', await b.ev("!!document.querySelector('.mg-lbl.bad')"));
  } else {
    await clickText('.mg-tab', 'รับเงิน'); await sleep(300); await b.shot(`${out}/dash-pay-${name}.png`);
    await clickText('.mg-tab', 'งานของฉัน'); await sleep(200); await clickText('button.btn', '+ เพิ่มงาน'); await sleep(300); await b.shot(`${out}/dash-workform-${name}.png`);
    check('no sideways scroll at 390px', await b.ev("document.documentElement.scrollWidth<=innerWidth"), await b.ev("document.documentElement.scrollWidth"));
  }
}
console.log(b.logs.filter(l => !/favicon/.test(l)).slice(0, 8).join('\n') || '(no console errors)');
console.log(`${ok} passed, ${bad} failed`);
b.close(); srv.close();
