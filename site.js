/* ---------- concrete grain: rendered ONCE into a tile, reused as an SVG pattern (replaces per-piece feTurbulence) ---------- */
(function grainTile() {
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
    document.getElementById('noiseImg').setAttribute('href', c.toDataURL('image/png'));
  } catch (e) {}
})();

ransom(document.getElementById('rn-title'), 'CIRCLES');

function renderMarquee() { document.getElementById('mq').innerHTML = t('mq').map(x => `<span>${esc(x)}</span><i>✱</i>`).join('').repeat(4); }

/* ---------- raw concrete ---------- */
const silh = [];   // flat silhouettes -> separate hover-shadow layer
function mass(d, o = {}) {
  silh.push(d);
  const sh = o.cyl ? 'cyl' : 'shade';
  return `<path d="${d}" fill="#8F8C85" fill-rule="evenodd"/><path d="${d}" fill="url(#noise)" fill-rule="evenodd"/>
    <path d="${d}" fill="url(#form)" fill-rule="evenodd" opacity=".5"/>
    <path d="${d}" fill="url(#ties)" fill-rule="evenodd" opacity=".45"/>
    <path d="${d}" fill="url(#${sh})" fill-rule="evenodd" opacity="${o.cyl ? .5 : .36}"/>
    <path d="${d}" fill="url(#ao)" fill-rule="evenodd"/>
    <path d="${d}" fill="none" stroke="#0E0D0C" stroke-width="3" stroke-linejoin="round" fill-rule="evenodd"/>`;
}
const circ = (cx, cy, r) => `M${cx-r},${cy} A${r},${r} 0 1 0 ${cx+r},${cy} A${r},${r} 0 1 0 ${cx-r},${cy} Z`;
let tIdx = 0;
function tile(x, y, w, h, color, title, o = {}) {
  const ov = o.tartan ? 'tartanS' : 'tg';
  let body = '';
  if (o.round) {
    const cx = x + w / 2, cy = y + h / 2, r = w / 2;
    body = `<circle cx="${cx}" cy="${cy}" r="${r}" class="t-out"/><circle class="t-in" cx="${cx}" cy="${cy}" r="${r-5}" fill="${color}"/><circle cx="${cx}" cy="${cy}" r="${r-5}" fill="url(#${ov})"/><circle cx="${cx}" cy="${cy}" r="${r-6.5}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/><circle class="t-hi" cx="${cx}" cy="${cy}" r="${r-5}"/>`;
  } else if (o.arch) {
    const p = (i) => `M${x+i},${y+h} V${y+w/2} A${w/2-i},${w/2-i} 0 0 1 ${x+w-i},${y+w/2} V${y+h} Z`;
    body = `<path class="t-out" d="${p(0)}"/><path class="t-in" d="${p(4)}" fill="${color}"/><path d="${p(4)}" fill="url(#${ov})"/><path d="${p(5.5)}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/><path class="t-hi" d="${p(4)}"/>`;
  } else {
    body = `<rect class="t-out" x="${x}" y="${y}" width="${w}" height="${h}"/><rect class="t-in" x="${x+5}" y="${y+5}" width="${w-10}" height="${h-10}" fill="${color}"/><rect x="${x+5}" y="${y+5}" width="${w-10}" height="${h-10}" fill="url(#${ov})"/><rect x="${x+6.5}" y="${y+6.5}" width="${w-13}" height="${h-13}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/><rect class="t-hi" x="${x+5}" y="${y+5}" width="${w-10}" height="${h-10}"/>`;
  }
  return `<g class="tile" style="--t:${tIdx++}"><title>${title}</title>${body}</g>`;
}
function tape(x, y, rot) { return `<rect x="${x}" y="${y}" width="46" height="15" fill="#FF2E88" stroke="#0E0D0C" stroke-width="2" opacity=".94" transform="rotate(${rot} ${x+23} ${y+7})"/>`; }

function monument(a) {
  tIdx = 0; silh.length = 0;
  const W = a.works, T = a.titles;
  let s = `<svg class="mon" viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ตึกของ${a.name}"><ellipse cx="200" cy="545" rx="205" ry="9" fill="url(#gshadow)"/>`;
  if (a.kind === 'arch') {
    const hole = 'M110,540 V270 A90,90 0 0 1 290,270 V540 Z';
    s += `<path d="${hole}" fill="#161413"/><path d="M110,180 L290,180 L330,540 L70,540 Z" fill="url(#shaft)" opacity=".7"/>`;
    s += tile(126, 296, 148, 92, W[0], T[0]) + tile(126, 414, 68, 102, W[1], T[1]) + tile(206, 414, 68, 102, W[2], T[2]);
    s += mass('M30,540 V150 H370 V540 Z ' + hole);
    s += mass('M74,150 V96 H326 V150 Z') + mass('M20,522 H380 V540 H20 Z');
  } else if (a.kind === 'lens') {
    s += mass('M54,540 V170 H172 V540 Z') + mass('M262,170 H280 V270 H262 Z') + mass('M262,448 H280 V540 H262 Z');
    s += mass(circ(271, 360, 104) + ' ' + circ(271, 360, 68));
    s += `<circle cx="271" cy="360" r="68" fill="#111"/><circle cx="271" cy="360" r="52" fill="none" stroke="#777" stroke-width="3"/><circle cx="271" cy="360" r="36" fill="none" stroke="#777" stroke-width="3"/><circle cx="271" cy="360" r="16" fill="#2a2a2a" stroke="#777" stroke-width="2"/><circle cx="262" cy="351" r="5" fill="#fff" opacity=".8"/>`;
    s += mass('M14,96 H386 V170 H14 Z');
    W.forEach((c, i) => s += tile(30 + i * 90, 108, 78, 52, c, T[i]));
  } else if (a.kind === 'tower') {
    s += mass('M84,540 V112 H316 V540 Z', {cyl: 1}) + mass('M72,88 H328 V112 H72 Z') + mass('M64,524 H336 V540 H64 Z');
    const pick = {'1-0':0, '3-1':1, '5-2':2};
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
      const x = 108 + c * 62, y = 134 + r * 66, k = pick[`${r}-${c}`];
      s += `<path d="M${x},${y+54} V${y+25} A25,25 0 0 1 ${x+50},${y+25} V${y+54} Z" fill="#161413" stroke="#0E0D0C" stroke-width="3"/>`;
      if (k !== undefined) s += tile(x + 3, y + 3, 44, 51, W[k], T[k], {arch: 1});
    }
  } else if (a.kind === 'vase') {
    const shell = 'M50,540 C140,430 152,330 138,176 H262 C248,330 260,430 350,540 Z';
    s += mass(shell, {cyl: 1}) + mass('M124,154 H276 V176 H124 Z') + mass('M30,518 H370 V540 H30 Z');
    s += tile(166, 246, 68, 68, W[0], T[0], {round: 1}) + tile(160, 380, 80, 80, W[1], T[1], {round: 1});
  } else if (a.kind === 'shell') {
    s += mass('M40,300 H360 V540 H40 Z');
    s += mass('M40,300 Q80,150 120,300 Q160,150 200,300 Q240,150 280,300 Q320,150 360,300 Z');
    W.forEach((c, i) => s += tile(54 + i * 100, 348, 84, 120, c, T[i], {tartan: 1}));
    s += mass('M30,522 H370 V540 H30 Z');
  } else if (a.kind === 'stack') {                 // risograph: slabs printed out of register, with ink swatches
    s += mass('M26,522 H340 V540 H26 Z') + mass('M40,540 V400 H300 V540 Z') + mass('M100,400 V270 H360 V400 Z') + mass('M60,270 V150 H310 V270 Z') + mass('M44,130 H326 V150 H44 Z');
    s += tile(60, 420, 220, 100, W[0], T[0]) + tile(124, 288, 212, 96, W[1], T[1]) + tile(84, 168, 200, 86, W[2], T[2]);
    s += `<g stroke="#0E0D0C" stroke-width="2" fill="none" opacity=".75"><circle cx="72" cy="162" r="7"/><path d="M62,162 H82 M72,152 V172"/><circle cx="298" cy="162" r="7"/><path d="M288,162 H308 M298,152 V172"/></g>`;
    W.forEach((c, i) => s += `<rect x="314" y="${436 + i * 32}" width="30" height="24" fill="${c}" stroke="#0E0D0C" stroke-width="3"/>`);
  } else if (a.kind === 'dome') {                  // generative: a dome ringed by plotted arcs
    s += mass('M26,522 H374 V540 H26 Z') + mass('M50,540 V400 H350 V540 Z') + mass('M60,400 A140,140 0 0 1 340,400 Z') + mass('M176,262 V210 H224 V262 Z') + mass('M166,210 H234 V192 H166 Z');
    [38, 68, 98, 124].forEach(r => s += `<path d="M${200 - r},400 A${r},${r} 0 0 1 ${200 + r},400" fill="none" stroke="#0E0D0C" stroke-width="2" opacity=".55"/>`);
    for (let i = 0; i < 9; i++) { const ang = Math.PI + (i + 1) * Math.PI / 10; s += `<circle cx="${(200 + Math.cos(ang) * 112).toFixed(1)}" cy="${(400 + Math.sin(ang) * 112).toFixed(1)}" r="3" fill="#0E0D0C" opacity=".6"/>`; }
    W.forEach((c, i) => s += tile(86 + i * 82, 440, 64, 64, c, T[i], {round: 1}));
  } else if (a.kind === 'pixel') {                 // glitch: horizontal slices knocked out of line
    [[540, 480, 70, 330], [480, 430, 40, 300], [430, 380, 110, 370], [380, 300, 70, 330], [300, 262, 20, 280], [262, 190, 90, 350], [190, 150, 60, 300], [150, 96, 100, 320]].forEach(([yb, yt, x0, x1]) => s += mass(`M${x0},${yb} V${yt} H${x1} V${yb} Z`));
    s += tile(92, 314, 104, 52, W[0], T[0]) + tile(116, 204, 104, 46, W[1], T[1]) + tile(122, 106, 100, 34, W[2], T[2]);
    [[336, 200, 14], [306, 284, 12], [22, 372, 12], [306, 160, 10], [352, 338, 12], [10, 470, 14], [330, 470, 10]].forEach(([x, y, z]) => s += `<rect x="${x}" y="${y}" width="${z}" height="${z}" fill="#0E0D0C"/>`);
  } else if (a.kind === 'spore') {                 // bio art: a mushroom with two small ones, roots in the ground
    s += mass('M150,350 C146,430 140,490 120,540 H280 C260,490 254,430 250,350 Z', {cyl: 1}) + mass('M44,470 V540 H66 V470 Z') + mass('M326,490 V540 H344 V490 Z');
    s += mass('M10,470 Q10,420 55,420 Q100,420 100,470 Z') + mass('M300,490 Q300,450 335,450 Q370,450 370,490 Z');
    s += mass('M30,330 Q30,150 200,150 Q370,150 370,330 Z') + mass('M30,330 H370 V352 H30 Z');
    W.forEach((c, i) => s += tile(86 + i * 82, i === 1 ? 190 : 214, 64, 64, c, T[i], {round: 1}));
    s += `<path d="M120,540 q-30,10 -62,8 M280,540 q30,10 72,8 M200,540 v16 M170,540 q-6,12 -22,16 M230,540 q6,12 22,16" fill="none" stroke="#0E0D0C" stroke-width="3" opacity=".6"/>`;
  } else {
    const A = '50,540 50,394 70,384 92,396 118,382 144,394 170,384 196,396 230,388 230,540';
    const B = '110,404 110,264 135,254 160,268 188,256 214,270 244,258 272,270 300,260 330,272 330,404';
    const C = '180,274 180,122 205,112 230,126 258,114 284,128 312,116 340,128 360,120 360,274';
    const piece = (pts, rot, cx, cy) => `<g transform="rotate(${rot} ${cx} ${cy})"><polygon points="${pts}" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="12" stroke-linejoin="round"/>${mass('M' + pts.split(' ').join(' L') + ' Z')}</g>`;
    s += piece(C, 2, 270, 200) + piece(B, -2, 220, 330) + piece(A, 0, 140, 460);
    s += tile(214, 150, 84, 104, W[0], T[0]) + tile(150, 288, 76, 98, W[1], T[1]) + tile(76, 420, 68, 90, W[2], T[2]);
    s += tape(226, 142, -12) + tape(158, 280, 14) + tape(84, 412, -8);
  }
  s += `<line x1="-40" y1="540" x2="440" y2="540" stroke="#0E0D0C" stroke-width="6"/></svg>`;
  const shadow = `<svg class="sh" viewBox="0 0 400 560" aria-hidden="true">${silh.map(d => `<path d="${d}" fill-rule="evenodd"/>`).join('')}</svg>`;
  return shadow + s;
}

const PIN = `<svg class="pin" viewBox="0 0 64 22" aria-hidden="true"><path d="M10,6 H52 M10,15 H44" stroke="#8d8d8d" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M10,6 C0,6 0,15 10,15" stroke="#8d8d8d" stroke-width="2.6" fill="none" stroke-linecap="round"/><rect x="44" y="3" width="14" height="15" rx="4" fill="#bdbdbd" stroke="#6d6d6d" stroke-width="2"/></svg>`;

const strip = document.getElementById('strip');
let dragMoved = false, vel = 0, inertia = 0;
function refreshCity() {     // fills every building tag in the current language
  document.querySelectorAll('#strip-in .bd').forEach((bd, i) => {
    const a = ARTISTS[i], nm = bd.querySelector('.nm');
    bd.querySelector('.mon').setAttribute('aria-label', LANG === 'en' ? `${nameL(a)}'s building` : `ตึกของ${a.name}`);
    bd.querySelector('.no').textContent = `NO.${String(i + 1).padStart(2, '0')} · ${t('works_n', {n: a.works.length})}`;
    nm.setAttribute('aria-label', nameL(a)); ransom(nm, nameL(a), i);
    bd.querySelector('.ds').textContent = discL(a);
    let wv = bd.querySelector('.wv'); if (a.wave) { if (!wv) { wv = document.createElement('i'); wv.className = 'wv'; bd.querySelector('.tag').appendChild(wv); } wv.textContent = '★ ' + t('wave'); }
    bd.querySelector('.wl').textContent = a.pieces.map(p => pk(p, 't')).join(' · ');
  });
}
function renderCity() {
  document.documentElement.style.setProperty('--bk', (Math.max(...ARTISTS.map(a => a.scale)) * 1.4).toFixed(3));     // tallest building = widest scale x the drawing's 1.4 height/width
  const host = document.getElementById('strip-in');
  host.insertAdjacentHTML('beforeend', ARTISTS.map((a, i) => `
    <a class="bd" href="studio-${a.id}.html" draggable="false" style="--i:${i};--s:${a.scale}" data-cur="ENTER" data-id="${a.id}">
      ${monument(a)}
      <div class="tag">${PIN}<div class="no"></div><span class="nm rn" role="img"></span><div class="ds"></div><div class="wl"></div></div>
    </a>`).join(''));
  refreshCity();
  host.querySelectorAll('.bd').forEach(el => {
    el.addEventListener('click', e => {      // plain click = animated page change; ctrl/cmd/middle click keeps the browser's own "open in new tab"
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault(); if (!dragMoved) openStudio(el.dataset.id);
    });
  });
}

/* ---------- smooth horizontal travel: drag + inertia, progress, parallax ---------- */
function scrollCity(d) { cancelAnimationFrame(inertia); strip.scrollBy({left: d * 460, behavior: 'smooth'}); }
(function () {
  let down = false, sx = 0, sl = 0, lastX = 0, lastT = 0;
  strip.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    cancelAnimationFrame(inertia);
    down = true; dragMoved = false; sx = lastX = e.clientX; sl = strip.scrollLeft; lastT = performance.now(); vel = 0;
  });
  addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 5 && !dragMoved) { dragMoved = true; strip.classList.add('drag'); }
    if (!dragMoved) return;
    strip.scrollLeft = sl - dx;
    const now = performance.now(), dt = Math.max(1, now - lastT);
    vel = .8 * vel + .2 * ((lastX - e.clientX) / dt * 16);
    lastX = e.clientX; lastT = now;
  });
  const end = () => {
    if (!down) return;
    down = false; strip.classList.remove('drag');
    if (dragMoved && !reduce) {
      (function glide() { if (Math.abs(vel) < .3) return; strip.scrollLeft += vel; vel *= .94; inertia = requestAnimationFrame(glide); })();
    }
    setTimeout(() => dragMoved = false, 0);
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  strip.addEventListener('keydown', e => {
    if (e.target !== strip) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollCity(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollCity(-1); }
  });
})();
const prog = document.getElementById('progress-i'), inner = document.getElementById('strip-in');
let ticking = false, parEls = null;
/* the MID city: closer and darker than the far one, windows cut out as holes, lower than the artists' towers */
(function midCity() {
  let x = 0, g = '';
  const win = (bx, by, bw, bh, cols, rows) => { let d = ''; const cw = bw / (cols * 2 + 1), rh = bh / (rows * 2 + 1); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) d += ` M${(bx + cw * (2 * c + 1)).toFixed(1)},${(by + rh * (2 * r + 1)).toFixed(1)} h${cw.toFixed(1)} v${(rh * 1.1).toFixed(1)} h${(-cw).toFixed(1)} Z`; return d; };
  for (let i = 0; x < 4700; i++) {
    const k = i % 6, w = 120 + (i * 47) % 100, h = 230 + (i * 83) % 250, y = 600 - h, cols = Math.max(2, Math.floor(w / 36)), rows = Math.floor(h / 62);
    if (k === 0) g += `<path fill-rule="evenodd" d="M${x},600 V${y} H${x + w} V600 Z${win(x, y + 18, w, h - 40, cols, rows)}"/>`;
    else if (k === 1) g += `<path fill-rule="evenodd" d="M${x},600 V${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w},${y + w / 2} V600 Z${win(x, y + w / 2 + 10, w, h - w / 2 - 30, cols, Math.max(1, rows - 2))}"/>`;
    else if (k === 2) g += `<path fill-rule="evenodd" d="M${x},600 V${y + 70} H${x + w * .3} V${y + 30} H${x + w * .65} V${y} H${x + w} V600 Z${win(x, y + 90, w, h - 110, cols, Math.max(1, rows - 1))}"/>`;
    else if (k === 3) g += `<path fill-rule="evenodd" d="M${x},600 V${y} H${x + w * .8} V600 Z${win(x, y + 14, w * .8, h - 34, Math.max(2, cols - 1), rows)}"/><rect x="${x + w * .37}" y="${y - 70}" width="6" height="70"/>`;
    else if (k === 4) g += `<path d="M${x},600 V${y + 40} L${x + w * .25},${y} L${x + w * .5},${y + 40} L${x + w * .75},${y} L${x + w},${y + 40} V600 Z"/>`;
    else g += `<path fill-rule="evenodd" d="M${x},600 V${y} H${x + w} V600 Z${win(x, y + 16, w, h - 36, cols, rows)}"/><path d="M${x + w * .5 - w * .32},${y} A${w * .32},${w * .32} 0 0 1 ${x + w * .5 + w * .32},${y} Z"/>`;
    x += w + 36 + (i * 29) % 70;
  }
  const el = document.createElement('div'); el.className = 'mid';
  el.innerHTML = `<svg viewBox="0 0 4800 600" preserveAspectRatio="xMinYMax meet" fill="#0E0D0C" aria-hidden="true">${g}</svg>`;
  document.getElementById('depth').appendChild(el);      // above the far city and the suns, below the buildings
})();
function onStrip() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const max = strip.scrollWidth - strip.clientWidth, r = max > 0 ? strip.scrollLeft / max : 0;
    const w = Math.max(.12, strip.clientWidth / strip.scrollWidth), track = document.getElementById('progress').clientWidth;
    prog.style.transform = `translateX(${r * (1 - w) * track}px) scaleX(${w})`;
    if (!reduce) { parEls = parEls || inner.querySelectorAll('.far,.mid,.sky,.sun'); parEls.forEach(el => el.style.setProperty('--sx', strip.scrollLeft)); }
    ticking = false;
  });
}
strip.addEventListener('scroll', onStrip, {passive: true}); addEventListener('resize', onStrip);
document.getElementById('progress').addEventListener('click', e => {
  const rect = e.currentTarget.getBoundingClientRect();
  strip.scrollTo({left: (e.clientX - rect.left) / rect.width * (strip.scrollWidth - strip.clientWidth), behavior: 'smooth'});
});

/* ---------- reveal on scroll ---------- */
function observe(nodes, root) {
  if (!('IntersectionObserver' in window)) { nodes.forEach(n => n.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), {root, threshold: .15});
  nodes.forEach(n => io.observe(n));
}

/* ---------- nav shrink, hero pointer parallax ---------- */
/* ===== lite:nav ===== read scrollY once per frame, touch the class only when it changes */
{ const nav = document.getElementById('nav'); let on = null, q = false;
  const sync = () => { q = false; const v = scrollY > 40; if (v !== on) { on = v; nav.classList.toggle('scrolled', v); } };
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(sync); } }, {passive: true}); sync(); }
(function () {
  if (reduce) return;
  const hero = document.getElementById('hero'), par = document.getElementById('arch-par');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    par.style.transform = `translate(${x * -22}px, ${y * -16}px)`;
  });
  hero.addEventListener('pointerleave', () => par.style.transform = '');
})();

/* ---------- page change: View Transitions where supported, curtain otherwise ---------- */
function openStudio(id, work) {
  const url = 'studio-' + encodeURIComponent(id) + '.html' + (work != null ? '?work=' + work : '');
  if (reduce) { location.href = url; return; }
  if ('PageSwapEvent' in window) {          // cross-document View Transitions: the building morphs into the cutaway
    const bd = document.querySelector('.bd[data-id="' + id + '"]'); if (bd) bd.style.viewTransitionName = 'studio-bd';
    location.href = url; return;
  }
  document.getElementById('curtain').classList.add('cover');
  setTimeout(() => location.href = url, 720);
}
addEventListener('pageshow', e => { if (e.persisted) { document.getElementById('curtain').classList.remove('cover'); document.querySelectorAll('.bd').forEach(b => b.style.viewTransitionName = ''); } });

/* torn paper edge under the hero */
(function () {
  const pts = ['0 0', '100% 0'];
  for (let i = 40; i >= 0; i--) pts.push(`${i * 2.5}% ${100 - 1.2 - ((i * 37) % 7) * .75 - (i % 2) * 1.4}%`);
  document.getElementById('hero').style.clipPath = `polygon(${pts.join(',')})`;
})();

(function farCity() {
  let x = 0, g = '';
  const kinds = ['arch','tower','block','vase','step','arch','block','tower'];
  for (let i = 0; x < 5600; i++) {
    const k = kinds[i % kinds.length], w = 170 + (i * 53) % 130, h = 300 + (i * 97) % 260, y = 600 - h;
    if (k === 'arch') g += `<path d="M${x},600 V${y+w/2} A${w/2},${w/2} 0 0 1 ${x+w},${y+w/2} V600 Z"/>`;
    else if (k === 'tower') g += `<rect x="${x}" y="${y}" width="${w*.7}" height="${h}"/><rect x="${x-10}" y="${y-14}" width="${w*.7+20}" height="14"/>`;
    else if (k === 'vase') g += `<path d="M${x},600 C${x+w*.3},520 ${x+w*.3},${y+120} ${x+w*.2},${y} H${x+w*.8} C${x+w*.7},${y+120} ${x+w*.7},520 ${x+w},600 Z"/>`;
    else if (k === 'step') g += `<path d="M${x},600 V${y+80} H${x+w*.35} V${y+40} H${x+w*.7} V${y} H${x+w} V600 Z"/>`;
    else g += `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    x += w + 60 + (i * 31) % 90;
  }
  const el = document.createElement('div'); el.className = 'far';
  el.innerHTML = `<svg viewBox="0 0 5800 600" preserveAspectRatio="xMinYMax meet" fill="#0E0D0C" aria-hidden="true">${g}</svg>`;
  const depth = document.getElementById('depth'); depth.insertBefore(el, depth.firstChild);
})();
/* ================= v6: sections driven by artists.js + circles.js (two languages) ================= */
let langInit = false;
const FEAT = [['mali', 0], ['phop', 2], ['napha', 0], ['phrae', 2], ['thara', 0], ['pan', 0], ['kwan', 2], ['irene', 1]], TAPE = [-5, 4, -3, 6, -6, 3, -4, 5];
let sortBy = 'cur';
const allWorks = () => ARTISTS.flatMap(a => a.pieces.map((p, k) => ({a, p, k})));

/* ===== search & filter bar =====
   Search: every word typed must appear in the work's title (t / tEn / tLo), its artist's name (name / nameEn / nameLo),
   art form, city, medium or year. Thai, Lao and English meet in one spelling (fold below), so ນະພາ finds นภา.
   Quick filters: ทั้งหมด = every work instead of this week's picks, ยังว่างอยู่ = no sold works, and one price band. */
const LAO = {'ກ':'ก','ຂ':'ข','ຄ':'ค','ງ':'ง','ຈ':'จ','ສ':'ส','ຊ':'ซ','ຍ':'ย','ດ':'ด','ຕ':'ต','ຖ':'ถ','ທ':'ท','ນ':'น','ບ':'บ','ປ':'ป','ຜ':'ผ','ຝ':'ฝ','ພ':'พ','ຟ':'ฟ','ມ':'ม','ຢ':'ย','ຣ':'ร','ລ':'ล','ວ':'ว','ຫ':'ห','ອ':'อ','ຮ':'ฮ',
  'ໜ':'หน','ໝ':'หม','ຼ':'ล','ຽ':'ย','ະ':'ะ','ັ':'ั','າ':'า','ຳ':'ำ','ິ':'ิ','ີ':'ี','ຶ':'ึ','ື':'ื','ຸ':'ุ','ູ':'ู','ົ':'','ເ':'เ','ແ':'แ','ໂ':'โ','ໃ':'ใ','ໄ':'ไ','ໆ':'',
  '່':'','້':'','໊':'','໋':'','໌':'์','ໍ':'ํ','໐':'0','໑':'1','໒':'2','໓':'3','໔':'4','໕':'5','໖':'6','໗':'7','໘':'8','໙':'9'};
const MERGE = {'ภ':'พ','ธ':'ท','ฑ':'ท','ฒ':'ท','ศ':'ส','ษ':'ส','ณ':'น','ฬ':'ล','ฎ':'ด','ฏ':'ต','ฐ':'ถ','ฆ':'ค','ช':'ซ','ฌ':'ซ','ญ':'ย','ร':'ล','ฤ':'ล'};   // Thai letters Lao writes with one
const FINAL = [[/[กขคฆ]$/, 'ก'], [/[จชซฎฏฐฑฒดตถทธศษส]$/, 'ด'], [/[บปพฟภ]$/, 'บ'], [/[ญณนรลฬ]$/, 'น']];                               // a word-final consonant as Lao writes it
function foldWord(w, finals) {
  w = w.replace(/[຀-໿]/g, c => LAO[c] ?? c)
    .replace(/[ก-ฮ][ิุ]?์/g, '')                      // silent letters (การันต์)
    .replace(/[่-๋็ๆ]/g, '')                          // tone marks, mai taikhu, repeat mark
    .replace(/ห(?=[งนมยลวร])/g, '');                   // leading silent ห (หมอก, ຕະຫຼາດ)
  if (finals && w.length > 1) { const f = FINAL.find(([re]) => re.test(w)); if (f) w = w.replace(f[0], f[1]); }
  return w.replace(/[ก-ฮ]/g, c => MERGE[c] ?? c).replace(/ะ/g, '');
}
const splitWords = s => String(s ?? '').normalize('NFC').toLowerCase().replace(/[’'`]/g, '').replace(/[-‐–—_/·.,()“”"!?]/g, ' ').split(/\s+/).filter(Boolean);
const foldHay = s => { const w = splitWords(s); return w.map(x => foldWord(x, true)).join(' ') + ' | ' + w.map(x => foldWord(x, false)).join(' '); };
const foldQuery = s => splitWords(s).map(x => [foldWord(x, true), foldWord(x, false)]);   // with and without the final-consonant step, so a half-typed word still finds
const HAY = new Map();
const hay = ({a, p}) => { let h = HAY.get(p); if (!h) HAY.set(p, h = foldHay([a.name, a.nameEn, a.nameLo, a.disc, DISC_EN[a.disc], a.city, CITY_EN[a.city], p.t, p.tEn, p.tLo, p.m, p.mEn, p.y].join(' '))); return h; };
const PRICE = {p1: v => v < 300, p2: v => v >= 300 && v < 600, p3: v => v >= 600};
const F = {all: false, avail: false, price: ''};
let query = '', qKey = [];
const pass = (x, f = F) => qKey.every(([a, b]) => hay(x).includes(a) || hay(x).includes(b)) && (!f.avail || workStatus(x.p) !== 'sold') && (!f.price || PRICE[f.price](x.p.p));
const narrowed = () => !!(qKey.length || F.avail || F.price);
const wholeCity = () => F.all || narrowed();
function worksList() {
  let l = wholeCity() ? allWorks().filter(x => pass(x)) : FEAT.map(([id, k]) => { const a = artistById(id); return {a, p: a.pieces[k], k}; });
  if (sortBy === 'low') l = [...l].sort((x, y) => x.p.p - y.p.p);
  else if (sortBy === 'high') l = [...l].sort((x, y) => y.p.p - x.p.p);
  else if (sortBy === 'new') l = [...l].sort((x, y) => y.p.y - x.p.y || y.p.p - x.p.p);
  return [...l.filter(x => workStatus(x.p) !== 'sold'), ...l.filter(x => workStatus(x.p) === 'sold')];   // sold works go last
}
/* each chip shows how many works it would give with everything else as it is now */
function syncBar() {
  const all = allWorks(), count = f => all.filter(x => pass(x, f)).length;
  document.querySelectorAll('#sf .sf-chip').forEach(b => {
    const k = b.dataset.f;
    const n = k === 'all' ? count({avail: false, price: ''}) : k === 'avail' ? count({...F, avail: true}) : count({...F, price: k});
    const on = k === 'all' ? F.all && !F.avail && !F.price : k === 'avail' ? F.avail : F.price === k;
    b.querySelector('.sf-n').textContent = n; b.classList.toggle('zero', !n); b.setAttribute('aria-pressed', on);
  });
  $('#sf-reset').hidden = !(F.all || narrowed() || query.trim());
}
function resetBar() { F.all = F.avail = false; F.price = ''; query = ''; qKey = []; $('#q').value = ''; renderFeatured('pop'); }

/* mode: 'init' = revealed on scroll, 'pop' = animated re-sort, 'still' = typing / language switch (no animation) */
function renderFeatured(mode) {
  const list = worksList(), total = allWorks().length;
  $('#masonry').innerHTML = list.map(({a, p, k}, n) => {
    const cls = mode === 'pop' ? 'mi pop' : mode === 'still' ? 'mi reveal in' : 'mi reveal';
    return `<div class="${cls}" style="--i:${mode === 'init' ? n % 3 : n}"><a class="card" href="studio-${a.id}.html?work=${k}" draggable="false" data-id="${a.id}" data-k="${k}" data-cur="VIEW" aria-label="${esc(t('card_aria', {t: pk(p, 't'), a: nameL(a), p: usd(p.p)}))}"><i class="tape" style="--tr:${TAPE[n % TAPE.length]}deg"></i><span class="art" style="--ar:${p.ar};--art:${artBg(a.works, k)}">${artImg(a, k)}${stampHtml(p)}</span><span class="plate"><span class="pn">${esc(pk(p, 't'))}</span><span class="pa">${esc(nameL(a))} · ${esc(discL(a))}</span><span class="pp${workStatus(p) ? ' strike' : ''}">${usd(p.p)}</span>${statusChip(p)}</span></a></div>`;
  }).join('') || `<div class="q-none" role="status"><p>${esc(qKey.length ? t('q_none', {q: query.trim()}) : t('sf_none'))}</p><button type="button" class="sf-reset" data-sf-reset>${esc(t('sf_reset'))}</button></div>`;
  $('#feat-h').textContent = t(wholeCity() ? 'feat_h_all' : 'feat_h');
  $('#feat-count').textContent = wholeCity() ? t('sf_count', {n: list.length, t: total}) : t('feat_count', {n: list.length});
  syncBar();
}
$('#masonry').addEventListener('click', e => {
  if (e.target.closest('[data-sf-reset]')) return resetBar();
  const b = e.target.closest('.card'); if (!b || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; e.preventDefault(); openStudio(b.dataset.id, +b.dataset.k);
});
$('#sort').addEventListener('change', e => { sortBy = e.target.value; renderFeatured('pop'); });
$('#sf').addEventListener('click', e => {
  if (e.target.closest('#sf-reset')) return resetBar();
  const b = e.target.closest('.sf-chip'); if (!b) return;
  const k = b.dataset.f;
  if (k === 'all') { F.all = true; F.avail = false; F.price = ''; }
  else if (k === 'avail') { F.all = true; F.avail = !F.avail; }
  else { F.all = true; F.price = F.price === k ? '' : k; }
  renderFeatured('pop');
});
let qRaf = 0;
const onQuery = () => { cancelAnimationFrame(qRaf); qRaf = requestAnimationFrame(() => { query = $('#q').value; qKey = foldQuery(query); renderFeatured('still'); }); };   // every keystroke, one render per frame
$('#q').addEventListener('input', e => { if (!e.isComposing) onQuery(); });
$('#q').addEventListener('compositionend', onQuery);

/* city map: top-down plan, districts by discipline */
const PLAN = {
  arch: '<rect x="14" y="10" width="92" height="60"/><path d="M40,70 V42 A20,20 0 0 1 80,42 V70"/>',
  lens: '<rect x="10" y="18" width="42" height="50"/><circle cx="84" cy="44" r="28"/><circle cx="84" cy="44" r="16"/>',
  tower: '<circle cx="60" cy="40" r="32"/><circle cx="60" cy="40" r="20" stroke-dasharray="3 4"/>',
  vase: '<ellipse cx="60" cy="40" rx="42" ry="28"/><circle cx="60" cy="40" r="12"/>',
  shell: '<rect x="8" y="16" width="104" height="50"/><path d="M8,16 q13,-12 26,0 t26,0 t26,0 t26,0"/><path d="M8,41 H112" stroke-dasharray="4 4"/>',
  stack: '<rect x="8" y="48" width="64" height="22"/><rect x="26" y="28" width="64" height="22"/><rect x="14" y="8" width="60" height="22"/>',
  dome: '<circle cx="60" cy="40" r="34"/><circle cx="60" cy="40" r="22"/><circle cx="60" cy="40" r="10"/><path d="M26,40 H94 M60,6 V74" stroke-dasharray="3 4"/>',
  pixel: '<rect x="14" y="50" width="44" height="12"/><rect x="34" y="36" width="44" height="12"/><rect x="8" y="22" width="40" height="12"/><rect x="48" y="8" width="44" height="12"/><rect x="92" y="46" width="8" height="8"/>',
  spore: '<circle cx="60" cy="34" r="30"/><circle cx="60" cy="34" r="10"/><circle cx="20" cy="62" r="12"/><circle cx="96" cy="60" r="9"/>',
  collage: '<rect x="10" y="38" width="50" height="32"/><rect x="38" y="22" width="48" height="32" transform="rotate(-4 62 38)"/><rect x="66" y="8" width="46" height="32"/>',
};
/* district layout for any number of artists: one wide + one narrow block, then rows of three, the leftovers share a row with the plaza */
function mapSpans(n) {
  if (n <= 1) return {s: [6].slice(0, n), p: 0};
  const s = [4, 2]; let rest = n - 2;
  while (rest >= 3) { s.push(2, 2, 2); rest -= 3; }
  let p = 6;
  if (rest === 1) { s.push(3); p = 3; } else if (rest === 2) { s.push(2, 2); p = 2; }
  return {s, p};
}
let curD = '';
function renderMap() {
  const L = mapSpans(ARTISTS.length), n = ARTISTS.length;
  $('#map-grid').innerHTML = ARTISTS.map((a, i) => `<button class="dist d${i % 6}${i === 0 || (i === n - 1 && n % 2 === 0) ? ' wide' : ''}" style="grid-column:span ${L.s[i]}" data-id="${a.id}" data-d="${esc(a.disc)}" data-w="${a.wave ? 1 : 0}" data-cur="ENTER"><span class="dn">NO.${String(i + 1).padStart(2, '0')} · ${esc(t('district'))}</span><span class="dd">${esc(discL(a))}</span><span class="da">${esc(nameL(a))} · ${esc(cityL(a))}</span><svg viewBox="0 0 120 80" aria-hidden="true">${PLAN[a.kind]}</svg></button>`).join('')
    + (L.p ? `<div class="plaza" style="grid-column:span ${L.p}" aria-hidden="true"><span>${esc(t('plaza'))}</span><svg viewBox="0 0 120 80"><circle cx="60" cy="40" r="34"/><circle cx="60" cy="40" r="22"/><circle cx="60" cy="40" r="8"/><path d="M60,4 V76 M24,40 H96"/></svg></div>` : '') + `<div class="compass" aria-hidden="true">N ↑</div>`;
  $('#filters').innerHTML = [['', t('f_all')], ['*wave', t('f_wave')], ...[...new Map(ARTISTS.map(a => [a.disc, discL(a)]))]].map(([d, l]) => `<button type="button" class="fbtn" data-d="${esc(d)}" aria-pressed="false">${esc(l)}</button>`).join('');
  syncFilter(false);
}
function syncFilter(scrollStrip) {
  const d = curD;
  $('#map-grid').classList.toggle('f', !!d);
  const wave = d === '*wave';
  document.querySelectorAll('.dist').forEach(el => { const on = wave ? el.dataset.w === '1' : el.dataset.d === d; el.classList.toggle('on', on); });
  document.querySelectorAll('.fbtn[data-d]').forEach(b => { const on = b.dataset.d === d; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  let first = null, n = 0, only = null;
  document.querySelectorAll('#strip-in .bd').forEach((bd, i) => {
    const hit = !d || (wave ? !!ARTISTS[i].wave : ARTISTS[i].disc === d);
    bd.style.transitionDelay = '0s';
    bd.classList.toggle('lit', !!d && hit); bd.classList.toggle('dim', !!d && !hit);
    if (d && hit) { n++; only = ARTISTS[i]; if (!first) first = bd; }
  });
  if (scrollStrip && first) strip.scrollTo({left: Math.max(0, first.offsetLeft - 80), behavior: reduce ? 'auto' : 'smooth'});
  /* the strip sits far above the map, so say so in a bar that follows the reader down the map */
  const note = $('#fnote'), go = $('#fnote-in');
  if (d) $('#fnote-t').textContent = wave ? t('fnote_wave', {n}) : t('fnote', {n, d: discL(ARTISTS.find(a => a.disc === d))});
  note.classList.toggle('off', !d); note.toggleAttribute('inert', !d);
  go.hidden = !(d && n === 1); if (!go.hidden) { go.dataset.id = only.id; go.href = 'studio-' + only.id + '.html'; }
}
function setFilter(d) { curD = d; syncFilter(true); }
$('#filters').addEventListener('click', e => { const b = e.target.closest('.fbtn[data-d]'); if (b) setFilter(b.dataset.d); });
$('#map-grid').addEventListener('click', e => { const b = e.target.closest('.dist'); if (b) openStudio(b.dataset.id); });   // a district on the map = that artist's building
$('#fnote-x').addEventListener('click', () => setFilter(''));
$('#fnote-in').addEventListener('click', e => { e.preventDefault(); openStudio(e.currentTarget.dataset.id); });

/* spotlight */
function renderSpot() {
  const N = ARTISTS[0], p = N.pieces[0], im = $('#afr-img');
  $('#afr-in').style.setProperty('--art', artBg(N.works, 0));
  if (p.img && !im.getAttribute('src')) im.src = p.img;
  im.alt = pk(p, 't');
  $('#afr-cap').innerHTML = `<b>${esc(pk(p, 't'))}</b><span>${esc(nameL(N))} · ${p.y} · ${usd(p.p)}</span>`;
  $('#spot-meta').textContent = t('spot_meta', {d: discL(N), y: N.since, c: cityL(N)});
}

/* support box: the % of each row comes from SUPPORT in circles.js. Not decided yet = [__] on your own computer, the row (or the whole box) left out on the live site */
(function renderSupport() {
  const box = $('.sup-w'); if (!box) return;
  const v = [SUPPORT.servers, SUPPORT.site, SUPPORT.events].map(n => +n > 0 ? +n : 0), draft = isDraft();
  box.querySelectorAll('li').forEach((li, i) => {
    li.hidden = !v[i] && !draft;
    if (v[i]) { li.querySelector('.sup-v').textContent = v[i] + '%'; li.querySelector('.sup-bar').style.width = v[i] + '%'; }
  });
  box.querySelector('.sup-note').hidden = !draft;
  box.hidden = !draft && !v.some(Boolean);
})();

/* city numbers: count up when scrolled into view */
(function () {
  $('#c-art').dataset.count = ARTISTS.length;
  $('#c-work').dataset.count = ARTISTS.reduce((n, a) => n + a.pieces.length, 0);
  $('#c-disc').dataset.count = new Set(ARTISTS.map(a => a.disc)).size;
  const els = [...document.querySelectorAll('[data-count]')];
  const fmt = (el, v) => el.textContent = NF.format(Math.round(v)) + (el.dataset.suf || '');
  const run = el => { const end = +el.dataset.count, t0 = performance.now(); (function f(n) { const k = Math.min(1, (n - t0) / 1600); fmt(el, end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); };
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => fmt(el, +el.dataset.count)); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), {threshold: .6});
  els.forEach(el => io.observe(el));
})();

/* everything that has words in it re-renders when the language changes */
onLang(() => {
  renderMarquee(); refreshCity(); renderSpot();
  document.querySelectorAll('.mani-lines .rn').forEach(el => ransom(el, t(el.dataset.k), +el.dataset.s, true));
  if (langInit) { renderFeatured('still'); renderMap(); }
  setMeta(t('title_idx'), t('desc_idx'));
});
renderFeatured('init'); renderMap();

renderCity();
observe([...document.querySelectorAll('.bd')], strip);
observe([...document.querySelectorAll('.reveal')], null);
onStrip();
wireNav(); applyLang(); langInit = true;

/* ================= v4: loader, scroll-linked hero, cursor, tilt, smooth scroll ================= */
(function () {
  const root = document.documentElement, loader = document.getElementById('loader'), countEl = document.getElementById('loader-count');
  const boot = () => root.classList.remove('pre');
  let seen = false; try { seen = sessionStorage.getItem('circles-seen') === '1'; } catch (e) {}
  if (reduce || seen) { loader.remove(); boot(); return; }
  const DUR = 1700, t0 = performance.now();
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const counted = new Promise(res => (function tick(now) {
    const k = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - k, 3);
    countEl.textContent = String(Math.round(e * 100)).padStart(3, '0');
    k < 1 ? requestAnimationFrame(tick) : res();
  })(t0));
  const go = () => {
    try { sessionStorage.setItem('circles-seen', '1'); } catch (e) {}
    loader.classList.add('done');
    setTimeout(boot, 520);
    setTimeout(() => loader.remove(), 1400);
  };
  Promise.all([fontsReady, counted]).then(go);
  setTimeout(go, 6000);                      // safety net
})();

(function scrollLinked() {
  if (reduce) return;
  const hero = document.getElementById('hero');
  let t = false, last = 0, hh = Math.min(innerHeight * .94, 1000);     // hero height: learnt from a ResizeObserver, never read from layout during scroll/load
  if ('ResizeObserver' in window) new ResizeObserver(es => { hh = es[0].borderBoxSize && es[0].borderBoxSize[0] ? es[0].borderBoxSize[0].blockSize : es[0].contentRect.height; }).observe(hero);
  else addEventListener('resize', () => { hh = hero.offsetHeight; });
  const upd = () => {
    const v = +Math.min(1, Math.max(0, scrollY / (hh * .9))).toFixed(3);
    if (v !== last) { hero.style.setProperty('--hp', v); last = v; }
    t = false;
  };
  addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(upd); } }, {passive: true});
  upd();
})();

(function cursor() {
  if (reduce || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const el = document.getElementById('cursor'), lab = document.getElementById('cursor-label');
  document.documentElement.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY; el.classList.add('show'); wake();
    const bd = e.target.closest && e.target.closest('[data-cur]'), st = e.target.closest && e.target.closest('.strip');
    el.classList.toggle('big', !!bd); el.classList.toggle('drag', !bd && !!st);
    lab.textContent = bd ? bd.dataset.cur : (st ? '← DRAG →' : '');
  });
  addEventListener('pointerdown', () => el.classList.add('down'));
  addEventListener('pointerup', () => el.classList.remove('down'));
  document.addEventListener('pointerleave', () => el.classList.remove('show'));
  /* rAF runs only while the dot is still catching up with the mouse */
  let raf = 0;
  function loop() {
    cx += (x - cx) * .2; cy += (y - cy) * .2; el.style.transform = `translate(${cx}px,${cy}px)`;
    raf = (Math.abs(x - cx) > .1 || Math.abs(y - cy) > .1) ? requestAnimationFrame(loop) : 0;
  }
  function wake() { if (!raf) raf = requestAnimationFrame(loop); }
})();

(function tilt() {
  if (reduce || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('.bd').forEach(bd => {
    const svg = bd.querySelector('.mon');
    bd.addEventListener('pointermove', e => {
      const r = bd.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      svg.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg'); svg.style.setProperty('--rx', (py * -5).toFixed(2) + 'deg');
    });
    bd.addEventListener('pointerleave', () => { svg.style.setProperty('--ry', '0deg'); svg.style.setProperty('--rx', '0deg'); });
  });
})();

/* smooth page scroll (Lenis, self-hosted in vendor/) — page works without it. lerp = how fast the page catches up with the wheel: higher = snappier, lower = floatier. */
addEventListener('load', () => {
  if (reduce || !window.Lenis) return;
  const lenis = new Lenis({lerp: .16, wheelMultiplier: 1});
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, {offset: -70, duration: 1.4}); }
  }));
});

/* ===== city: buildings or map, in the same place ===== */
function setView(v) {
  const map = v === 'map';
  $('#map').hidden = !map; $('#strip').hidden = map; $('#progress').hidden = map;
  const pager = document.querySelector('.city .pager'); if (pager) pager.hidden = map;
  document.querySelectorAll('#vtog .vt').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
$('#vtog').addEventListener('click', e => { const b = e.target.closest('.vt'); if (b) setView(b.dataset.v); });
/* old links to "#map" (menu, footer, other pages) open the map view inside the City section */
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="#map"]'); if (a) setView('map'); }, true);
function mapFromHash() {
  if (location.hash !== '#map') return;
  setView('map');
  const go = () => { const el = document.querySelector('.city-tools'); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - 96); };
  go(); addEventListener('load', () => setTimeout(go, 50), {once: true});
}
addEventListener('hashchange', mapFromHash); mapFromHash();
