/* pixel.js — the pixel art and the small maths behind the "alive" walls (moved out of hd2d.js so React pages can share it).
   A sprite frame is 16 strings of 16 characters; '.' is clear. Letters are the site's own colours (COL), h = hair, c = coat. */

export const COL = {k: '#0E0D0C', p: '#F4F1E8', r: '#FF2E88', g: '#E8B730', t: '#A3182C', b: '#E8E4D8'};

const HEAD = ['................', '.....hhhhh......', '....hhhhhhh.....', '....hpppppp.....', '.....ppppkp.....', '.....pppppp.....', '......ppp.......'];
const TORSO = ['....cccccc......', '...cccccccc.....', '...cccccccc.....', '...cccccccc.....', '....cccccc......'];
const LEGS = {
  a: ['....kk..kk......', '...kk....kk.....', '...kk....kk.....', '..kkk....kkk....'],
  b: ['.....kkkk.......', '.....kkkk.......', '.....kkkk.......', '.....kkkk.......'],
  c: ['.....kk.kk......', '....kk...kk.....', '....kk...kk.....', '....kkk..kkk....'],
};
const paint = (rows, hair, coat) => rows.map(r => r.replace(/h/g, hair).replace(/c/g, coat));

/* walking: four frames. standing: one frame, and a second one pixel lower (a breath) */
export const walkFrames = (hair, coat) => ['a', 'b', 'c', 'b'].map(f => paint([...HEAD, ...TORSO, ...LEGS[f]], hair, coat));
export function standFrames(hair, coat) {
  const f1 = paint([...HEAD, ...TORSO, ...LEGS.b], hair, coat);
  return [f1, ['.'.repeat(16), ...f1.slice(0, 11), ...f1.slice(12)]];
}

const pad = rows => rows.concat(Array(16 - rows.length).fill('.'.repeat(16)));
const BIRD = [
  pad(['................', '................', '..k...........k.', '..kk.........kk.', '...kk.......kk..', '....kk.....kk...', '.....kkk.kkk....', '......kkkkk.....', '.......kkk......']),
  pad(['................', '................', '................', '................', '.k...........k..', '.kkk.......kkk..', '...kkk...kkk....', '.....kkkkk......', '......kkk.......']),
  pad(['................', '................', '................', '................', '................', '......kkkkk.....', '.....kkkkkkk....', '...kkk.kkk.kkk..', '.kkk....k....kkk']),
];
export const birdFrames = [BIRD[0], BIRD[1], BIRD[2], BIRD[1]];

/* a bird standing still: it looks around (the head dips) */
const blank = n => Array(n).fill('.'.repeat(16));
export const perchFrames = [
  [...blank(10), '....kk..........', '...kkkk.........', '...kkkkkkkk.....', '....kkkkkkkkk...', '.....kkkkkkk....', '......k..k......'],
  [...blank(11), '....kk..........', '...kkkkkkkk.....', '....kkkkkkkkk...', '.....kkkkkkk....', '......k..k......'],
];

/* someone sitting on the kerb with a cigarette: four frames, the smoke curls up and away */
const SIT = [
  '.....hhhhh......', '....hhhhhhh.....', '....hpppppp.....', '.....ppppkp.....', '.....ppppppbr...',
  '....cccccc......', '...cccccccc.....', '...cccccccc.....', '....cccccckkkkk.', '....kkkkkkkkkkk.', '....kkkkkkkkkkkk'];
export function sitFrames(hair, coat) {
  const calm = [...blank(5), ...SIT];
  const puff1 = [...calm]; puff1[5] = '.....hhhhh...b..'; puff1[6] = '....hhhhhhh..b..'; puff1[7] = '....hpppppp.b...';
  const puff2 = [...calm]; puff2[4] = '..............b.'; puff2[5] = '.....hhhhh....b.';
  return [calm, puff1, puff2, puff1].map(f => paint(f, hair, coat));   // paint last: the smoke rows carry hair letters too
}

/* every frame must be 16 x 16 and use only known letters: checked by tests/pixel.test.mjs */
export const ALL_FRAMES = () => [...walkFrames('r', 't'), ...standFrames('r', 't'), ...birdFrames, ...perchFrames, ...sitFrames('r', 't')];

/* ---------- drawing (browser only) ---------- */
export function canvasOf(rows) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = COL[ch] || COL.k; g.fillRect(x, y, 1, 1); } }));
  return c;
}

/* dust: a tile of tiny square motes. A layer that slides by exactly one tile loops with no seam. Returns a data URL. */
export const DUST_W = 480, DUST_H = 360;
export function dustTile(seed, n, size, alpha) {
  const c = document.createElement('canvas'); c.width = DUST_W; c.height = DUST_H; const g = c.getContext('2d');
  let x = seed; const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * (.45 + rnd() * .55); g.fillStyle = rnd() < .35 ? COL.g : COL.p;
    g.fillRect(Math.floor(rnd() * DUST_W / 2) * 2, Math.floor(rnd() * DUST_H / 2) * 2, size, size);   // on a 2px grid, like the pixel art
  }
  return c.toDataURL('image/png');
}
