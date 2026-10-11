// The rules of supabase/functions/payment-notice (logic.js), run under Node. The function itself (index.ts) needs Deno and a real
// project: deploy it and try one notice by hand (supabase/README.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNotice, workBlock, rateBlock, holdStatus, noticeEmail, base64Bytes, MAX_SLIP_BYTES, RATE_PER_HOUR, MAX_OPEN_PER_WORK} from '../functions/payment-notice/logic.js';

const good = () => ({artist_id: 'napha', position: 1, buyer_name: ' Somchai ', buyer_email: ' Somchai@Mail.com ', ship_to: 'Vientiane', message: 'Paid 12:30', captcha: 'tok'});

test('a good notice is cleaned: trimmed, e-mail lower-cased, unknown fields dropped', () => {
  const {value} = parseNotice({...good(), status: 'sold', work_id: 'x', price_usd: 1});
  assert.equal(value.buyer_name, 'Somchai'); assert.equal(value.buyer_email, 'somchai@mail.com');
  for (const k of ['status', 'work_id', 'price_usd']) assert.ok(!(k in value), k);   // price and status come from the database, never from the visitor
  assert.equal(value.slip, null);
});

test('every required field is checked', () => {
  const bad = (patch, field) => assert.deepEqual(parseNotice({...good(), ...patch}), {error: 'bad_field', field});
  bad({artist_id: 'Bad Id'}, 'artist_id'); bad({artist_id: ''}, 'artist_id'); bad({position: -1}, 'position'); bad({position: 1.5}, 'position'); bad({position: '1'}, 'position');
  bad({buyer_name: '  '}, 'buyer_name'); bad({buyer_email: 'nope'}, 'buyer_email'); bad({captcha: ''}, 'captcha'); bad({captcha: 'x'.repeat(3000)}, 'captcha');
  assert.deepEqual(parseNotice(null), {error: 'bad_body'}); assert.deepEqual(parseNotice([1]), {error: 'bad_body'}); assert.deepEqual(parseNotice('x'), {error: 'bad_body'});
});

test('long text is cut, empty optional text becomes null', () => {
  const {value} = parseNotice({...good(), message: 'x'.repeat(5000), ship_to: '   '});
  assert.equal(value.message.length, 1500); assert.equal(value.ship_to, null);
});

test('slip: images only, valid base64, at most 2 MB', () => {
  const ok = parseNotice({...good(), slip: {type: 'image/png', data: 'aGVsbG8='}});
  assert.equal(ok.value.slip.ext, 'png');
  assert.equal(parseNotice({...good(), slip: {type: 'application/pdf', data: 'aGVsbG8='}}).field, 'slip');
  assert.equal(parseNotice({...good(), slip: {type: 'image/png', data: 'not base64!'}}).field, 'slip');
  assert.equal(parseNotice({...good(), slip: 'x'}).field, 'slip');
  const big = 'A'.repeat(Math.ceil((MAX_SLIP_BYTES + 10) * 4 / 3));
  assert.equal(parseNotice({...good(), slip: {type: 'image/jpeg', data: big}}).field, 'slip');
  assert.equal(base64Bytes('aGVsbG8='), 5);
});

test('a sold work, an unapproved artist, a missing work or too many open notices block a notice', () => {
  const art = {approved: true};
  assert.equal(workBlock({status: ''}, art, 0), null); assert.equal(workBlock({status: 'reserved'}, art, 0), null);   // on hold: a second buyer may still queue
  assert.equal(workBlock({status: 'sold'}, art, 0), 'sold');
  assert.equal(workBlock(null, art, 0), 'not_found'); assert.equal(workBlock({status: ''}, {approved: false}, 0), 'not_found'); assert.equal(workBlock({status: ''}, null, 0), 'not_found');
  assert.equal(workBlock({status: ''}, art, MAX_OPEN_PER_WORK), 'busy');
});

test('rate limit and the status a work gets', () => {
  assert.equal(rateBlock(RATE_PER_HOUR - 1), null); assert.equal(rateBlock(RATE_PER_HOUR), 'rate');
  assert.equal(holdStatus(''), 'reserved'); assert.equal(holdStatus('reserved'), 'reserved'); assert.equal(holdStatus('sold'), 'sold');
});

test('the artist e-mail names the work, the price and how to answer; it points the reply at the buyer', () => {
  const m = noticeEmail({artistName: 'Napha', title: 'Morning Fog', priceUsd: 1800, priceLak: 40000000, n: {...parseNotice(good()).value}});
  assert.match(m.subject, /Morning Fog/); assert.match(m.text, /40,000,000 LAK/); assert.match(m.text, /somchai@mail.com/); assert.match(m.text, /Money received/);
  assert.equal(m.replyTo, 'somchai@mail.com');
  assert.match(noticeEmail({artistName: 'N', title: 'T', priceUsd: 450, priceLak: null, n: parseNotice(good()).value}).text, /\$450/);
});
