/* art.js — artist / artwork helpers from circles.js that do not touch the page */
import {ARTISTS} from 'virtual:circles/data';

export {ARTISTS};
export const artistById = id => ARTISTS.find(a => a.id === id);

/* sale status of a work: '' (for sale), 'sold' or 'reserved'; and the artist's own payment link (https only) */
export const workStatus = p => (p && (p.status === 'sold' || p.status === 'reserved')) ? p.status : '';
export const httpsHost = u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.includes('.'); } catch (e) { return false; } };
export const payLink = p => (p && typeof p.pay === 'string' && /^https:\/\/\S+$/.test(p.pay) && httpsHost(p.pay)) ? p.pay : '';

/* abstract placeholder built from an artist's own colours — sits behind each artwork <img> in case it fails to load */
export function artBg(c, k) {
  const A = c[0], B = c[1 % c.length], C = c[2 % c.length], g = 'repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0 1px,transparent 1px 7px)';
  return [
    `${g},linear-gradient(180deg,${A} 0 40%,${B} 40% 66%,${C} 66%)`,
    `${g},radial-gradient(circle at 34% 40%,${A} 0 22%,transparent 22.5%),radial-gradient(circle at 68% 64%,${B} 0 30%,transparent 30.5%),${C}`,
    `${g},radial-gradient(circle at 50% 50%,${C} 0 18%,transparent 18.5%),linear-gradient(135deg,${A} 0 50%,${B} 50%)`,
    `${g},repeating-linear-gradient(90deg,${A} 0 16%,${B} 16% 30%,${C} 30% 40%)`,
  ][k % 4];
}

/* ransom-note type: 4 colourways, small tilt */
export const RS = [
  {bg: '#0E0D0C', fg: '#F4F1E8', ff: 'Anton'}, {bg: '#FF2E88', fg: '#0E0D0C', ff: 'Anton'},
  {bg: '#F4F1E8', fg: '#0E0D0C', ff: '"Special Elite"'}, {bg: '#E8B730', fg: '#0E0D0C', ff: 'Chonburi', w: 400},
];
export const ROT = [-3, 2, -1.5, 3.5, -2.5, 1.5, -3.5, 2.5], YOFF = [0, -2, 1, -1, 2, 0, -2, 1];
const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', {granularity: 'grapheme'}) : null;
export function graphemes(s) { return SEG ? Array.from(SEG.segment(s), x => x.segment) : Array.from(s); }
