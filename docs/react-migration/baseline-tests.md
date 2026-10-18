# Test baseline before the React migration

- Commit: `1d7fb02` (branch `studio-museum`, last plain-HTML state), branch `react` starts here
- Date: 2026-10-10
- Command: `node tests/run.mjs all` (build, smoke, flow, hd2d, layout, newwave, perf), run twice
- Raw output: [baseline-run1.txt](baseline-run1.txt), [baseline-run2.txt](baseline-run2.txt)

## Result

| Run | Passed | Failed |
|---|---|---|
| 1 | 230 | 24 |
| 2 | 230 | 24 |

Both runs failed on exactly the same 24 checks, so these are **stable** failures (none flaky in these two runs).
By suite: flow 17, newwave 4, layout 2, perf 1. build, smoke and hd2d pass fully.

## The 24 failures that already exist before any React work

- flow: language button switches to Thai and back
- flow: Join dialog opens (English)
- flow: Join submit → email app + copyable message
- flow: Join message goes to the contact address
- flow: newsletter is kept in this browser (no endpoint yet)
- flow: newsletter honeypot: a bot-filled form is dropped
- flow: studio page: 4 floors, 4 artworks, links to neighbours
- flow: artwork opens a detail dialog with the facts
- flow: URL remembers the open work
- flow: next / previous work
- flow: ArrowLeft goes back
- flow: buy → inquiry form, message prefilled
- flow: inquiry goes to the artist, not to the site
- flow: dynamic cutaway.html?id= still works (fallback)
- flow: old cutaway-napha.html redirects
- flow: no console / network errors in the whole walk-through
- flow: no-JS: studio page has its floors, images, title and JSON-LD
- layout: 1280px: every card's tartan tape is whole (not split across a column)
- layout: 375px: every card's tartan tape is whole (not split across a column)
- newwave: mali studio: 3 floors, all images, new-wave label, ?work=1 opens "One-Page Zine"
- newwave: phop studio: 3 floors, all images, new-wave label, ?work=1 opens "Orbit Study"
- newwave: phrae studio: 3 floors, all images, new-wave label, ?work=1 opens "Pixel Sort"
- newwave: pan studio: 3 floors, all images, new-wave label, ?work=1 opens "Spore Print"
- perf: studio page: rain runs on the compositor (transform animation)

## How to use this

After each migration step, run `node tests/run.mjs all` again.
- A check in the list above that still fails is not caused by the migration.
- A check that is NOT in the list and now fails is a regression from the migration.
- Note: `tests/` is in .gitignore, so the test files themselves are not in git. Keep a copy before changing them.
