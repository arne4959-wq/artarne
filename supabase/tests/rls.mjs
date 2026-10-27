// RLS tests for supabase/migrations/001..008, run in an in-memory Postgres (PGlite) with a small stand-in for Supabase's auth and storage schemas.
// Run:  npm i --no-save --prefix supabase/tests @electric-sql/pglite     (once)
//       node supabase/tests/rls.mjs
// (`npx -p @electric-sql/pglite node ...` does NOT work: ES modules look for packages next to the file, not in npx's cache.)
// It checks the policies and constraints, and that every column the artist dashboard writes (app/src/lib/manage.js) is allowed by the grants.
// It is NOT the real Supabase: re-run the checks in README.md once on your project.
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
const db = new PGlite();
const A='00000000-0000-0000-0000-00000000000a', B='00000000-0000-0000-0000-00000000000b', C='00000000-0000-0000-0000-00000000000c', ADM='00000000-0000-0000-0000-0000000000ad';
const PRELUDE = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb default '{}');
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid() primary key, bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
grant usage on schema auth, storage, public to anon, authenticated, service_role;
grant execute on function auth.jwt(), auth.uid(), storage.foldername(text) to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to authenticated;
insert into auth.users(id,email) values ('${A}','a@x.co'),('${B}','b@x.co'),('${C}','c@x.co'),('${ADM}','admin@x.co');
`;   // the stand-in for Supabase's auth / storage / roles, reused for the bundle checks at the end
await db.exec(PRELUDE);
await db.exec(fs.readFileSync(new URL('../migrations/001_init.sql', import.meta.url),'utf8'));
await db.exec(fs.readFileSync(new URL('../migrations/002_payment_notices.sql', import.meta.url),'utf8'));
await db.exec(fs.readFileSync(new URL('../migrations/003_donations.sql', import.meta.url),'utf8'));
for (const f of ['004_artist_tells', '005_artist_photo', '006_work_rules', '007_work_process', '008_payment_check']) await db.exec(fs.readFileSync(new URL(`../migrations/${f}.sql`, import.meta.url),'utf8'));
console.log('migrations applied (001-008)');
let pass=0, fail=0;
const as = async (who, sql, params) => {   // who: null=postgres, 'anon', uid, 'admin'; params: optional $1.. values
  await db.exec('reset role; select set_config(\'request.jwt.claims\', \'\', false)');
  if (who==='anon') await db.exec("set role anon");
  else if (who) { const claims = who===ADM ? {sub:ADM, app_metadata:{role:'admin'}} : {sub:who}; await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]); await db.exec('set role authenticated'); }
  try { const r = await db.query(sql, params); return {rows:r.rows, n:r.affectedRows ?? r.rows.length}; } catch(e) { return {err:e.message}; }
  finally { await db.exec('reset role'); }
};
const ok = (name, cond, extra='') => { cond ? pass++ : fail++; console.log((cond?'  ✓ ':'  ✗ ')+name+(cond?'':'  '+extra)); };
// seed as owner/service
await as(null, `insert into artists(id,user_id,name,disc,city,approved) values ('art-a',  '${A}','A','d','c',true),('art-b','${B}','B','d','c',true),('art-c','${C}','C','d','c',false)`);
await as(null, `insert into artist_private(artist_id,email) values ('art-a','a@secret.co'),('art-b','b@secret.co')`);
await as(null, `insert into works(artist_id,position,title,price_usd) values ('art-a',0,'a0',100),('art-a',1,'a1',200),('art-b',0,'b0',300),('art-c',0,'c0',50)`);
await as(null, `insert into artist_payment(artist_id,account_name,account_no,checked) values ('art-a','A','123',true),('art-c','C','999',true)`);

let r;
r = await as('anon','select id from artists order by id'); ok('anon sees only approved artists', JSON.stringify(r.rows.map(x=>x.id))==='["art-a","art-b"]', JSON.stringify(r));
r = await as('anon','select user_id from artists'); ok('anon cannot read user_id', !!r.err, JSON.stringify(r));
r = await as('anon','select * from artists'); ok('anon select * is refused (includes user_id)', !!r.err);
r = await as('anon','select email from artist_private'); ok('anon cannot read e-mail', !!r.err);
r = await as('anon','select title from works order by title'); ok('anon sees works of approved artists only', JSON.stringify(r.rows.map(x=>x.title))==='["a0","a1","b0"]', JSON.stringify(r));
r = await as('anon','select artist_id from artist_payment'); ok('anon sees payment info of approved artists only', JSON.stringify(r.rows.map(x=>x.artist_id))==='["art-a"]', JSON.stringify(r));
r = await as('anon',"update works set price_usd=1"); ok('anon cannot write works', !!r.err || r.n===0, JSON.stringify(r));
r = await as('anon',"insert into artists(id,name,disc,city) values ('hack-x','x','d','c')"); ok('anon cannot create artists', !!r.err);

r = await as(A,"select id from artists order by id"); ok('artist A sees approved artists (not C unapproved)', JSON.stringify(r.rows.map(x=>x.id))==='["art-a","art-b"]', JSON.stringify(r));
r = await as(C,"select id from artists order by id"); ok('artist C sees own unapproved artist too', JSON.stringify(r.rows.map(x=>x.id))==='["art-a","art-b","art-c"]', JSON.stringify(r));
r = await as(A,"select artist_id from artist_private"); ok('A reads only own e-mail row', JSON.stringify(r.rows.map(x=>x.artist_id))==='["art-a"]', JSON.stringify(r));
r = await as(A,"update artists set name='A2' where id='art-a' returning id"); ok('A edits own profile', r.n===1, JSON.stringify(r));
r = await as(A,"update artists set name='hacked' where id='art-b' returning id"); ok('A cannot edit B profile', r.n===0, JSON.stringify(r));
r = await as(A,"update artists set approved=false where id='art-a'"); ok('A cannot change approved', !!r.err, JSON.stringify(r));
r = await as(C,"update artists set approved=true where id='art-c'"); ok('C cannot approve self', !!r.err, JSON.stringify(r));
r = await as(A,"update artists set user_id='"+B+"' where id='art-a'"); ok('A cannot hand profile to someone else', !!r.err, JSON.stringify(r));
r = await as(A,"update artists set demo=true where id='art-a'"); ok('A cannot set demo flag', !!r.err, JSON.stringify(r));
r = await as(A,"insert into artists(id,user_id,name,disc,city) values ('new-art','"+A+"','n','d','c')"); ok('A cannot create artists', !!r.err, JSON.stringify(r));
r = await as(A,"delete from artists where id='art-a'"); ok('A cannot delete artist', !!r.err || r.n===0, JSON.stringify(r));
r = await as(A,"insert into works(artist_id,position,title,price_usd) values ('art-a',2,'a2',10) returning id"); ok('A adds own work', r.n===1, JSON.stringify(r));
r = await as(A,"insert into works(artist_id,position,title,price_usd) values ('art-b',5,'evil',10)"); ok('A cannot add work to B', !!r.err, JSON.stringify(r));
r = await as(A,"update works set status='sold' where artist_id='art-a' and position=0 returning id"); ok('nothing is sold any more: a non-empty works.status is refused (003)', !!r.err, JSON.stringify(r));
r = await as(A,"insert into works(artist_id,position,title) values ('art-a',3,'no price') returning id"); ok('a work needs no price any more (003)', r.n===1, JSON.stringify(r));
r = await as(A,"update works set artist_id='art-b' where artist_id='art-a' and position=1"); ok('A cannot move work to B', !!r.err || r.n===0, JSON.stringify(r));
r = await as(A,"update works set status='bogus' where artist_id='art-a'"); ok('bad status rejected', !!r.err);
r = await as(A,"update works set price_usd=-5 where artist_id='art-a'"); ok('negative price rejected', !!r.err);
r = await as(A,"update works set pay='http://x.co' where artist_id='art-a'"); ok('non-https pay link rejected', !!r.err);
r = await as(A,"update works set pay='https://x' where artist_id='art-a'"); ok('hostless pay link rejected', !!r.err);
r = await as(A,"update works set position = case position when 0 then 1 when 1 then 0 else position end where artist_id='art-a' and position in (0,1)"); ok('one-statement reorder swaps positions', !r.err, JSON.stringify(r));
r = await as(A,"update works set position=1 where artist_id='art-a' and position=2"); ok('duplicate position rejected', !!r.err);
r = await as(A,"insert into artist_private(artist_id,email) values ('art-b','steal@x.co')"); ok('A cannot write B e-mail', !!r.err);
r = await as(A,"update artist_private set email='new@a.co' where artist_id='art-a' returning artist_id"); ok('A updates own e-mail', r.n===1, JSON.stringify(r));
r = await as(A,"update artist_private set email='not-an-email' where artist_id='art-a'"); ok('bad e-mail rejected', !!r.err);
r = await as(A,"insert into artist_payment(artist_id,account_name) values ('art-b','x')"); ok('A cannot write B payment', !!r.err);
r = await as(A,"insert into storage.objects(bucket_id,name) values ('art','art-a/x.png') returning id"); ok('A uploads to own folder', r.n===1, JSON.stringify(r));
r = await as(A,"insert into storage.objects(bucket_id,name) values ('art','art-b/x.png')"); ok('A cannot upload into B folder', !!r.err);
r = await as(A,"insert into storage.objects(bucket_id,name) values ('slips','art-a/s.png')"); ok('A cannot upload slips (service role only)', !!r.err);
r = await as('anon',"insert into storage.objects(bucket_id,name) values ('art','art-a/y.png')"); ok('anon cannot upload', !!r.err);
for (let i=3;i<=40;i++) await as(null,`insert into works(artist_id,position,title,price_usd) values ('art-a',${i+10},'f${i}',1)`).then(x=>{ if(x.err && i<39) console.log('seed err',i,x.err); });
r = await as(A,"insert into works(artist_id,position,title,price_usd) values ('art-a',99,'over',1)"); ok('41st work refused', !!r.err, JSON.stringify(r));

r = await as(ADM,"update artists set approved=true where id='art-c' returning id"); ok('admin approves', r.n===1, JSON.stringify(r));
r = await as(ADM,"insert into artists(id,name,disc,city) values ('admin-made','n','d','c') returning id"); ok('admin creates artist', r.n===1, JSON.stringify(r));
r = await as(ADM,"select email from artist_private"); ok('admin reads e-mails', r.rows?.length===2, JSON.stringify(r));
r = await as(null,"update artists set approved=false where id='art-c' returning id"); ok('service/superuser path still works', r.n===1, JSON.stringify(r));

// ---- payment notices (002) are retired by 003 ----
await as(null, `insert into payment_notices(artist_id,work_id,buyer_name,buyer_email,price_usd,status)
  select 'art-a', id, 'Old Buyer', 'old@x.co', 100, 'new' from works where artist_id='art-a' and position=0 limit 1`);
r = await as(A,'select * from payment_notices'); ok('retired: an artist can no longer see payment notices', !r.err && r.n===0, JSON.stringify(r));
r = await as(ADM,'select count(*)::int as n from payment_notices'); ok('retired: the admin can still read the history', r.rows?.[0]?.n===1, JSON.stringify(r));

// ---- donation notices (003) ----
await as(null, `insert into donation_notices(artist_id,work_id,donor_name,donor_email,amount)
  select 'art-a', id, 'Donor One', 'd1@x.co', 5 from works where artist_id='art-a' and position=0 limit 1`);
await as(null, `insert into donation_notices(artist_id,donor_name,donor_email,amount,currency) values ('art-b','Donor Two','d2@x.co',20,'LAK')`);
r = await as('anon','select * from donation_notices'); ok('anon cannot read donation notices', !!r.err);
r = await as('anon',"insert into donation_notices(artist_id,donor_name,donor_email,amount) values ('art-a','x','x@x.co',5)"); ok('anon cannot create a donation notice (only the Edge Function can)', !!r.err);
r = await as(A,'select donor_name from donation_notices'); ok('A sees only own donation notices', JSON.stringify(r.rows.map(x=>x.donor_name))==='["Donor One"]', JSON.stringify(r));
r = await as(A,"insert into donation_notices(artist_id,donor_name,donor_email,amount) values ('art-a','fake','f@x.co',5)"); ok('an artist cannot create donation notices either', !!r.err);
r = await as(A,"update donation_notices set status='confirmed' where artist_id='art-a' returning id"); ok('A confirms own donation', r.n===1, JSON.stringify(r));
r = await as(A,"update donation_notices set status='rejected' where artist_id='art-b'"); ok('A cannot decide B donation', !!r.err || r.n===0, JSON.stringify(r));
r = await as(A,"update donation_notices set donor_email='steal@x.co' where artist_id='art-a'"); ok('A cannot edit the donor data', !!r.err, JSON.stringify(r));
r = await as(A,"update donation_notices set amount=999 where artist_id='art-a'"); ok('A cannot edit the amount', !!r.err, JSON.stringify(r));
r = await as(A,"update donation_notices set status='paid' where artist_id='art-a'"); ok('bad donation status rejected', !!r.err);
r = await as(A,"delete from donation_notices where artist_id='art-a'"); ok('A cannot delete donation notices', !!r.err || r.n===0, JSON.stringify(r));
r = await as(ADM,'select count(*)::int as n from donation_notices'); ok('admin sees all donation notices', r.rows[0].n===2, JSON.stringify(r));
r = await as(null,"insert into donation_notices(artist_id,donor_name,donor_email,amount) values ('art-a','x','not-an-email',5)"); ok('bad donor e-mail rejected', !!r.err);
r = await as(null,"insert into donation_notices(artist_id,donor_name,donor_email,amount) values ('art-a','x','x@x.co',0)"); ok('amount below 1 rejected', !!r.err);
r = await as(null,"insert into donation_notices(artist_id,donor_name,donor_email,amount) values ('art-a','x','x@x.co',1001)"); ok('amount above 1000 rejected', !!r.err);
r = await as(null,"insert into donation_notices(artist_id,donor_name,donor_email,amount,currency) values ('art-a','x','x@x.co',5,'EUR')"); ok('unknown currency rejected', !!r.err);
r = await as(null,"insert into donation_notices(artist_id,donor_name,donor_email,amount,slip_path) values ('art-a','x','x@x.co',5,'../etc/passwd')"); ok('bad slip path rejected', !!r.err);
r = await as(null,"delete from works where artist_id='art-a' and position=0"); ok('deleting the inspiring work keeps the donation notice', r.n===1 && (await as(ADM,"select count(*)::int as n from donation_notices where artist_id='art-a' and work_id is null")).rows[0].n===1, JSON.stringify(r));
// ---- 004 (the artist tells it), 005 (profile photo), 006 (work rules) ----
await as(null, "delete from works where artist_id='art-a' and position >= 10");   // clear the 40-work seed from the limit test above
r = await as(A,"insert into works(artist_id,position,title,say,why,look,say_en,rights_confirmed_at) values ('art-a',60,'told','one line','because','look here','one line, en',now()) returning id"); ok('A adds a work with say / why / look and the own-work tick (004, 006)', r.n===1, JSON.stringify(r));
r = await as(A,"insert into works(artist_id,position,title,say) values ('art-a',61,'long say',repeat('x',301))"); ok('a say longer than 300 characters is refused (004)', !!r.err);
r = await as(A,"update works set why=repeat('y',1501) where artist_id='art-a' and position=60"); ok('a why longer than 1500 characters is refused (004)', !!r.err);
r = await as(A,"update works set look='look again', look_lo='ຕື່ມ' where artist_id='art-a' and position=60 returning id"); ok('A edits look / look_lo (004)', r.n===1, JSON.stringify(r));
r = await as('anon',"select say, why, look from works where artist_id='art-a' and position=60"); ok('visitors read the artist words (004)', r.rows?.length===1 && r.rows[0].say==='one line', JSON.stringify(r));

r = await as('anon',"select photo from artists where id='art-a'"); ok('anon can read artists.photo (005)', !r.err, JSON.stringify(r));
r = await as(A,"update artists set photo='https://x.co/me.webp' where id='art-a' returning id"); ok('A sets own photo (005)', r.n===1, JSON.stringify(r));
r = await as(A,"update artists set photo='http://x.co/me.webp' where id='art-a'"); ok('a non-https photo is refused (005)', !!r.err);
r = await as(A,"update artists set photo='https://x.co/b.webp' where id='art-b' returning id"); ok('A cannot set the photo of B (005)', !!r.err || r.n===0, JSON.stringify(r));

r = await as(A,"insert into works(artist_id,position,title,hidden) values ('art-a',62,'sneaky',true)"); ok('A cannot insert an already hidden work (006)', !!r.err, JSON.stringify(r));
r = await as(A,"update works set hidden=true where artist_id='art-a' and position=60"); ok('A cannot hide a work with a plain update (006)', !!r.err, JSON.stringify(r));
r = await as(A,"select admin_set_work_hidden(id, true) from works where artist_id='art-a' and position=60"); ok('an artist cannot call admin_set_work_hidden (006)', !!r.err, JSON.stringify(r));
r = await as('anon',"select admin_set_work_hidden(id, true) from works where artist_id='art-a' and position=60"); ok('anon cannot call admin_set_work_hidden (006)', !!r.err, JSON.stringify(r));
r = await as(ADM,"select admin_set_work_hidden(id, true) from works where artist_id='art-a' and position=60"); ok('the admin hides a work (006)', !r.err, JSON.stringify(r));
r = await as('anon',"select title from works where artist_id='art-a' and position=60"); ok('visitors no longer get a hidden work (006)', !r.err && r.rows.length===0, JSON.stringify(r));
r = await as(B,"select title from works where artist_id='art-a' and position=60"); ok('another artist does not get it either (006)', !r.err && r.rows.length===0, JSON.stringify(r));
r = await as(A,"select hidden from works where artist_id='art-a' and position=60"); ok('the owner still sees the hidden work, marked hidden (006)', r.rows?.length===1 && r.rows[0].hidden===true, JSON.stringify(r));
r = await as(A,"update works set title='renamed' where artist_id='art-a' and position=60 returning id"); ok('the owner can still edit a hidden work (006)', r.n===1, JSON.stringify(r));
r = await as(A,"update works set hidden=false where artist_id='art-a' and position=60"); ok('the owner cannot un-hide it (006)', !!r.err, JSON.stringify(r));
r = await as(ADM,"select admin_set_work_hidden(id, false) from works where artist_id='art-a' and position=60"); ok('the admin can un-hide it (006)', !r.err, JSON.stringify(r));
r = await as('anon',"select title from works where artist_id='art-a' and position=60"); ok('and visitors get it back (006)', r.rows?.length===1, JSON.stringify(r));
r = await as(A,"update works set artist_id='art-b' where artist_id='art-a' and position=60"); ok('A cannot move a work to another artist (006: artist_id is not an updatable column)', !!r.err || r.n===0, JSON.stringify(r));
r = await as(A,"update works set created_at=now() - interval '1 year' where artist_id='art-a' and position=60"); ok('A cannot rewrite created_at (006)', !!r.err, JSON.stringify(r));

// The contract with the dashboard: every column app/src/lib/manage.js writes must be granted. Add a form field and forget the grant, and these fail.
const M = await import('../../app/src/lib/manage.js');
const cast = {timeline: '::jsonb', colors: '::text[]'};
const val = (k, v) => k === 'colors' ? `{${v.map(x => `"${x}"`).join(',')}}` : k === 'timeline' ? JSON.stringify(v) : v;
const setSql = row => Object.keys(row).map((k, i) => `${k} = $${i + 1}${cast[k] || ''}`).join(', ');
const vals = row => Object.keys(row).map(k => val(k, row[k]));
const prof = M.formToProfile(M.profileToForm({name: 'A three', name_en: 'A3', name_lo: 'A3', disc: 'collage', city: 'Vientiane', since: 2020, instagram: 'https://instagram.com/a', photo: 'https://x.co/a.webp', kind: 'tower', scale: 1.1, colors: ['#112233', '#445566', '#778899'], bio: 'b', bio_en: 'b', bio_lo: 'b', tagline: 't', tagline_en: 't', concept: 'c', concept_en: 'c', timeline: [{y: 2020, t: 'start', tEn: 'start'}]})).update;
r = await as(A, `update artists set ${setSql(prof)} where id='art-a' returning id`, vals(prof)); ok(`the profile save of the dashboard is allowed (${Object.keys(prof || {}).length} columns)`, !!prof && r.n===1, JSON.stringify(r));
const wf = M.emptyWork(); for (const [k] of M.WORK_TEXT) wf[k] = 'x'; Object.assign(wf, {year: '2026', ar: '4/5', img: 'https://x.co/a.webp'});
const wr = M.formToWork(wf).row, ins = {...wr, rights_confirmed_at: new Date().toISOString(), artist_id: 'art-a', position: 70};
r = await as(A, `insert into works(${Object.keys(ins).join(',')}) values (${Object.keys(ins).map((_, i) => '$' + (i + 1)).join(',')}) returning id`, Object.values(ins)); ok(`the new-work insert of the dashboard is allowed (${Object.keys(ins).length} columns)`, r.n===1, JSON.stringify(r));
r = await as(A, `update works set ${setSql(wr)} where artist_id='art-a' and position=70 returning id`, vals(wr)); ok(`the work update of the dashboard is allowed (${Object.keys(wr).length} columns)`, r.n===1, JSON.stringify(r));
r = await as(A, "delete from works where artist_id='art-a' and position=70 returning id"); ok('A deletes own work', r.n===1, JSON.stringify(r));
const pay = M.formToPayment({bank: 'BCEL', account_name: 'A A', account_no: '123 456 789'}).row;
r = await as(A, "insert into artist_payment(artist_id,bank,account_name,account_no,qr_path) values ('art-a',$1,$2,$3,'art-a/qr1.png') on conflict (artist_id) do update set bank=excluded.bank, account_name=excluded.account_name, account_no=excluded.account_no, qr_path=excluded.qr_path returning artist_id", [pay.bank, pay.account_name, pay.account_no]); ok('the payment upsert of the dashboard is allowed', r.n===1, JSON.stringify(r));
r = await as(A, "insert into artist_private(artist_id,email) values ('art-a','a@y.co') on conflict (artist_id) do update set email=excluded.email returning artist_id"); ok('the e-mail upsert of the dashboard is allowed', r.n===1, JSON.stringify(r));
// ---- 008: a new or changed account is hidden from visitors until an admin checks it ----
r = await as('anon',"select artist_id from artist_payment where artist_id='art-a'"); ok('008: the account A just changed is hidden from visitors', r.rows && r.rows.length===0, JSON.stringify(r));
r = await as(A,"select checked from artist_payment where artist_id='art-a'"); ok('008: A still sees it (not checked yet)', r.rows?.[0]?.checked===false, JSON.stringify(r));
r = await as(A,"update artist_payment set checked=true where artist_id='art-a'"); r = await as(null,"select checked from artist_payment where artist_id='art-a'"); ok('008: A cannot tick it themselves', r.rows?.[0]?.checked===false, JSON.stringify(r));
r = await as(ADM,"update artist_payment set checked=true where artist_id='art-a' returning artist_id"); ok('008: the admin checks it', r.n===1, JSON.stringify(r));
r = await as('anon',"select artist_id from artist_payment where artist_id='art-a'"); ok('008: then visitors see it', r.rows?.length===1, JSON.stringify(r));
r = await as(A,"update artist_payment set account_name='still A' where artist_id='art-a'"); r = await as('anon',"select artist_id from artist_payment where artist_id='art-a'"); ok('008: any later change hides it again', r.rows?.length===0, JSON.stringify(r));
const dn = cur => `insert into donation_notices(artist_id,donor_name,donor_email,amount,currency) values ('art-a','D','d@x.co',${cur})`;
r = await as(null, dn("50000,'LAK'")); ok('008: a 50,000 kip notice is allowed', !r.err, JSON.stringify(r));
r = await as(null, dn("1001,'USD'")); ok('008: still at most 1000 dollars', !!r.err, JSON.stringify(r));
r = await as(null, dn("22000001,'LAK'")); ok('008: and at most 22,000,000 kip', !!r.err, JSON.stringify(r));
// ---- tools/seed-sql.mjs: the owner's building from artists.js goes into the database in one clean transaction ----
const {spawnSync} = await import('node:child_process'), {fileURLToPath} = await import('node:url');
const seed = spawnSync(process.execPath, [fileURLToPath(new URL('../../tools/seed-sql.mjs', import.meta.url)), 'arne', 'owner@x.co', '--admin'], {encoding: 'utf8'});
ok('seed-sql prints SQL for the owner building (and refuses sample artists)', seed.status === 0 && /do \$seed\$/.test(seed.stdout) && spawnSync(process.execPath, [fileURLToPath(new URL('../../tools/seed-sql.mjs', import.meta.url)), 'napha', 'owner@x.co'], {encoding: 'utf8'}).status === 1, seed.stderr);
const run = async sql => { await db.exec('reset role'); try { await db.exec(sql); return {}; } catch (e) { return {err: e.message}; } };
r = await run(seed.stdout); ok('seed-sql stops with a clear message while the login does not exist yet', /no login for owner@x\.co/.test(r.err || ''), JSON.stringify(r));
await as(null, "insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000f1','owner@x.co')");
r = await run(seed.stdout); ok('seed-sql runs cleanly once the login exists', !r.err, JSON.stringify(r));
r = await as(null, "select (select count(*)::int from artists where id='arne' and approved and user_id='00000000-0000-0000-0000-0000000000f1') as a, (select count(*)::int from works where artist_id='arne' and rights_confirmed_at is not null) as w, (select raw_app_meta_data->>'role' from auth.users where email='owner@x.co') as role, (select email from artist_private where artist_id='arne') as mail");
ok('seed-sql: the building is approved and linked to the login, its works carry the own-work tick, the login is admin, the e-mail is private', r.rows?.[0]?.a === 1 && r.rows[0].w >= 1 && r.rows[0].role === 'admin' && r.rows[0].mail === 'owner@x.co', JSON.stringify(r));
r = await as('anon', "select count(*)::int as n from works where artist_id='arne' and img like 'art/%'"); ok('seed-sql: visitors can read the seeded works', r.rows?.[0]?.n >= 1, JSON.stringify(r));
r = await run(seed.stdout); ok('seed-sql twice is refused (the building already exists), nothing is doubled', /duplicate key/.test(r.err || ''), JSON.stringify(r));
// ---- 007: the process of a work (idea note, sketch and draft pictures, stage dates) ----
await as(null, "insert into works(artist_id,position,title) values ('art-a',90,'proc-a'),('art-b',90,'proc-b')");
r = await as(A,"update works set idea='a boat', idea_en='a boat', sketch='https://x.test/s.png', draft='https://x.test/d.png', idea_on='2026-03', sketch_on='2026-04-12', draft_on='2026', final_on='2026-06' where artist_id='art-a' and position=90 returning id"); ok('007: an artist writes the process of own work', r.n===1, JSON.stringify(r));
r = await as(A,"update works set sketch='http://x.test/s.png' where artist_id='art-a' and position=90"); ok('007: a sketch must be an https address', !!r.err, JSON.stringify(r));
r = await as(A,"update works set sketch='javascript:alert(1)' where artist_id='art-a' and position=90"); ok('007: no script address as a sketch', !!r.err, JSON.stringify(r));
r = await as(A,"update works set idea_on='yesterday' where artist_id='art-a' and position=90"); ok('007: a stage date is YYYY, YYYY-MM or YYYY-MM-DD', !!r.err, JSON.stringify(r));
r = await as(A,"update works set idea='"+'x'.repeat(601)+"' where artist_id='art-a' and position=90"); ok('007: an idea note is at most 600 characters', !!r.err, JSON.stringify(r));
r = await as(A,"update works set idea='hacked' where artist_id='art-b' and position=90 returning id"); ok('007: A cannot write the process of B', r.n===0 || !!r.err, JSON.stringify(r));
r = await as('anon',"select idea, sketch, final_on from works where artist_id='art-a' and position=90"); ok('007: visitors read the process of approved artists', r.rows && r.rows.length===1 && r.rows[0].idea==='a boat', JSON.stringify(r));
r = await as('anon',"update works set idea='x'"); ok('007: visitors cannot write it', !!r.err || r.n===0, JSON.stringify(r));

// ---- the one-transaction bundle (tools/sql-bundle.mjs) that the owner pastes into the SQL editor equals running 002-008 one by one ----
const {bundle} = await import('../../tools/sql-bundle.mjs');
const fresh = async () => { const d = new PGlite(); await d.exec(PRELUDE); await d.exec(fs.readFileSync(new URL('../migrations/001_init.sql', import.meta.url),'utf8')); return d; };
const shape = async d => ((await d.query("select 'c:'||table_name||'.'||column_name||':'||data_type||':'||is_nullable as x from information_schema.columns where table_schema='public' union all select 'p:'||tablename||'.'||policyname||':'||cmd from pg_policies where schemaname in ('public','storage') union all select 'f:'||p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' union all select 't:'||event_object_table||'.'||trigger_name from information_schema.triggers where trigger_schema='public' order by 1")).rows.map(x => x.x).join('\n'));
const db2 = await fresh(); let berr = ''; try { await db2.exec(bundle(2, 8)); } catch (e) { berr = e.message; }
ok('the paste-in bundle (002-008, begin/commit) applies cleanly on top of 001', !berr, berr);
ok('and leaves exactly the same columns, policies, functions and triggers as running the files one by one', (await shape(db2)) === (await shape(db)));
const db3 = await fresh(); let broke = ''; try { await db3.exec(bundle(2, 8).replace(/commit;\s*$/, 'select 1/0;\ncommit;')); } catch (e) { broke = e.message; } await db3.exec('rollback').catch(() => {});
ok('a bundle that fails on its last statement changes nothing (all or nothing)', /division by zero/.test(broke) && (await shape(db3)) === (await shape(await fresh())), broke);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
