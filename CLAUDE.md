# circles — design system rules (for turning Figma designs into code here)

circles is a static, framework-free site: a Brutalist Punk "city of artists" (Thai + English). Plain HTML, CSS and JavaScript. No React, no bundler, no npm packages.
Read `README.md` (what each file is) and `HOWTO.md` (how the owner edits it, in Thai) first. This file is the short version for implementing designs.

When a Figma design arrives (Figma MCP `get_design_context` returns React + Tailwind as a *reference*), **do not paste it**. Rebuild it with the tokens, classes and helpers below, in the file that owns that part of the site.

---

## 1. Design tokens

**Where:** there is no tokens file. The same `:root` block is repeated at the top of each page's `<style>`:
`index.html:30`, `cutaway.html:29`, `buy.html:29`, `profile.html:29`, and a short one in `join.html`, `privacy.html`, `404.html`.
`circles.css`, `buy.css`, `profile.css`, `museum.css` use these variables but do not define them. A page that loads `circles.css` must define the tokens.

**Format:** CSS custom properties, no transformation step (no Style Dictionary, no Tailwind config).

```css
:root{
  --black:#0E0D0C; --bone:#E8E4D8; --paper:#F4F1E8; --concrete:#8F8C85;      /* neutrals */
  --pink:#FF2E88;  --gold:#E8B730;  --tartan-red:#A3182C;                      /* the only accents */
  --anton:"Anton","Chonburi",Impact,sans-serif;                                /* display caps, buttons, prices */
  --thai:"IBM Plex Sans Thai",system-ui,sans-serif;                            /* body text */
  --type:"Special Elite","IBM Plex Sans Thai",monospace;                       /* labels, captions, typewriter */
  --ease:cubic-bezier(.22,.8,.24,1);  --ease-io:cubic-bezier(.65,0,.35,1);
  --line:3px;                                                                  /* the border width of the whole site */
}
```

Other fonts, used by name: `"Chonburi"` (Thai + Latin display headings), `"Playfair Display"` italic (quotes, kickers).
Patterns are tokens too: `--checker`, `--tt-red | --tt-pink | --tt-gold | --tt-black` (tartan) in `index.html`, and `--grain` (concrete noise) and `--conc` (concrete surface) in the other templates. Reuse them; do not draw new textures.
`buy.css` re-declares the palette scoped to `.by` as `--by-ink --by-paper --by-pink --by-yel`. Same hex values.

**Mapping Figma → tokens.** Match a Figma colour to the nearest token above. Never add a new hex. Artist-specific picture colours live in `artists.js` (`works:['#C4958A', …]` → `artBg()` in `circles.js`), not in CSS.
Spacing has no scale: rem values and `gap` in flex/grid. Typical steps are .35 / .55 / .8 / 1 / 1.4 / 2 rem. Radius is **0** everywhere except round dots (`50%`).

## 2. Components

There is no component library, no Storybook and no framework. A "component" is a function in a global script that returns an HTML string, plus CSS classes with a feature prefix.

| Part | Where | Class prefix |
|---|---|---|
| Home page (city strip, map, works wall, support, footer) | `index.html` (CSS inline), `site.js`, `hd2d.js` | `.bd` `.card` `.mi` `.fbtn` `.sf-` |
| Works wall card, search & filter bar | `site.js` `renderFeatured()`, `worksList()`, `syncBar()` | `.card` `.plate` `.sf-` |
| Studio page = picture hall | `cutaway.html` (template), `museum.js`, `pixel-punks.js` | `.mus-` `.work-dlg` |
| Artist profile | `profile.html`, `profile.js`, `profile.css` | `.pf-` |
| Buy page of one work | `buy.html`, `buy.js`, `buy.css` | `.by-` |
| Shared: language, forms, dialogs, toast, zoom, quick view, bottom bar | `circles.js`, `circles.css` | `.cdlg` `.z-` `.qv-` `.bn-` `.chip` `.stamp` |
| Legal pages | `privacy.html`, `terms.html`, `legal.css` | |

Shared helpers in `circles.js` (use them, do not re-implement): `$`, `esc`, `t(key, vars)`, `pk(obj,'t')` (Thai/English field), `usd`, `nameL/discL/cityL`, `fmtSize`, `workStatus`, `payLink`, `statusChip`, `stampHtml`, `artImg`, `artBg`, `mountDialog`, `dlgShell`, `showDone`, `deliver`, `wireForm`, `openInquiry`, `openZoom` + `zoomBtn()` + `data-zoomable`, `openQuick(artistId, workIndex, list)`, `mountBnav()` (the phone bottom bar, called by `wireNav()`), `isDraft()`, `toast`.

Static twins: `studio-<id>.html`, `profile-<id>.html`, `buy-<id>-<k>.html` and the `<!--pre:…-->` blocks in `index.html` are **generated** by `node tools/build.mjs`. Never hand-edit them; edit the template or script, then rebuild.
`design/buy-reference.html` and `design/profile-reference.html` are static visual references, not shipped code.

## 3. Frameworks, styling libraries, build

- UI: none. Vanilla JS in global scripts (no modules, no TypeScript). Order matters: `artists.js` → `circles.js` → page script. Only library: Lenis smooth scroll (`vendor/lenis.min.js`).
- Styling: hand-written CSS. No Tailwind, CSS Modules, Sass or CSS-in-JS. Do not convert Tailwind classes from Figma output; translate them to the site's CSS.
- Build: no bundler. `node tools/build.mjs [--site URL]` pre-renders pages in headless Chrome (Node 22+ and Chrome; set `CHROME_PATH`). `node tools/dist.mjs` copies the public site to `dist/`. `.github/workflows/pages.yml` does both on push to `main` and publishes to GitHub Pages.
- Local run: `python3 serve.py`. Check a change with `node tools/compare.mjs snap before|after` then `diff before after` (errors, broken images or links, overflow, meta tags, Lighthouse). `tests/` exists on the owner's machine only (git-ignored).

## 4. Assets

- Artwork pictures: `art/<artist>-<n>.svg`, generated placeholders (`tools/genart.py`), slimmed with svgo (untouched originals in `art-originals/`). Real photos (`.jpg .webp .png .svg`) go in `art/` and are referenced from `artists.js` as `img:'art/…'` with `ar:'4/3'` (width/height) kept in step.
- Every `<img>` needs `alt`. The build refuses a page with an image without it. Work pictures use the work title.
- Share images: `og.png` and `og/<id>.png` (1200×630), generated by the build.
- Fonts: self-hosted `.woff2` in `fonts/`, declared in `fonts/fonts.css` (Thai + latin subsets, `font-display:swap`), critical ones preloaded in each page.
- Logo: `art/circles-logo.svg`, `circles-logo-small.svg`, `circles-logo-bg.svg`. The favicon is an inline `data:` SVG in each `<head>`.
- No CDN. Nothing is loaded from other sites except Cloudflare Turnstile (CAPTCHA on forms) and the Formspree form endpoint (`CONFIG` at the top of `circles.js`). Do not add external fonts, icon kits or scripts.
- Optimisation: SVG art is minified; images below the fold use `loading="lazy" decoding="async"`; animations use `transform` and `opacity` only.

## 5. Icons

There is no icon font, sprite or icon folder. Icons are:
- small inline SVG strings inside the JS template that uses them, drawn with `fill:none; stroke:currentColor` (stroke 2.4–2.8, round caps), e.g. the magnifier in `zoomBtn()` (`circles.js`) and `.sf-ico` (`index.html`);
- plain glyphs in text: `✕ ← → ★ ♥ ▼ ≈`;
- CSS shapes (dots, tape, arrows).

Name them by purpose (`z-open`, `sf-ico`). When Figma has an icon, redraw it as inline SVG on a 24×24 viewBox in the black / paper of its surroundings. Do not import SVG files.

## 6. Styling approach

- **Where CSS lives:** page-specific CSS in `<style>` inside the page (`index.html` is the biggest); shared parts in `circles.css`; a feature that spans pages gets its own file with a unique prefix (`buy.css`, `profile.css`, `museum.css`).
- **Methodology:** flat class selectors, one prefix per feature (`.by-`, `.pf-`, `.mus-`, `.sf-`, `.qv-`, `.z-`, `.bn-`). A new feature takes a new prefix and does not override existing rules. Comment block at the top of the block says which script uses it.
- **The look (apply to every new piece):**
  - Borders `var(--line)` (3px) solid `--black` (2px for dense controls like the filter bar). Radius 0.
  - Hard offset shadows, no blur: `box-shadow:5px 5px 0 var(--black)` (or `--pink` / `--gold`). Hover moves the element up-left and grows the shadow; active moves it down-right.
  - Display text in `--anton`, uppercase, `letter-spacing:.08–.16em`. Body in `--thai`. Labels in `--type`, small, letter-spaced, often `--tartan-red`.
  - Pink = on / primary, gold = highlight, black = strong, paper = surface, dashed border = empty / zero.
  - Slight tilts (`rotate(±1–6deg)`), tape strips (hazard stripes `repeating-linear-gradient(135deg,var(--black) 0 10px,var(--gold) 10px 20px)`), ransom-note letters (`ransom()` in `circles.js`).
  - Pop-up motion is stepped (`steps(1,end)` keyframes) for a cut-and-paste feel.
- **Touch and accessibility:** targets at least 44px (`@media(hover:none)` rules cancel hover lifts), visible `:focus-visible` outline (pink or black, 3px, offset 3px), `prefers-reduced-motion` turns animation off, contrast checked on the paper and black surfaces.
- **Responsive:** mobile is a first-class target (375px). `max-width` media queries at about 860px and 600px, `clamp()` for type and sizes, `svh`/`dvh` for full-height layouts, no horizontal scroll. Weak devices get `html.lite` (see `lite:decide` in `circles.js`).
- **Phone navigation:** under 768px a fixed bottom bar (City · Art · Artists · Language, `#bnav`, class `html.has-bnav`) is injected on every page that loads `circles.js`. Anything else fixed to the foot of the screen must sit above it: use `bottom:calc(var(--bn-h) + env(safe-area-inset-bottom,0px))` (see `.toast` and `.by-cta` in `circles.css`). It is a `div role=navigation`, not a `<nav>`, because every page styles a bare `nav{}` as its top menu.
- **Language:** the visitor picks one of `LOCALE` = `th | en | lo`; `LANG` (`th | en`) is the language of the content and of `<html lang>` (Lao reads English data). `STR.lo` holds the few strings written in Lao so far and `t()` falls back to English for the rest. Add Lao by adding keys to `STR.lo`. Every visible string exists in Thai and English. Text in HTML carries `data-t="key"` (also `data-t-ph`, `data-t-aria`); strings live in `STR.th` and `STR.en` in `circles.js` (same keys). Text built in JS calls `t('key', {vars})`. Dynamic markup must re-render in `onLang(fn)`. Data fields come as `name` / `nameEn`, `t` / `tEn`.

## 7. Project structure

```
index.html site.js hd2d.js        home page
cutaway.html museum.js pixel-punks.js   studio template (one picture hall per artist)
profile.html profile.js profile.css     artist profile template
buy.html buy.js buy.css                 buy page template
join.html privacy.html terms.html 404.html legal.css
circles.js circles.css            shared code and styles (strings, CONFIG, SHIPPING / RATES / SUPPORT)
artists.js                        ALL data: artists, buildings, works, prices, status, images
studio-*.html profile-*.html buy-*-*.html   generated, do not edit
art/ art-originals/ fonts/ vendor/ og/       assets
tools/                            build.mjs dist.mjs compare.mjs browser.mjs genart.py (apply-*.py are old one-off scripts)
design/                           static visual references
.github/workflows/pages.yml       build + deploy
```

**Data rules.** Prices are USD numbers. A work can have `status:'sold'|'reserved'`, `pay:'https://…'`, concept blocks. Never invent shipping, fees, rates or percentages: empty values in `SHIPPING`, `RATES`, `SUPPORT` show a yellow `[__]` on a developer's own computer (`isDraft()`) and are left out on the live site. `RATES.thb` is the baht per dollar used for "≈ ฿" prices and is empty until the owner sets it.
Values from `artists.js` that reach markup or CSS are checked: `tools/build.mjs` stops with a plain message on a bad id (only a-z, 0-9, -), colour (#hex), year, price, ratio, missing picture file, `status` or `pay` value, and `circles.js` (`cleanArtists()`) repairs them in the browser. Still use `esc()` for every text field.
Unfinished parts that must not show on the live site (a Support box without a link, placeholder social links) carry the class `draft-only`; they appear only where `isDraft()` is true (`html.is-draft`). `CONFIG.demo = true` adds a "sample data" notice above the consent line of every message form; set it to false when real artists are in.
`CONFIG.shop` (circles.js) is false: the site is a gallery of creators and their words. Prices, status stamps, buy / message-to-buy buttons, price filters and the buy pages are hidden; use `shopOn()` in JS or the class `shop-only` (CSS) for anything that sells. `node tools/build.mjs` and `tools/dist.mjs` skip the `buy-*` pages while it is false; the code and the 28 existing `buy-*.html` files stay for a later shop.
Messages from forms reach the circles team first (Formspree), who pass them on: text must not say they go "directly" to the artist.
The home wall keeps its filters in the address (`?q= &avail=1 &price=p1 &sort=low &all=1`) and every dialog from `mountDialog()` adds a history entry, so Back closes it.

## Checklist for implementing a Figma frame

1. Find the page / file that owns the area. Reuse its classes and the shared helpers before writing new ones.
2. Map colours to the tokens, fonts to `--anton | --thai | --type`, borders to `--line`, shadows to hard offsets. No new hex, no radius, no blur shadows.
3. New feature: new class prefix, new CSS block (or file) with a header comment, strings in both languages, `alt` on every image, 44px targets, focus styles, reduced-motion.
4. Check at 375px and 1280px, Thai and English, and with the language switched while it is open.
5. If `artists.js`, strings or a template changed: `node tools/build.mjs`. Check with `node tools/compare.mjs`.
6. Update `README.md` / `HOWTO.md` when the owner has something new to edit.
