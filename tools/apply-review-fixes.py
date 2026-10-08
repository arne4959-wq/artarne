#!/usr/bin/env python3
"""Review fixes 3-7 and 10. Idempotent: safe to run twice. Usage: python3 apply_fixes.py <site-root>"""
import glob, os, sys
root = sys.argv[1]
os.chdir(root)
log = []

def edit(path, pairs):
    s = open(path, encoding='utf-8').read(); o = s
    for a, b, *chk in pairs:
        done = chk[0] if chk else b
        if done and done in s:
            continue                      # already applied
        if a not in s and b == '':
            continue                      # a removal that was already done
        if a not in s:
            log.append(f'!! {path}: not found: {a[:70]}'); continue
        s = s.replace(a, b)
    if s != o:
        open(path, 'w', encoding='utf-8').write(s); log.append(f'ok {path}')

# 3. drop the small English italic line above section titles (the kicker above already says it)
edit('index.html', [
    ('<i data-t="how_i">3 steps</i><br>', ''),
    ('<i data-t="feat_i">Featured</i><br>', ''),
    ('<i data-t="map_i">The</i><br>', ''),
    ('<i data-t="join_i">Your</i><br>', ''),
])

# 4. phones: smaller logo so it never touches the EN button (home, studio pages, template)
NAV_CSS = '\n/* review fix 4: phones, keep the logo clear of the language button */\n@media(max-width:480px){nav .brand{font-size:1.45rem;gap:.45rem;letter-spacing:.07em;}nav .brand svg{width:30px;height:30px;}nav .links{gap:.5rem;}}\n</style>'
for p in ['index.html', 'cutaway.html'] + sorted(glob.glob('studio-*.html')):
    s = open(p, encoding='utf-8').read()
    if 'review fix 4' not in s:
        s = s.replace('</style>', NAV_CSS, 1); open(p, 'w', encoding='utf-8').write(s); log.append(f'ok {p} (nav)')

# 5. keep "จากคนทำ" together so "ทำ" never ends up alone on a line
edit('circles.js', [("แล้วซื้อตรงจากคนทำ'", "แล้วซื้อตรงจาก\\u2060คน\\u2060ทำ'")])

# 6. spaces in the ransom note were drawn as tiny empty tiles (looked like a stray "-"): make them plain gaps
edit('circles.js', [("return `<span style=\"--r:${ROT[k]}deg;", "return `<span${/^\\s+$/.test(c) ? ' class=\"sp\"' : ''} style=\"--r:${ROT[k]}deg;")])
s = open('circles.css', encoding='utf-8').read()
if '.rn span.sp' not in s:
    s += '\n/* review fix 6: a space inside a ransom note is a gap, not a tile */\n.rn span.sp{background:none!important;border-color:transparent!important;box-shadow:none!important;}\n'
    open('circles.css', 'w', encoding='utf-8').write(s); log.append('ok circles.css')

# 7. legends: each field is one shelf (one row that scrolls sideways), so no card is ever left alone on a row
edit('legends.html', [
    ('.lg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:2.2rem 1.8rem;}',
     '.lg-grid{display:grid;grid-auto-flow:column;grid-auto-columns:clamp(160px,calc((100% - 6 * 1.4rem) / 7),240px);gap:1.4rem;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:16px 12px 26px;margin:0 -12px;scrollbar-width:thin;scrollbar-color:var(--black) transparent;}\n.lg{scroll-snap-align:start;}'),
    ('  .lg-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:1.6rem 1rem;}',
     '  .lg-grid{grid-auto-columns:58%;gap:1rem;}'),
])

# 10. home page: a short "before this city" strip that leads to legends.html
TEASER_HTML = '''<section class="sec lgt" id="legends-teaser" aria-labelledby="lgt-h">
  <div class="sec-k reveal" id="lgt-k">Legends</div>
  <div class="lgt-top"><h2 class="sec-t reveal" id="lgt-h">ก่อนจะมีเมืองนี้</h2><p id="lgt-p">คนที่ทำให้ศิลปะไม่ยอมเงียบ ทั้งจิตรกร นักดนตรี คนทำหนัง นักออกแบบ และช่างภาพ หน้านี้ไม่มีอะไรขาย มาดูเฉย ๆ ได้เลย</p></div>
  <div class="lgt-row" id="lgt-row"></div>
  <a class="btn" href="legends.html" id="lgt-btn">ไปหน้าตำนาน →</a>
</section>

<footer class="foot reveal">'''
TEASER_CSS = '''
/* review fix 10: legends teaser on the home page */
.lgt{border-top:var(--line) solid var(--black);}
.lgt-top{display:flex;flex-wrap:wrap;gap:1rem 3rem;align-items:flex-end;justify-content:space-between;margin-bottom:2rem;}
.lgt-top p{font:300 1rem/1.85 var(--thai);max-width:440px;}
.lgt-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1.4rem;margin-bottom:2.4rem;}
.lgt-c{display:block;color:var(--black);text-decoration:none;background:var(--paper);border:var(--line) solid var(--black);box-shadow:6px 6px 0 var(--black);transition:transform .4s var(--ease),box-shadow .4s var(--ease);}
.lgt-c:nth-child(odd){transform:rotate(-1deg);}.lgt-c:nth-child(even){transform:rotate(.8deg);}
.lgt-c:hover,.lgt-c:focus-visible{transform:translateY(-6px);box-shadow:9px 11px 0 var(--pink);}
.lgt-ph{display:block;position:relative;aspect-ratio:4/5;background:var(--c);border-bottom:var(--line) solid var(--black);overflow:hidden;isolation:isolate;}
.lgt-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%;filter:grayscale(1) contrast(1.45) brightness(1.08);mix-blend-mode:multiply;}
.lgt-ph::after{content:"";position:absolute;inset:0;background:radial-gradient(circle,rgba(14,13,12,.38) 0 1px,transparent 1.35px) 0 0/4px 4px;mix-blend-mode:multiply;}
.lgt-ini{position:absolute;inset:0;display:grid;place-items:center;font:400 clamp(2.2rem,4vw,3.4rem)/1 var(--anton);}
.lgt-n{display:block;font:400 1rem/1.4 "Chonburi",var(--thai);padding:.6rem .7rem .1rem;}
.lgt-y{display:block;font:400 .78rem var(--anton);letter-spacing:.12em;padding:0 .7rem .7rem;color:var(--tartan-red);}
@media(max-width:860px){.lgt-row{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:42%;overflow-x:auto;padding:6px 6px 18px;margin:0 -6px 2rem;}}
</style>'''
s = open('index.html', encoding='utf-8').read()
if 'id="legends-teaser"' not in s:
    s = s.replace('<footer class="foot reveal">', TEASER_HTML, 1)
    s = s.replace('</style>', TEASER_CSS, 1)
    s = s.replace('<script src="hd2d.js" defer></script>', '<script src="hd2d.js" defer></script>\n<script src="legends-data.js" defer></script>\n<script src="legends-credits.js" defer></script>\n<script src="legends-teaser.js" defer></script>', 1)
    open('index.html', 'w', encoding='utf-8').write(s); log.append('ok index.html (teaser)')
print('\n'.join(log))

# ---------- 1. stats: the made-up visitor number becomes a real count (number of art forms in the city) ----------
edit('index.html', [('<b data-count="12480">0</b><span data-t="st3">ผู้เข้าชมเดือนนี้</span>', '<b id="c-disc" data-count="0">0</b><span data-t="st3">สาขาศิลปะ</span>')])
edit('site.js', [("  $('#c-work').dataset.count = ARTISTS.reduce((n, a) => n + a.pieces.length, 0);\n",
                  "  $('#c-work').dataset.count = ARTISTS.reduce((n, a) => n + a.pieces.length, 0);\n  $('#c-disc').dataset.count = new Set(ARTISTS.map(a => a.disc)).size;\n", "$('#c-disc')")])
edit('circles.js', [("st3:'ผู้เข้าชมเดือนนี้'", "st3:'สาขาศิลปะ'"), ("st3:'Visitors this month'", "st3:'Art forms'")])

# ---------- 2. "want a building?" moves to its own page (join.html); the home page keeps one short band ----------
edit('circles.js', [("join_btn:'Join — ขอมีตึก →',", "join_btn:'Join — ขอมีตึก →', jn_kick:'สำหรับศิลปิน', jn_cta:'เล่าให้เราฟังสั้น ๆ ว่าคุณทำงานแบบไหน แนบลิงก์ผลงาน แล้วเราจะติดต่อกลับทางอีเมล', jb_p:'ตั้งราคาเอง รับเงินเอง ไม่มีใครคัดงาน', jb_btn:'ดูรายละเอียด →', skip_main:'ข้ามไปที่เนื้อหา',", "jn_kick:'สำหรับศิลปิน'"),
                    ("join_btn:'Join — get a building →',", "join_btn:'Join — get a building →', jn_kick:'For artists', jn_cta:'Tell us briefly what you make and add a link to your work. We will get back to you by email.', jb_p:'Set your own prices, get paid directly, no jury.', jb_btn:'See how it works →', skip_main:'Skip to content',", "jn_kick:'For artists'")])
import re
s = open('index.html', encoding='utf-8').read()
if 'class="sec join-band"' not in s:
    band = '''<section class="sec join-band" id="join">
  <div><div class="sec-k reveal" data-t="jn_kick">สำหรับศิลปิน</div>
  <h2 class="sec-t reveal"><span data-t="join_h">อยากมีตึกของตัวเอง?</span></h2>
  <p class="jb-p" data-t="jb_p">ตั้งราคาเอง รับเงินเอง ไม่มีใครคัดงาน</p></div>
  <a class="btn" href="join.html" data-t="jb_btn">ดูรายละเอียด →</a>
</section>'''
    s, n = re.subn(r'<section class="sec join-sec" id="join">.*?</section>', band, s, count=1, flags=re.S)
    s = s.replace('<a href="#join" data-t="foot_join">', '<a href="join.html" data-t="foot_join">')
    s = s.replace('</style>', '\n/* review fix 2: the join band */\n.join-band{background:var(--bone);display:flex;flex-wrap:wrap;gap:1.6rem 3rem;align-items:flex-end;justify-content:space-between;border-top:var(--line) solid var(--black);}\n.join-band .sec-t{margin-bottom:.4rem;}\n.jb-p{font:300 1.05rem/1.8 var(--thai);}\n</style>', 1)
    open('index.html', 'w', encoding='utf-8').write(s); log.append(f'ok index.html (join band, replaced {n})')
for p in ['cutaway.html'] + sorted(glob.glob('studio-*.html')):
    edit(p, [('<a href="index.html#join" data-t="foot_join">', '<a href="join.html" data-t="foot_join">')])
if os.path.exists('tests/suites/smoke.mjs'):
    edit('tests/suites/smoke.mjs', [("'legends.html', '404.html'];", "'legends.html', 'join.html', '404.html'];")])
edit('tools/build.mjs', [("'legends.html', 'privacy.html', 'terms.html'];", "'legends.html', 'join.html', 'privacy.html', 'terms.html'];")])
print('\n'.join(log[-12:]))
