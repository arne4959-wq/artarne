# circles — Brutalist Punk

A city of artists: one concrete building = one artist, the work is set into the building, you buy straight from the maker.
Plain HTML / CSS / JS. No framework, no bundler. Thai + English. Nothing is loaded from other websites (fonts and the scroll library are in this folder).

## Run it locally

```bash
cd ~/Documents/circles-brutal-punk
python3 serve.py          # opens http://localhost:8000
python3 serve.py 8080     # another port
```

Use `serve.py` (http), not a double-click on the file: the page-to-page View Transitions need http.
Stop with `Ctrl+C`. Edit a file, refresh the browser.

## Files

| file | what it is |
|---|---|
| `index.html`, `site.js` | the home page (markup + CSS, and its script: city strip, sections, filters, cursor, loader) |
| `hd2d.js` | the HD-2D touches on the city strip: pixel people and birds, light shafts, dust (see below) |
| `studio-<id>.html` | one page per artist, **generated** by `tools/build.mjs` (full content in the HTML, meta tags, JSON-LD) |
| `cutaway.html` | the template those pages come from. It also works on its own as `cutaway.html?id=napha`, which is the fallback for a studio you have not built yet. `?work=1` opens a piece |
| `artists.js` | **all artists, buildings and artworks** (names, bios, prices, sizes, image paths, EN texts) |
| `circles.js`, `circles.css` | shared: TH/EN strings, language switch, forms, toast, ransom type, mobile menu, dialogs |
| `privacy.html`, `terms.html`, `legal.css` | privacy policy and terms of use (TH + EN) — **templates, see "Before you go live"** |
| `art/*.svg` | 30 generated artworks (placeholders for real photos). `python3 tools/genart.py` regenerates them |
| `og.png`, `og/<id>.png` | share images (site, and one per artist, generated) |
| `fonts/`, `vendor/` | self-hosted fonts (SIL OFL) and Lenis (MIT) |
| `tools/build.mjs`, `tools/browser.mjs` | the build step and a tiny Chrome driver |
| `tools/compare.mjs` | before / after check of every page (screenshots, errors, links, meta tags, Lighthouse), see "Tests" |
| `tools/dist.mjs` | copies only the public site into `dist/` (see "Put it online") |
| `404.html`, `robots.txt`, `.nojekyll`, `serve.py` | hosting helpers |

## Common edits

**Change a price, text, or add a piece** → `artists.js`, then run `node tools/build.mjs` (it refreshes the generated pages).

**Use real photos instead of the generated art** → put the files in `art/` and change each piece's `img:` in `artists.js`.
Keep `ar:` (width/height, e.g. `'4/3'`) in step with the photo. `.jpg`, `.webp`, `.png`, `.svg` all work.
The coloured placeholder behind each image comes from the artist's own colours (`works:` in `artists.js`).

**Add an artist** → add one object to `ARTISTS` in `artists.js` (copy one), plus `DISC_EN` / `CITY_EN` entries if the discipline or city is new, then `node tools/build.mjs`.
`kind:` picks the building shape: `arch | lens | tower | vase | shell | collage`. The strip, the map (any number of districts), the studio page and the filters all follow.

**Change the Thai / English wording** → `STR` in `circles.js` (`th:` and `en:`, same keys). Text in the HTML carries `data-t="key"`.

## Build step (crawlers, link previews, no-JavaScript visitors)

Search engines and link previews do not run the page's JavaScript reliably. So the content is also written into plain HTML:

```bash
node tools/build.mjs                              # relative URLs, fine for local use
node tools/build.mjs --site https://your-domain   # + absolute og:image / canonical URLs, sitemap.xml, robots.txt
```

It opens the real pages in headless Chrome (Node 22+ and Chrome/Chromium needed; set `CHROME_PATH` if Chrome is somewhere unusual) and writes the `studio-<id>.html` pages, `og/<id>.png`, and the blocks between the `<!--pre:…-->` markers in `index.html`.
It does not duplicate rendering logic: what it saves is what the browser shows. Run it again after any change to `artists.js` or to wording.
`npm run build` does the same if you prefer npm.

## Tests

**Before / after check (in the repo):** take a snapshot before a change and one after it, then compare.

```bash
node tools/compare.mjs snap before            # every page: 375px touch + 1280px, Thai + English, plus Lighthouse on 4 key pages
# ... make your change ...
node tools/compare.mjs snap after
node tools/compare.mjs diff before after      # writes compare/report.html: totals, Lighthouse scores, pages that changed, screenshots side by side
```

It counts JavaScript errors, broken images, links to missing pages, views wider than the screen, images without alt text, visible `[__]` marks and broken or doubled meta tags.
`--no-lh` skips Lighthouse (faster), `--pages index.html,buy-napha-0.html` checks only those pages. Results stay in `compare/` (not in git). Lighthouse is fetched by `npx` the first time.

**The full test suite** (`tests/`, kept outside git on the author's computer, see `.gitignore`):

```bash
node tests/run.mjs          # build freshness + smoke + flow  (~8 min)
node tests/run.mjs perf     # frame rates, normal and with the CPU 4x slower
node tests/run.mjs all
```

`smoke` opens every page in both languages at 1280px and 375px and checks errors, overflow, accessible names, leftover Thai in English mode and broken images.
`flow` clicks through language, filters, sorting, dialogs, forms, drag vs click, keyboard, a touch screen, JavaScript switched off and reduced motion.
No packages to install (it drives Chrome directly).

## Make the forms real (important before going live)

Right now nothing is sent to a server (there isn't one):

- **Buy / inquiry** and **Join** open the visitor's email app (`mailto:`) with the message filled in, plus a copy-to-clipboard fallback.
- **Newsletter** is saved in the visitor's own browser only (`localStorage`).
- Artist emails in `artists.js` and `contact` in `circles.js` use the reserved `*.example` domain, so no real mailbox can receive them by accident.

To go live, edit the first lines of `circles.js`:

```js
const CONFIG = { endpoint: 'https://formspree.io/f/xxxxxxx', contact: 'you@your-domain.com', turnstileSiteKey: '' };
```

`endpoint` is any form backend (Formspree, Getform, your own API). It receives `POST` JSON: `{kind, to, subject, ...fields, captcha}`; `kind` is `inquiry`, `join` or `newsletter`.
With an endpoint set, the dialogs say "sent" instead of opening the email app.
`turnstileSiteKey` is optional: a free Cloudflare Turnstile key adds a CAPTCHA to the Join and inquiry forms (it loads Cloudflare's script only then). Your endpoint must verify the `captcha` token on the server.
Every form also has a hidden honeypot field against simple bots.

**All names, prices, visitor numbers, social handles and emails in this prototype are sample data.**

## Before you go live

- **`privacy.html` and `terms.html` are templates.** They are written to match what this site does today (no cookies, no analytics; forms go by email or to your endpoint), but you must fill in the operator's legal name and address and the retention period (`[24]` months), adjust shipping/returns to what your artists really do, then have a lawyer review them. Remove the yellow "template" notice when done. This is not legal advice.
- Replace the sample data (see above) and put real emails in `artists.js`.
- Set `CONFIG.endpoint` (and `contact`).
- Fill `SHIPPING`, `RATES` and `SUPPORT` at the top of `circles.js` (shipping, reply time, certificate, exchange rates, how the support money is split). Until a value is set, your own computer shows a yellow `[__]` in its place and the live site leaves that line out (`?draft` in the address shows the marks anywhere, `?live` hides them on your computer).

## Put it online

It is a static site, any static host works. Do **not** upload the project folder as is: it also holds dev files (tests, tools, notes, snapshots). Run `npm run dist` (= `node tools/dist.mjs`) first; it copies only the public site into `dist/` and warns about any file the pages point at that is missing. Publish `dist/`.

- **Netlify / Cloudflare Pages**: build command `node tools/dist.mjs`, publish directory = `dist`. Or drag the `dist/` folder in.
- **GitHub Pages** (set up): `.github/workflows/pages.yml` builds with `--site`, runs `dist.mjs` and publishes `dist/` on every push to `main`. One-time setup: Settings → Pages → Source: **GitHub Actions**. The site is then at `https://arne4959-wq.github.io/artarne/`. Because it lives under `/artarne/`, Google does not read its `robots.txt` (only the one at the domain root): add the site in Google Search Console and submit `sitemap.xml` there.

After you have a domain, run `node tools/build.mjs --site https://your-domain` once (absolute share-image URLs, canonical links, sitemap), then check a share preview with the platforms' debuggers.
`404.html` also opens a studio that has not been built yet through `cutaway.html?id=`, so a new artist works the moment you add it to `artists.js`, before you re-run the build.

## New wave artists

Four artists work in styles that are only now finding an audience, and carry `wave: true` in `artists.js`; their buildings wear a gold "★ NEW WAVE" label and the map has a "★ New wave" filter that lights them:
**Mali** (risograph, `kind:'stack'`), **Phop** (generative / pen-plotter art, `'dome'`), **Phrae** (glitch art, `'pixel'`), **Pan** (bio art / living mycelium, `'spore'`).
Each has a bio, 3 works with year / medium / size / price (USD) and a TH + EN text, a studio page, a map district and a hand-drawn concrete building. To add another: copy one of these objects, give it a new `kind` and a building in `monument()` in `site.js`, a footprint in `PLAN`, and a floor shape in `KINDS` in `cutaway.html`, then `node tools/build.mjs`.
Artwork images are generated placeholders in the same spirit (halftone overprint, plotter lines, glitch slices, spores); swap in real photos via `img:`.
`node tests/run.mjs newwave` checks the data, the labels, the filter and every new studio. The other suites now read the artist list from `artists.js`, so adding an artist does not break them.

## Patterns: checker and tartan

Two patterns carry the colour, both made only from the site palette (defined once in `:root` in `index.html`):
- `--checker` — a black/paper 2-tone checker (`repeating-conic-gradient`, no image). Used on the edges of the numbers band and the footer, the kerb of two map districts, the gold/black floor under the Spotlight, and (faint) the floor tiles in every studio room.
- `--tt-red` (the original tartan), `--tt-pink`, `--tt-gold`, `--tt-black` — small 30px tartans in four colourways. Used as washi tape on the artwork cards and the "join" cards, and as the kerb along the foot of each map district. The big red tartan stays on the Hero, the street and the Manifesto.
To add a colourway, copy one `--tt-*` line and change the base / band / line colours (only palette colours). `node tests/run.mjs layout` checks that the tapes are whole and the map icons never sit on text.

## HD-2D city strip (Octopath Traveler look, no 3D)

The city strip is built as three planes that move at different speeds when you drag: the **far city** (blurred 4px, gives back 55% of your scroll), the **mid city** (blurred 1.5px, 28%) and the **artists' buildings** (sharp, 1:1). That is the depth-of-field / tilt-shift feel.
On top of it: pixel-art people and birds (16×16 canvases drawn in `hd2d.js`, scaled up with `image-rendering: pixelated`, colours from the site palette only), diagonal light shafts and slow dust in a screen-fixed overlay in front of the city.
Only `transform` and `opacity` animate (frame swaps are `opacity` with `steps()`), so the compositor does the work. With `prefers-reduced-motion` the scene stays but nothing moves: people stand on their first frame, dust is hidden, the light is static, there is no parallax.
To change it: depth speeds are `--d` on `.far` / `.mid` / `.sky` in `index.html`; the blur is the `filter` on `.far` / `.mid`; who walks and how fast is the `WALKERS` list in `hd2d.js`; the sprites are the character strings at the top of that file (`.` = transparent).
`node tests/run.mjs hd2d` checks all of it (speeds, blur, 16×16 pixelated sprites, palette, only transform/opacity, reduced motion, 375 px).
A pixel person also stands at the door of every building (replacing the old vector silhouette; `STAND` in `hd2d.js`, two-frame "breathing", lifts with the building on hover).

**Sizing:** `--bw` (the building width unit) comes from the screen height, so the tallest building + its name tag + the street always fit one screen under the nav: `(100svh − 300px) / --bk`. `--bk` is set from `artists.js` (the largest `scale` × 1.4), so a taller building cannot overflow. Taller screen = bigger city.
**Ransom text:** `ransom(el, text, seed, true)` wraps every word in an unbreakable `.rw`. A line can only break between words. Thai has no spaces, so the Thai Manifesto lines carry U+200B ("may break here") between words in `STR` (`mani1`…`mani4`).
`node tests/run.mjs layout` checks these, and the hazard tape that separates the tartan street from the tartan Manifesto.

## Art Deco + noir (only two places)

The studio pages (`cutaway.html` and the generated `studio-<id>.html`) and the Spotlight section of the home page are dressed as night / noir with Art Deco gold: rain outside, a gold sunburst, blinds of light across the rooms, double gold frames, a theatre-marquee sign.
On top of that sits a "British tailoring" layer (Savile Row / Peaky Blinders): pinstripes, thick-thin gold rules, an "EST." shop-sign line, cut-corner plaques, a brass door plaque, double-hairline picture frames, herringbone floor slabs and a tartan hem under the building.
It uses only the existing palette (black, gold, paper, pink) and the existing five fonts. The rest of the site keeps the raw-concrete punk look.
The CSS is the blocks marked `noir + art deco` in `cutaway.html` and `spotlight: art deco` in `index.html`. The rain is one tile slid by its own height with `transform`, so it costs almost nothing (the tests check it).

## Performance notes

- Animations use `transform` and `opacity` only. The hover shadow of each building is its own flat layer; the concrete grain is one canvas-rendered tile reused as an SVG pattern; the Hero's drifting tartan is a transformed layer.
- `node tests/run.mjs perf` measures frames in headless Chrome: about 60 fps while scrolling, dragging the city and hovering; with the CPU throttled 4× slower it stays above 50.
- The loader's 1.7 s count-up (first visit of a session) is part of the design, and it is why a first-visit Lighthouse LCP is ~4 s on throttled mobile.
- `prefers-reduced-motion` is respected everywhere. Tested at 375 px wide.

