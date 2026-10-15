#!/usr/bin/env node
// node tests-legacy/run.mjs [build|smoke|flow|sample|ux|hd2d|layout|newwave|inline|places|perf|all]   (tests of the old plain-HTML site, served from the repo root)      (default: build + smoke + flow; "all" adds perf)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tools/browser.mjs';
import {makeChecker} from './check.mjs';

const root = process.env.CIRCLES_ROOT ? path.resolve(process.env.CIRCLES_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');   // CIRCLES_ROOT=app/dist runs a suite against the React build
const want = process.argv[2] || 'default';
const names = want === 'all' ? ['build', 'smoke', 'flow', 'sample', 'ux', 'hd2d', 'layout', 'newwave', 'inline', 'places', 'perf'] : want === 'default' ? ['build', 'smoke', 'flow', 'sample', 'ux', 'hd2d', 'layout', 'newwave', 'inline', 'places'] : [want];
/* The real circles.js has the live form endpoint and a Turnstile key, and Turnstile refuses 127.0.0.1. The tests drive the email-app path,
   so they get a copy with both emptied (the real file is not touched). */
const circles = !fs.existsSync(path.join(root, 'circles.js')) ? '' : fs.readFileSync(path.join(root, 'circles.js'), 'utf8').replace(/endpoint: '[^']*'/, "endpoint: ''").replace(/turnstileSiteKey: '[^']*'/, "turnstileSiteKey: ''");
const server = await startServer(root, circles ? {'/circles.js': () => ({type: 'text/javascript; charset=utf-8', body: circles})} : {});
let failures = [], passed = 0;
try {
  for (const n of names) {
    const suite = await import(`./suites/${n}.mjs`);
    console.log(`\n== ${suite.name}`);
    const c = makeChecker(suite.name);
    try { await suite.run({url: server.url, root, check: c.check}); } catch (e) { c.check(`${suite.name} crashed`, false, String(e.stack || e).slice(0, 400)); }
    failures = failures.concat(c.failures); passed += c.passed;
  }
} finally { server.close(); }
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.log('\nFAILED:\n' + failures.map(f => ' - ' + f).join('\n')); process.exit(1); }
