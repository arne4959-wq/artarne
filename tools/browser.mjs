// tools/browser.mjs — a tiny static server + headless-Chrome driver (Chrome DevTools Protocol, no npm packages).
// Used by tools/build.mjs and by the tests. Needs Node 22+ (global WebSocket / fetch) and Google Chrome or Chromium.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

export const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon'};

/** Serve `root` over http on a free port. `routes` = {'/path': () => 'html string' | {type, body}} for generated or patched files. Resolves {url, close}. */
export function startServer(root, routes = {}) {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
    if (routes[p]) { const r = routes[p](u), o = typeof r === 'string' ? {type: 'text/html; charset=utf-8', body: r} : r; res.writeHead(200, {'Content-Type': o.type, 'Cache-Control': 'no-store'}); return res.end(o.body); }   // a route returns a string (a page) or {type, body}
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const nf = path.join(root, '404.html');
      res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'}); return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found');
    }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({url: `http://127.0.0.1:${server.address().port}`, close: () => server.close()})));
}

export function findChrome() {
  const c = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  const hit = c.find(x => fs.existsSync(x));
  if (!hit) throw new Error('Chrome not found. Install Google Chrome or set CHROME_PATH=/path/to/chrome');
  return hit;
}

/** Launch headless Chrome and return a page driver. */
export async function launch({gpu = false, throttle = 0} = {}) {
  // port 0 = let Chrome pick a free port, then read it back from DevToolsActivePort (a random fixed port could collide with another Chrome and attach to the wrong browser)
  let chrome, dir, port, tabs;
  for (let attempt = 0; attempt < 3 && !tabs; attempt++) {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'circles-chrome-'));
    const args = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', 'about:blank'];
    if (!gpu) args.unshift('--disable-gpu');
    if (process.env.CHROME_NO_SANDBOX) args.unshift('--no-sandbox');   // CI / root containers only
    chrome = spawn(findChrome(), args, {stdio: 'ignore'});
    for (let i = 0; i < 40 && !tabs; i++) {
      await sleep(250);
      try { port = +fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]; tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch (e) {}
    }
    if (!tabs) { chrome.kill(); try { fs.rmSync(dir, {recursive: true, force: true}); } catch (e) {} }
  }
  if (!tabs) throw new Error('Chrome did not start');
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}, logs = [], reqs = {};
  const handlers = {};
  ws.onmessage = m => { const d = JSON.parse(m.data);
    if (d.method && handlers[d.method]) handlers[d.method](d.params);
    if (d.id && pend[d.id]) pend[d.id](d.result || d.error);
    else if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 220));
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push('CONSOLE.ERROR ' + d.params.args.map(a => a.value || a.description).join(' ').slice(0, 200));
    else if (d.method === 'Network.requestWillBeSent') reqs[d.params.requestId] = d.params.request.url;
    else if (d.method === 'Network.loadingFailed' && !/^mailto:/.test(reqs[d.params.requestId] || '')) logs.push('NETFAIL ' + (reqs[d.params.requestId] || '') + ' ' + d.params.errorText);
    else if (d.method === 'Network.responseReceived' && d.params.response.status >= 400) logs.push('HTTP ' + d.params.response.status + ' ' + d.params.response.url);
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method, params})); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', {cacheDisabled: true});
  if (throttle) await send('Emulation.setCPUThrottlingRate', {rate: throttle});
  const api = {
    logs, send, sleep,
    on: (method, fn) => { handlers[method] = fn; },
    ev: async e => { const r = await send('Runtime.evaluate', {expression: e, returnByValue: true, awaitPromise: true}); if (r.exceptionDetails) return 'EVAL_ERR ' + (r.exceptionDetails.exception?.description || '').slice(0, 200); return r.result?.value; },
    view: async (w, h, touch = false) => { await send('Emulation.setDeviceMetricsOverride', {width: w, height: h, deviceScaleFactor: 1, mobile: touch}); await send('Emulation.setTouchEmulationEnabled', {enabled: touch, maxTouchPoints: 5}); },
    /** make every following page load start in this language, with the intro skipped */
    lang: l => send('Page.addScriptToEvaluateOnNewDocument', {source: `try{localStorage.setItem('circles-lang','${l}');sessionStorage.setItem('circles-seen','1')}catch(e){}`}),
    go: async (url, wait = 3500) => { await send('Page.navigate', {url}); await sleep(wait); },
    shot: async (file, clip) => { const r = await send('Page.captureScreenshot', clip ? {format: 'png', clip: {...clip, scale: 1}} : {format: 'png'}); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
    scrollTo: async (sel, off = 64) => { await api.ev(`(()=>{const e=document.querySelector('${sel}');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-${off})})()`); await sleep(2200); },
    key: async (k, code, vk) => { for (const t of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', {type: t, key: k, code: code || k, windowsVirtualKeyCode: vk || 0}); },
    close: () => { try { ws.close(); } catch (e) {} chrome.kill(); try { fs.rmSync(dir, {recursive: true, force: true}); } catch (e) {} },
  };
  return api;
}
