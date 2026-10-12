/* donate.js — the donation rules shared by the dialog, the profile block and the floating button. The same behaviour as openDonate() in ../circles.js.
   Sample mode: no Supabase set up, or the artist is sample data (no `live` flag). Then the QR is generated and marked SAMPLE and nothing is sent. */
import {supabaseReady} from './supabase.js';

export const DON_AMOUNTS = [3, 5, 10];   // preset donations in US dollars
export const MIN_AMOUNT = 1, MAX_AMOUNT = 1000;
export const sampleMode = A => !supabaseReady || !A || !A.live;
export const supOf = A => { const s = A && A.support; return s && (s.qr || s.no) ? s : null; };
/* a sample artist can always be supported (a generated SAMPLE QR); a real one only once payment details exist */
export const canDonate = A => !!A && (sampleMode(A) || !!supOf(A));
export const validAmount = v => /^\d{1,4}$/.test(String(v).trim()) && +v >= MIN_AMOUNT && +v <= MAX_AMOUNT;

/* what this browser "sent" in sample mode (circles-sample-v1, shared with the plain-HTML site); nothing leaves the browser */
const KEY = 'circles-sample-v1';
export function rememberSampleDonation(artistId, usd) {
  try { const o = JSON.parse(localStorage.getItem(KEY)) || {}; localStorage.setItem(KEY, JSON.stringify({...o, tips: [...(o.tips || []), {a: artistId, u: usd, at: Date.now()}].slice(-20)})); } catch (e) { /* no storage: nothing to remember */ }
}

/* the separate "support circles" gift is remembered under its own key (never mixed with the artist donations above) */
export function rememberSampleCircles(usd) {
  try { const o = JSON.parse(localStorage.getItem(KEY)) || {}; localStorage.setItem(KEY, JSON.stringify({...o, circles: [...(o.circles || []), {u: usd, at: Date.now()}].slice(-20)})); } catch (e) { /* no storage: nothing to remember */ }
}

/* a made-up QR-looking picture (random pattern, three finder squares) with a SAMPLE label over the middle. Not a valid code, on purpose. → SVG markup */
export function sampleQrSvg(seed, caption) {
  let h = 1779033703 ^ String(seed).length; for (const c of String(seed)) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = h << 13 | h >>> 19; }
  const rnd = () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  const N = 29, Q = 4, U = 6, W = (N + Q * 2) * U, finder = (x, y) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  let r = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() < .5) r += `<rect x="${(x + Q) * U}" y="${(y + Q) * U}" width="${U}" height="${U}"/>`;
  for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
    const X = (fx + Q) * U, Y = (fy + Q) * U;
    r += `<rect x="${X}" y="${Y}" width="${7 * U}" height="${7 * U}"/><rect x="${X + U}" y="${Y + U}" width="${5 * U}" height="${5 * U}" fill="#fff"/><rect x="${X + 2 * U}" y="${Y + 2 * U}" width="${3 * U}" height="${3 * U}"/>`;
  }
  const c = W / 2, esc = s => String(s).replace(/[&<>"']/g, x => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[x]));
  r += `<g transform="rotate(-12 ${c} ${c})"><rect x="${c - 78}" y="${c - 26}" width="156" height="52" fill="#FFD21F" stroke="#0E0D0C" stroke-width="4"/><text x="${c}" y="${c + 4}" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="26" letter-spacing="3" fill="#0E0D0C" stroke="none">SAMPLE</text><text x="${c}" y="${c + 20}" text-anchor="middle" font-family="IBM Plex Sans Thai,sans-serif" font-size="13" font-weight="700" fill="#0E0D0C" stroke="none">ตัวอย่าง</text></g>`;
  return `<svg class="sup-qr sm-qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" role="img" aria-label="${esc(caption)}"><rect width="${W}" height="${W}" fill="#fff"/><g fill="#0E0D0C">${r}</g></svg>`;
}
