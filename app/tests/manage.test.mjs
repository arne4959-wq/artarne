// The dashboard's data rules (src/lib/manage.js): what a form may send to the database, and what it must refuse.
import test from 'node:test';
import assert from 'node:assert/strict';
import {formToProfile, formToWork, formToPayment, formToEmail, emptyWork, workToForm, profileToForm, nextPosition, fitSize, ratioOf, fileKey, isHttps} from '../src/lib/manage.js';

const goodWork = () => ({...emptyWork(), title: 'เช้าหมอก'});
const goodProfile = () => ({...profileToForm({}), name: 'นภา', disc: 'จิตรกรรม', city: 'เชียงใหม่'});

test('a work needs only a title (no price: nothing is sold)', () => {
  assert.deepEqual(formToWork({...goodWork(), title: ' '}).errors, {title: 'er_required'});
  const {row} = formToWork({...goodWork(), price_usd: '5', status: 'sold', edition: '3', pay: 'https://pay.example.com/p', price_lak: '1'});
  for (const k of ['price_usd', 'price_lak', 'status', 'edition', 'pay']) assert.ok(!(k in row), k + ' must not be sent');
});

test('work: year and ratio', () => {
  assert.equal(formToWork({...goodWork(), year: '24'}).errors.year, 'er_year');
  assert.equal(formToWork({...goodWork(), ar: '4:5'}).errors.ar, 'er_ratio');
  assert.equal(formToWork({...goodWork(), year: '2024', ar: '4/5'}).row.ar, '4/5');
});

test('a work never carries the fields the artist must not set', () => {
  const {row} = formToWork({...goodWork(), id: 'x', artist_id: 'evil', position: 5, created_at: 'x'});
  for (const k of ['id', 'artist_id', 'position', 'created_at']) assert.ok(!(k in row), k);
});

test('work form round-trip keeps the values', () => {
  const w = {title: 'A', title_en: 'B', year: 2022, ar: '4/5', img: 'https://x.co/a.webp', story: null};
  const {row} = formToWork(workToForm(w));
  assert.equal(row.title_en, 'B'); assert.equal(row.year, 2022); assert.equal(row.ar, '4/5'); assert.equal(row.story, null);
});

test('profile: name, discipline and city are required; instagram must be https', () => {
  assert.deepEqual(Object.keys(formToProfile({...goodProfile(), name: '', city: ''}).errors).sort(), ['city', 'name']);
  assert.equal(formToProfile({...goodProfile(), instagram: 'http://instagram.com/x'}).errors.instagram, 'er_https');
  assert.equal(formToProfile({...goodProfile(), since: '99'}).errors.since, 'er_year');
  const {update} = formToProfile({...goodProfile(), instagram: 'https://instagram.com/napha', since: '2014'});
  assert.equal(update.since, 2014); assert.equal(update.instagram, 'https://instagram.com/napha');
});

test('profile update never contains admin-only columns', () => {
  const {update} = formToProfile({...goodProfile(), approved: true, demo: true, user_id: 'x', id: 'x'});
  for (const k of ['approved', 'demo', 'user_id', 'id']) assert.ok(!(k in update), k);
});

test('long text is cut to what the database accepts', () => {
  assert.equal(formToProfile({...goodProfile(), bio: 'ก'.repeat(5000)}).update.bio.length, 2000);
  assert.equal(formToWork({...goodWork(), title: 'x'.repeat(500)}).row.title.length, 120);
});

test('payment: account number is digits, spaces and dashes; e-mail is checked', () => {
  assert.equal(formToPayment({bank: 'BCEL', account_no: 'abc'}).errors.account_no, 'er_account');
  assert.equal(formToPayment({bank: '', account_no: '010 12-345'}).row.bank, 'BCEL');
  assert.equal(formToEmail(' A@B.CO ').email, 'a@b.co');
  assert.equal(formToEmail('nope').errors.email, 'er_email');
});

test('nextPosition fills after the last work; pictures keep their shape', () => {
  assert.equal(nextPosition([]), 0); assert.equal(nextPosition([{position: 0}, {position: 4}]), 5);
  assert.equal(nextPosition([{position: 99}, {position: 0}, {position: 1}]), 2, 'after many adds and deletes the numbers run out at 99: take the first free one');
  assert.deepEqual(fitSize(4000, 3000, 1600), {w: 1600, h: 1200}); assert.deepEqual(fitSize(800, 600, 1600), {w: 800, h: 600});
  assert.equal(ratioOf(1600, 1200), '4/3'); assert.equal(ratioOf(1000, 1000), '1/1');
  assert.match(ratioOf(1601, 1237), /^[0-9]{1,3}\/[0-9]{1,3}$/);
});

test('file keys fit the database rule for storage paths', () => {
  for (let i = 0; i < 20; i++) assert.match(`napha/${fileKey('webp')}`, /^[a-z0-9-]+\/[A-Za-z0-9._-]+$/);
  assert.ok(isHttps('https://pay.example.com') && !isHttps('https://x') && !isHttps('javascript:alert(1)'));
});

test('profile: photo, building look and timeline are checked and sent', () => {
  const ok = formToProfile({...goodProfile(), photo: 'https://x.supabase.co/storage/v1/object/public/art/a/p.webp', kind: 'collage', scale: '1.2',
    colors: ['#00ff3a', '#F00FA8', '#1B2B2A'], timeline: [{y: '2026', t: 'เริ่มทำเมือง', tEn: 'Started the city'}, {y: '', t: '', tEn: ''}]}).update;
  assert.equal(ok.photo, 'https://x.supabase.co/storage/v1/object/public/art/a/p.webp');
  assert.equal(ok.kind, 'collage'); assert.equal(ok.scale, 1.2); assert.deepEqual(ok.colors, ['#00FF3A', '#F00FA8', '#1B2B2A']);
  assert.deepEqual(ok.timeline, [{y: 2026, t: 'เริ่มทำเมือง', tEn: 'Started the city'}]);   // the empty row is dropped
  assert.equal(formToProfile({...goodProfile(), photo: 'http://x.co/a.jpg'}).errors.photo, 'er_https');
  assert.equal(formToProfile({...goodProfile(), scale: '3'}).errors.scale, 'er_scale');
  assert.equal(formToProfile({...goodProfile(), timeline: [{y: '99', t: 'x', tEn: ''}]}).errors.tl0, 'er_year');
  assert.equal(formToProfile({...goodProfile(), timeline: [{y: '2020', t: '', tEn: ''}]}).errors.tl0, 'er_required');
  const bad = formToProfile({...goodProfile(), kind: 'rocket', colors: ['red', 'x', 'y']}).update;
  assert.equal(bad.kind, 'arch'); assert.equal(bad.colors.length, 3); assert.ok(bad.colors.every(c => /^#[0-9A-F]{6}$/.test(c)));
});

test('profile form round-trip keeps photo, look and timeline', () => {
  const a = {name: 'A', disc: 'd', city: 'c', photo: 'https://x.co/p.jpg', kind: 'vase', scale: 0.9, colors: ['#111111', '#222222', '#333333'], timeline: [{y: 2020, t: 'ก', tEn: 'a'}]};
  const {update} = formToProfile(profileToForm(a));
  assert.equal(update.photo, a.photo); assert.equal(update.kind, 'vase'); assert.equal(update.scale, 0.9);
  assert.deepEqual(update.timeline, [{y: 2020, t: 'ก', tEn: 'a'}]);
});

test('asking for a building: a slug, a name, a discipline and a city', async () => {
  const {formToClaim, slugFrom} = await import('../src/lib/manage.js');
  assert.equal(slugFrom('Dao.Keo_99@gmail.com'), 'dao-keo-99');
  assert.equal(slugFrom('ນາງ@gmail.com'), '', 'a non-latin name gives no slug: the artist types one');
  const good = {id: ' Dao-K ', name: 'ດາວ', disc: 'paint', city: 'Vientiane', note: ' '};
  assert.deepEqual(formToClaim(good).row, {p_id: 'dao-k', p_name: 'ດາວ', p_disc: 'paint', p_city: 'Vientiane', p_note: null});
  assert.equal(formToClaim({...good, id: 'a b'}).errors.id, 'er_slug');
  assert.equal(formToClaim({...good, id: 'x'}).errors.id, 'er_slug');
  assert.equal(formToClaim({...good, id: 'arne'}, ['arne']).errors.id, 'er_taken');
  assert.deepEqual(Object.keys(formToClaim({id: 'ok-id'}).errors).sort(), ['city', 'disc', 'name']);
});
