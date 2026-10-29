#!/usr/bin/env node
// tools/sql-bundle.mjs — prints several migrations as ONE script wrapped in begin/commit, to paste into Supabase → SQL editor.
// If any statement fails, nothing at all is changed (the whole script is one transaction), so a half-migrated database cannot happen.
//
//   node tools/sql-bundle.mjs              migrations 002 to 009 (what a project that only ran 001 needs)
//   node tools/sql-bundle.mjs 4 6          migrations 004 to 006
//   node tools/sql-bundle.mjs | pbcopy     straight to the clipboard on a Mac
// It only prints. Nothing is sent anywhere. Check afterwards with: npm run doctor
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
export function bundle(from = 2, to = 9) {
  const files = fs.readdirSync(dir).filter(f => /^\d{3}_.*\.sql$/.test(f)).sort().filter(f => +f.slice(0, 3) >= from && +f.slice(0, 3) <= to);
  if (!files.length) throw new Error(`no migration between ${from} and ${to} in ${dir}`);
  return `-- circles: migrations ${files.map(f => f.slice(0, 3)).join(', ')} as one transaction (tools/sql-bundle.mjs). Paste into Supabase → SQL editor → Run.\nbegin;\n\n`
    + files.map(f => `-- ======================== ${f} ========================\n${fs.readFileSync(path.join(dir, f), 'utf8').trim()}\n`).join('\n') + '\ncommit;\n';
}
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const [a, b] = process.argv.slice(2).map(Number);
  process.stdout.write(bundle(a || 2, b || 9));
}
