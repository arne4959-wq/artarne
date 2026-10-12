/* home.js — small pure helpers of the home page (from site.js): which works are featured, the "NO.xx" label, opening a studio. */

/* The hand-picked featured works of the sample artists (site.js FEAT). Real artists (from the database) are added in front by `featuredPicks`. */
const CURATED = [['mali', 0], ['phop', 2], ['napha', 0], ['phrae', 2], ['thara', 0], ['pan', 0], ['kwan', 2], ['irene', 1]];
export const FEATURED_MAX = 8;
export const TAPE = [-5, 4, -3, 6, -6, 3, -4, 5];

/* → [{a, k}] : a real artist's first work, then the curated sample picks that exist; at most 8.
   With only the sample artists this is exactly the old FEAT list. Nothing here can throw on a missing id or index. */
export function featuredPicks(artists) {
  const live = artists.filter(a => a.live && a.pieces.length).map(a => { return {a, k: 0}; });
  const curated = CURATED.map(([id, k]) => ({a: artists.find(x => x.id === id), k})).filter(x => x.a && x.a.pieces[x.k]);
  return [...live, ...curated].slice(0, FEATURED_MAX);
}

export const allWorks = artists => artists.flatMap(a => a.pieces.map((p, k) => ({a, p, k})));
/* the list on screen: featured or all, sorted, sold works last */
export function worksList(artists, {showAll, sortBy}) {
  let l = showAll ? allWorks(artists) : featuredPicks(artists).map(({a, k}) => ({a, p: a.pieces[k], k}));
  if (sortBy === 'new') l = [...l].sort((x, y) => (y.p.y || 0) - (x.p.y || 0));
  return l;
}

export const noLabel = i => `NO.${String(i + 1).padStart(2, '0')}`;

/* the spotlight: the first artist of the list (real artists come first), their first work */
export const spotlightOf = artists => artists[0] || null;

/* leaving for a studio: straight away when motion is reduced, a view transition where the browser has them, the curtain otherwise */
export function openStudio(id, work, reduce) {
  const url = 'studio-' + encodeURIComponent(id) + '.html' + (work != null ? '?work=' + work : '');
  if (reduce) { location.href = url; return; }
  if ('PageSwapEvent' in window) {            // cross-document View Transitions: the building morphs into the studio
    const bd = document.querySelector('.bd[data-id="' + CSS.escape(id) + '"]'); if (bd) bd.style.viewTransitionName = 'studio-bd';
    location.href = url; return;
  }
  document.getElementById('curtain')?.classList.add('cover');
  setTimeout(() => { location.href = url; }, 720);
}

/* the concrete grain: one noise tile drawn once and put into the sprite's #noiseImg pattern (every building uses it) */
export function drawGrain() {
  try {
    const N = 160, M = 40, K = N / M, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'), img = g.createImageData(N, N), co = Float32Array.from({length: M * M}, Math.random);
    const at = (x, y) => co[((y % M + M) % M) * M + ((x % M + M) % M)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / K, gy = y / K, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const lo = at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy;
      let n = .55 * lo + .45 * Math.random(); n = .5 + (n - .5) * .75;
      const i = (y * N + x) * 4; img.data[i + 3] = Math.max(0, Math.min(1, 1.3 * n - .4)) * 255;
    }
    g.putImageData(img, 0, 0);
    document.getElementById('noiseImg')?.setAttribute('href', c.toDataURL('image/png'));
  } catch (e) {}
}
