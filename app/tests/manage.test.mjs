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
  assert.deepEqual(fitSize(4000, 3000, 1600), {w: 1600, h: 1200}); assert.deepEqual(fitSize(800, 600, 1600), {w: 800, h: 600});
  assert.equal(ratioOf(1600, 1200), '4/3'); assert.equal(ratioOf(1000, 1000), '1/1');
  assert.match(ratioOf(1601, 1237), /^[0-9]{1,3}\/[0-9]{1,3}$/);
});

test('file keys fit the database rule for storage paths', () => {
  for (let i = 0; i < 20; i++) assert.match(`napha/${fileKey('webp')}`, /^[a-z0-9-]+\/[A-Za-z0-9._-]+$/);
  assert.ok(isHttps('https://pay.example.com') && !isHttps('https://x') && !isHttps('javascript:alert(1)'));
});
