/* Wall.jsx — the tartan wall behind the login door. The pattern (pins, tape, patches in three sizes) stands still; what lives on it is
   the light shafts, the people on the kerb and the bird. Everything that moves does so with transform or opacity only. */
import Pixel from '../../components/Pixel.jsx';
import {LITE} from '../../lib/env.js';
import {walkFrames, standFrames, sitFrames, birdFrames, perchFrames} from '../../lib/pixel.js';

/* Westwood-punk bits on a tartan wall: safety pins, tape, tartan patches. They stand still.
   [shape, left %, top %, size px (width), colour token, peeled corner?]  (the door covers the middle of the wall) */
const FAR = [['pin', 3, 56, 54, 'gold'], ['tape', 20, 90, 46, 'pink'], ['pin', 94, 48, 52, 'paper'], ['tape', 90, 24, 40, 'gold'], ['patch', 16, 76, 22, 'paper', true],
  ['pin', 66, 6, 50, 'pink'], ['tape', 73, 90, 44, 'paper'], ['patch', 85, 70, 22, 'paper', true], ['pin', 30, 92, 46, 'gold'], ['tape', 4, 14, 44, 'paper']];
const MID = [['pin', 5, 44, 76, 'gold'], ['tape', 19, 60, 58, 'gold'], ['patch', 12, 82, 30, 'paper', true], ['pin', 86, 60, 76, 'paper'],
  ['patch', 95, 40, 26, 'paper', true], ['tape', 7, 12, 60, 'pink'], ['pin', 92, 14, 70, 'gold'], ['tape', 82, 84, 60, 'paper']];
const NEAR = [['pin', 15, 12, 124, 'paper'], ['tape', 74, 77, 112, 'gold'], ['pin', 72, 9, 100, 'pink'], ['tape', 21, 83, 100, 'pink'], ['patch', 71, 33, 44, 'paper', true]];
const ASPECT = {pin: .44, tape: .36};   // height / width of the box; the rest are square

/* the drawn ones (inline SVG, palette colours only). `shadow` = the same drawing in black, drawn offset underneath: the sticker shadow */
function Art({k, shadow, className}) {
  const c = shadow ? 'var(--black)' : 'var(--c)';
  if (k === 'pin') return <svg className={className} viewBox="0 0 64 28" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" aria-hidden="true">
    <path d="M14 8H50"/><path d="M14 20H46Q61 20 61 13.5Q61 8 50 8"/><circle cx="9" cy="14" r="6"/><rect x="44" y="3" width="14" height="10" rx="4" fill={c} stroke="none"/></svg>;
  return null;
}
const Shape = ({k, shadow, peel}) => {
  const cls = (shadow ? 'sh' : 'fg') + ` b-${k}` + (peel ? ' peel' : '');
  return k === 'pin' ? <Art k={k} shadow={shadow} className={cls}/> : <i className={cls}/>;
};

function Bit({s, i}) {
  const [k, x, y, z, c, peel] = s;
  return <span className="sp" style={{left: x + '%', top: y + '%', '--z': z + 'px', '--a': ASPECT[k] || 1, '--c': `var(--${c})`, '--r': ((i * 47) % 50 - 25) + 'deg',}}>
    <span className="bl"><Shape k={k} shadow peel={peel}/><Shape k={k} peel={peel}/>{peel && <i className="fold"/>}</span></span>;
}
const Layer = ({name, items}) => <div className={'mg-lay ' + name} aria-hidden="true">{items.map((s, i) => <Bit key={i} s={s} i={i}/>)}</div>;

/* the people on the kerb: frames are made once */
const WALK_A = walkFrames('g', 'r'), STAND_A = standFrames('g', 'r'), WALK_B = walkFrames('p', 'k'), STAND_B = standFrames('p', 'k');
/* the bird is drawn in black for the home page; on this dark tartan it is repainted paper-white */
const pale = frames => frames.map(f => f.map(r => r.replace(/k/g, 'p')));
const SIT = sitFrames('r', 't'), FLY = pale(birdFrames), PERCH = pale(perchFrames);

/* behind the door */
export function Wall() {
  return <>
    <Layer name="far" items={FAR}/>
    <Layer name="mid" items={MID}/>
    <div className="mg-fx" aria-hidden="true">
      {[{x: 6, w: 9, T: 9, o: 0}, {x: 28, w: 14, T: 12, o: 3}, {x: 53, w: 10, T: 10.5, o: 6}, {x: 78, w: 7, T: 13, o: 1.5}].map((r, i) =>
        <i key={i} className="mg-ray" style={{'--x': r.x + '%', '--w': r.w + '%', '--T': r.T + 's', '--o': -r.o + 's'}}/>)}
    </div>
    <div className="mg-folk" aria-hidden="true">
      <div className="mg-w a" style={{'--rx': '22cqw'}}><div className="flip"><Pixel frames={WALK_A} dur=".72" className="wk"/><Pixel frames={STAND_A} dur="2.6" className="st"/></div></div>
      {!LITE && <div className="mg-w b" style={{'--rx': '78cqw'}}><div className="flip rev"><Pixel frames={WALK_B} dur=".78" className="wk"/><Pixel frames={STAND_B} dur="2.9" className="st"/></div></div>}
      {!LITE && <div className="mg-sit"><Pixel frames={SIT} dur="3.6"/></div>}
    </div>
  </>;
}

/* in front of the door's edge */
export function WallNear() { return <Layer name="near" items={NEAR}/>; }

/* the bird that lands on the door, looks around and leaves: put it inside the door */
export function Bird() {
  return <div className="mg-bird" aria-hidden="true"><Pixel frames={FLY} dur=".42" className="fly"/><Pixel frames={PERCH} dur="2.4" className="perch"/></div>;
}
