// The dashboard's data rules (src/lib/manage.js): what a form may send to the database, and what it must refuse.
import test from 'node:test';
import assert from 'node:assert/strict';
import {formToProfile, formToWork, formToPayment, formToEmail, emptyWork, workToForm, profileToForm, nextPosition, fitSize, ratioOf, fileKey, isHttps} from '../src/lib/manage.js';

const goodWork = () => ({...emptyWork(), title: 'เช้าหมอก', price_usd: '1800'});
const goodProfile = () => ({...profileToForm({}), name: 'นภา', disc: 'จิตรกรรม', city: 'เชียงใหม่'});

test('a work needs a title and a price; the price is rounded to cents', () => {
  assert.deepEqual(formToWork({...goodWork(), title: ' '}).errors, {title: 'er_required'});
  assert.deepEqual(formToWork({...goodWork(), price_usd: ''}).errors, {price_usd: 'er_price'});
  assert.deepEqual(formToWork({...goodWork(), price_usd: '-1'}).errors, {price_usd: 'er_price'});
  assert.deepEqual(formToWork({...goodWork(), price_usd: 'abc'}).errors, {price_usd: 'er_price'});
  assert.equal(formToWork({...goodWork(), price_usd: '12.345'}).row.price_usd, 12.35);
});

test('work: year, kip, ratio, edition, status, pay link', () => {
  assert.equal(formToWork({...goodWork(), year: '24'}).errors.year, 'er_year');
  assert.equal(formToWork({...goodWork(), price_lak: '1.5'}).errors.price_lak, 'er_price');
  assert.equal(formToWork({...goodWork(), ar: '4:5'}).errors.ar, 'er_ratio');
  assert.equal(formToWork({...goodWork(), edition: '1'}).errors.edition, 'er_edition');
  assert.equal(formToWork({...goodWork(), edition: '12'}).row.edition, 12);
  assert.equal(formToWork({...goodWork(), edition: ''}).row.edition, null);   // empty = one of a kind
  assert.equal(formToWork({...goodWork(), status: 'gone'}).errors.status, 'er_required');
  assert.equal(formToWork({...goodWork(), pay: 'http://pay.example.com'}).errors.pay, 'er_https');
  assert.equal(formToWork({...goodWork(), pay: 'https://x'}).errors.pay, 'er_https');
  assert.equal(formToWork({...goodWork(), pay: 'https://pay.example.com/p'}).row.pay, 'https://pay.example.com/p');
  assert.equal(formToWork({...goodWork(), pay: ''}).row.pay, null);
});

test('a work never carries the fields the artist must not set', () => {
  const {row} = formToWork({...goodWork(), id: 'x', artist_id: 'evil', position: 5, created_at: 'x'});
  for (const k of ['id', 'artist_id', 'position', 'created_at']) assert.ok(!(k in row), k);
});

test('work form round-trip keeps the values', () => {
  const w = {title: 'A', title_en: 'B', year: 2022, price_usd: '450.00', price_lak: 10000000, ar: '4/5', img: 'https://x.co/a.webp', status: 'reserved', edition: 12, pay: null, story: null};
  const {row} = formToWork(workToForm(w));
  assert.equal(row.title_en, 'B'); assert.equal(row.price_usd, 450); assert.equal(row.price_lak, 10000000); assert.equal(row.status, 'reserved'); assert.equal(row.edition, 12); assert.equal(row.story, null);
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
