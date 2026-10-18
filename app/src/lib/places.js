/* places.js — the numbers of the weekly highlights and the "Resonated" button (same rules as circles.js: sampleRes / sampleViews / resCount).
   SAMPLE data while there are no real visitors: stable made-up counts plus this browser's own tap (localStorage circles-res-v1). Donation amounts never count. */
const hash32 = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const sampleRes = (aid, k) => 40 + hash32(aid + ':' + k + ':r') % 320;
export const sampleViews = (aid, k) => 700 + hash32(aid + ':' + k + ':v') % 3600;
const KEY = 'circles-res-v1';
const get = () => { try { const o = JSON.parse(localStorage.getItem(KEY)); if (o && typeof o === 'object') return o; } catch (e) { /* no storage */ } return {}; };
export const resMine = (aid, k) => !!get()[aid + ':' + k];
export const resCount = (aid, k) => sampleRes(aid, k) + (resMine(aid, k) ? 1 : 0);
export function resToggle(aid, k) { const o = {...get()}, key = aid + ':' + k; if (o[key]) delete o[key]; else o[key] = 1; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* no storage */ } return !!o[key]; }
/* artists who joined less than 3 months ago (sample: weeks since joining) */
export const NEW_SAMPLE = [{id: 'phrae', wk: 3}, {id: 'phop', wk: 5}, {id: 'pan', wk: 8}];
export const chars = s => 'Segmenter' in Intl ? Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(s), x => x.segment) : Array.from(s);
