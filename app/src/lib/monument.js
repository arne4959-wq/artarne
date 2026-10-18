/* monument.js — the ten building drawings of the city (and the far / mid skylines), as SVG strings.
   Moved from site.js without changing a number: the look of the city must stay exactly as it was. monument(a) returns the markup of one
   artist's building (a unit's shadow layer + the drawing); an unknown kind draws the "collage" building (the last branch). */

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

export function monument(a) {
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

export const PIN = `<svg class="pin" viewBox="0 0 64 22" aria-hidden="true"><path d="M10,6 H52 M10,15 H44" stroke="#8d8d8d" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M10,6 C0,6 0,15 10,15" stroke="#8d8d8d" stroke-width="2.6" fill="none" stroke-linecap="round"/><rect x="44" y="3" width="14" height="15" rx="4" fill="#bdbdbd" stroke="#6d6d6d" stroke-width="2"/></svg>`;

export function midCitySvg() {
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
  return `<svg viewBox="0 0 4800 600" preserveAspectRatio="xMinYMax meet" fill="#0E0D0C" aria-hidden="true">${g}</svg>`;   // the .mid layer: closer and darker than the far one
}

export function farCitySvg() {
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
  return `<svg viewBox="0 0 5800 600" preserveAspectRatio="xMinYMax meet" fill="#0E0D0C" aria-hidden="true">${g}</svg>`;   // the .far layer
}
