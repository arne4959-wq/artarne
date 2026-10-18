/* hall.js — the geometry of the picture hall (the "private museum") of a studio page. From museum.js: where every picture hangs and where the camera stops.
   Pure functions, no page access, so the parity tests can run them. The look lives in museum.css (every class starts with .mus-). */
export const W = 760, H = 560, PERSP = 800, VW = 1100, VH = 680;   // hall width / height, camera distance, design size of the viewport
export const FIRST = 800, GAP = 900, RIB = 460, SIDE_H = 430, HERO_H = 440, NEAR = 380, END_NEAR = 260;
const TX = {L: -130, R: -50, E: 40};
const CX = {L: 230, R: -230, E: 0};   // the camera stands across the hall from the picture it is looking at, so the picture is not seen edge-on
export const SPRITE_FILE = {stand: 'people/stand.png', sitA: 'people/sit-a.png', sitB: 'people/sit-b.png'};

/* a hall is built for every artist who has at least one work (?floors used to show the old cut-open tower; that view is not in the React app) */
export const hasHall = a => !!a && Array.isArray(a.pieces) && a.pieces.length > 0;

/* → {n, L (length of the hall), spots: [{k, side: 'L'|'R'|'E', d (distance along the hall), w, h, cam (where the camera stops)}]}. The last work hangs at the far end. */
export function geometry(a) {
  const n = a.pieces.length, side = Math.max(0, n - 1);
  const L = Math.max(1500, (side ? FIRST + (side - 1) * GAP : 0) + 1300);
  const spots = a.pieces.map((p, k) => {
    const [aw, ah] = p.ar.split('/').map(Number), hero = k === n - 1, h = hero ? HERO_H : SIDE_H;
    const w = Math.min(Math.round(h * aw / ah), hero ? 640 : 460), hh = Math.round(w * ah / aw);
    return hero ? {k, side: 'E', d: L, w, h: hh, cam: L - END_NEAR} : {k, side: k % 2 ? 'R' : 'L', d: FIRST + k * GAP, w, h: hh, cam: Math.max(0, FIRST + k * GAP - NEAR)};
  });
  return {n, L, spots};
}

/* the camera turns (about the eye) a little so the lit picture lands where TX says: big, whole, and near the label */
export function yawFor(s) {
  const wx = (s.side === 'L' ? -W / 2 : s.side === 'R' ? W / 2 : 0) - CX[s.side], z = -(PERSP + (s.d - s.cam)), want = TX[s.side];
  let best = 0, err = 1e9;
  for (let a = -40; a <= 40; a += .5) {
    const r = a * Math.PI / 180, x = wx * Math.cos(r) + z * Math.sin(r), zz = -wx * Math.sin(r) + z * Math.cos(r);
    if (zz > -50) continue;
    const e = Math.abs(PERSP * x / -zz - want); if (e < err) { err = e; best = a; }
  }
  return best;
}
export const camT = s => `translate3d(0,0,${PERSP}px) rotateY(${yawFor(s)}deg) translate3d(${-CX[s.side]}px,0,${s.cam - PERSP}px)`;

export const px = v => Math.round(v * 10) / 10 + 'px';

/* the picture's place on its wall (left, top in px) */
export function artBox(s, G) {
  const top = (H - s.h) / 2 - 40;
  const left = s.side === 'L' ? s.d - s.w / 2 : s.side === 'R' ? G.L - s.d - s.w / 2 : (W - s.w) / 2;
  return {left: px(left), top: px(top), width: px(s.w), height: px(s.h)};
}

/* where the bench stands: opposite the right-wall picture (or near the far end when there is none), never in front of a left-wall picture */
export function benchAt(G) {
  const rs = G.spots.find(x => x.side === 'R');
  let bd = rs ? rs.d : Math.max(600, G.L - 700);
  G.spots.filter(x => x.side === 'L').forEach(x => { if (Math.abs(x.d - bd) < 480) bd = x.d + 560; });
  return Math.min(bd, G.L - 500);
}

/* ribs along the ceiling, skylights and the light pools on the floor below them */
export function ribsAndLights(G) {
  const ribs = [], sky = [];
  for (let d = 300; d < G.L - 120; d += RIB) ribs.push(d);
  for (let d = 300 + RIB / 2; d < G.L - 200; d += RIB * 2) sky.push(d);
  return {ribs, sky};
}

/* a thing is hidden once it is behind the camera (it fades out and never looms); `min` = only once the camera has come this far */
export const isGone = (d, min, cam) => d < cam + 100 || (min != null && cam < min);

/* the floor plan: the "you are here" marker */
export const MAP = {mx: 28, mw: 70, my: 8, mh: 96};
export const youAt = (cam, G) => MAP.my + MAP.mh - cam / G.L * MAP.mh;

/* fit the hall into its stage: "cover" (the hall always fills the stage); on a phone show at least 640 design px across and make the stage as tall as the hall */
export function fitScale(stageW, stageH) {
  let sc = Math.max(stageW / VW, stageH / VH);
  const narrow = stageW / sc < 640;
  if (narrow) sc = stageW / 640;
  sc = Math.round(sc * 10000) / 10000;
  return {sc, narrow, height: narrow ? Math.round(VH * sc) : null};
}
