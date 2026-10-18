// The rules of supabase/functions/donation-notice (logic.js), run under Node. The function itself (index.ts) needs Deno and a real
// project: deploy it and try one notice by hand (supabase/README.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDonation, artistBlock, rateBlock, donationEmail, base64Bytes, MAX_SLIP_BYTES, RATE_PER_EMAIL_HOUR, RATE_PER_ARTIST_HOUR, MAX_PENDING_PER_ARTIST} from '../functions/donation-notice/logic.js';

const good = () => ({artist_id: 'napha', donor_name: ' Somchai ', donor_email: ' Somchai@Mail.com ', amount: 5, message: 'Thank you', captcha: 'tok'});

test('a good notice is cleaned: trimmed, e-mail lower-cased, unknown fields dropped, currency defaults to USD', () => {
  const {value} = parseDonation({...good(), status: 'confirmed', work_id: 'x', price_usd: 1});
  assert.equal(value.donor_name, 'Somchai'); assert.equal(value.donor_email, 'somchai@mail.com'); assert.equal(value.currency, 'USD'); assert.equal(value.position, null);
  for (const k of ['status', 'work_id', 'price_usd']) assert.ok(!(k in value), k);   // status and work come from the server, never from the visitor
  assert.equal(value.slip, null);
});

test('every required field is checked', () => {
  const bad = (patch, field) => assert.deepEqual(parseDonation({...good(), ...patch}), {error: 'bad_field', field});
  bad({artist_id: 'Bad Id'}, 'artist_id'); bad({artist_id: ''}, 'artist_id'); bad({position: -1}, 'position'); bad({position: 1.5}, 'position'); bad({position: '1'}, 'position');
  bad({donor_name: '  '}, 'donor_name'); bad({donor_email: 'nope'}, 'donor_email'); bad({captcha: ''}, 'captcha'); bad({captcha: 'x'.repeat(3000)}, 'captcha');
  assert.deepEqual(parseDonation(null), {error: 'bad_body'}); assert.deepEqual(parseDonation([1]), {error: 'bad_body'}); assert.deepEqual(parseDonation('x'), {error: 'bad_body'});
});

test('amount: a number from 1 to 1000 with at most two decimals; currency USD, LAK or THB', () => {
  const bad = (patch, field) => assert.equal(parseDonation({...good(), ...patch}).field, field);
  bad({amount: 0.99}, 'amount'); bad({amount: 1001}, 'amount'); bad({amount: -5}, 'amount'); bad({amount: '5'}, 'amount'); bad({amount: NaN}, 'amount'); bad({amount: Infinity}, 'amount'); bad({amount: 5.123}, 'amount'); bad({amount: null}, 'amount');
  assert.equal(parseDonation({...good(), amount: 1}).value.amount, 1); assert.equal(parseDonation({...good(), amount: 1000}).value.amount, 1000); assert.equal(parseDonation({...good(), amount: 2.5}).value.amount, 2.5);
  bad({currency: 'EUR'}, 'currency'); assert.equal(parseDonation({...good(), currency: 'LAK', amount: 50000 / 100}).value.currency, 'LAK');
});

test('a named work is optional and only a position', () => {
  assert.equal(parseDonation({...good(), position: 2}).value.position, 2);
  assert.equal(parseDonation({...good(), position: 100}).field, 'position');
});

test('long text is cut, empty optional text becomes null', () => {
  const {value} = parseDonation({...good(), message: 'x'.repeat(5000)});
  assert.equal(value.message.length, 1500); assert.equal(parseDonation({...good(), message: '   '}).value.message, null);
});

test('slip: images only, valid base64, at most 2 MB', () => {
  const ok = parseDonation({...good(), slip: {type: 'image/png', data: 'aGVsbG8='}});
  assert.equal(ok.value.slip.ext, 'png');
  assert.equal(parseDonation({...good(), slip: {type: 'application/pdf', data: 'aGVsbG8='}}).field, 'slip');
  assert.equal(parseDonation({...good(), slip: {type: 'image/png', data: 'not base64!'}}).field, 'slip');
  assert.equal(parseDonation({...good(), slip: 'x'}).field, 'slip');
  const big = 'A'.repeat(Math.ceil((MAX_SLIP_BYTES + 10) * 4 / 3));
  assert.equal(parseDonation({...good(), slip: {type: 'image/jpeg', data: big}}).field, 'slip');
  assert.equal(base64Bytes('aGVsbG8='), 5);
});

test('an unknown or unapproved artist, a missing named work, or too many pending notices block a notice', () => {
  const art = {approved: true};
  assert.equal(artistBlock(art, false, null, 0), null); assert.equal(artistBlock(art, true, {id: 'w'}, 0), null);
  assert.equal(artistBlock(null, false, null, 0), 'not_found'); assert.equal(artistBlock({approved: false}, false, null, 0), 'not_found');
  assert.equal(artistBlock(art, true, null, 0), 'not_found');
  assert.equal(artistBlock(art, false, null, MAX_PENDING_PER_ARTIST), 'busy');
});

test('rate limits: per e-mail and per artist', () => {
  assert.equal(rateBlock(RATE_PER_EMAIL_HOUR - 1, 0), null); assert.equal(rateBlock(RATE_PER_EMAIL_HOUR, 0), 'rate');
  assert.equal(rateBlock(0, RATE_PER_ARTIST_HOUR - 1), null); assert.equal(rateBlock(0, RATE_PER_ARTIST_HOUR), 'rate');
});

test('the artist e-mail names the amount, the inspiring work (if any) and how to confirm; replies go to the donor', () => {
  const n = parseDonation(good()).value;
  const m = donationEmail({artistName: 'Napha', title: 'Morning Fog', n});
  assert.match(m.subject, /Morning Fog/); assert.match(m.text, /\$5/); assert.match(m.text, /inspired by “Morning Fog”/); assert.match(m.text, /somchai@mail.com/); assert.match(m.text, /Confirm/);
  assert.equal(m.replyTo, 'somchai@mail.com');
  assert.doesNotMatch(donationEmail({artistName: 'N', title: '', n}).text, /inspired/);
  assert.match(donationEmail({artistName: 'N', title: '', n: {...n, currency: 'LAK', amount: 50000}}).text, /50,000 LAK/);
});
