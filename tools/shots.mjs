#!/usr/bin/env node
// tools/shots.mjs — screenshots of the pages that changed, desktop (1280) and phone (375), into review-shots/.   node tools/shots.mjs [filter]
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from './browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'review-shots');
const want = process.argv[2] || '';
const server = await startServer(ROOT), b = await launch();
const click = sel => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'NOEL ${sel}';e.click();return 'ok'})()`);
const SC = [
  ['profile', 'profile-napha.html', async () => {}],
  ['profile-donate-box', 'profile-napha.html', async () => { await b.scrollTo('#pf-tips', 200); }],
  ['donate-1-amount', 'profile-napha.html', async () => { await click('.pf-sbtn'); await sleep(800); }],
  ['donate-2-scan', 'profile-napha.html', async () => { await click('[data-pf-tip="5"]'); await sleep(900); }],
  ['donate-3-notice', 'profile-napha.html', async () => { await click('[data-pf-tip="5"]'); await sleep(500); await click('[data-sm-sent]'); await sleep(700); }],
  ['donate-4-thanks', 'profile-napha.html', async () => { await click('[data-pf-tip="5"]'); await sleep(500); await click('[data-sm-sent]'); await sleep(500);
    await b.ev(`(()=>{const f=document.querySelector('#dlg-tip form');f.elements.name.value='Mali';f.elements.email.value='a@b.co';f.requestSubmit()})()`); await sleep(1800); }],
  ['support-circles', 'profile-napha.html', async () => { await click('[data-pf-tip="5"]'); await sleep(500); await click('[data-sm-sent]'); await sleep(500);
    await b.ev(`(()=>{const f=document.querySelector('#dlg-tip form');f.elements.name.value='Mali';f.elements.email.value='a@b.co';f.requestSubmit()})()`); await sleep(1800); await click('[data-sc]'); await sleep(800); }],
  ['studio-work-window', 'cutaway.html?id=napha&work=0', async () => { await sleep(1500); }],
  ['studio-hall', 'studio-napha.html', async () => {}],
  ['highlights-works', 'highlights.html', async () => {}],
  ['highlights-concepts', 'highlights.html', async () => { await click('#tab-c'); await sleep(300); }],
  ['highlights-new', 'highlights.html', async () => { await click('#tab-n'); await sleep(300); }],
  ['legends', 'legends.html', async () => {}],
];
try {
  await b.lang('th');
  for (const [w, h, tag] of [[1280, 900, 'desk'], [375, 812, 'phone']]) {
    await b.view(w, h, tag === 'phone');
    for (const [name, url, act] of SC) {
      if (want && !name.includes(want)) continue;
      await b.go(`${server.url}/${url}`, 3500); await act(); await sleep(400);
      await b.shot(path.join(OUT, `${name}-${tag}.png`)); console.log('shot', name, tag);
    }
  }
  console.log('console:', b.logs.filter(l => !/favicon|Turnstile|cloudflare/.test(l)).join('\n') || 'clean');
} finally { b.close(); server.close(); }
