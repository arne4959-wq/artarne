# punk-ui hook-up (apply AFTER the integration thread has committed)

Everything below is built as **new, self-contained files** so nothing that someone else has uncommitted was touched. Nothing is wired into the live pages yet.
Try it all at `punk-ui-demo.html` (`python3 serve.py`, open `/punk-ui-demo.html`, `?lang=en`, `?taps=1` shows a TEST fixture of resonance counts so the ranking can be seen; real data has none yet).

| New file | What it is |
|---|---|
| `cube.css`, `cube.js` | `CirclesCube.mount(el, {lang, size, auto, hint, controls})`: draggable (pointer + arrow keys), auto-spin toggle, reset. Auto-spin starts OFF under `prefers-reduced-motion`. |
| `donate-flow.css`, `donate-flow.js` | `CirclesDonateFlow.open({lang, artist:{id,name,support}, work:{title,voice}, amounts, circles:{qr,bank,sample}, onSupportCircles, canDeliverMessage, onPaid, onClose})`. 3 steps, poster thank-you with the cube, separate "support circles" box. |
| `times.css`, `times.js`, `notices.js` | `CirclesTimes.front / ticker / notices / rank`. Notices are edited in `notices.js` only (max 3 shown, newest first). |
| `punk-ui-demo.html` | the test page (`noindex`, not linked from anywhere, not in `sitemap.xml`). Delete it or keep it out of `dist`. |
| `tests-legacy/punkui.mjs` | `node tests-legacy/punkui.mjs`: 6 shots into `review-shots/punkui-*.png`, 18 checks. |

Not done: the **React side** (`app/`) is left out on purpose (its files are dirty and the plain site was preferred). The modules have no DOM dependencies beyond `document`, so the React port is a thin wrapper.

## 1. Donate window (circles.js, `openDonate`)

Add to the page `<head>`/scripts of every page that has donate buttons (via `tools/build.mjs`, the same place `showcase.css` / `showcase.js` are added):

```html
<link rel="stylesheet" href="cube.css"><link rel="stylesheet" href="donate-flow.css">
<script src="cube.js"></script><script src="donate-flow.js"></script>
```

At the top of `openDonate(A, usd, forTitle)` in `circles.js` (about line 124), hand over to the new flow for **real** artists:

```js
if (window.CirclesDonateFlow && realDonate(A)) {
  const s = supOf(A) || {}, w = A.pieces.find(p => p.t === forTitle) || A.pieces[0] || {};
  CirclesDonateFlow.open({lang: LANG, artist: {id: A.id, name: nameL(A), support: s},
    work: {title: forTitle ? titleL(w) : '', voice: pk(w, 'say') || (w.concept && pk(w.concept, 'quote')) || ''},
    circles: CONFIG.support, onSupportCircles: openSupportCircles});
  return;
}
```
- `usd` (a preselected amount) is not honoured by step 1 yet: if you want that, add `amount: usd` to `open()` (one line: `amt = o.amount || amt`).
- Sample artists keep the old 4-step demo dialog untouched (it has the fake "I have donated" notice form). The new flow shows the SAMPLE banner for `support.sample`.
- Step 3's "support circles" button calls `onSupportCircles` (the existing window) when circles has no QR of its own, or opens `CONFIG.support.qr` inline when it has one.
- The message to the artist is **not sent anywhere** (static site): the field says so (`canDeliverMessage:false`). Pass `canDeliverMessage:true` only once a backend really delivers it.
- Fonts: **Bai Jamjuree** and **Mali** are not in `fonts/`; the CSS falls back to IBM Plex Sans Thai / Kanit. To get the exact look, add them to `fonts/fonts.css` (needs a download, left for the owner).

## 2. Cube beside the thank-you
Already done inside `donate-flow.js` (it mounts `CirclesCube` when `cube.js` is loaded). To use it elsewhere (about page, 404): `<div id="cube"></div>` + `CirclesCube.mount(document.getElementById('cube'), {lang: LANG})`.

## 3. THE CIRCLES TIMES
Add `<link rel="stylesheet" href="times.css"><script src="times.js"></script>` to `highlights.html`, `index.html` (ticker) and the about page.

**highlights.js**: in `render()`, build `works` from the REAL artists only and mount the front page (no sample artists, no invented counts):
```js
const real = ARTISTS.filter(a => !isSample(a));
const list = real.flatMap(a => a.pieces.map((p, k) => ({aid: a.id, artist: nameL(a), title: titleL(p), img: p.img, href: `studio-${a.id}.html?work=${k}`,
  say: pk(p, 'say'), res: resCount(a.id, k), views: 0, added: p.added})));
CirclesTimes.front(document.getElementById('pan-w'), list, {lang: LANG});
```
`resCount` for a real artist is only this browser's own tap until a server counts taps; the front page then honestly shows "nobody has resonated yet" or the 1 tap. If you'd rather not show a single-browser count as a "most resonated" headline, pass `res: 0` until there is a server. Donation amounts are never read by the ranking (there is a test for it).
Add an optional `added:'YYYY-MM-DD'` to each piece in `artists.js` so "newest" and the ticker order are real (without it the order in the file is used).

**Ticker** on the city page (`index.html`, above the city): `<div id="news-ticker"></div>` then `CirclesTimes.ticker(document.getElementById('news-ticker'), list, {lang: LANG})` (same `list`; it takes the 3 newest and hides itself when empty). Do **not** feed it donation events.

**Wall notices** on the about page: `<div id="wall-notes"></div>` then `<script src="notices.js"></script>` and `CirclesTimes.notices(document.getElementById('wall-notes'), null, {lang: LANG})`. Check the three starter notices and their dates in `notices.js` before launch (they only say things that are true today).

## 4. Tests / build
- Add `punkui` to the suite list in `tests-legacy/run.mjs` (`import ... from './punkui.mjs'` style, or call it from there); it already uses the same `tools/browser.mjs` helpers and exits non-zero on failure.
- `tools/build.mjs` / `tools/dist.mjs`: copy `cube.*`, `donate-flow.*`, `times.*`, `notices.js` into `dist`; do NOT copy `punk-ui-demo.html`.
- Existing suites that assert on the donate dialog (`sample`, `realmode`, `flow`) will need updating for real artists after hook-up 1, because arne's donate is now the 3-step poster flow instead of the old dialog.
