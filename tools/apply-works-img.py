#!/usr/bin/env python3
"""apply-works-img.py: makes the "featured works" wall image-first.
Cards lose the frame, the tape, the shadow and the name plate; the picture is all you see.
Name, artist and price fade in over the bottom of the picture on hover or keyboard focus,
and are always shown on touch screens (no hover there).
Only adds one CSS block to index.html (marker: works-img). Safe to run twice.
Run from the site folder:  python3 tools/apply-works-img.py
To undo: delete the block between the two works-img comments in index.html (or git checkout index.html)."""
import pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
p = ROOT / 'index.html'
s = p.read_text(encoding='utf-8')
if '/* ===== works-img:start' in s:
    print('ok    index.html (already done)'); sys.exit(0)
CSS = """/* ===== works-img:start ===== image-first wall: no frame, the details show on hover / focus (always on touch) */
.masonry{column-gap:1.1rem;}
.mi{margin-bottom:1.1rem;padding:0;}
.masonry .card::before{display:none;}
.masonry .card:hover,.masonry .card:focus-visible{transform:none;}
.masonry .card .tape{display:none;}
.masonry .card .art{border:0;}
.masonry .card .art img{transition:transform .7s var(--ease);}
.masonry .card:hover .art img,.masonry .card:focus-visible .art img{transform:scale(1.04);}
.masonry .card .plate{position:absolute;left:0;right:0;bottom:0;margin:0;border:0;background:linear-gradient(to top,rgba(14,13,12,.94),rgba(14,13,12,0));padding:3.2rem 1rem .9rem;opacity:0;transition:opacity .3s var(--ease);z-index:3;}
.masonry .card .pn{color:var(--paper);}
.masonry .card .pa{color:var(--gold);}
.masonry .card:hover .plate,.masonry .card:focus-visible .plate{opacity:1;}
.masonry .card:focus-visible{outline:4px solid var(--pink);outline-offset:3px;}
@media(hover:none){.masonry .card .plate{opacity:1;padding:2.2rem .7rem .6rem;}}
@media(max-width:860px){.masonry{column-gap:.7rem;}.mi{margin-bottom:.7rem;}}
@media(prefers-reduced-motion:reduce){.masonry .card .art img,.masonry .card .plate{transition:none;}}
/* ===== works-img:end ===== */
"""
a = '</style>\n</head>'
if s.count(a) != 1:
    sys.exit(f'STOP index.html: expected the anchor once, found it {s.count(a)} times. Nothing was changed.')
p.write_text(s.replace(a, CSS + a), encoding='utf-8')
print('done  index.html')
