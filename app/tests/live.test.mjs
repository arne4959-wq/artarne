// tools/live-data.mjs: database rows → the shape of artists.js, and the merge with the sample artists.
import test from 'node:test';
import assert from 'node:assert/strict';
import {rowsToArtists, workToPiece, mergeArtists, payToSupport, ARTIST_COLUMNS, WORK_COLUMNS} from '../../tools/live-data.mjs';

const artist = (o = {}) => ({id: 'mali', name: 'มะลิ', name_en: 'Mali', name_lo: null, disc: 'ศิลปะดิจิทัล', city: 'เวียงจันทน์', since: 2018, bio: 'bio', bio_en: null, bio_lo: null, tagline: null, tagline_en: null,
  concept: null, concept_en: null, instagram: 'https://instagram.com/mali', timeline: [], scale: '1.10', kind: 'arch',
  colors: [], created_at: '2026-10-01T00:00:00Z', ...o});
const work = (o = {}) => ({artist_id: 'mali', position: 0, title: 'ภาพหนึ่ง', title_en: 'One', title_lo: null, year: 2024, medium: 'สีน้ำ', medium_en: null, medium_lo: null, size: '50 × 70 ซม.', size_lo: null,
  ar: '4/5', img: 'https://x.supabase.co/storage/v1/object/public/art/mali/a.webp', quote: null, quote_en: null, quote_lo: null, story: null, story_en: null, story_lo: null, concept: null, ...o});

test('a row becomes an artist in the shape of artists.js; missing stays missing', () => {
  const [a] = rowsToArtists([artist()], [work()]);
  assert.equal(a.id, 'mali'); assert.equal(a.nameEn, 'Mali'); assert.ok(!('nameLo' in a) && !('bioEn' in a) && !('tagline' in a));
  assert.equal(a.scale, 1.1); assert.equal(a.kind, 'arch'); assert.equal(a.works.length, 3);
  assert.ok(!('commission' in a) && !('sold' in a)); assert.equal(a.live, true);   // donation-only: nothing is sold, no commissions
  assert.deepEqual(a.titles, ['ภาพหนึ่ง']);
});

test('a piece has its texts and picture, and never a price, status, edition or pay link (donation-only)', () => {
  const p = workToPiece(work({price_usd: '450.00', price_lak: '10000000', status: 'sold', edition: 12, pay: 'https://pay.example.com/x'}));
  assert.equal(p.tEn, 'One'); assert.equal(p.ar, '4/5');
  for (const k of ['p', 'priceLak', 'status', 'edition', 'pay']) assert.ok(!(k in p), k);
  assert.ok(!/price|status|edition|pay\b|commission|sold_elsewhere/.test(ARTIST_COLUMNS + ',' + WORK_COLUMNS));   // the pull never even asks for them
  assert.equal(workToPiece(work({story_lo: 'ລາວ'})).stLo, 'ລາວ');
  const t = workToPiece(work({say: 'ก', say_en: 'a', why: 'ข', look_lo: 'ລ'}));   // "the artist tells it"
  assert.deepEqual([t.say, t.sayEn, t.why, t.lookLo, 'look' in t], ['ก', 'a', 'ข', 'ລ', false]);
});

test('works come in the order of their position, titles follow', () => {
  const [a] = rowsToArtists([artist()], [work({position: 2, title: 'C'}), work({position: 0, title: 'A'}), work({position: 1, title: 'B'}), work({artist_id: 'other', title: 'X'})]);
  assert.deepEqual(a.pieces.map(p => p.t), ['A', 'B', 'C']); assert.deepEqual(a.titles, ['A', 'B', 'C']);
});

test('the e-mail is never in the data, and an artist with no works is left out', () => {
  const out = rowsToArtists([artist(), artist({id: 'empty'})], [work()]);
  assert.deepEqual(out.map(a => a.id), ['mali']); assert.equal(out[0].email, '');
  assert.ok(!/@/.test(JSON.stringify(out).replace(/instagram\.com/g, '')), 'no e-mail address anywhere');
  assert.ok(!/user_id|approved|demo/.test(ARTIST_COLUMNS + ',' + WORK_COLUMNS), 'only public columns are asked for');
  assert.ok(!/email/.test(ARTIST_COLUMNS), 'no e-mail column');
});

test('oldest artist first; real artists come before the sample ones', () => {
  const live = rowsToArtists([artist({id: 'late', created_at: '2026-11-01'}), artist({id: 'early', created_at: '2026-09-01'})], [work({artist_id: 'late'}), work({artist_id: 'early'})]);
  assert.deepEqual(live.map(a => a.id), ['early', 'late']);
  const demo = [{id: 'napha'}, {id: 'dao'}];
  assert.deepEqual(mergeArtists(demo, {artists: live}).map(a => a.id), ['early', 'late', 'napha', 'dao']);
});

test('hideDemo hides the samples only when there is a real artist', () => {
  const live = [{id: 'mali'}], demo = [{id: 'napha'}];
  assert.deepEqual(mergeArtists(demo, {artists: live, hideDemo: true}), live);
  assert.deepEqual(mergeArtists(demo, {artists: [], hideDemo: true}), demo);   // never an empty city
  assert.deepEqual(mergeArtists(demo, {artists: [], hideDemo: false}), demo);
  assert.deepEqual(mergeArtists(demo, null), demo);
});

test('bank details become `support` (QR as a public Storage URL); no account and no QR = no support', () => {
  const base = 'https://x.supabase.co';
  const [a] = rowsToArtists([artist()], [work()], [{artist_id: 'mali', bank: 'LDB', account_name: 'MALI X', account_no: '123 456', qr_path: 'mali/qr.png'}], base);
  assert.deepEqual(a.support, {bank: 'LDB', name: 'MALI X', no: '123 456', qr: base + '/storage/v1/object/public/qr/mali/qr.png'});
  assert.ok(!('support' in rowsToArtists([artist()], [work()])[0]));
  assert.equal(payToSupport({bank: 'BCEL', account_name: null, account_no: null, qr_path: null}, base), null);
  assert.equal(payToSupport({bank: 'BCEL', account_no: '1', qr_path: '../evil/x'}, base).qr, undefined);   // a path that is not <artist_id>/<file> is ignored
});
