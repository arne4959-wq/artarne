// logic.js — the rules of the donation-notice function, as plain JavaScript with no Deno or Supabase in it,
// so they run the same under Deno (the function) and Node (supabase/tests/donation-logic.test.mjs).
// A donation notice says "I've donated" to one artist (optionally naming the work that inspired it). No price, no work status is involved.

export const SLIP_TYPES = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'};
export const MAX_SLIP_BYTES = 2 * 1024 * 1024;
export const CURRENCIES = ['USD', 'LAK', 'THB'];
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 1000;
export const RATE_PER_EMAIL_HOUR = 5;     // notices from one e-mail address per hour
export const RATE_PER_ARTIST_HOUR = 30;   // notices for one artist per hour, from anyone
export const MAX_PENDING_PER_ARTIST = 200;   // unanswered notices for one artist

const ID = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/* bytes a base64 string stands for, without decoding it */
export const base64Bytes = b => { const s = b.replace(/=+$/, ''); return Math.floor((s.length * 3) / 4); };

/* → {value} or {error: code, field}. Never trusts a field it does not know. */
export function parseDonation(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {error: 'bad_body'};
  const artist_id = str(body.artist_id, 40);
  if (!ID.test(artist_id)) return {error: 'bad_field', field: 'artist_id'};
  let position = null;                                   // optional: the work that inspired the donation
  if (body.position != null) {
    if (!Number.isInteger(body.position) || body.position < 0 || body.position > 99) return {error: 'bad_field', field: 'position'};
    position = body.position;
  }
  const donor_name = str(body.donor_name, 80);
  if (!donor_name) return {error: 'bad_field', field: 'donor_name'};
  const donor_email = str(body.donor_email, 120).toLowerCase();
  if (!EMAIL.test(donor_email)) return {error: 'bad_field', field: 'donor_email'};
  const amount = body.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) return {error: 'bad_field', field: 'amount'};
  const currency = body.currency == null ? 'USD' : body.currency;
  if (!CURRENCIES.includes(currency)) return {error: 'bad_field', field: 'currency'};
  const captcha = typeof body.captcha === 'string' ? body.captcha.trim() : '';
  if (!captcha || captcha.length > 2048) return {error: 'bad_field', field: 'captcha'};
  let slip = null;
  if (body.slip != null) {
    const s = body.slip;
    if (typeof s !== 'object' || !SLIP_TYPES[s.type] || typeof s.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(s.data)) return {error: 'bad_field', field: 'slip'};
    if (base64Bytes(s.data) > MAX_SLIP_BYTES) return {error: 'bad_field', field: 'slip'};
    slip = {type: s.type, ext: SLIP_TYPES[s.type], data: s.data};
  }
  return {value: {artist_id, position, donor_name, donor_email, amount: Math.round(amount * 100) / 100, currency, message: str(body.message, 1500) || null, captcha, slip}};
}

/* the artist must exist and be approved; a named work must exist. Returns null when a notice may be made, else the error code */
export function artistBlock(artist, workWanted, work, pending) {
  if (!artist || !artist.approved) return 'not_found';
  if (workWanted && !work) return 'not_found';
  if (pending >= MAX_PENDING_PER_ARTIST) return 'busy';
  return null;
}
export const rateBlock = (emailLastHour, artistLastHour) => (emailLastHour >= RATE_PER_EMAIL_HOUR || artistLastHour >= RATE_PER_ARTIST_HOUR ? 'rate' : null);

/* the e-mail the artist gets */
export function donationEmail({artistName, title, n}) {
  const amt = n.currency === 'USD' ? `$${n.amount}` : `${Number(n.amount).toLocaleString('en-US')} ${n.currency}`;
  const lines = [`${n.donor_name} says they donated ${amt} to you${title ? ` (inspired by “${title}”)` : ''}.`, '', `E-mail: ${n.donor_email}`, n.message ? `Message: ${n.message}` : '', '',
    'Check your bank app. If the money is there, press "Confirm" in the Donations tab of your circles dashboard (manage.html).'].filter((l, i, a) => l !== '' || a[i - 1] !== '');
  return {subject: `Donation notice${title ? `: ${title}` : ''}`, text: lines.join('\n'), replyTo: n.donor_email, artistName};
}
