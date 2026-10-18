/* hd2d.js — what stands and moves on the city strip (from hd2d.js): the person at every door, the walkers and the birds.
   Frames come from lib/pixel.js; this file holds the choices. Unknown building kinds simply get nobody at the door. */
import {walkFrames, standFrames, birdFrames} from './pixel.js';

/* x = where they stand, in the building's 400-wide drawing */
export const STAND = {arch: {x: 200, hair: 'k', coat: 'p'}, lens: {x: 28, hair: 'r', coat: 'k'}, tower: {x: 44, hair: 'g', coat: 'k'}, vase: {x: 16, hair: 'p', coat: 'k'}, shell: {x: 18, hair: 'g', coat: 'k'}, collage: {x: 34, hair: 'r', coat: 'k'},
  stack: {x: 66, hair: 'g', coat: 'r'}, dome: {x: 28, hair: 'p', coat: 'k'}, pixel: {x: 34, hair: 'r', coat: 'k'}, spore: {x: 130, hair: 'g', coat: 'p'}};
/* the frames of one standing person, made once per look (a stable array: <Pixel> draws its canvases once) */
const standCache = {};
export const standOf = kind => {
  const cfg = STAND[kind]; if (!cfg) return null;
  const key = cfg.hair + cfg.coat;
  return {cfg, frames: standCache[key] || (standCache[key] = standFrames(cfg.hair, cfg.coat))};
};

/* people: who they are, how long a lap of the street takes, which way they walk */
export const WALKERS = [
  {hair: 'g', coat: 'r', T: 96, rev: false}, {hair: 'k', coat: 'g', T: 124, rev: true}, {hair: 'p', coat: 't', T: 108, rev: false},
  {hair: 'r', coat: 'p', T: 142, rev: true}, {hair: 'g', coat: 'k', T: 116, rev: false},
].map(w => ({...w, frames: walkFrames(w.hair, w.coat)}));
/* birds: three crossing the sky at different heights and speeds */
export const BIRDS = [{y: '2.2rem', T: 54, rev: false, o: .15}, {y: '6.5rem', T: 76, rev: true, o: .55}, {y: '10.5rem', T: 64, rev: false, o: .8}];
export const BIRD_FRAMES = birdFrames;
export const FX_RAYS = [{x: 6, w: 9, T: 9, o: 0}, {x: 28, w: 14, T: 12, o: 3}, {x: 53, w: 10, T: 10.5, o: 6}, {x: 78, w: 7, T: 13, o: 1.5}];
