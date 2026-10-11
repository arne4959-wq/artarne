// RLS tests for supabase/migrations/001_init.sql, run in an in-memory Postgres (PGlite) with a small stand-in for Supabase's auth and storage schemas.
// Run:  npx -y -p @electric-sql/pglite node supabase/tests/rls.mjs   (or: npm i --no-save @electric-sql/pglite && node supabase/tests/rls.mjs)
// It checks the policies and constraints. It is NOT the real Supabase: re-run the checks in README.md once on your project.
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
const db = new PGlite();
const A='00000000-0000-0000-0000-00000000000a', B='00000000-0000-0000-0000-00000000000b', C='00000000-0000-0000-0000-00000000000c', ADM='00000000-0000-0000-0000-0000000000ad';
await db.exec(`
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
`);
await db.exec(fs.readFileSync(new URL('../migrations/001_init.sql', import.meta.url),'utf8'));
await db.exec(fs.readFileSync(new URL('../migrations/002_payment_notices.sql', import.meta.url),'utf8'));
console.log('migration applied');
let pass=0, fail=0;
const as = async (who, sql) => {   // who: null=postgres, 'anon', uid, 'admin'
  await db.exec('reset role; select set_config(\'request.jwt.claims\', \'\', false)');
  if (who==='anon') await db.exec("set role anon");
  else if (who) { const claims = who===ADM ? {sub:ADM, app_metadata:{role:'admin'}} : {sub:who}; await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]); await db.exec('set role authenticated'); }
  try { const r = await db.query(sql); return {rows:r.rows, n:r.affectedRows ?? r.rows.length}; } catch(e) { return {err:e.message}; }
  finally { await db.exec('reset role'); }
};
const ok = (name, cond, extra='') => { cond ? pass++ : fail++; console.log((cond?'  ✓ ':'  ✗ ')+name+(cond?'':'  '+extra)); };
// seed as owner/service
await as(null, `insert into artists(id,user_id,name,disc,city,approved) values ('art-a',  '${A}','A','d','c',true),('art-b','${B}','B','d','c',true),('art-c','${C}','C','d','c',false)`);
await as(null, `insert into artist_private(artist_id,email) values ('art-a','a@secret.co'),('art-b','b@secret.co')`);
await as(null, `insert into works(artist_id,position,title,price_usd) values ('art-a',0,'a0',100),('art-a',1,'a1',200),('art-b',0,'b0',300),('art-c',0,'c0',50)`);
await as(null, `insert into artist_payment(artist_id,account_name,account_no) values ('art-a','A','123'),('art-c','C','999')`);

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
r = await as(A,"update works set status='sold' where artist_id='art-a' and position=0 returning id"); ok('A marks own work sold', r.n===1, JSON.stringify(r));
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

// ---- payment notices (002) ----
await as(null, `insert into payment_notices(artist_id,work_id,buyer_name,buyer_email,price_usd,status)
  select 'art-a', id, 'Buyer One', 'b1@x.co', 100, 'new' from works where artist_id='art-a' and position=0 limit 1`);
await as(null, `insert into payment_notices(artist_id,work_id,buyer_name,buyer_email,price_usd)
  select 'art-b', id, 'Buyer Two', 'b2@x.co', 300 from works where artist_id='art-b' limit 1`);
r = await as('anon','select * from payment_notices'); ok('anon cannot read notices', !!r.err);
r = await as('anon',"insert into payment_notices(artist_id,work_id,buyer_name,buyer_email,price_usd) select 'art-a',id,'x','x@x.co',1 from works limit 1"); ok('anon cannot create a notice (only the Edge Function can)', !!r.err);
r = await as(A,'select buyer_name from payment_notices'); ok('A sees only own notices', JSON.stringify(r.rows.map(x=>x.buyer_name))==='["Buyer One"]', JSON.stringify(r));
r = await as(A,"insert into payment_notices(artist_id,work_id,buyer_name,buyer_email,price_usd) select 'art-a',id,'fake','f@x.co',1 from works where artist_id='art-a' limit 1"); ok('an artist cannot create notices either', !!r.err);
r = await as(A,"update payment_notices set status='confirmed' where artist_id='art-a' returning id"); ok('A confirms own notice', r.n===1, JSON.stringify(r));
r = await as(A,"update payment_notices set status='rejected' where artist_id='art-b'"); ok('A cannot decide B notice', !!r.err || r.n===0, JSON.stringify(r));
r = await as(A,"update payment_notices set buyer_email='steal@x.co' where artist_id='art-a'"); ok('A cannot edit the buyer data', !!r.err, JSON.stringify(r));
r = await as(A,"update payment_notices set status='paid' where artist_id='art-a'"); ok('bad status rejected', !!r.err);
r = await as(A,"delete from payment_notices where artist_id='art-a'"); ok('A cannot delete notices', !!r.err || r.n===0, JSON.stringify(r));
r = await as(ADM,'select count(*)::int as n from payment_notices'); ok('admin sees all notices', r.rows[0].n===2, JSON.stringify(r));
r = await as(null,"insert into payment_notices(artist_id,work_id,buyer_name,buyer_email,price_usd) select 'art-a',id,'x','not-an-email',1 from works limit 1"); ok('bad buyer e-mail rejected', !!r.err);
r = await as(null,"insert into payment_notices(artist_id,work_id,buyer_name,buyer_email,price_usd,slip_path) select 'art-a',id,'x','x@x.co',1,'../etc/passwd' from works limit 1"); ok('bad slip path rejected', !!r.err);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
