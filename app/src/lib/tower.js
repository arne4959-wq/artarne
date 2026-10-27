/* tower.js — the rules of the studio tower (from ../tower.js): which stage of which work has something to show.
   Pure functions, no page access, so the parity tests can run them. L = the language object of useLang() (only L.pk is used).
   Optional per-work fields in artists.js (an empty one shows an honest empty window, never an invented picture):
     idea, ideaEn, ideaLo   a few lines of text      sketch, draft   an image (relative path or https address)
     stages: {idea, sketch, draft, final}   dates as 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD'  (final falls back to the work's year) */
export const STAGES = ['idea', 'sketch', 'draft', 'final'];
export const CATS = [['idea', 'idea'], ['sketch', 'sketch'], ['work', 'final']];   // floors from the roof down: [lift key, stage shown on that floor]
export const PER_ROW = 3, MAX_ROWS = 3;

export const safeSrc = u => typeof u === 'string' && (/^https:\/\/[^\s"'<>]+$/.test(u) || /^[\w][\w.\/-]*$/.test(u)) ? u : '';   // an artist's address: https, or a file of this site
export const dateOf = d => /^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(d || '')) ? String(d) : '';
export const fmtOn = d => { const m = dateOf(d).split('-'); return m.length === 3 ? `${m[2]}/${m[1]}/${m[0]}` : m.length === 2 ? `${m[1]}/${m[0]}` : m[0] || ''; };
export const num = k => String(k + 1).padStart(2, '0');

/* one work at one stage: {s, has, text|src, on} */
export function stage(L, p, s) {
  const on = dateOf(p.stages && p.stages[s]) || (s === 'final' && p.y ? dateOf(String(p.y)) : '');
  if (s === 'idea') { const x = String(L.pk(p, 'idea') || '').trim(); return {s, has: !!x, text: x, on}; }
  const src = safeSrc(s === 'sketch' ? p.sketch : s === 'draft' ? p.draft : p.img);
  return {s, has: !!src, src, on};
}
export const stagesOf = (L, p) => STAGES.map(s => stage(L, p, s));
export const hasProcess = (L, p) => stagesOf(L, p).some(x => x.s !== 'final' && (x.has || dateOf(p.stages && p.stages[x.s])));   // any idea, sketch or draft (or a date for one)

/* the floors of a tower: [{cat, st, r, level, ks}] from the roof down; a floor holds at most PER_ROW works, at most MAX_ROWS rows per kind */
export function floors(n) {
  const shown = Math.min(n, PER_ROW * MAX_ROWS), rows = Math.ceil(shown / PER_ROW), total = rows * CATS.length, out = [];
  let level = total;
  for (const [cat, st] of CATS) for (let r = 0; r < rows; r++) {
    const ks = []; for (let k = r * PER_ROW; k < Math.min(shown, (r + 1) * PER_ROW); k++) ks.push(k);
    out.push({cat, st, r, level: level--, ks});
  }
  return {shown, rows, total, floors: out};
}
