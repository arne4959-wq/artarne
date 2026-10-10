# React migration

The plain-HTML site in the project root keeps working while the React version is built in `app/` (Vite 8 + React 19).
When every page is done, the root files are removed and `app/` becomes the site.

| Step | State |
|---|---|
| 1. Commit pending work, `react` branch, test baseline | done: [baseline-tests.md](baseline-tests.md) |
| 2. Vite project, data, strings, helpers, CSS | done (this note) |
| 3. Simple pages: 404, privacy, terms, join | next |
| 4. buy, profile | |
| 5. studio / museum | |
| 6. home (city strip, hd2d, loader) | |
| 7. pre-render, og images, sitemap, tests | |

## Commands (from the project root)

```
npm run app:dev     # http://localhost:5173
npm run app:test    # parity tests: React helpers vs the old circles.js
npm run app:build   # app/dist, works from any folder (base './')
```

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

`app/src/App.jsx` is a temporary check page (language button, every work, page-CSS switcher). Step 3 replaces it with the router.

## Not moved yet (needs components or a page, later steps)

Toast, dialogs and forms (`deliver`, `openJoin`, `openInquiry`, Turnstile), nav / mobile menu, coins (`coin3d`), page curtain, `setMeta`, the SVG sprite (`#orb` …) and the favicon of each page.
