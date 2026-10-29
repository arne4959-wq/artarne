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
    instagram:null, timeline:[], scale:1, kind:'arch', colors:[], approved:false, demo:false};
  let works = [
    {id:'w1', artist_id:'napha', position:0, title:'เช้าหมอก', title_en:'Morning Fog', ar:'4/5', img:null, year:2022},
    {id:'w2', artist_id:'napha', position:1, title:'ห้องว่าง', title_en:'Empty Room', ar:'1/1', img:'art/napha-2.svg', year:2021}];
  let notices = [{id:'n1', artist_id:'napha', work_id:'w1', donor_name:'Somchai', donor_email:'somchai@mail.com', amount:5, currency:'USD', message:'Thank you!', slip_path:null, status:'pending', created_at:'2026-10-11T05:00:00Z', works:{title:'เช้าหมอก', title_en:'Morning Fog', title_lo:null}}];
  let claimed = !/[?&]claim/.test(location.search);   // ?claim = a fresh Google login with no building yet
  const json = (b, status = 200) => new Response(JSON.stringify(b), {status, headers: {'Content-Type': 'application/json'}});
  const real = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url, method = (init.method || (input.method) || 'GET').toUpperCase();
    if (!url.includes('${REF}.supabase.co')) return real(input, init);
    const body = init.body && typeof init.body === 'string' ? init.body : null;
    calls.push({method, url: url.replace(/^https:\\/\\/[^/]+/, ''), body});
    const h = new Headers(init.headers || {}), one = (h.get('Accept') || '').includes('pgrst.object');
    if (url.includes('/rest/v1/rpc/claim_building')) { const b = JSON.parse(body); Object.assign(artist, {id: b.p_id, name: b.p_name, disc: b.p_disc, city: b.p_city}); claimed = true; return json(b.p_id); }
    if (url.includes('/rest/v1/artists') && method === 'GET' && url.includes('approved=eq.false')) return json([{id:'dao-k', name:'Dao', disc:'paint', city:'Vientiane', created_at:'2026-10-29T01:00:00Z', artist_private:{email:'d@gmail.com', apply_note:'https://ig.test/dao'}}]);
    if (url.includes('/rest/v1/artists') && method === 'GET' && !claimed) return one ? json(null) : json([]);
    if (url.includes('/rest/v1/artists')) { if (method === 'GET') return one ? json(artist) : json([artist]); const b = JSON.parse(body); Object.assign(artist, b); return json(one ? artist : [artist]); }
    if (url.includes('/rest/v1/works')) {
      if (method === 'GET') return json(works);
      if (method === 'PATCH') { const id = new URL(url).searchParams.get('id').replace('eq.', ''); works = works.map(w => w.id === id ? {...w, ...JSON.parse(body)} : w); return new Response(null, {status: 204}); }
      if (method === 'DELETE') { const id = new URL(url).searchParams.get('id').replace('eq.', ''); works = works.filter(w => w.id !== id); return new Response(null, {status: 204}); }
      if (method === 'POST') { const b = JSON.parse(body); works.push({id: 'w' + (works.length + 1), ...b}); return new Response(null, {status: 201}); }
    }
    if (url.includes('/rest/v1/donation_notices')) {
      if (method === 'HEAD') return new Response(null, {status: 200, headers: {'content-range': '0-0/' + notices.filter(n => n.status === 'pending').length}});
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
const signedIn = sess => fs.readFileSync(DIST + '/manage.html', 'utf8').replace('<head>', `<head><script>try{localStorage.setItem('sb-${REF}-auth-token', ${JSON.stringify(sess)})}catch(e){};${mock.replace(/<\/script>/g, '<\\/script>')}</script>`);
const html = signedIn(session), adminHtml = signedIn(session.replace('"app_metadata":{}', '"app_metadata":{"role":"admin"}'));
const anon = fs.readFileSync(DIST + '/manage.html', 'utf8').replace('<head>', `<head><script>${mock.replace(/<\/script>/g, '<\\/script>')}</script>`);
const srv = await startServer(DIST, {'/manage.html': u => (u.searchParams.has('anon') ? anon : u.searchParams.has('admin') ? adminHtml : html)});
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
  await b.view(1280, 900); await b.go(srv.url + '/manage.html?anon&full', 2500);
  check('no session: a "Sign in with Google" button comes first', await b.ev("document.querySelector('.mg-go')?.textContent==='เข้าด้วย Google' && document.querySelector('.mg-go').type==='button'"));
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
  await b.ev(`(()=>{const e=document.querySelector('input[name=email]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'nobody');e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.mg-go[type=submit]').click()})()`); await sleep(300);
  check('bad e-mail: error shown, nothing sent', await b.ev("!!document.querySelector('.mg-err')") && !/otp/.test(await b.ev("JSON.stringify(window.__calls)")));
  check('bad e-mail: the stamp lands again and the bolts rattle', await b.ev("!!document.querySelector('.mg-stamp.re') && document.querySelectorAll('.mg-bolt.re').length===4"));
  await b.ev(`(()=>{const e=document.querySelector('input[name=email]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Napha@Studio.com');e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.mg-go[type=submit]').click()})()`); await sleep(600);
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
    check('a work card has no price and no sale status buttons (nothing is sold)', await b.ev("!document.querySelector('.mg-seg') && !/\\$\\d/.test(document.querySelector('.mg-works')?.textContent||'')"));
    // add form without a title
    await clickText('button.btn', '+ เพิ่มงาน'); await sleep(300);
    await set('ชื่องาน (ไทย)', ' ');
    await clickText('button[type=submit]', 'บันทึก'); await sleep(300);
    check('a work without a title shows an error and sends nothing', await b.ev("!!document.querySelector('.mg-lbl.bad')") && !/POST/.test(await b.ev("JSON.stringify(window.__calls)")));
    await b.shot(`${out}/dash-workform-err-${name}.png`);
    await set('ชื่องาน (ไทย)', 'ทดสอบ'); await set('ปี', '2024');
    check('the work form has no price, status, edition or pay-link field', await b.ev("![...document.querySelectorAll('label.mg-lbl span')].some(x => /ราคา|สถานะ|edition|ลิงก์จ่ายเงิน/i.test(x.textContent))"));
    await b.ev("window.__calls.length=0");
    await clickText('button[type=submit]', 'บันทึก'); await sleep(300);
    check('a new work cannot be saved before ticking "this is my own work"', !/POST/.test(await b.ev("JSON.stringify(window.__calls)")) && await b.ev("!!document.querySelector('.mg-own .bad')"));
    await b.ev("document.querySelector('.mg-own input').click()"); await sleep(150);
    await clickText('button[type=submit]', 'บันทึก'); await sleep(500);
    const c2 = await b.ev("JSON.stringify(window.__calls)");
    check('valid work sends POST with artist_id and position 2, and no price / status', /POST/.test(c2) && /artist_id/.test(c2) && /position/.test(c2) && /rights_confirmed_at/.test(c2) && !/price|status|edition/.test(c2), c2);
    check('after save the list is back', await b.ev("!!document.querySelector('.mg-works')"));
    // delete needs two presses
    await b.ev("window.__calls.length=0");
    await clickText('.mg-mini.del', 'ลบ'); await sleep(200);
    check('first delete press only asks', !/DELETE/.test(await b.ev("JSON.stringify(window.__calls)")));
    // donations tab: a supporter's notice, confirmed by the artist
    check('the Donations tab shows a badge with the waiting notices', await b.ev("/1/.test(document.querySelector('#tab-donations .mg-badge')?.textContent||'')"));
    await clickText('.mg-tab', 'การสนับสนุน'); await sleep(400);
    check('the notice shows donor, e-mail, message, amount and the inspiring work', await b.ev("(()=>{const t=document.querySelector('.mg-order')?.textContent||'';return /Somchai/.test(t)&&/somchai@mail.com/.test(t)&&/Thank you/.test(t)&&/\\$5/.test(t)&&/เช้าหมอก/.test(t)})()"));
    await b.shot(`${out}/dash-donations-${name}.png`);
    await b.ev("window.__calls.length=0");
    await clickText('.mg-order .mg-mini', 'ยืนยัน'); await sleep(500);
    const co = await b.ev("JSON.stringify(window.__calls)");
    check('"Confirm" confirms the notice and touches no work', /donation_notices/.test(co) && /confirmed/.test(co) && !/rest\/v1\/works/.test(co), co.slice(0, 400));
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
{   // a new Google login: no building yet, so it asks for one
  await b.view(1280, 900); await b.go(srv.url + '/manage.html?claim', 2500);
  check('a login without a building sees the request form, the slug guessed from the e-mail', await b.ev("!!document.querySelector('form.mg-panel h2') && document.querySelector('input[maxlength=\"40\"]')?.value==='napha'"));
  await b.shot(`${out}/claim.png`);
  await set('ชื่อตึกในลิงก์', 'arne'); await set('ชื่อ (ไทย)', 'ดาว'); await set('แนวงาน', 'จิตรกรรม'); await set('เมือง', 'เวียงจันทน์');
  await b.ev("window.__calls.length=0"); await clickText('button[type=submit]', 'ส่งคำขอ'); await sleep(300);
  check('a slug the site already uses is refused before anything is sent', !/claim_building/.test(await b.ev("JSON.stringify(window.__calls)")) && /มีคนใช้แล้ว/.test(await b.ev("document.querySelector('.mg-lbl.bad small')?.textContent||''")));
  await set('ชื่อตึกในลิงก์', 'dao-art'); await clickText('button[type=submit]', 'ส่งคำขอ'); await sleep(800);
  const cc = await b.ev("JSON.stringify(window.__calls)");
  check('sending calls claim_building once with the form', (cc.match(/rpc\/claim_building/g) || []).length === 1 && /dao-art/.test(cc) && /เวียงจันทน์/.test(cc), cc.slice(0, 400));
  check('then the dashboard of the new, still hidden building', await b.ev("document.querySelector('.mg-room h1')?.textContent==='ตึกของ ดาว' && !!document.querySelector('.mg-note')"));
  check('an artist does not see the approvals list', await b.ev("!document.querySelector('#ad-h')"));
}
{   // the site owner
  await b.go(srv.url + '/manage.html?admin', 2500);
  check('admin: the waiting request shows with e-mail and note', await b.ev("(()=>{const t=document.querySelector('#ad-h')?.parentElement.textContent||'';return /Dao/.test(t)&&/d@gmail.com/.test(t)&&/ig.test\\/dao/.test(t)})()"));
  await b.shot(`${out}/approvals.png`);
  await b.ev("window.__calls.length=0"); await clickText('#ad-h ~ ul button.btn', 'อนุมัติ'); await sleep(500);
  const ca = await b.ev("JSON.stringify(window.__calls)");
  check('"Approve" PATCHes that one artist to approved and the row leaves the list', /PATCH/.test(ca) && /id=eq.dao-k/.test(ca) && /approved\\?":true/.test(ca) && await b.ev("/ไม่มีคำขอรอ/.test(document.querySelector('#ad-h').parentElement.textContent)"), ca.slice(0, 400));
}
console.log(b.logs.filter(l => !/favicon/.test(l)).slice(0, 8).join('\n') || '(no console errors)');
console.log(`${ok} passed, ${bad} failed`);
b.close(); srv.close();
