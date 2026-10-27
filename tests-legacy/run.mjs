#!/usr/bin/env node
// node tests-legacy/run.mjs [build|smoke|flow|sample|ux|hd2d|layout|newwave|tower|inline|places|a11y|realmode|live|perf|all]   (tests of the old plain-HTML site, served from the repo root)      (default: everything but live and perf; "all" adds them; live = Supabase artists through merge + build, ~2 min)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tools/browser.mjs';
import {makeChecker} from './check.mjs';
import {demoSite} from './demo.mjs';

const root = process.env.CIRCLES_ROOT ? path.resolve(process.env.CIRCLES_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');   // CIRCLES_ROOT=app/dist runs a suite against the React build
const want = process.argv[2] || 'default';
const names = want === 'all' ? ['build', 'smoke', 'flow', 'sample', 'ux', 'hd2d', 'layout', 'newwave', 'tower', 'inline', 'places', 'a11y', 'realmode', 'live', 'perf'] : want === 'default' ? ['build', 'smoke', 'flow', 'sample', 'ux', 'hd2d', 'layout', 'newwave', 'tower', 'inline', 'places', 'a11y', 'realmode'] : [want];
/* The real circles.js has the live form endpoint and a Turnstile key, and Turnstile refuses 127.0.0.1. The tests drive the email-app path,
   so they get a copy with both emptied (the real file is not touched). */
const circles = !fs.existsSync(path.join(root, 'circles.js')) ? '' : fs.readFileSync(path.join(root, 'circles.js'), 'utf8').replace(/endpoint: '[^']*'/, "endpoint: ''").replace(/turnstileSiteKey: '[^']*'/, "turnstileSiteKey: ''");
/* Most suites test the demo city (the ten sample artists), but the owner's artists.js hides them once the live block says hideDemo, and the build then
   writes the owner's pages only: those suites get a throw-away copy rebuilt with the demo shown (demo.mjs). The others use the real folder. */
const serve = r => startServer(r, circles ? {'/circles.js': () => ({type: 'text/javascript; charset=utf-8', body: circles})} : {});
const DEMO = new Set(['smoke', 'flow', 'sample', 'ux', 'hd2d', 'layout', 'newwave', 'inline', 'places', 'a11y']);
const server = await serve(root);
let demo = null;
let failures = [], passed = 0;
try {
  for (const n of names) {
    const suite = await import(`./suites/${n}.mjs`);
    console.log(`\n== ${suite.name}`);
    const c = makeChecker(suite.name);
    try {
      let r = root, u = server.url;
      if (DEMO.has(n) && !process.env.CIRCLES_ROOT) { demo = demo || await (async () => { const d = demoSite(root); return {root: d, server: d === root ? server : await serve(d)}; })(); r = demo.root; u = demo.server.url; }
      await suite.run({url: u, root: r, check: c.check});
    } catch (e) { c.check(`${suite.name} crashed`, false, String(e.stack || e).slice(0, 400)); }
    failures = failures.concat(c.failures); passed += c.passed;
  }
} finally { server.close(); if (demo && demo.server !== server) demo.server.close(); if (demo && demo.root !== root) fs.rmSync(demo.root, {recursive: true, force: true}); }
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.log('\nFAILED:\n' + failures.map(f => ' - ' + f).join('\n')); process.exit(1); }
