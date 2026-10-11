// logic.js — the rules of the payment-notice function, as plain JavaScript with no Deno or Supabase in it,
// so they run the same under Deno (the function) and Node (supabase/tests/notice-logic.test.mjs).

export const SLIP_TYPES = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'};
export const MAX_SLIP_BYTES = 2 * 1024 * 1024;
export const RATE_PER_HOUR = 5;          // notices from one e-mail address per hour
export const MAX_OPEN_PER_WORK = 10;     // unanswered notices on one work

const ID = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/* bytes a base64 string stands for, without decoding it */
export const base64Bytes = b => { const s = b.replace(/=+$/, ''); return Math.floor((s.length * 3) / 4); };

/* → {value} or {error: code, field}. Never trusts a field it does not know. */
export function parseNotice(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {error: 'bad_body'};
  const artist_id = str(body.artist_id, 40), position = body.position;
  if (!ID.test(artist_id)) return {error: 'bad_field', field: 'artist_id'};
  if (!Number.isInteger(position) || position < 0 || position > 99) return {error: 'bad_field', field: 'position'};
  const buyer_name = str(body.buyer_name, 80);
  if (!buyer_name) return {error: 'bad_field', field: 'buyer_name'};
  const buyer_email = str(body.buyer_email, 120).toLowerCase();
  if (!EMAIL.test(buyer_email)) return {error: 'bad_field', field: 'buyer_email'};
  const captcha = typeof body.captcha === 'string' ? body.captcha.trim() : '';
  if (!captcha || captcha.length > 2048) return {error: 'bad_field', field: 'captcha'};
  let slip = null;
  if (body.slip != null) {
    const s = body.slip;
    if (typeof s !== 'object' || !SLIP_TYPES[s.type] || typeof s.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(s.data)) return {error: 'bad_field', field: 'slip'};
    if (base64Bytes(s.data) > MAX_SLIP_BYTES) return {error: 'bad_field', field: 'slip'};
    slip = {type: s.type, ext: SLIP_TYPES[s.type], data: s.data};
  }
  return {value: {artist_id, position, buyer_name, buyer_email, ship_to: str(body.ship_to, 300) || null, message: str(body.message, 1500) || null, captcha, slip}};
}

/* what the work's state allows: returns null when a notice may be made, else the error code */
export function workBlock(work, artist, openNotices) {
  if (!work || !artist || !artist.approved) return 'not_found';
  if (work.status === 'sold') return 'sold';
  if (openNotices >= MAX_OPEN_PER_WORK) return 'busy';
  return null;
}
export const rateBlock = countLastHour => (countLastHour >= RATE_PER_HOUR ? 'rate' : null);

/* the status the work gets when a notice arrives: only a work that is for sale becomes "on hold" */
export const holdStatus = status => (status === '' || status == null ? 'reserved' : status);

/* the e-mail the artist gets */
export function noticeEmail({artistName, title, priceUsd, priceLak, n}) {
  const price = priceLak ? `${Number(priceLak).toLocaleString('en-US')} LAK` : `$${priceUsd}`;
  const lines = [`${n.buyer_name} says they paid for “${title}” (${price}).`, '', `E-mail: ${n.buyer_email}`, n.ship_to ? `Ship to: ${n.ship_to}` : '', n.message ? `Message: ${n.message}` : '', '',
    'Check your bank app. If the money is there, press "Money received" in your circles dashboard (manage.html). The work is on hold until you do.'].filter((l, i, a) => l !== '' || a[i - 1] !== '');
  return {subject: `Payment notice: ${title}`, text: lines.join('\n'), to: undefined, replyTo: n.buyer_email, artistName};
}
