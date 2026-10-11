# React migration

The plain-HTML site in the project root keeps working while the React version is built in `app/` (Vite 8 + React 19).
When every page is done, the root files are removed and `app/` becomes the site.

| Step | State |
|---|---|
| 1. Commit pending work, `react` branch, test baseline | done: [baseline-tests.md](baseline-tests.md) |
| 2. Vite project, data, strings, helpers, CSS | done (this note) |
| 3. Simple pages: 404, privacy, terms, join | done: same DOM and look as the old pages (30/30), same behaviour (7/7) |
| 4. buy, profile | done: see below |
| 5. studio / museum | next |
| 6. home (city strip, hd2d, loader) | done: same DOM and look as the old page (`compare.mjs index.html`, 3 languages x 2 sizes, also #map and #filter), 11 behaviour scenarios, old hd2d / layout / perf suites pass on `app/dist` (`CIRCLES_ROOT=app/dist node tests-legacy/run.mjs hd2d`) |
| 7. pre-render, og images, sitemap, tests | |

## Commands (from the project root)

```
npm run app:dev     # http://localhost:5173
npm run app:test    # parity tests: React helpers vs the old circles.js
npm run app:build   # app/dist, works from any folder (base './'); one .html file per page
node app/tests/compare.mjs join.html 'join.html#dialog' …   # old page vs React page: DOM + screenshots, th/en/lo, desktop + phone
node app/tests/behaviour.mjs [words]                        # the same clicks on both; the answers must match (words: only matching scenarios)
node app/tests/compare.mjs --fixture buy-napha-1.html …     # same, on test data (tests/fixture.mjs)
```

**Test data (`app/tests/fixture.mjs`).** The real data has no pay link, commission, timeline, Instagram, filled-in shipping or THB rate. The form endpoint is also set, so the email-app path never runs.
- The fixture makes edited copies of `artists.js` / `circles.js` that add those, and builds a second app from them (`CIRCLES_FIXTURE`, `CIRCLES_DIST`).
- It serves the same copies to the old site, so both sides use the same data.
- `compare.mjs --fixture` uses it, and `behaviour.mjs` uses it for its `fixture ·` scenarios.

`compare.mjs` and `behaviour.mjs` need `npm run app:build` first. They never send anything: the form endpoint is answered inside the page and the CAPTCHA script is blocked.

The first time: `npm --prefix app install`.

## How app/ reads the old site (no copies)

`app/legacy-site.js` is a Vite plugin. It turns the old files into modules, so `artists.js` stays the single source of truth:

| Import | Comes from |
|---|---|
| `virtual:circles/data` | `artists.js` (ARTISTS, DISC_EN, CITY_EN, DISC_LO, CITY_LO) |
| `virtual:circles/strings` | `const STR` in `circles.js` |
| `virtual:circles/config` | `CONFIG`, `SHIPPING`, `RATES` in `circles.js` |
| `virtual:circles/css/<name>` | `<name>.css`, as raw text |
| `virtual:circles/page-css/<page>` | the `<style>` block of `<page>.html`, as raw text |

It also serves `art/`, `fonts/`, `og/`, `vendor/` in dev and copies them into `app/dist/`.
Editing `artists.js` or `circles.js` reloads the dev page.

## What moved where

| Old (global, in circles.js) | New |
|---|---|
| `LANG`, `t`, `pk`, `nameL`, `discL`, `cityL`, `titleL`, `bldgL`, `fmtSize`, `money`, `moneyHtml`, `esc` | `app/src/lib/lang.js`: `makeLang(lang)` returns them for one language |
| `applyLang`, `onLang`, `setLang`, `data-t`, `data-t-html` | `app/src/lib/i18n.jsx`: `<LangProvider>`, `useLang()`, `<Tx k="…" html/>` |
| `reduce`, `LITE` (+ the `lite` class) | `app/src/lib/env.js` |
| `artBg`, `workStatus`, `payLink`, `artistById`, `graphemes`, `RS/ROT/YOFF` | `app/src/lib/art.js` |
| `ransom()`, `stampHtml`, `statusChip`, `artImg` | `app/src/components/art.jsx`: `<Ransom>`, `<Stamp>`, `<StatusChip>`, `<ArtImg>` |
| each page's `<link>`s + `<style>` | `app/src/styles/<page>.js` + `usePageStyles()` (`app/src/lib/pageStyle.js`) |

The pages' CSS rules clash with each other (body, :root, .hero …). So each route puts its CSS into `<head>` only while it is on screen, in the old order.
`fonts/fonts.css` stays a render-blocking `<link>` in `app/index.html`, same as before.

## Pages (step 3 on)

- **Same URLs, real files.** Every address is a real `.html` file (`app/scripts/pages.mjs` writes them after `vite build`), so any static host works without rewrite rules.
  - Links stay plain `<a href>`, with no client-side router. `app/src/lib/routes.js` picks the page from the file name. The old `?id=` forms still work, and `cutaway-<id>.html` redirects.
- **`<PageShell>`** (`components/PageShell.jsx`) wraps every page: its CSS, its sprite, the page-change curtain (`lib/curtain.js`).
- **Shared components:**
  - `Nav` (+ `LangButton`, phone menu)
  - `Coin` (+ `lib/coin.js`)
  - `Toast`
  - `Dialogs`: `useDialogs().openJoin()`, form dialogs, Turnstile, the Done view
  - `lib/forms.js`: `deliver`, `subscribeNews`
  - `lib/meta.js`: `usePageMeta`
- **Keep the old markup:** same ids and classes, and `data-t="key"` on the texts the old HTML marked with it. `circles.css` styles `html[lang=lo] [data-t]`, and the old tests use the ids.
- **Old bug kept on purpose:** the old `ransom()` wrote `font-family:"Special Elite"` inside `style="…"`. The quote ends the attribute, so those letters never got Special Elite. `OLD_QUOTE_BUG` in `components/art.jsx` keeps that look. Set it to `false` for the intended font.

- **Blanks count:** the old templates had line breaks between inline elements, and a browser shows them as a space. `compare.mjs` records a blank that takes room as `␠`, so a missing one shows up (one was missing on the buy page, before the title). Add `{' '}` where the old markup had one.
- **Language change:** buy and profile rebuild their content when the language changes (`key={lang}`), like the old `render()`. A half-typed message starts over in the new language, the same as before.
- **Pre-built files:** `buy-<id>-<k>.html` / `profile-<id>.html` put the same `data-pre` / `data-buy-id` / `data-profile` on `<main>` as the old pre-built files.

## Not moved yet (later steps)

The newsletter form and Support button (home). Per-page `<head>` meta tags (og, JSON-LD) come with the pre-render step.
