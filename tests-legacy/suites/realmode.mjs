// Launch readiness: the site must work with a real artist and no demo, without invented numbers or pretend steps.
//  A. only the owner on the site (the sample artists hidden): no page throws, the featured list tops itself up, no interview about an artist who is not there
//  B. a real artist (live + real payment details): the donation dialog has no demo banner, no pretend form, records nothing; the like button (made-up count) is hidden
//  C. the sample artists still behave as a demo, and the "artist of the week" picture is the artist the heading names
import fs from 'node:fs';
import path from 'node:path';
import {launch, startServer, sleep} from '../../tools/browser.mjs';
import {demoArtists, demoSite} from '../demo.mjs';
export const name = 'realmode';
const noise = l => /Turnstile|favicon|challenges\.cloudflare|HTTP 404 \S+\/legends\//.test(l);   // a legend picture that `npm run pictures` has not fetched yet is a known warning of npm run check, not part of this promise
export async function run({root, check}) {
  const base = fs.readFileSync(path.join(root, 'artists.js'), 'utf8');
  const ownerOnly = base + '\nARTISTS.splice(0, ARTISTS.length, ...ARTISTS.filter(a => a.id === "arne"));\n';
  const ownerReal = demoArtists(root) + '\n{ const a = ARTISTS.find(x => x.id === "arne"); a.live = true; a.support = {bank: "BCEL", name: "ARNE TEST", no: "111 222 333", qr: "art/qr-sample.svg"}; }\n';
  const serve = body => startServer(root, {'/artists.js': () => ({type: 'text/javascript; charset=utf-8', body})});

  /* ---- A. only the owner ---- */
  let server = await serve(ownerOnly);
  for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
    const b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    const errs = [];
    for (const p of ['index.html', 'highlights.html', 'studio-arne.html', 'profile-arne.html', 'donate.html']) {
      await b.go(`${server.url}/${p}`, p === 'index.html' ? 4500 : 3000);
      if (p === 'index.html') {
        var home = await b.ev("(()=>({buildings:document.querySelectorAll('#strip-in .bd').length,cards:document.querySelectorAll('#masonry .mi').length,allBtnHidden:document.getElementById('all-btn').hidden,spotHidden:!document.getElementById('spotlight'),wave:!!document.querySelector('.fbtn[data-d=\"*wave\"]'),overflowX:document.documentElement.scrollWidth>innerWidth}))()");
      }
      errs.push(...b.logs.filter(l => !noise(l)).map(l => p + ': ' + l.slice(0, 120)));
      b.logs.length = 0;
    }
    check(`${w}px owner only: no page throws (home, highlights, studio, profile, donate)`, errs.length === 0, errs.slice(0, 3));
    check(`${w}px owner only: one building, the three works as featured, no "show all" button, no interview about an absent artist, no empty "new wave" filter, nothing sideways`,
      home.buildings === 1 && home.cards === 3 && home.allBtnHidden && home.spotHidden && !home.wave && !home.overflowX, home);
    b.close();
  }
  server.close();

  /* ---- B + C. a real owner among the sample artists ---- */
  server = await serve(ownerReal);
  const b = await launch(); await b.lang('th'); await b.view(1280, 800, false);
  await b.go(`${server.url}/studio-arne.html?work=0`, 4500);
  const like = await b.ev("(()=>({dealHidden:document.querySelector('.dlg-deal').hidden||getComputedStyle(document.querySelector('.dlg-deal')).display==='none',res:!!document.querySelector('#dlg-res b')&&getComputedStyle(document.getElementById('dlg-res')).display!=='none'}))()");
  check('real artist: the "ถูกใจ" button and its made-up count are not shown on their work', like.dealHidden === true, like);
  await b.ev("document.getElementById('dlg-sup').click()"); await sleep(1200);   // a real artist now gets the 3-step poster window (donate-flow.js), loaded on demand
  const s0 = await b.ev("(()=>{const d=document.querySelector('dialog.df');return {open:!!d&&d.open,old:!!document.querySelector('#dlg-tip[open]'),bricks:d?[...d.querySelectorAll('.df-brick')].map(x=>x.dataset.v).join():'',sample:!!d&&/SAMPLE|ตัวอย่าง \\(SAMPLE\\)/.test(d.innerText)}})()");
  await b.ev("document.querySelector('dialog.df .df-brick[data-v=\"5\"]').click(); document.querySelector('dialog.df [data-go2]').click()"); await sleep(600);
  const s1 = await b.ev("(()=>{const d=document.querySelector('dialog.df');return {amt:(d.querySelector('[data-df-amt]')||{}).textContent,sample:!!d.querySelector('.df-sample')||/SAMPLE/.test(d.innerText),acc:/ARNE TEST/.test(d.innerText)&&/111 222 333/.test(d.innerText),paid:!!d.querySelector('[data-go3]:not([disabled])'),nofee:!!d.querySelector('.df-nofee')}})()");
  await b.ev("document.querySelector('dialog.df [data-go3]').click()"); await sleep(900);
  const s2 = await b.ev("(()=>{const d=document.querySelector('dialog.df');return {form:!!d.querySelector('form'),sample:/SAMPLE|สาธิต|จำลอง|demo/i.test(d.innerText),text:d.querySelector('.df-poster').textContent,note:d.querySelector('.df-poster p[style]').textContent,tips:(()=>{try{return (JSON.parse(localStorage.getItem('circles-sample-v1'))||{}).tips||[]}catch(e){return []}})().length}})()");
  check('real artist: the 3-step window (bricks 2/5/10/25), then the real QR/account name and number with the no-fee box and no demo banner', s0.open && !s0.old && s0.bricks === '2,5,10,25' && !s0.sample && /^110,000 ₭ ?≈ \$5$/.test(s1.amt) && !s1.sample && s1.acc && s1.paid && s1.nofee, {s0, s1});
  check('real artist: after "I have paid" the poster thank-you (no pretend form, no "demo"), says honestly that nothing is passed on (no "the artist confirms" promise), and no made-up tip is stored', !s2.form && !s2.sample && /Arne/.test(s2.text) && /โดยตรง/.test(s2.note) && !/ยืนยันเอง/.test(s2.note) && s2.tips === 0, s2);
  const ds = demoSite(root), dsrv = await startServer(ds);   // the sample artists' pages are redirects in the real folder: use a throw-away copy built with the demo shown
  await b.go(`${dsrv.url}/studio-napha.html?work=0`, 4500);
  await b.ev("document.getElementById('dlg-sup').click()"); await sleep(700);
  await b.ev("document.querySelector('#dlg-tip [data-amt=\"5\"]').click()"); await sleep(600);
  const d1 = await b.ev("(()=>{const d=document.getElementById('dlg-tip');return {sample:/SAMPLE/.test(d.innerText),floor:(d.querySelector('.cdlg-fl')||{}).textContent}})()");
  await b.ev("document.querySelector('#dlg-tip [data-sm-sent]').click()"); await sleep(600);
  const d2 = await b.ev("!!document.querySelector('#dlg-tip form.sm-form')");
  check('sample artist: still the 4-step demo (SAMPLE banner, then the pretend "I have donated" form)', d1.sample && /4/.test(d1.floor) && d2 === true, {d1, d2});
  b.close(); server.close(); dsrv.close(); if (ds !== root) fs.rmSync(ds, {recursive: true, force: true});
}
