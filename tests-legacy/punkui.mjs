// Standalone test for the new punk-ui pieces (cube, 3-step donate flow, THE CIRCLES TIMES, ticker, wall notices) on punk-ui-demo.html.
// node tests-legacy/punkui.mjs      (saves screenshots into review-shots/punkui-*.png). Kept out of run.mjs on purpose until the tree is clean, see HOOKUP.md.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../tools/browser.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), shots = path.join(root, 'review-shots');
let fails = 0;
const check = (n, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  ' + JSON.stringify(info))); if (!ok) fails++; };
const srv = await startServer(root);
try {
  for (const [label, w, h] of [['desk', 1280, 900], ['phone', 390, 844]]) {
    const b = await launch(); await b.lang('th'); await b.view(w, h, label === 'phone');
    await b.go(`${srv.url}/punk-ui-demo.html`, 2500);
    /* ---- ticker / front / notices on real data ---- */
    const t = await b.ev(`({tick:[...document.querySelectorAll('#ticker .ct-run > a')].map(a=>a.textContent),front:document.getElementById('front').textContent,notes:document.querySelectorAll('#notes .ct-note').length,sample:/@\\S*\\.example/.test(document.body.innerText)})`);
    check(`[${label}] ticker: at most 3 items, newest real artworks, each a link`, t.tick.length === 3 && /Arne|ศิลปะคือทางออก/.test(t.tick[0]), t);
    check(`[${label}] front page with no taps says so honestly: no counts, no invented artist`, /ยังไม่มีใครกดซึ้ง/.test(t.front) && !/\\d+ ครั้ง/.test(t.front) && /จัดอันดับจากการกด “ซึ้ง” เท่านั้น/.test(t.front) && !t.sample, t.front.slice(0, 200));
    check(`[${label}] wall notices: 3 cards from notices.js`, t.notes === 3, t);
    await b.go(`${srv.url}/punk-ui-demo.html?taps=1`, 2000);
    const f = await b.ev(`({h:document.querySelector('.ct-lead h2').textContent,ranks:[...document.querySelectorAll('.ct-rank')].map(r=>r.textContent.replace(/\\s+/g,' ')),donate:/โดเนท\\s*\\d|donat.*\\$|฿|\\$/.test(document.getElementById('front').textContent.replace('ไม่เกี่ยวกับยอดเงินโดเนท',''))})`);
    check(`[${label}] front page ranks by resonated taps only (128 > 97 > 76), no money on it`, /128 ครั้ง/.test(f.h) && f.ranks.length === 3 && /128/.test(f.ranks[0]) && /97/.test(f.ranks[1]) && !f.donate, f);
    if (label === 'desk') await b.shot(path.join(shots, 'punkui-times-desk.png')); else await b.shot(path.join(shots, 'punkui-times-phone.png'));
    /* ---- cube ---- */
    await b.scrollTo('#cube', 120); await sleep(300);
    const r0 = await b.ev(`(()=>{const c=document.querySelector('#cube .cc-cube');return {faces:document.querySelectorAll('#cube .cc-f').length,tr:c.style.transform,spin:document.querySelector('[data-cc-spin]').getAttribute('aria-pressed')}})()`);
    await sleep(500);
    const r1 = await b.ev(`document.querySelector('#cube .cc-cube').style.transform`);
    check(`[${label}] cube: 6 faces, auto-spin on by default and it moves`, r0.faces === 6 && r0.spin === 'true' && r0.tr !== r1, {r0, r1});
    const box = await b.ev(`(()=>{const r=document.querySelector('#cube .cc-stage').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await b.ev(`document.querySelector('[data-cc-spin]').click()`);
    const before = await b.ev(`document.querySelector('#cube .cc-cube').style.transform`);
    await b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1});
    await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: box.x + 80, y: box.y + 20, button: 'left'});
    await b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: box.x + 80, y: box.y + 20, button: 'left', clickCount: 1});
    const after = await b.ev(`document.querySelector('#cube .cc-cube').style.transform`);
    await sleep(500);
    const still = await b.ev(`document.querySelector('#cube .cc-cube').style.transform`);
    check(`[${label}] cube: dragging rotates it; with auto-spin off it stays where you left it`, before !== after && after === still && (await b.ev(`document.querySelector('[data-cc-spin]').getAttribute('aria-pressed')`)) === 'false', {before, after, still});
    await b.shot(path.join(shots, `punkui-cube-${label}.png`));
    /* ---- donate flow ---- */
    await b.ev(`document.getElementById('open').click()`); await sleep(500);
    const s1 = await b.ev(`({open:document.querySelector('dialog.df').open,steps:document.querySelectorAll('.df-step').length,bricks:[...document.querySelectorAll('.df-brick')].map(x=>x.dataset.v).join(),pressed:document.querySelector('.df-brick[aria-pressed=true]').dataset.v,name:!!document.getElementById('df-nm'),msg:!!document.getElementById('df-msg')})`);
    check(`[${label}] step 1: modal, bricks 2/5/10/25 ($5 preselected), optional name, no message box while a message cannot reach the artist`, s1.open && s1.bricks === '2,5,10,25' && s1.pressed === '5' && s1.name && !s1.msg, s1);
    await b.shot(path.join(shots, `punkui-donate-1-${label}.png`));
    await b.ev(`document.querySelector('.df-brick[data-v="10"]').click(); document.getElementById('df-nm').value='<img src=x onerror=alert(1)> $&'; document.querySelector('[data-go2]').click()`); await sleep(500);
    const s2 = await b.ev(`({amt:document.querySelector('[data-df-amt]').textContent,qr:document.querySelector('[data-df-qr]').getAttribute('src'),loaded:document.querySelector('[data-df-qr]').complete&&document.querySelector('[data-df-qr]').naturalWidth>0,rows:[...document.querySelectorAll('.df-tbl dt')].map(x=>x.textContent).join('|'),nofee:document.querySelector('.df-nofee').textContent,sample:!!document.querySelector('.df-sample'),acc:document.querySelector('.df-tbl').textContent})`);
    check(`[${label}] step 2: shows $10, arne's own QR (art/qr/arne.png, loads), bank + account name rows, no invented account number, no-fee box, no SAMPLE banner for a real artist`, s2.amt === '$10' && s2.qr === 'art/qr/arne.png' && s2.loaded && s2.rows === 'ธนาคาร|ชื่อบัญชี' && /100%/.test(s2.nofee) && !s2.sample, s2);
    await b.shot(path.join(shots, `punkui-donate-2-${label}.png`));
    await b.ev(`document.querySelector('[data-go3]').click()`); await sleep(1100);
    const s3 = await b.ev(`({who:document.querySelector('[data-df-who]').textContent,imgInName:!!document.querySelector('.df-poster img'),you:document.querySelector('.df-wall .you').textContent,voice:document.querySelector('.df-voice').textContent,by:document.querySelector('.df-by').textContent,cube:document.querySelectorAll('[data-df-cube] .cc-f').length,circles:!!document.querySelector('[data-df-circles]'),circlesInPoster:!!document.querySelector('.df-poster [data-df-circles]'),qrInPosterOrArtist:!!document.querySelector('[data-df-cqr]'),alert:window.__alerted||false,dots:document.querySelectorAll('.df-floors i.on').length})`);
    check(`[${label}] step 3: the name is escaped (no injected <img>, "$&" kept literally), 3 floors lit`, !s3.imgInName && s3.who.includes('<img') && s3.who.includes('$&') && s3.you.startsWith('<IMG') && s3.dots === 3, s3);
    check(`[${label}] step 3: pull quote is Arne's words for "สาธุ" and labelled "คำของArneเอง"`, s3.voice.includes('ม้าขาวลายดาว') && /คำของArneเอง/.test(s3.by) && /สาธุ/.test(s3.by), s3);
    check(`[${label}] step 3: cube beside the poster; circles box is separate (not inside the poster) and its QR stays hidden until asked`, s3.cube === 6 && s3.circles && !s3.circlesInPoster && !s3.qrInPosterOrArtist, s3);
    await b.shot(path.join(shots, `punkui-donate-3-${label}.png`));
    await b.ev(`document.querySelector('[data-df-sc]').click()`); await sleep(400);
    const c = await b.ev(`({src:document.querySelector('[data-df-cqr]').getAttribute('src'),sample:!!document.querySelector('[data-df-cbox] .df-sample'),artistQr:!!document.querySelector('[data-df-qr]')})`);
    check(`[${label}] circles box: opens circles' own QR (sample-warned) and never shows the artist's`, c.src === 'art/qr-sample.svg' && c.sample && !c.artistQr, c);
    await b.key('Escape', 'Escape', 27); await sleep(300);
    check(`[${label}] Escape closes and removes the dialog`, (await b.ev(`document.querySelectorAll('dialog.df').length`)) === 0);
    check(`[${label}] no console / network errors`, b.logs.length === 0, b.logs);
    b.close();
  }
  /* sample warning + no-payment-details state, unit-level */
  const b = await launch(); await b.lang('th'); await b.view(1280, 900);
  await b.go(`${srv.url}/punk-ui-demo.html`, 2000);
  const u = await b.ev(`(()=>{const out={};let f=CirclesDonateFlow.open({artist:{id:'x',name:'X',support:{bank:'BCEL',name:'SAMPLE',no:'000',qr:'art/qr-sample.svg',sample:true}}});f.el.querySelector('[data-go2]').click();out.sample=!!f.el.querySelector('.df-sample');out.pay=!f.el.querySelector('[data-go3]').disabled;out.noVoice=true;f.el.querySelector('[data-go3]').click();out.noQuote=!f.el.querySelector('.df-voice');out.soon=f.el.querySelector('[data-df-sc]').disabled;f.close();
    f=CirclesDonateFlow.open({artist:{id:'y',name:'Y',support:{}}});f.el.querySelector('[data-go2]').click();out.none=!!f.el.querySelector('[data-df-none]');out.disabled=f.el.querySelector('[data-go3]').disabled;f.close();
    f=CirclesDonateFlow.open({artist:{id:'z',name:'Z',support:{qr:'javascript:alert(1)',no:'1'}}});f.el.querySelector('[data-go2]').click();out.badQr=!f.el.querySelector('[data-df-qr]');f.close();return out})()`);
  check('SAMPLE banner shows for sample payment data; no voice = no pull quote; circles box disabled with no account; no payment details = disabled "I have paid"; javascript: QR rejected', u.sample && u.pay && u.noQuote && u.soon && u.none && u.disabled && u.badQr, u);
  const e = await b.ev(`(()=>{const o={};const el=document.createElement('div');CirclesTimes.front(el,[{title:'<b>t</b>',artist:'A&B',img:'javascript:x',href:'javascript:alert(1)',res:5,added:'2026-10-20'}],{lang:'en'});o.xss=!el.querySelector('b b')&&!/javascript:/.test(el.innerHTML);o.rank=CirclesTimes.rank([{title:'a',res:1,views:9},{title:'b',res:3,views:0,donation:9999},{title:'c',res:3,views:5}]).map(w=>w.title).join('');
    const tk=document.createElement('div');CirclesTimes.ticker(tk,[],{});o.hidden=tk.hidden;const nt=document.createElement('div');CirclesTimes.notices(nt,[1,2,3,4].map(i=>({date:'2026-10-0'+i,en:{h:'h'+i,p:'p'}})),{lang:'en'});o.n=nt.children.length+nt.children[0].querySelector('h4').textContent;return o})()`);
  check('Times: markup and javascript: links escaped; ranking is res, then views (donation field ignored); empty ticker hides; notices cap at 3, newest first', e.xss && e.rank === 'cba' && e.hidden && e.n === '3h4', e);
  b.close();
} finally { srv.close && srv.close(); }
console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
