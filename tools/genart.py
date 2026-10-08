# tools/genart.py — generates the placeholder artworks in art/*.svg (one function per piece, seeded: same output every run).
# Run:  python3 tools/genart.py     Replace any piece with a real photo by changing `img:` in artists.js; this file is only a starting point.
import random, math, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art')
os.makedirs(OUT, exist_ok=True)
INK, PAPER, BONE, PINK, GOLD = '#0E0D0C', '#F4F1E8', '#E8E4D8', '#FF2E88', '#E8B730'
W = 600
f = lambda v: f'{v:.1f}'

def wrap(w, h, body, defs='', seed=1):
    r = random.Random(seed * 7 + 3)
    dots = ''.join(f'<circle cx="{f(r.random()*48)}" cy="{f(r.random()*48)}" r="{f(.5+r.random()*1.1)}" fill="{INK if r.random()<.7 else PAPER}" opacity="{f(.08+r.random()*.14)}"/>' for _ in range(26))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice">'
            f'<defs>{defs}<pattern id="gr" width="48" height="48" patternUnits="userSpaceOnUse">{dots}</pattern>'
            f'<radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="{INK}" stop-opacity="0"/><stop offset="1" stop-color="{INK}" stop-opacity=".34"/></radialGradient></defs>'
            f'{body}<rect width="{w}" height="{h}" fill="url(#gr)"/><rect width="{w}" height="{h}" fill="url(#vg)"/></svg>')

def lg(id, stops, x2=0, y2=1):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'

def stroke(r, x, y, ln, ang, wd, col, op):
    ex, ey = x + math.cos(ang) * ln, y + math.sin(ang) * ln
    cx, cy = (x + ex) / 2 + r.uniform(-4, 4), (y + ey) / 2 + r.uniform(-4, 4)
    return f'<path d="M{f(x)},{f(y)} Q{f(cx)},{f(cy)} {f(ex)},{f(ey)}" stroke="{col}" stroke-width="{f(wd)}" stroke-linecap="round" fill="none" opacity="{f(op)}"/>'

def torn(r, x, y, w, h, fill, rot=0, op=1, edge=''):
    pts = []; n = max(6, int(w / 16))
    for i in range(n + 1): pts.append((x + w * i / n, y + r.uniform(-3, 3)))
    m = max(4, int(h / 16))
    for i in range(1, m + 1): pts.append((x + w + r.uniform(-3, 3), y + h * i / m))
    for i in range(n - 1, -1, -1): pts.append((x + w * i / n, y + h + r.uniform(-3, 3)))
    for i in range(m - 1, 0, -1): pts.append((x + r.uniform(-3, 3), y + h * i / m))
    p = ' '.join(f'{f(a)},{f(b)}' for a, b in pts)
    return f'<g transform="rotate({rot} {f(x+w/2)} {f(y+h/2)})" opacity="{op}"><polygon points="{p}" fill="{fill}" stroke="{INK}" stroke-opacity=".5" stroke-width="1.5"/>{edge}</g>'

def tape(x, y, rot, w=84, h=26):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{w}" height="{h}" fill="{PINK}" stroke="{INK}" stroke-width="2.5" opacity=".92" transform="rotate({rot} {f(x+w/2)} {f(y+h/2)})"/>'

def text_lines(r, x, y, w, h, gap=9, col=INK, op=.5):
    out = ''; yy = y
    while yy < y + h - 4:
        ww = w * r.uniform(.55, 1)
        out += f'<rect x="{f(x)}" y="{f(yy)}" width="{f(ww)}" height="4" fill="{col}" opacity="{op}"/>'
        yy += gap
    return out

# ------------------------------------------------------------------ NAPHA (painting)
def napha1(r, c):
    w, h = 600, 450; A, B, C = c
    d = lg('sky', [(0, C), (.55, A), (1, PAPER)])
    b = f'<rect width="{w}" height="{h}" fill="url(#sky)"/><circle cx="400" cy="205" r="48" fill="{PAPER}" opacity=".88"/>'
    for k, (y0, op) in enumerate([(240, .3), (285, .45), (335, .66)]):
        pts = ' '.join(f'{f(x)},{f(y0 + math.sin(x / 70 + k * 1.7) * 18 + math.sin(x / 23 + k) * 6)}' for x in range(0, 621, 20))
        b += f'<polygon points="0,{h} {pts} {w},{h}" fill="{B}" opacity="{op}"/>'
    for _ in range(16):
        b += f'<ellipse cx="{f(r.uniform(0,w))}" cy="{f(r.uniform(225,360))}" rx="{f(r.uniform(110,270))}" ry="{f(r.uniform(9,26))}" fill="{PAPER}" opacity="{f(r.uniform(.2,.42))}"/>'
    for _ in range(170):
        b += stroke(r, r.uniform(-20, w), r.uniform(60, h), r.uniform(30, 100), r.uniform(-.1, .1), r.uniform(5, 15), r.choice([A, B, C, PAPER, PAPER]), r.uniform(.1, .28))
    for x in (60, 95, 520, 548):
        yb = 300 + r.uniform(-8, 10)
        b += f'<path d="M{x},{f(yb)} V{f(yb-r.uniform(45,70))}" stroke="{INK}" stroke-width="2.4" opacity=".5"/><circle cx="{x}" cy="{f(yb-62)}" r="{f(r.uniform(14,22))}" fill="{INK}" opacity=".3"/>'
    return wrap(w, h, b, d, 1)

def napha2(r, c):
    w, h = 600, 600; A, B, C = c
    d = lg('sky', [(0, A), (1, PAPER)])
    b = f'<rect width="{w}" height="{h}" fill="url(#sky)"/><rect y="400" width="{w}" height="200" fill="{C}"/>'
    b += f'<ellipse cx="350" cy="478" rx="250" ry="34" fill="{B}" opacity=".6" transform="rotate(-3 350 478)"/>'
    for _ in range(90):
        a = r.uniform(0, math.tau); rr = r.uniform(0, 1) ** .6
        x, y = 285 + math.cos(a) * 230 * rr, 175 + math.sin(a) * 135 * rr
        b += f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r.uniform(14,40))}" fill="{r.choice([B,B,INK,A])}" opacity="{f(r.uniform(.28,.6))}"/>'
    b += f'<path d="M262,560 C268,470 272,390 266,300 L304,300 C300,390 306,470 316,560 Z" fill="{INK}" opacity=".9"/>'
    for ang in (-1.0, -.55, .5, .9):
        b += f'<path d="M285,330 Q{f(285+math.sin(ang)*90)},{f(270-abs(ang)*40)} {f(285+math.sin(ang)*170)},{f(250-abs(ang)*70)}" stroke="{INK}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>'
    for _ in range(46):
        b += f'<ellipse cx="{f(r.uniform(150,500))}" cy="{f(r.uniform(450,500))}" rx="{f(r.uniform(5,16))}" ry="{f(r.uniform(2,5))}" fill="{PAPER}" opacity="{f(r.uniform(.25,.6))}"/>'
    for _ in range(26):
        x, y = r.uniform(0, w), r.uniform(40, 580)
        b += f'<polyline points="{f(x)},{f(y)} {f(x+r.uniform(-60,60))},{f(y+r.uniform(-30,30))} {f(x+r.uniform(-90,90))},{f(y+r.uniform(-50,50))}" stroke="{INK}" stroke-width="{f(r.uniform(1.5,3.5))}" fill="none" opacity="{f(r.uniform(.12,.3))}" stroke-linecap="round"/>'
    return wrap(w, h, b, d, 2)

def napha3(r, c):
    w, h = 600, 450; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{C}"/>'
    b += f'<polygon points="0,0 {w},0 450,92 150,92" fill="{PAPER}" opacity=".75"/><polygon points="0,{h} 150,330 450,330 {w},{h}" fill="{B}"/>'
    b += f'<polygon points="0,0 150,92 150,330 0,{h}" fill="{A}"/><polygon points="{w},0 450,92 450,330 {w},{h}" fill="{A}"/><polygon points="{w},0 450,92 450,330 {w},{h}" fill="{INK}" opacity=".22"/>'
    b += f'<rect x="150" y="92" width="300" height="238" fill="{C}"/><path d="M255,330 V210 A45,45 0 0 1 345,210 V330 Z" fill="{INK}" opacity=".55"/>'
    b += f'<polygon points="22,118 128,150 128,262 22,262" fill="{PAPER}" opacity=".92"/><path d="M75,128 V262 M22,190 H128" stroke="{INK}" stroke-width="3" opacity=".6"/>'
    b += f'<polygon points="168,334 292,334 262,430 96,430" fill="{PAPER}" opacity=".5"/>'
    for x1, y1, x2, y2 in [(0, 0, 150, 92), (600, 0, 450, 92), (0, 450, 150, 330), (600, 450, 450, 330), (150, 92, 450, 92), (150, 330, 450, 330), (150, 92, 150, 330), (450, 92, 450, 330)]:
        b += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="3" opacity=".55"/>'
    b += f'<rect x="150" y="318" width="300" height="12" fill="{INK}" opacity=".35"/>'
    for _ in range(140):
        b += stroke(r, r.uniform(0, w), r.uniform(0, h), r.uniform(25, 80), r.uniform(-.25, .25), r.uniform(4, 11), r.choice([A, B, C, PAPER]), r.uniform(.08, .2))
    return wrap(w, h, b, '', 3)

# ------------------------------------------------------------------ THARA (photography)
def thara1(r, c):
    w, h = 600, 900; A, B, C, D = c
    d = lg('sky', [(0, B), (1, A)]) + f'<radialGradient id="gl"><stop offset="0" stop-color="{GOLD}" stop-opacity=".9"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>'
    b = f'<rect width="{w}" height="{h}" fill="url(#sky)"/>'
    b += f'<polygon points="0,40 215,300 215,530 0,640" fill="{B}"/><polygon points="0,40 215,300 215,530 0,640" fill="{INK}" opacity=".45"/>'
    b += f'<polygon points="{w},120 385,320 385,530 {w},640" fill="{B}"/><polygon points="{w},120 385,320 385,530 {w},640" fill="{INK}" opacity=".55"/>'
    # lit windows drawn as true perspective quads on each building face
    cols = [(8, 40), (54, 82), (96, 120), (134, 154), (166, 182), (192, 202)]
    rows = [(.14, .27), (.34, .47), (.54, .67), (.74, .87)]
    for side in (0, 1):
        for xa, xb in cols:
            for v0, v1 in rows:
                def Y(x, v):
                    if side == 0: top, bot = 40 + x / 215 * 260, 640 - x / 215 * 110
                    else: top, bot = 120 + x / 215 * 200, 640 - x / 215 * 110
                    return top + v * (bot - top)
                xs = (xa, xb) if side == 0 else (w - xa, w - xb)
                pts = f"{xs[0]},{f(Y(xa, v0))} {xs[1]},{f(Y(xb, v0))} {xs[1]},{f(Y(xb, v1))} {xs[0]},{f(Y(xa, v1))}"
                lit = r.random() < .5
                b += f'<polygon points="{pts}" fill="{GOLD if lit and r.random() < .7 else (PAPER if lit else A)}" opacity="{f(.8 if lit else .28)}"/>'
    b += f'<polygon points="228,520 372,520 {w},{h} 0,{h}" fill="{INK}" opacity=".78"/><rect x="215" y="500" width="170" height="24" fill="{INK}" opacity=".8"/>'
    for gx, gy in [(130, 360), (470, 360), (300, 440), (60, 250), (545, 260)]:
        b += f'<circle cx="{gx}" cy="{gy}" r="{r.randint(36,62)}" fill="url(#gl)"/>'
    for _ in range(46):
        x = r.uniform(70, 540); wd = r.uniform(3, 11)
        b += f'<rect x="{f(x)}" y="{f(560+r.uniform(0,40))}" width="{f(wd)}" height="{f(r.uniform(90,300))}" fill="{r.choice([GOLD,PAPER,PAPER,D])}" opacity="{f(r.uniform(.1,.38))}"/>'
    for _ in range(9):
        b += f'<ellipse cx="{f(r.uniform(60,540))}" cy="{f(r.uniform(620,860))}" rx="{f(r.uniform(40,120))}" ry="{f(r.uniform(6,14))}" fill="{PAPER}" opacity="{f(r.uniform(.1,.26))}"/>'
    b += f'<g fill="{INK}"><circle cx="300" cy="498" r="6"/><path d="M293,528 L294.5,506 Q300,501 305.5,506 L307,528 Z"/></g>'
    for _ in range(150):
        x, y = r.uniform(-20, w), r.uniform(0, h)
        b += f'<line x1="{f(x)}" y1="{f(y)}" x2="{f(x-9)}" y2="{f(y+34)}" stroke="{PAPER}" stroke-width="1" opacity="{f(r.uniform(.1,.3))}"/>'
    return wrap(w, h, b, d, 4)

def thara2(r, c):
    w, h = 600, 900; A, B, C, D = c
    d = lg('bg', [(0, B), (1, INK)]) + f'<radialGradient id="bk"><stop offset=".5" stop-color="{PAPER}" stop-opacity=".9"/><stop offset="1" stop-color="{PAPER}" stop-opacity="0"/></radialGradient>'
    b = f'<rect width="{w}" height="{h}" fill="url(#bg)"/>'
    for _ in range(30):
        rr = r.uniform(18, 70); col = r.choice([GOLD, PAPER, D, C])
        b += f'<circle cx="{f(r.uniform(0,w))}" cy="{f(r.uniform(40,560))}" r="{f(rr)}" fill="{col}" opacity="{f(r.uniform(.12,.34))}"/>'
    b += f'<rect x="60" y="150" width="480" height="14" fill="{INK}"/><rect x="74" y="150" width="14" height="560" fill="{INK}"/><rect x="512" y="150" width="14" height="560" fill="{INK}"/>'
    b += f'<rect x="88" y="164" width="424" height="400" fill="{C}" opacity=".16"/><rect x="100" y="600" width="400" height="14" fill="{INK}"/><rect x="118" y="614" width="10" height="100" fill="{INK}"/><rect x="472" y="614" width="10" height="100" fill="{INK}"/>'
    b += f'<rect y="710" width="{w}" height="190" fill="{INK}" opacity=".7"/>'
    person = f'<circle cx="300" cy="400" r="30"/><path d="M262,700 L268,450 Q300,420 332,450 L338,700 Z"/><rect x="268" y="560" width="28" height="140"/><rect x="304" y="560" width="28" height="140"/><rect x="338" y="520" width="34" height="46" rx="4"/>'
    b += f'<g fill="{INK}">{person}</g><g fill="{PAPER}" opacity=".16" transform="translate(0 1420) scale(1 -1)">{person}</g>'
    for _ in range(190):
        x, y = r.uniform(-20, w), r.uniform(0, h)
        b += f'<line x1="{f(x)}" y1="{f(y)}" x2="{f(x-8)}" y2="{f(y+30)}" stroke="{PAPER}" stroke-width="1.2" opacity="{f(r.uniform(.12,.34))}"/>'
    return wrap(w, h, b, d, 5)

def thara3(r, c):
    w, h = 600, 600; A, B, C, D = c
    b = f'<rect width="{w}" height="{h}" fill="{INK}"/>'
    xs = [0]
    while xs[-1] < w: xs.append(xs[-1] + r.randint(58, 112))
    ys = [0]
    while ys[-1] < h: ys.append(ys[-1] + r.randint(58, 112))
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            x, y = xs[i] + 8, ys[j] + 8; ww, hh = xs[i + 1] - xs[i] - 16, ys[j + 1] - ys[j] - 16
            col = r.choice([A, B, C, D, C])
            b += f'<rect x="{x}" y="{y}" width="{ww}" height="{hh}" fill="{col}"/><polygon points="{x+ww},{y} {x+ww+16},{y+10} {x+ww+16},{y+hh+10} {x+ww},{y+hh}" fill="{INK}" opacity=".5"/>'
            if r.random() < .55: b += f'<rect x="{x+r.randint(6,max(7,ww-30))}" y="{y+r.randint(6,max(7,hh-24))}" width="18" height="14" fill="{PAPER}" opacity=".55"/>'
            if r.random() < .2: b += f'<circle cx="{x+ww/2}" cy="{y+hh/2}" r="{min(ww,hh)/3.2}" fill="none" stroke="{PAPER}" stroke-width="2" opacity=".5"/>'
    for _ in range(14):
        x, y = r.uniform(30, 570), r.uniform(30, 570)
        b += f'<line x1="{f(x)}" y1="{f(y)}" x2="{f(x+r.uniform(18,34))}" y2="{f(y+r.uniform(10,26))}" stroke="{INK}" stroke-width="5" stroke-linecap="round" opacity=".8"/><circle cx="{f(x)}" cy="{f(y)}" r="4" fill="{PAPER}"/>'
    return wrap(w, h, b, '', 6)

def thara4(r, c):
    w, h = 600, 900; A, B, C, D = c
    d = lg('sky', [(0, B), (.45, D), (.78, GOLD), (1, PAPER)])
    b = f'<rect width="{w}" height="{h}" fill="url(#sky)"/><circle cx="420" cy="640" r="84" fill="{PAPER}" opacity=".8"/>'
    for k, (base, op) in enumerate([(700, .5), (760, 1)]):
        x = 0; pts = [(0, h)]
        while x < w + 40:
            ww = r.randint(30, 80); hh = r.randint(60 if k else 30, 190 if k else 120)
            pts += [(x, base - hh), (x + ww, base - hh)]; x += ww
        pts += [(w + 40, h)]
        b += f'<polygon points="{" ".join(f"{a},{c2}" for a, c2 in pts)}" fill="{INK}" opacity="{op}"/>'
    for _ in range(54):
        b += f'<rect x="{f(r.uniform(6,w-12))}" y="{f(r.uniform(640,880))}" width="5" height="7" fill="{GOLD}" opacity="{f(r.uniform(.4,.95))}"/>'
    for k in range(5):
        b += f'<circle cx="{f(120+k*95)}" cy="{f(250+k*72)}" r="{f(12+k*14)}" fill="none" stroke="{PAPER}" stroke-width="2" opacity="{f(.14+k*.04)}"/>'
    for _ in range(7):
        x, y = r.uniform(60, 520), r.uniform(120, 420)
        b += f'<path d="M{f(x)},{f(y)} q8,-9 16,0 q8,-9 16,0" stroke="{INK}" stroke-width="2.5" fill="none" opacity=".75"/>'
    return wrap(w, h, b, d, 7)

# ------------------------------------------------------------------ KWAN (illustration)
def spiral(cx, cy, r0, turns, rot=0, k=1.0):
    pts = []; n = int(turns * 26)
    for i in range(n):
        a = i / 26 * math.tau + rot; rr = r0 * (i / n) ** k
        pts.append(f'{f(cx+math.cos(a)*rr*1.0)},{f(cy+math.sin(a)*rr*.8)}')
    return 'M' + ' L'.join(pts)

def kwan1(r, c):
    w, h = 600, 840; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{C}"/>'
    for _ in range(9):
        b += f'<ellipse cx="{f(r.uniform(0,w))}" cy="{f(r.uniform(0,h))}" rx="{f(r.uniform(90,220))}" ry="{f(r.uniform(60,160))}" fill="{r.choice([A,PAPER,B])}" opacity="{f(r.uniform(.14,.3))}" transform="rotate({r.randint(-30,30)} 300 420)"/>'
    for k in range(7):
        b += f'<path d="{spiral(r.uniform(300,520),r.uniform(130,720),r.uniform(40,90),r.uniform(1.4,2.4),r.uniform(0,6))}" stroke="{INK if k%2 else PAPER}" stroke-width="{f(r.uniform(2.5,5))}" fill="none" stroke-linecap="round" opacity=".8"/>'
    b += f'<path d="M160,560 C300,520 420,600 590,540" stroke="{INK}" stroke-width="3.5" fill="none" opacity=".6"/>'
    b += f'<path d="M205,770 L222,600 Q250,570 280,600 L300,770" fill="{B}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/><path d="M215,690 Q250,672 290,690 L296,770 L206,770 Z" fill="{A}" opacity=".75"/>'
    b += f'<path d="M222,610 L150,515" stroke="{INK}" stroke-width="6" stroke-linecap="round"/><path d="M285,610 L355,540" stroke="{INK}" stroke-width="6" stroke-linecap="round"/><path d="M228,770 V810 M280,770 V810" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
    b += f'<circle cx="252" cy="520" r="62" fill="{PAPER}" stroke="{INK}" stroke-width="5"/><path d="M232,520 q8,-8 16,0 M262,520 q8,-8 16,0" stroke="{INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M240,546 q12,12 26,0" stroke="{INK}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="224" cy="540" r="8" fill="{PINK}" opacity=".7"/><circle cx="282" cy="540" r="8" fill="{PINK}" opacity=".7"/>'
    for k in range(9):
        y0 = 470 + k * 9
        b += f'<path d="M{f(300+k*2)},{y0-30} C{340+k*14},{y0-70} {420+k*16},{y0-10-k*6} {500+k*10},{y0-60+k*7}" stroke="{INK}" stroke-width="4" fill="none" stroke-linecap="round" opacity="{f(.9-k*.04)}"/>'
    for _ in range(18):
        x, y = r.uniform(330, 580), r.uniform(120, 700)
        b += f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(r.uniform(12,22))}" ry="{f(r.uniform(5,9))}" fill="{r.choice([A,B,PAPER])}" stroke="{INK}" stroke-width="2" transform="rotate({r.randint(-70,70)} {f(x)} {f(y)})"/>'
    return wrap(w, h, b, '', 8)

def flower(r, x, y, s, cols):
    petals = ''.join(f'<circle cx="{f(x+math.cos(a)*s)}" cy="{f(y+math.sin(a)*s)}" r="{f(s*.8)}" fill="{r.choice(cols)}" stroke="{INK}" stroke-width="2.5"/>' for a in [i * math.tau / 5 + r.random() for i in range(5)])
    return petals + f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(s*.6)}" fill="{GOLD}" stroke="{INK}" stroke-width="2.5"/>'

def kwan2(r, c):
    w, h = 600, 840; A, B, C = c
    d = lg('sk', [(0, PAPER), (1, C)])
    b = f'<rect width="{w}" height="{h}" fill="url(#sk)"/><circle cx="470" cy="140" r="68" fill="{GOLD}" stroke="{INK}" stroke-width="4"/>'
    for k in range(14):
        a = k * math.tau / 14; b += f'<line x1="{f(470+math.cos(a)*82)}" y1="{f(140+math.sin(a)*82)}" x2="{f(470+math.cos(a)*112)}" y2="{f(140+math.sin(a)*112)}" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
    for _ in range(7):
        b += f'<ellipse cx="{f(r.uniform(0,w))}" cy="{f(r.uniform(300,520))}" rx="{f(r.uniform(80,180))}" ry="{f(r.uniform(40,80))}" fill="{B}" opacity="{f(r.uniform(.12,.24))}"/>'
    for i in range(-1, 12):
        x = i * 54 + 6; top = 470 + (i % 2) * 6
        b += f'<path d="M{x},760 V{top+22} L{x+22},{top-10} L{x+44},{top+22} V760 Z" fill="{PAPER}" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<rect x="0" y="540" width="{w}" height="12" fill="{PAPER}" stroke="{INK}" stroke-width="3.5"/><rect x="0" y="660" width="{w}" height="12" fill="{PAPER}" stroke="{INK}" stroke-width="3.5"/>'
    b += f'<rect y="740" width="{w}" height="100" fill="{B}" opacity=".5"/>'
    for _ in range(26):
        x = r.uniform(10, 590); y = r.uniform(620, 790)
        b += f'<path d="M{f(x)},{f(y+60)} Q{f(x+r.uniform(-14,14))},{f(y+25)} {f(x)},{f(y)}" stroke="{INK}" stroke-width="3" fill="none"/><path d="M{f(x)},{f(y+34)} q-26,-6 -30,-26 q22,0 30,26z" fill="{B}" stroke="{INK}" stroke-width="2.5"/>'
        b += flower(r, x, y, r.uniform(9, 17), [A, B, PAPER, PINK])
    for _ in range(70):
        x = r.uniform(0, w)
        b += f'<path d="M{f(x)},840 q{f(r.uniform(-8,8))},-22 {f(r.uniform(-6,6))},{f(-r.uniform(26,56))}" stroke="{r.choice([B,INK,A])}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".8"/>'
    return wrap(w, h, b, d, 9)

def kwan3(r, c):
    w, h = 600, 900; A, B, C = c
    d = lg('sk', [(0, INK), (.5, B), (1, A)])
    b = f'<rect width="{w}" height="{h}" fill="url(#sk)"/><circle cx="410" cy="240" r="130" fill="{PAPER}" stroke="{INK}" stroke-width="5"/>'
    for cx, cy, rr in [(370, 200, 24), (450, 280, 30), (400, 300, 14), (440, 190, 12)]:
        b += f'<circle cx="{cx}" cy="{cy}" r="{rr}" fill="{C}" opacity=".5" stroke="{INK}" stroke-width="2"/>'
    for _ in range(40):
        x, y = r.uniform(10, 590), r.uniform(10, 480); s = r.uniform(4, 10)
        b += f'<path d="M{f(x)},{f(y-s)} L{f(x+s*.3)},{f(y-s*.3)} L{f(x+s)},{f(y)} L{f(x+s*.3)},{f(y+s*.3)} L{f(x)},{f(y+s)} L{f(x-s*.3)},{f(y+s*.3)} L{f(x-s)},{f(y)} L{f(x-s*.3)},{f(y-s*.3)}Z" fill="{GOLD}" opacity="{f(r.uniform(.5,1))}"/>'
    for k in range(7):
        x = r.uniform(0, 500); y = 520 + r.uniform(0, 280); wd = r.uniform(90, 170)
        b += f'<path d="M{f(x)},{f(y)} q10,-34 40,-22 q18,-34 52,-8 q40,-8 {f(wd-92)},30 z" fill="{PAPER}" opacity=".9" stroke="{INK}" stroke-width="3"/>'
    b += f'<path d="M-20,760 C140,640 360,640 620,420" stroke="{INK}" stroke-width="12" fill="none"/><path d="M-20,776 C140,656 360,656 620,436" stroke="{INK}" stroke-width="4" fill="none" stroke-dasharray="14 12"/>'
    for i in range(6):
        t = .12 + i * .15; x = -20 + (620 + 20) * t; y = 760 + (420 - 760) * t - math.sin(t * math.pi) * 130 + 8
        ang = -34 + i * 2
        b += f'<g transform="translate({f(x)} {f(y)}) rotate({ang})"><rect x="-36" y="-52" width="72" height="50" rx="6" fill="{PAPER if i%2 else A}" stroke="{INK}" stroke-width="4"/><rect x="-26" y="-42" width="20" height="18" fill="{C}" stroke="{INK}" stroke-width="2.5"/><rect x="2" y="-42" width="20" height="18" fill="{C}" stroke="{INK}" stroke-width="2.5"/><circle cx="-20" cy="2" r="9" fill="{INK}"/><circle cx="20" cy="2" r="9" fill="{INK}"/></g>'
    for k in range(5):
        b += f'<circle cx="{f(500+k*26)}" cy="{f(320-k*50)}" r="{f(14+k*8)}" fill="{PAPER}" stroke="{INK}" stroke-width="3" opacity="{f(.95-k*.12)}"/>'
    return wrap(w, h, b, d, 10)

# ------------------------------------------------------------------ PHUM (ceramics)
def phum1(r, c):
    w, h = 600, 800; A, B = c
    d = f'<radialGradient id="bg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="{PAPER}"/><stop offset=".6" stop-color="{A}"/><stop offset="1" stop-color="{B}"/></radialGradient>'
    prof = [(150, 0), (200, 20), (190, 60), (130, 120), (92, 210), (118, 330), (190, 450), (216, 540), (190, 620), (150, 640)]
    left = [(300 - x, 110 + y) for x, y in prof]; right = [(300 + x, 110 + y) for x, y in reversed(prof)]
    # smooth via polyline of catmull-rom-ish samples
    def smooth(pts, n=6):
        out = []
        for i in range(len(pts) - 1):
            p0, p1, p2, p3 = pts[max(i-1, 0)], pts[i], pts[i+1], pts[min(i+2, len(pts)-1)]
            for s in range(n):
                t = s / n; t2, t3 = t*t, t*t*t
                out.append((.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3), .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)))
        out.append(pts[-1]); return out
    prof2 = [(x, y) for x, y in prof]
    L = smooth([(300 - 0.5 * x, 110 + y) for x, y in [(60, 0), (80, 18), (66, 70), (50, 150), (84, 250), (150, 360), (196, 470), (206, 545), (190, 600), (150, 640)]])
    Rr = [(600 - x, y) for x, y in reversed(L)]
    pts = L + Rr
    path = 'M' + ' L'.join(f'{f(x)},{f(y)}' for x, y in pts) + ' Z'
    d += f'<clipPath id="vz"><path d="{path}"/></clipPath>' + lg('gz', [(0, B), (.5, A), (1, B)], 1, 0)
    b = f'<rect width="{w}" height="{h}" fill="url(#bg)"/><ellipse cx="300" cy="752" rx="230" ry="26" fill="{INK}" opacity=".35"/><rect y="750" width="{w}" height="50" fill="{B}" opacity=".6"/>'
    b += f'<path d="{path}" fill="{B}"/><g clip-path="url(#vz)"><rect width="{w}" height="{h}" fill="url(#gz)" opacity=".85"/>'
    for y in range(130, 760, 11): b += f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="{INK}" stroke-width="1.4" opacity="{f(r.uniform(.07,.2))}"/>'
    for _ in range(9):
        x = r.uniform(230, 370); b += f'<path d="M{f(x)},108 v{f(r.uniform(50,190))}" stroke="{PAPER}" stroke-width="{f(r.uniform(7,16))}" stroke-linecap="round" opacity=".8"/>'
    b += f'<ellipse cx="410" cy="440" rx="22" ry="130" fill="{PAPER}" opacity=".18" transform="rotate(-8 410 440)"/></g>'
    b += f'<path d="{path}" fill="none" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
    crack = 'M286,112 l12,44 l-16,36 l20,52 l-14,40 l22,60 l-8,48'
    b += f'<path d="{crack}" stroke="{INK}" stroke-width="9" fill="none" stroke-linejoin="round" opacity=".7"/><path d="{crack}" stroke="{GOLD}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
    return wrap(w, h, b, d, 11)

def phum2(r, c):
    w, h = 600, 600; A, B = c
    d = f'<radialGradient id="gl" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="{PAPER}"/><stop offset=".5" stop-color="{A}"/><stop offset="1" stop-color="{B}"/></radialGradient>'
    b = f'<rect width="{w}" height="{h}" fill="{A}"/><circle cx="300" cy="316" r="262" fill="{INK}" opacity=".3"/><circle cx="300" cy="300" r="258" fill="{PAPER}" stroke="{INK}" stroke-width="5"/><circle cx="300" cy="300" r="236" fill="none" stroke="{INK}" stroke-width="2" opacity=".35"/>'
    b += f'<rect x="440" y="248" width="120" height="104" rx="52" fill="none" stroke="{INK}" stroke-width="5"/><rect x="452" y="262" width="96" height="76" rx="38" fill="none" stroke="{B}" stroke-width="12"/>'
    b += f'<circle cx="300" cy="300" r="176" fill="url(#gl)" stroke="{INK}" stroke-width="6"/><circle cx="300" cy="300" r="146" fill="{B}" stroke="{INK}" stroke-width="4"/><circle cx="300" cy="300" r="146" fill="{INK}" opacity=".6"/><circle cx="300" cy="300" r="116" fill="{INK}" opacity=".35"/>'
    b += f'<path d="M190,260 A120,120 0 0 1 270,190" stroke="{PAPER}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>'
    for _ in range(110):
        a = r.uniform(0, math.tau); rr = r.uniform(150, 174)
        b += f'<circle cx="{f(300+math.cos(a)*rr)}" cy="{f(300+math.sin(a)*rr)}" r="{f(r.uniform(1,3.4))}" fill="{r.choice([PAPER,INK,GOLD])}" opacity="{f(r.uniform(.4,.9))}"/>'
    return wrap(w, h, b, d, 12)

# ------------------------------------------------------------------ IRENE (textiles)
def irene1(r, c):
    w, h = 600, 933; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{PAPER}"/>'
    x = 0
    while x < w:
        ww = r.choice([8, 14, 24, 40, 64]); col = r.choice([A, B, C, INK, PAPER, C]); b += f'<rect x="{x}" y="0" width="{ww}" height="880" fill="{col}" opacity="{f(r.uniform(.45,.8))}"/>'; x += ww + r.choice([0, 6, 12])
    y = 0
    while y < 880:
        hh = r.choice([8, 14, 24, 44, 70]); col = r.choice([A, B, C, INK, PAPER, C]); b += f'<rect x="0" y="{y}" width="{w}" height="{hh}" fill="{col}" opacity="{f(r.uniform(.4,.7))}"/>'; y += hh + r.choice([0, 6, 12])
    for xx in range(0, w, 4): b += f'<line x1="{xx}" y1="0" x2="{xx}" y2="880" stroke="{INK}" stroke-width="1" opacity=".07"/>'
    for yy in range(0, 880, 4): b += f'<line x1="0" y1="{yy}" x2="{w}" y2="{yy}" stroke="{PAPER}" stroke-width="1" opacity=".1"/>'
    b += f'<rect x="{r.randint(150,350)}" y="{r.randint(300,600)}" width="90" height="26" fill="{PINK}" opacity=".85"/><path d="M0,880 H600" stroke="{INK}" stroke-width="6"/>'
    for xx in range(2, w, 9):
        b += f'<path d="M{xx},880 q{r.uniform(-4,4):.1f},26 {r.uniform(-8,8):.1f},{r.randint(40,52)}" stroke="{r.choice([A,B,C,INK])}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    return wrap(w, h, b, '', 13)

def irene2(r, c):
    w, h = 600, 1080; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{BONE}"/><rect x="40" y="60" width="520" height="22" rx="11" fill="{INK}"/><circle cx="46" cy="71" r="14" fill="{INK}"/><circle cx="554" cy="71" r="14" fill="{INK}"/>'
    for i in range(34):
        x = 62 + i * 15.2; ln = r.randint(560, 960); col = r.choice([A, B, C, PAPER, INK, C]); wd = r.uniform(5, 13); ph = r.uniform(0, 6)
        pts = ' '.join(f'{f(x+math.sin(y/46+ph)*r.uniform(1.5,6))},{y}' for y in range(82, ln, 24))
        b += f'<polyline points="{pts}" stroke="{col}" stroke-width="{f(wd)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="{pts}" stroke="{INK}" stroke-width="1" fill="none" opacity=".25"/>'
        for _ in range(r.randint(1, 3)):
            yy = r.randint(120, ln - 40); b += f'<circle cx="{f(x)}" cy="{yy}" r="{f(wd*.8)}" fill="{r.choice([A,B,PAPER])}" stroke="{INK}" stroke-width="1.5"/>'
    for yy in (260, 520, 760):
        b += f'<rect x="56" y="{yy}" width="490" height="{r.randint(14,24)}" fill="{r.choice([A,B,C])}" opacity=".78"/>'
    for i in range(34):
        x = 62 + i * 15.2; b += f'<path d="M{f(x)},{r.randint(940,1000)} v{r.randint(20,60)}" stroke="{r.choice([A,B,C,INK])}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>'
    return wrap(w, h, b, '', 14)

def irene3(r, c):
    w, h = 600, 840; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{PAPER}"/>'
    cell = 50
    for i in range(12):
        for j in range(14):
            x, y = i * cell, 70 + j * cell; dark = (i + j) % 2 == 0
            b += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{A if dark else PAPER}"/><rect x="{x+11}" y="{y+11}" width="{cell-22}" height="{cell-22}" fill="{PAPER if dark else B}"/>'
            b += f'<path d="M{x},{y} l{cell},{cell}" stroke="{INK}" stroke-width="1.5" opacity=".18"/>'
            if (i * 3 + j * 5) % 11 == 0: b += f'<rect x="{x+20}" y="{y+20}" width="10" height="10" fill="{GOLD}"/>'
    b += f'<rect x="0" y="60" width="{w}" height="14" fill="{INK}"/><rect x="0" y="770" width="{w}" height="14" fill="{INK}"/>'
    for yy, d in ((60, -1), (784, 1)):
        for xx in range(2, w, 8):
            b += f'<path d="M{xx},{yy} q{r.uniform(-3,3):.1f},{d*18} {r.uniform(-6,6):.1f},{d*r.randint(32,54)}" stroke="{r.choice([A,B,C,INK])}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    return wrap(w, h, b, '', 15)

# ------------------------------------------------------------------ DAO (collage)
def dao1(r, c):
    w, h = 600, 840; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{BONE}"/>'
    cols = [PAPER, BONE, '#8F8C85', A, B, PAPER, BONE, C]
    for _ in range(11):
        x, y, ww, hh = r.uniform(-40, 420), r.uniform(-30, 700), r.uniform(150, 330), r.uniform(150, 330); fill = r.choice(cols)
        edge = text_lines(r, x + 12, y + 30, ww - 24, hh - 40, 9, INK, .5) + f'<rect x="{f(x+12)}" y="{f(y+10)}" width="{f(ww*.6)}" height="14" fill="{INK}" opacity=".8"/>'
        if r.random() < .4: edge += ''.join(f'<circle cx="{f(x+ww-60+i%6*8)}" cy="{f(y+hh-50+i//6*8)}" r="2.3" fill="{INK}" opacity=".7"/>' for i in range(36))
        b += torn(r, x, y, ww, hh, fill, r.uniform(-8, 8), 1, edge)
    b += f'<circle cx="430" cy="610" r="70" fill="none" stroke="{B}" stroke-width="7" opacity=".4"/>'
    for _ in range(4): b += tape(r.uniform(20, 480), r.uniform(10, 760), r.uniform(-35, 35))
    return wrap(w, h, b, '', 16)

def dao2(r, c):
    w, h = 600, 857; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{BONE}"/><circle cx="440" cy="190" r="86" fill="{PINK}" stroke="{INK}" stroke-width="3"/>'
    b += torn(r, 20, 20, 560, 400, PAPER, -1, .55, text_lines(r, 40, 60, 520, 330, 11, INK, .25))
    x = -10
    while x < w:
        ww = r.randint(70, 130); hh = r.randint(180, 470); y = h - 90 - hh; fill = r.choice([A, B, C, PAPER, '#8F8C85'])
        win = ''.join(f'<rect x="{f(x+12+i*22)}" y="{f(y+22+j*30)}" width="11" height="15" fill="{r.choice([GOLD,INK,INK,PAPER])}" opacity=".8"/>' for i in range(int((ww-24)/22)) for j in range(int((hh-40)/30)))
        b += torn(r, x, y, ww, hh, fill, r.uniform(-1.5, 1.5), 1, win); x += ww + r.randint(-6, 10)
    b += f'<rect y="{h-90}" width="{w}" height="90" fill="{INK}"/>' + text_lines(r, 20, h - 74, 560, 60, 12, BONE, .5)
    for _ in range(3): b += tape(r.uniform(40, 480), r.uniform(60, 700), r.uniform(-30, 30))
    return wrap(w, h, b, '', 17)

def dao3(r, c):
    w, h = 600, 600; A, B, C = c
    b = f'<rect width="{w}" height="{h}" fill="{B}"/>' + ''.join(torn(r, r.uniform(-30, 380), r.uniform(-30, 380), r.uniform(180, 300), r.uniform(140, 260), r.choice([BONE, A, C, PAPER]), r.uniform(-9, 9), .45, text_lines(r, 0, 0, 0, 0)) for _ in range(5))
    b += torn(r, 150, 70, 300, 210, PAPER, -5, 1, ''.join(f'<path d="M{170+k*0},{110+k*22} q40,-12 80,0 t80,0 t70,-2" stroke="{INK}" stroke-width="2.2" fill="none" opacity=".6" transform="translate(0 {k*2})"/>' for k in range(6)))
    b += f'<rect x="80" y="200" width="440" height="300" fill="{BONE}" stroke="{INK}" stroke-width="5"/><polygon points="80,200 300,370 520,200" fill="{PAPER}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/><polygon points="80,500 260,340 300,370 340,340 520,500" fill="{PAPER}" opacity=".6" stroke="{INK}" stroke-width="3"/>'
    b += f'<rect x="394" y="226" width="96" height="116" fill="{PINK}" stroke="{INK}" stroke-width="4" transform="rotate(5 442 284)"/><path d="M418,320 V270 L442,246 L466,270 V320 Z" fill="{PAPER}" stroke="{INK}" stroke-width="3" transform="rotate(5 442 284)"/>'
    b += ''.join(f'<circle cx="{394+i*8}" cy="226" r="2.6" fill="{BONE}" transform="rotate(5 442 284)"/>' for i in range(13))
    b += f'<circle cx="330" cy="350" r="50" fill="none" stroke="{INK}" stroke-width="4" opacity=".7"/><circle cx="330" cy="350" r="34" fill="none" stroke="{INK}" stroke-width="2.5" opacity=".7"/>' + ''.join(f'<path d="M{236},{346+k*14} q40,-14 80,0 t72,0" stroke="{INK}" stroke-width="3" fill="none" opacity=".55"/>' for k in range(3))
    b += tape(70, 190, -22) + tape(450, 470, 18)
    b += f'<text x="150" y="476" font-family="Special Elite, monospace" font-size="26" fill="{INK}" opacity=".8">dear city,</text>'
    return wrap(w, h, b, '', 18)


# ================================================================== NEW WAVE
# ---------- risograph (Mali): inks overprint with multiply, never quite registered, halftone dots ----------
def ht(id, size, rad, col, op=1):
    return f'<pattern id="{id}" width="{size}" height="{size}" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="{size/2}" cy="{size/2}" r="{rad}" fill="{col}" opacity="{op}"/></pattern>'
MUL = 'style="mix-blend-mode:multiply"'
def reg(x, y, c=INK):
    return f'<g stroke="{c}" stroke-width="1.5" fill="none" opacity=".7"><circle cx="{x}" cy="{y}" r="9"/><path d="M{x-14},{y} H{x+14} M{x},{y-14} V{y+14}"/></g>'

def mali1(r, c):
    w, h = 600, 750; A, B, C = c
    d = ht('h1', 9, 3.2, A) + ht('h2', 7, 2.4, B)
    b = f'<rect width="{w}" height="{h}" fill="{PAPER}"/>'
    b += f'<circle cx="270" cy="290" r="200" fill="{C}" {MUL} opacity=".95"/><circle cx="278" cy="296" r="200" fill="url(#h1)" {MUL}/>'
    b += f'<rect x="150" y="200" width="300" height="420" fill="{B}" {MUL} opacity=".9" transform="rotate(-9 300 410)"/><rect x="158" y="205" width="300" height="420" fill="url(#h2)" {MUL} transform="rotate(-9 300 410)"/>'
    b += f'<polygon points="330,120 520,560 150,560" fill="{A}" {MUL} opacity=".92"/><polygon points="337,126 527,566 157,566" fill="none" stroke="{A}" stroke-width="3" {MUL}/>'
    b += f'<circle cx="420" cy="520" r="90" fill="{B}" {MUL} opacity=".85"/><circle cx="148" cy="570" r="60" fill="{C}" {MUL}/>'
    for k in range(14): b += f'<rect x="{40+k*13}" y="660" width="7" height="{30+(k*37)%50}" fill="{INK}" opacity=".78"/>'
    b += reg(26, 26) + reg(w - 26, 26) + reg(26, h - 26) + reg(w - 26, h - 26)
    return wrap(w, h, b, d, 41)

def mali2(r, c):
    w, h = 600, 840; A, B, C = c
    d = ht('h1', 8, 2.6, A) + ht('h2', 8, 2.4, B)
    b = f'<rect width="{w}" height="{h}" fill="{PAPER}"/>'
    cw, ch = 262, 188
    motifs = [
        lambda x, y: f'<circle cx="{x+cw/2}" cy="{y+ch/2}" r="62" fill="{A}" {MUL}/><circle cx="{x+cw/2+8}" cy="{y+ch/2+6}" r="62" fill="url(#h2)" {MUL}/>',
        lambda x, y: ''.join(f'<rect x="{x+10+i*26}" y="{y+10}" width="14" height="{ch-20}" fill="{B}" {MUL}/>' for i in range(9)),
        lambda x, y: f'<polygon points="{x+cw/2},{y+16} {x+cw-28},{y+ch-18} {x+28},{y+ch-18}" fill="{C}" {MUL}/><polygon points="{x+cw/2+7},{y+22} {x+cw-21},{y+ch-12} {x+35},{y+ch-12}" fill="url(#h1)" {MUL}/>',
        lambda x, y: f'<path d="M{x+14},{y+ch/2} q{cw/8},-60 {cw/4},0 t{cw/4},0 t{cw/4},0 t{cw/4},0" stroke="{B}" stroke-width="16" fill="none" {MUL}/><path d="M{x+14},{y+ch/2+34} q{cw/8},-60 {cw/4},0 t{cw/4},0 t{cw/4},0 t{cw/4},0" stroke="{A}" stroke-width="10" fill="none" {MUL}/>',
        lambda x, y: f'<rect x="{x+34}" y="{y+40}" width="{cw-68}" height="{ch-60}" fill="{A}" {MUL}/><polygon points="{x+24},{y+44} {x+cw/2},{y+8} {x+cw-24},{y+44}" fill="{B}" {MUL}/><rect x="{x+cw/2-16}" y="{y+ch-86}" width="32" height="66" fill="{INK}" opacity=".8"/>',
        lambda x, y: f'<ellipse cx="{x+cw/2}" cy="{y+ch/2}" rx="86" ry="46" fill="none" stroke="{INK}" stroke-width="5"/><circle cx="{x+cw/2}" cy="{y+ch/2}" r="30" fill="{B}" {MUL}/><circle cx="{x+cw/2}" cy="{y+ch/2}" r="12" fill="{INK}"/>',
        lambda x, y: f'<circle cx="{x+cw*.3}" cy="{y+ch*.4}" r="44" fill="{C}" {MUL}/><circle cx="{x+cw*.55}" cy="{y+ch*.5}" r="44" fill="{A}" {MUL}/><circle cx="{x+cw*.75}" cy="{y+ch*.6}" r="44" fill="{B}" {MUL}/>',
        lambda x, y: ''.join(f'<polygon points="{x+cw/2},{y+ch/2-52} {x+cw/2+14},{y+ch/2-14} {x+cw/2+52},{y+ch/2} {x+cw/2+14},{y+ch/2+14} {x+cw/2},{y+ch/2+52} {x+cw/2-14},{y+ch/2+14} {x+cw/2-52},{y+ch/2} {x+cw/2-14},{y+ch/2-14}" fill="{col}" {MUL} transform="rotate({rot} {x+cw/2} {y+ch/2})"/>' for col, rot in ((A, 0), (B, 22))),
    ]
    for i, m in enumerate(motifs):
        x, y = 24 + (i % 2) * (cw + 28), 28 + (i // 2) * (ch + 22)
        b += f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" fill="{PAPER}" stroke="{INK}" stroke-width="3"/>' + m(x, y) + f'<text x="{x+8}" y="{y+ch-8}" font-family="Special Elite, monospace" font-size="14" fill="{INK}" opacity=".8">{i+1}/8</text>'
    return wrap(w, h, b, d, 42)

def mali3(r, c):
    w, h = 600, 600; A, B, C = c
    d = ht('h1', 8, 3, B)
    b = f'<rect width="{w}" height="{h}" fill="{PAPER}"/>'
    x = 0
    while x < w:
        ww = r.choice([30, 46, 70, 100]); col = r.choice([A, B, C]); b += f'<rect x="{x}" y="0" width="{ww}" height="{h}" fill="{col}" {MUL} opacity="{f(r.uniform(.7,.95))}"/>'; x += ww + r.choice([0, 0, 8])
    b += f'<circle cx="300" cy="260" r="170" fill="{PAPER}" opacity=".9"/><circle cx="300" cy="260" r="170" fill="url(#h1)" {MUL}/><circle cx="312" cy="270" r="170" fill="none" stroke="{A}" stroke-width="6" {MUL}/>'
    b += f'<rect x="0" y="470" width="{w}" height="130" fill="{PAPER}" opacity=".92"/>' + ''.join(f'<rect x="{20+i*28}" y="486" width="14" height="{40+(i*53)%70}" fill="{r.choice([A,B,C])}" {MUL}/>' for i in range(20))
    b += reg(24, 24) + reg(w - 24, h - 24)
    return wrap(w, h, b, d, 43)

# ---------- generative / pen plotter (Phop): lines from equations, cream paper ----------
def phop1(r, c):
    w, h = 600, 800; K, G, S = c
    b = f'<rect width="{w}" height="{h}" fill="{BONE}"/>'
    fld = lambda x, y: math.sin(x / 95) * 1.6 + math.cos(y / 80) * 1.4 + math.sin((x + y) / 140) * 1.2
    for n in range(190):
        x, y = r.uniform(20, w - 20), r.uniform(20, h - 20); pts = []
        for _ in range(46):
            pts.append((x, y)); a = fld(x, y); x += math.cos(a) * 8; y += math.sin(a) * 8
            if not (10 < x < w - 10 and 10 < y < h - 10): break
        col, op = (INK, .55) if n % 9 else (r.choice([GOLD, PINK]), .85)
        b += f'<polyline points="{" ".join(f"{px:.1f},{py:.1f}" for px, py in pts)}" fill="none" stroke="{col}" stroke-width="{1.1 if n%9 else 1.8}" opacity="{op}" stroke-linecap="round"/>'
    b += f'<rect x="14" y="14" width="{w-28}" height="{h-28}" fill="none" stroke="{INK}" stroke-width="1.5" opacity=".6"/>'
    return wrap(w, h, b, '', 51)

def phop2(r, c):
    w, h = 600, 600
    b = f'<rect width="{w}" height="{h}" fill="{BONE}"/>'
    for i in range(70):
        cx, cy = 300 + math.cos(i * .33) * 78, 300 + math.sin(i * .33) * 78
        col = GOLD if i % 17 == 0 else (PINK if i % 23 == 0 else INK)
        b += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{34+i*3.6:.1f}" fill="none" stroke="{col}" stroke-width="{1.4 if col!=INK else 1}" opacity="{.8 if col!=INK else .5}"/>'
    b += f'<circle cx="300" cy="300" r="7" fill="{PINK}"/>'
    return wrap(w, h, b, '', 52)

def phop3(r, c):
    w, h = 800, 600
    b = f'<rect width="{w}" height="{h}" fill="{BONE}"/>'
    bumps = [(r.uniform(150, 650), r.uniform(20, 70), r.uniform(60, 130)) for _ in range(7)]
    for row in range(38):
        y0 = 90 + row * 12; pts = []
        for x in range(60, 741, 8):
            amp = sum(a * math.exp(-((x - cx) / wd) ** 2) for cx, a, wd in bumps) * (0.35 + row / 38 * .9)
            pts.append((x, y0 - amp * (1 + .25 * math.sin(x / 9 + row))))
        poly = f'M60,{y0+400} ' + ' '.join(f'L{x},{y:.1f}' for x, y in pts) + f' L740,{y0+400} Z'
        col = PINK if row == 33 else INK
        b += f'<path d="{poly}" fill="{BONE}" stroke="none"/><polyline points="{" ".join(f"{x},{y:.1f}" for x, y in pts)}" fill="none" stroke="{col}" stroke-width="{1.6 if col==PINK else 1.1}" opacity=".8" stroke-linejoin="round"/>'
    return wrap(w, h, b, '', 53)

# ---------- glitch (Phrae): corrupted signal, displaced bands, pixel sorting ----------
def phrae1(r, c):
    w, h = 800, 600; K, M, Cy = c
    d = lg('g', [(0, M), (.5, PAPER), (1, Cy)], 1, 0)
    b = f'<rect width="{w}" height="{h}" fill="{K}"/>'
    y = 0
    while y < h:
        bh = r.choice([6, 10, 18, 30, 44]); off = r.choice([0, 0, -60, 40, 120, -150, 22]); col = r.choice([M, Cy, PAPER, K, M, Cy])
        b += f'<rect x="{off}" y="{y}" width="{w}" height="{bh}" fill="{col}" opacity="{f(r.uniform(.35,.95))}"/>'
        if r.random() < .5: b += f'<rect x="{r.uniform(0,w-200):.0f}" y="{y}" width="{r.uniform(60,260):.0f}" height="{bh}" fill="url(#g)" opacity=".85"/>'
        y += bh
    for _ in range(90): b += f'<rect x="{r.randint(0,w//8)*8}" y="{r.randint(0,h//8)*8}" width="{r.choice([8,16,24])}" height="8" fill="{r.choice([PAPER,M,Cy])}" opacity="{f(r.uniform(.4,1))}"/>'
    for yy in range(0, h, 4): b += f'<rect y="{yy}" width="{w}" height="1.4" fill="#000" opacity=".28"/>'
    return wrap(w, h, b, d, 61)

def phrae2(r, c):
    w, h = 600, 600; K, M, Cy = c
    b = f'<rect width="{w}" height="{h}" fill="{K}"/>'
    shades = [K, '#2A2A3C', M, '#8E3B64', Cy, '#2F7F7B', PAPER]
    x = 0
    while x < w:
        cw = r.choice([6, 10, 14, 22]); cut = r.uniform(120, 520); segs = sorted(r.choices(shades, k=r.randint(5, 9)), key=lambda s: shades.index(s)); y = h - cut
        for s in segs:
            hh = r.uniform(18, (cut) / len(segs) * 1.6)
            b += f'<rect x="{x}" y="{f(y)}" width="{cw}" height="{f(hh)}" fill="{s}"/>'; y += hh
        b += f'<rect x="{x}" y="0" width="{cw}" height="{f(h-cut)}" fill="{r.choice([K,K,PAPER])}" opacity=".12"/>'
        x += cw
    for yy in range(0, h, 4): b += f'<rect y="{yy}" width="{w}" height="1" fill="#000" opacity=".22"/>'
    return wrap(w, h, b, '', 62)

def phrae3(r, c):
    w, h = 600, 900; K, M, Cy = c; cell = 20; cols, rows = w // cell, h // cell
    b = f'<rect width="{w}" height="{h}" fill="{K}"/>'
    inside = lambda i, j: ((i - 15) / 7.2) ** 2 + ((j - 17) / 8.5) ** 2 < 1 or (abs(i - 15) < 11 and j > 25 and j < 40 and ((i - 15) / 11) ** 2 + ((j - 40) / 15) ** 2 < 1)
    shift = {}
    for j in range(rows):
        if r.random() < .22: shift[j] = r.choice([-4, -2, 3, 5, 8])
    for layer, (col, dx) in enumerate(((M, -3), (Cy, 3), (PAPER, 0))):
        for j in range(rows):
            for i in range(cols):
                ii = i - shift.get(j, 0)
                if inside(ii, j) and (layer == 2 and r.random() < .13 or layer < 2 and r.random() < .72):
                    b += f'<rect x="{i*cell+dx}" y="{j*cell}" width="{cell-1}" height="{cell-1}" fill="{col}" opacity="{.8 if layer<2 else .9}"/>'
    for _ in range(40): b += f'<rect x="{r.randint(0,cols-3)*cell}" y="{r.randint(0,rows-1)*cell}" width="{r.choice([3,5,8])*cell}" height="{cell}" fill="{r.choice([M,Cy,PAPER])}" opacity=".5"/>'
    for yy in range(0, h, 4): b += f'<rect y="{yy}" width="{w}" height="1" fill="#000" opacity=".25"/>'
    return wrap(w, h, b, '', 63)

# ---------- bio art (Pan): mycelium, spores, living skin ----------
def pan1(r, c):
    w, h = 600, 600; D, G, Cr = c
    d = f'<radialGradient id="rg" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="{D}" stop-opacity=".0"/><stop offset="1" stop-color="{INK}" stop-opacity=".5"/></radialGradient>'
    b = f'<rect width="{w}" height="{h}" fill="{D}"/><rect width="{w}" height="{h}" fill="url(#rg)"/>'
    def branch(x, y, a, ln, dp, wd):
        nonlocal b
        if dp == 0 or ln < 6: b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{f(r.uniform(1.6,3.4))}" fill="{Cr}" opacity=".9"/>'; return
        x2, y2 = x + math.cos(a) * ln, y + math.sin(a) * ln; mx, my = (x + x2) / 2 + r.uniform(-ln * .2, ln * .2), (y + y2) / 2 + r.uniform(-ln * .2, ln * .2)
        b += f'<path d="M{x:.1f},{y:.1f} Q{mx:.1f},{my:.1f} {x2:.1f},{y2:.1f}" stroke="{Cr}" stroke-width="{wd:.2f}" fill="none" stroke-linecap="round" opacity="{f(.45+dp*.07)}"/>'
        for k in range(2 if dp < 4 else r.choice([2, 2, 3])): branch(x2, y2, a + r.uniform(-.9, .9), ln * r.uniform(.62, .8), dp - 1, wd * .72)
    for (x, y, a) in ((300, 600, -math.pi / 2), (80, 560, -1.0), (520, 570, -2.1), (40, 320, 0), (570, 300, math.pi), (300, 20, math.pi / 2)): branch(x, y, a, 130, 6, 4.2)
    return wrap(w, h, b, d, 71)

def pan2(r, c):
    w, h = 600, 800; D, G, Cr = c
    b = f'<rect width="{w}" height="{h}" fill="{PAPER}"/>'
    cx, cy = 300, 380
    for ring in range(1, 4): b += f'<circle cx="{cx}" cy="{cy}" r="{ring*84}" fill="none" stroke="{D}" stroke-width="1" opacity=".15"/>'
    for k in range(66):
        a = k / 66 * math.tau + r.uniform(-.01, .01)
        for s in range(25):
            rr = 30 + s * 10 + r.uniform(-1.5, 1.5); sz = max(.7, 3.2 - s * .1)
            b += f'<circle cx="{cx+math.cos(a)*rr:.1f}" cy="{cy+math.sin(a)*rr:.1f}" r="{sz:.2f}" fill="{D}" opacity="{f(max(.12, .85 - s * .022))}"/>'
    b += f'<circle cx="{cx}" cy="{cy}" r="22" fill="{D}" opacity=".85"/><circle cx="{cx}" cy="{cy}" r="9" fill="{PAPER}"/>'
    b += f'<text x="300" y="770" text-anchor="middle" font-family="Special Elite, monospace" font-size="15" fill="{D}" opacity=".7">spore print · 18 h · room temp</text>'
    return wrap(w, h, b, '', 72)

def pan3(r, c):
    w, h = 750, 600; D, G, Cr = c; placed = []
    b = f'<rect width="{w}" height="{h}" fill="{Cr}"/>'
    for _ in range(4000):
        x, y, rad = r.uniform(0, w), r.uniform(0, h), r.uniform(10, 44)
        if all((x - px) ** 2 + (y - py) ** 2 > (rad + pr + 3) ** 2 for px, py, pr in placed):
            placed.append((x, y, rad)); col = r.choice([D, G, G, Cr, PAPER])
            b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rad:.1f}" fill="{col}" stroke="{INK}" stroke-width="2" stroke-opacity=".55"/><circle cx="{x+rad*.15:.1f}" cy="{y+rad*.1:.1f}" r="{rad*.42:.1f}" fill="{r.choice([D,G,PAPER])}" opacity=".7"/><circle cx="{x-rad*.25:.1f}" cy="{y-rad*.3:.1f}" r="{max(1.5,rad*.1):.1f}" fill="{PAPER}" opacity=".8"/>'
            if len(placed) > 170: break
    return wrap(w, h, b, '', 73)

PIECES = {
 'napha': ('4/3 1/1 4/3', [napha1, napha2, napha3], ['#C4958A', '#7A4A40', '#D4CFCA']),
 'thara': ('2/3 2/3 1/1 2/3', [thara1, thara2, thara3, thara4], ['#4A6080', '#2D4A6A', '#6B8099', '#8A9BB0']),
 'kwan': ('5/7 5/7 2/3', [kwan1, kwan2, kwan3], ['#9B6B9B', '#7A4A7A', '#B888B8']),
 'phum': ('3/4 1/1', [phum1, phum2], ['#D99A4E', '#B87830']),
 'irene': ('9/14 5/9 5/7', [irene1, irene2, irene3], ['#4A7040', '#3A6030', '#5A8050']),
 'dao': ('5/7 7/10 1/1', [dao1, dao2, dao3], ['#4A4A4A', '#6A6A6A', '#3A3A3A']),
 'mali': ('4/5 5/7 1/1', [mali1, mali2, mali3], ['#E8584F', '#3F6FA8', '#F0C14B']),
 'phop': ('3/4 1/1 4/3', [phop1, phop2, phop3], ['#2E2A3A', '#C9A24B', '#E8E4D8']),
 'phrae': ('4/3 1/1 2/3', [phrae1, phrae2, phrae3], ['#1B1B26', '#D6457A', '#3FB8AF']),
 'pan': ('1/1 3/4 5/4', [pan1, pan2, pan3], ['#2A241C', '#8F9A6C', '#D8CFA6']),
}
for aid, (ars, fns, cols) in PIECES.items():
    for i, fn in enumerate(fns):
        svg = fn(random.Random(sum(map(ord, aid)) + i * 31 + 5), cols)
        open(f'{OUT}/{aid}-{i+1}.svg', 'w', encoding='utf-8').write(svg)
print('wrote', len(os.listdir(OUT)), 'files')
