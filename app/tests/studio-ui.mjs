// studio-ui.mjs — the React studio page on its own in headless Chrome (desktop + phone): the hall, the artwork window, zoom, donate, no shop. Takes screenshots.
// Needs `npm run app:build` first. Usage: node app/tests/studio-ui.mjs [folder for screenshots]   (default: screenshots/ in the project)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), DIST = path.resolve(HERE, '..', 'dist'), OUT = path.resolve(process.argv[2] || path.join(HERE, '..', '..', 'screenshots'));
fs.mkdirSync(OUT, {recursive: true});
let bad = 0;
const check = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ' + extra}`); };
const srv = await startServer(DIST), b = await launch();
await b.send('Network.setBlockedURLs', {urls: ['*challenges.cloudflare.com*']});
const ev = b.ev;
try {
  for (const [w, h, touch, vp] of [[1280, 900, false, 'desktop'], [375, 812, true, 'phone']]) {
    await b.view(w, h, touch);
    await ev(`try{localStorage.clear()}catch(e){}`);
    await b.go(`${srv.url}/studio-napha.html?lang=en`, 2800);
    const s = n => path.join(OUT, `react-studio-${n}-${vp}.png`);
    check(`${vp}: no sideways scroll`, await ev(`document.documentElement.scrollWidth <= innerWidth`));
    check(`${vp}: the hall is there with its 3 works, door-to-end plan and controls`, await ev(`document.querySelectorAll('#mus .mus-art').length === 3 && !!document.querySelector('.mus-map') && !!document.getElementById('mus-next') && document.getElementById('mus-cnt').textContent === '1 / 3'`));
    check(`${vp}: the hint matches the device (${touch ? 'swipe' : 'arrow keys'})`, await ev(`document.querySelector('.hint').dataset.t === '${touch ? 'hint_swipe' : 'mus_hint'}'`));
    check(`${vp}: the stage sits inside the screen`, await ev(`(() => { const r = document.getElementById('mus-stage').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.height > 200; })()`));
    check(`${vp}: nothing to buy anywhere on the page`, await ev(`!/\\$\\s?\\d|฿|price|add to cart|checkout|ซื้อ/i.test(document.querySelector('main').textContent) && !document.querySelector('[data-buy],.buy,.price')`));
    await ev(`document.getElementById('mus-stage').scrollIntoView()`); await sleep(500);
    await b.shot(s('hall'));
    await ev(`document.getElementById('mus-next').click()`); await sleep(1500); await b.shot(s('hall-next'));
    await ev(`document.getElementById('mus-prev').click()`); await sleep(1300);

    await ev(`document.querySelector('.mus-more').click()`); await sleep(700);
    check(`${vp}: the window is a concrete room (beam, room sign, hazard footing, taped picture)`, await ev(`(() => { const d = document.getElementById('dlg'); return d.open && !!d.querySelector('.cdlg-h .cdlg-x') && /01/.test(d.querySelector('.wd-room').textContent) && !!d.querySelector('.cdlg-foot') && !!d.querySelector('.dlg-tape'); })()`));
    check(`${vp}: "written by the artist" badge and the artist's own words`, await ev(`(() => { const d = document.getElementById('dlg'); return /written by the artist/i.test((d.querySelector('.v-stamp') || {}).textContent || '') && d.querySelectorAll('.v-rows dd').length === 2 && !!d.querySelector('.v-say') && !!d.querySelector('.v-note'); })()`));
    check(`${vp}: the window fits the screen width`, await ev(`(() => { const r = document.getElementById('dlg').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; })()`));
    await b.shot(s('window'));
    await ev(`document.getElementById('dlg').scrollTo(0, 560)`); await sleep(300); await b.shot(s('window-lower'));
    await ev(`document.getElementById('dlg').scrollTo(0, 0)`);

    const res = async () => ev(`[document.getElementById('dlg-res').getAttribute('aria-pressed'), document.querySelector('#dlg-res b').textContent]`);
    const [p0, c0] = await res(); await ev(`document.getElementById('dlg-res').click()`); await sleep(150); const [p1, c1] = await res();
    check(`${vp}: Resonated toggles and adds one`, p0 === 'false' && p1 === 'true' && +c1 === +c0 + 1, JSON.stringify([p0, c0, p1, c1]));
    check(`${vp}: Resonated is kept for this browser (an artist's other work is not touched)`, await ev(`JSON.parse(localStorage.getItem('circles-res-v1'))['napha:0'] === 1 && !('napha:1' in JSON.parse(localStorage.getItem('circles-res-v1')))`));

    await ev(`document.querySelector('#dlg-frame .zoom-btn').click()`); await sleep(500);
    check(`${vp}: zoom opens full screen and closes with Escape`, await ev(`document.getElementById('dlg-zoom').open && document.querySelector('#dlg-zoom .zm-img').complete`));
    await b.shot(s('zoom'));
    await b.key('Escape', 'Escape', 27); await sleep(400);
    check(`${vp}: zoom is gone after Escape`, await ev(`!document.getElementById('dlg-zoom')`));
    // (a script-made click gives Chrome no user activation, so one Escape may close both stacked windows; a real person's click does not. Open the window again to go on.)
    if (!(await ev(`document.getElementById('dlg').open`))) { await ev(`document.querySelector('.mus-more').click()`); await sleep(500); }
    await ev(`document.getElementById('dlg-sup').click()`); await sleep(700);
    check(`${vp}: the quiet donate link opens the donation to the artist, naming the work (not the circles gift)`, await ev(`(() => { const d = document.getElementById('dlg-tip'); return d.open && /Napha/.test(d.querySelector('h2').textContent) && /Morning Fog/.test((d.querySelector('.sm-for') || {}).textContent || '') && !document.getElementById('dlg-sc'); })()`));
    await b.shot(s('window-donate'));
    await b.key('Escape', 'Escape', 27); await sleep(300); await b.key('Escape', 'Escape', 27); await sleep(400);
    check(`${vp}: Escape closes the donation, then the window, and ?work leaves the address`, await ev(`!document.getElementById('dlg-tip').open && !document.getElementById('dlg').open && !/work=/.test(location.search)`));

    await b.go(`${srv.url}/studio-thara.html?lang=th&work=0`, 2800);
    check(`${vp}: a work with a concept shows the concept block`, await ev(`!document.getElementById('dlg-concept').hidden && document.querySelector('#dlg-concept .cc-card') !== null`));
    await ev(`document.getElementById('dlg').scrollTo(0, 99999)`); await sleep(300); await b.shot(s('window-concept-th'));
  }
  console.log('console:', b.logs.filter(l => !/favicon|cloudflare/.test(l)).join('\n') || 'clean');
  check('console is clean', !b.logs.filter(l => !/favicon|cloudflare/.test(l)).length);
} finally { b.close(); srv.close(); }
console.log(bad ? `\n${bad} failed` : '\nall passed');
process.exit(bad ? 1 : 0);
