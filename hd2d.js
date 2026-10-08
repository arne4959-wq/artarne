/* hd2d.js — HD-2D touches for the city strip (the look of Octopath Traveler, with no 3D).
   Needs site.js first (it builds #strip-in, #depth and the three depth planes).
   · pixel-art people and birds, drawn once on 16×16 canvases and scaled up with image-rendering: pixelated
   · (light shafts and floating dust are added further down)
   Everything that moves does so with transform or opacity only. */
(function () {
  const inner = document.getElementById('strip-in'), depth = document.getElementById('depth');
  if (!inner || !depth) return;

  /* palette = the site's own colours, nothing new */
  const COL = {k: '#0E0D0C', p: '#F4F1E8', r: '#FF2E88', g: '#E8B730', t: '#A3182C', b: '#E8E4D8'};

  /* ---------- the pixel art: 16 rows of 16 characters, '.' = transparent ---------- */
  const HEAD = [
    '................',
    '.....hhhhh......',
    '....hhhhhhh.....',
    '....hpppppp.....',
    '.....ppppkp.....',
    '.....pppppp.....',
    '......ppp.......',
  ];
  const TORSO = [
    '....cccccc......',
    '...cccccccc.....',
    '...cccccccc.....',
    '...cccccccc.....',
    '....cccccc......',
  ];
  const LEGS = {
    a: ['....kk..kk......', '...kk....kk.....', '...kk....kk.....', '..kkk....kkk....'],
    b: ['.....kkkk.......', '.....kkkk.......', '.....kkkk.......', '.....kkkk.......'],
    c: ['.....kk.kk......', '....kk...kk.....', '....kk...kk.....', '....kkk..kkk....'],
  };
  const walkFrames = (hair, coat) => ['a', 'b', 'c', 'b'].map(f => [...HEAD, ...TORSO, ...LEGS[f]].map(r => r.replace(/h/g, hair).replace(/c/g, coat)));

  const pad = rows => rows.concat(Array(16 - rows.length).fill('.'.repeat(16)));
  const BIRD = [
    pad(['................', '................', '..k...........k.', '..kk.........kk.', '...kk.......kk..', '....kk.....kk...', '.....kkk.kkk....', '......kkkkk.....', '.......kkk......']),
    pad(['................', '................', '................', '................', '.k...........k..', '.kkk.......kkk..', '...kkk...kkk....', '.....kkkkk......', '......kkk.......']),
    pad(['................', '................', '................', '................', '................', '......kkkkk.....', '.....kkkkkkk....', '...kkk.kkk.kkk..', '.kkk....k....kkk']),
  ];
  const birdFrames = [BIRD[0], BIRD[1], BIRD[2], BIRD[1]];

  /* ---------- drawing ---------- */
  function canvasOf(rows) {
    if (rows.length !== 16 || rows.some(r => r.length !== 16)) console.error('hd2d: a sprite frame is not 16x16');
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = COL[ch] || COL.k; g.fillRect(x, y, 1, 1); } }));
    return c;
  }
  /* one sprite = its frames stacked; CSS shows one at a time (opacity, steps) so no script runs per frame */
  function sprite(frames, dur) {
    const el = document.createElement('div'); el.className = 'spr'; el.style.setProperty('--n', frames.length); el.style.setProperty('--dur', dur + 's'); el.classList.add('n' + frames.length);
    frames.forEach((rows, i) => { const c = canvasOf(rows); c.style.setProperty('--i', i); c.setAttribute('aria-hidden', 'true'); el.appendChild(c); });
    return el;
  }

  /* ---------- the layers ---------- */
  const fg = document.createElement('div'); fg.className = 'fg'; fg.setAttribute('aria-hidden', 'true');      // in front of the buildings (under their name tags)
  const sky = document.createElement('div'); sky.className = 'sky'; sky.setAttribute('aria-hidden', 'true');  // behind the buildings, drifts a little with the far city
  inner.appendChild(fg); depth.appendChild(sky);
  if (typeof parEls !== 'undefined') parEls = null;       // site.js re-collects its parallax layers (now including .sky)

  const setW = () => { const w = inner.offsetWidth + 'px'; fg.style.setProperty('--W', w); sky.style.setProperty('--W', w); };
  setW(); addEventListener('resize', setW);

  /* someone standing at the door of every artist's building (these replace the old vector silhouettes).
     Two frames, a slow "breathing" swap; reduced motion keeps frame 1. x = where they stand, in the building's 400-wide drawing. */
  const STAND = {arch: {x: 200, hair: 'k', coat: 'p'}, lens: {x: 28, hair: 'r', coat: 'k'}, tower: {x: 44, hair: 'g', coat: 'k'}, vase: {x: 16, hair: 'p', coat: 'k'}, shell: {x: 18, hair: 'g', coat: 'k'}, collage: {x: 34, hair: 'r', coat: 'k'},
    stack: {x: 66, hair: 'g', coat: 'r'}, dome: {x: 28, hair: 'p', coat: 'k'}, pixel: {x: 34, hair: 'r', coat: 'k'}, spore: {x: 130, hair: 'g', coat: 'p'}};
  document.querySelectorAll('#strip-in .bd').forEach(bd => {
    const a = ARTISTS.find(x => x.id === bd.dataset.id), cfg = STAND[a && a.kind]; if (!cfg) return;
    const f1 = [...HEAD, ...TORSO, ...LEGS.b].map(r => r.replace(/h/g, cfg.hair).replace(/c/g, cfg.coat));
    const f2 = ['.'.repeat(16), ...f1.slice(0, 11), ...f1.slice(12)];                 // one pixel lower and compressed: a breath
    const el = document.createElement('div'); el.className = 'stand'; el.style.setProperty('--x', cfg.x); el.setAttribute('aria-hidden', 'true');
    const lift = document.createElement('div'); lift.className = 'lift'; lift.appendChild(sprite([f1, f2], 2.6 + (cfg.x % 7) * .17)); el.appendChild(lift); bd.appendChild(el);
  });

  /* people: who they are, how long a lap of the street takes, which way they walk */
  const WALKERS = [
    {hair: 'g', coat: 'r', T: 96, rev: false}, {hair: 'k', coat: 'g', T: 124, rev: true}, {hair: 'p', coat: 't', T: 108, rev: false},
    {hair: 'r', coat: 'p', T: 142, rev: true}, {hair: 'g', coat: 'k', T: 116, rev: false},
  ];
  /* lite:walkers */ if (document.documentElement.classList.contains('lite')) WALKERS.length = 3;
  WALKERS.forEach((w, i) => {
    const el = document.createElement('div'); el.className = 'walker' + (w.rev ? ' rev' : '');
    el.style.setProperty('--T', w.T + 's'); el.style.setProperty('--o', -(w.T * (i + .35) / WALKERS.length) + 's');   // start spread along the street
    el.style.setProperty('--rx', Math.round(160 + i * 560 + (i % 2) * 120) + 'px');                                  // where they stand when motion is reduced
    const flip = document.createElement('div'); flip.className = 'flip'; if (w.rev) flip.style.transform = 'scaleX(-1)';
    flip.appendChild(sprite(walkFrames(w.hair, w.coat), .72)); el.appendChild(flip); fg.appendChild(el);
  });

  /* birds: three crossing the sky at different heights and speeds */
  /* lite:birds */ [{y: '2.2rem', T: 54, rev: false, o: .15}, {y: '6.5rem', T: 76, rev: true, o: .55}, {y: '10.5rem', T: 64, rev: false, o: .8}].slice(0, document.documentElement.classList.contains('lite') ? 2 : 3).forEach((b, i) => {
    const el = document.createElement('div'); el.className = 'bird' + (b.rev ? ' rev' : '');
    el.style.setProperty('--y', b.y); el.style.setProperty('--T', b.T + 's'); el.style.setProperty('--o', -(b.T * b.o) + 's');
    el.style.setProperty('--rx', Math.round(300 + i * 700) + 'px');
    const bob = document.createElement('div'); bob.className = 'bob'; bob.style.setProperty('--bd', (2.2 + i * .5) + 's');
    const flip = document.createElement('div'); flip.className = 'flip'; if (b.rev) flip.style.transform = 'scaleX(-1)';
    flip.appendChild(sprite(birdFrames, .5 + i * .06)); bob.appendChild(flip); el.appendChild(bob); sky.appendChild(el);
  });

  /* ---------- light and air: a screen-fixed overlay in FRONT of the city, so the buildings drift through it ---------- */
  const strip = document.getElementById('strip');
  if (strip && strip.parentNode) {
    const stage = document.createElement('div'); stage.className = 'stage';
    strip.parentNode.insertBefore(stage, strip); stage.appendChild(strip);          // the strip keeps its id, scroll and listeners
    const fx = document.createElement('div'); fx.className = 'fx'; fx.setAttribute('aria-hidden', 'true'); stage.appendChild(fx);

    /* diagonal shafts from the upper left: soft-edged slanted bands that breathe (opacity) and sway (transform) */
    [{x: 6, w: 9, T: 9, o: 0}, {x: 28, w: 14, T: 12, o: 3}, {x: 53, w: 10, T: 10.5, o: 6}, {x: 78, w: 7, T: 13, o: 1.5}].forEach(r => {
      const el = document.createElement('i'); el.className = 'ray';
      el.style.setProperty('--x', r.x + '%'); el.style.setProperty('--w', r.w + '%'); el.style.setProperty('--T', r.T + 's'); el.style.setProperty('--o', -r.o + 's');
      fx.appendChild(el);
    });

    /* dust: two tiles of tiny square motes, each drawn once on a canvas. A layer slides by exactly one tile, so it loops without a seam. */
    const TILE_W = 480, TILE_H = 360;
    function dustTile(seed, n, size, alpha) {
      const c = document.createElement('canvas'); c.width = TILE_W; c.height = TILE_H; const g = c.getContext('2d');
      let x = seed; const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < n; i++) {
        g.globalAlpha = alpha * (.45 + rnd() * .55); g.fillStyle = rnd() < .35 ? COL.g : COL.p;
        g.fillRect(Math.floor(rnd() * TILE_W / 2) * 2, Math.floor(rnd() * TILE_H / 2) * 2, size, size);     // on a 2px grid, like the pixel art
      }
      return c.toDataURL('image/png');
    }
    [{seed: 11, n: 34, size: 4, a: .75, cls: 'a'}, {seed: 29, n: 56, size: 2, a: .6, cls: 'b'}].forEach(d => {
      const el = document.createElement('div'); el.className = 'dust ' + d.cls; el.style.backgroundImage = `url(${dustTile(d.seed, d.n, d.size, d.a)})`; fx.appendChild(el);
    });
  }
})();
