// Frame pacing: scroll the page, drag the city, hover buildings; once normally and once with the CPU slowed 4x (a weak laptop).
import {launch, sleep} from '../../tools/browser.mjs';
export const name = 'perf';
export async function run({url, check}) {
  for (const rate of [1, 4]) {
    const b = await launch({gpu: true, throttle: rate}); await b.lang('th'); await b.view(1440, 900);
    const ev = b.ev; let tok = 0;
    const start = () => { tok++; return ev(`window.__f=[];window.__tok=${tok};(function(my){let last=performance.now();(function l(t){if(window.__tok!==my)return;window.__f.push(t-last);last=t;requestAnimationFrame(l)})(last)})(${tok});0`); };
    const stop = async () => { await ev('window.__tok=-1;0'); await sleep(50); return ev(`(()=>{const a=window.__f.slice(3).sort((x,y)=>x-y),n=a.length,s=a.reduce((p,c)=>p+c,0);return {fps:+(1000*n/s).toFixed(1),p95:+a[Math.floor(n*.95)].toFixed(1),slow:a.filter(x=>x>33.4).length,n}})()`); };
    await b.go(`${url}/index.html`, 6000);
    const minFps = rate === 1 ? 55 : 50;
    await start(); await sleep(2500); let r = await stop();
    check(`CPU x${rate}: idle at the Hero ≥ ${minFps} fps (tartan drifts on the compositor)`, r.fps >= minFps, r);
    await start();
    await b.send('Input.synthesizeScrollGesture', {x: 700, y: 500, yDistance: -6000, speed: 1800, gestureSourceType: 'mouse'}); await sleep(900);
    await b.send('Input.synthesizeScrollGesture', {x: 700, y: 500, yDistance: 6000, speed: 2400, gestureSourceType: 'mouse'}); await sleep(900);
    r = await stop(); check(`CPU x${rate}: scrolling the whole page ≥ ${minFps} fps, < 3% dropped frames`, r.fps >= minFps && r.slow / r.n < .03, r);
    await ev("document.getElementById('strip').scrollIntoView({block:'center'});0"); await sleep(1800);
    const y = await ev("Math.round(document.getElementById('strip').getBoundingClientRect().top+200)");
    await start();
    await b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: 900, y, button: 'left', clickCount: 1});
    for (let i = 0; i < 70; i++) { await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: 900 - i * 10, y, button: 'left'}); await sleep(16); }
    await b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: 200, y, button: 'left', clickCount: 1}); await sleep(1200);
    r = await stop(); check(`CPU x${rate}: dragging the city (3 planes, blur, sprites, light, dust) + inertia ≥ ${minFps} fps`, r.fps >= minFps, r);
    await ev("document.getElementById('strip').scrollLeft=600;0"); await sleep(1500); await start(); await sleep(2500);
    r = await stop(); check(`CPU x${rate}: the city idle (people walk, birds fly, dust drifts) ≥ ${minFps} fps`, r.fps >= minFps, r);
    await start();
    for (let i = 0; i < 60; i++) { await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: 200 + (i % 30) * 30, y: y - 20 + (i % 7) * 10}); await sleep(16); }
    r = await stop(); check(`CPU x${rate}: hovering buildings ≥ ${minFps} fps`, r.fps >= minFps, r);
    // the studio page (the tower): idle and scrolling frames must stay smooth too
    await b.go(`${url}/studio-thara.html`, 3500); await ev("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));window.scrollTo(0,300);0"); await sleep(800);
    await start(); await sleep(2500); r = await stop();
    check(`CPU x${rate}: studio page (tower) idle + scrolling ≥ ${minFps} fps`, r.fps >= minFps, r);
    b.close();
  }
}
