/* Wall.jsx — the concrete wall behind the login door, alive in three depths:
     far / mid shapes (behind the door) · light shafts and dust · people on the kerb · near shapes (in front of the door's edge).
   Everything moves with transform or opacity only. The pointer (or the tilt of a phone) shifts each depth by a different amount. */
import {useEffect} from 'react';
import Pixel from '../../components/Pixel.jsx';
import {LITE, reduce} from '../../lib/env.js';
import {walkFrames, standFrames, sitFrames, birdFrames, perchFrames, pointerNorm, tiltNorm} from '../../lib/pixel.js';

/* Westwood-punk bits on a tartan wall: safety pins, orbs, studs, pearls, tape, tartan patches.
   [shape, left %, top %, size px (width), colour token, peeled corner?]  (the door covers the middle of the wall) */
const FAR = [['stud', 8, 22, 14, 'paper'], ['pearls', 16, 76, 44, 'paper'], ['pin', 3, 56, 54, 'gold'], ['stud', 24, 12, 12, 'pink'], ['tape', 20, 90, 46, 'pink'],
  ['orb', 85, 70, 20, 'pink'], ['pin', 94, 48, 52, 'paper'], ['stud', 73, 90, 14, 'gold'], ['pearls', 66, 6, 42, 'paper'], ['tape', 90, 24, 40, 'gold']];
const MID = [['orb', 7, 12, 42, 'pink'], ['pin', 5, 44, 76, 'gold'], ['tape', 19, 60, 58, 'gold'], ['patch', 12, 82, 30, 'paper', true],
  ['orb', 92, 14, 38, 'gold'], ['pin', 86, 60, 76, 'paper'], ['pearls', 80, 84, 60, 'paper'], ['patch', 95, 40, 26, 'paper', true]];
const NEAR = [['pin', 24, 13, 124, 'paper'], ['orb', 72, 9, 72, 'pink'], ['stud', 21, 83, 46, 'paper'], ['tape', 74, 77, 112, 'gold'], ['pearls', 71, 33, 92, 'paper']];
const ASPECT = {pin: .44, orb: 1.17, pearls: .5, tape: .36};   // height / width of the box; the rest are square

/* the drawn ones (inline SVG, palette colours only). `shadow` = the same drawing in black, drawn offset underneath: the sticker shadow */
function Art({k, shadow, className}) {
  const c = shadow ? 'var(--black)' : 'var(--c)', ink = 'var(--black)', hi = shadow ? 'var(--black)' : 'var(--paper)';
  if (k === 'pin') return <svg className={className} viewBox="0 0 64 28" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" aria-hidden="true">
    <path d="M14 8H50"/><path d="M14 20H46Q61 20 61 13.5Q61 8 50 8"/><circle cx="9" cy="14" r="6"/><rect x="44" y="3" width="14" height="10" rx="4" fill={c} stroke="none"/></svg>;
  if (k === 'orb') return <svg className={className} viewBox="0 0 48 56" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M24 3V16M18 8.5H30" fill="none" stroke={ink}/><circle cx="24" cy="37" r="16" fill={c} stroke={ink}/><ellipse cx="24" cy="37" rx="22" ry="6.5" fill="none" stroke={hi}/></svg>;
  if (k === 'pearls') return <svg className={className} viewBox="0 0 80 40" fill={hi} stroke={ink} strokeWidth="2.5" aria-hidden="true">
    {[[8, 10], [24, 21], [40, 26], [56, 21], [72, 10]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="7.5"/>)}</svg>;
  return null;
}
const Shape = ({k, shadow, peel}) => {
  const cls = (shadow ? 'sh' : 'fg') + ` b-${k}` + (peel ? ' peel' : '');
  return ['pin', 'orb', 'pearls'].includes(k) ? <Art k={k} shadow={shadow} className={cls}/> : <i className={cls}/>;
};

function Bit({s, i, amp}) {
  const [k, x, y, z, c, peel] = s;
  return <span className="sp" style={{left: x + '%', top: y + '%', '--z': z + 'px', '--a': ASPECT[k] || 1, '--c': `var(--${c})`, '--r': ((i * 47) % 50 - 25) + 'deg', '--t': (6 + (i * 1.7) % 4).toFixed(1) + 's', '--w': -((i * .9) % 5).toFixed(1) + 's', '--amp': amp + 'px'}}>
    <span className="fl"><span className="sn"><span className="bl"><Shape k={k} shadow peel={peel}/><Shape k={k} peel={peel}/>{peel && <i className="fold"/>}</span></span></span></span>;
}
const Layer = ({name, items, amp}) => <div className={'mg-lay ' + name} aria-hidden="true">{items.map((s, i) => <Bit key={i} s={s} i={i} amp={amp}/>)}</div>;

/* the people on the kerb: frames are made once */
const WALK_A = walkFrames('g', 'r'), STAND_A = standFrames('g', 'r'), WALK_B = walkFrames('p', 'k'), STAND_B = standFrames('p', 'k');
const SIT = sitFrames('r', 't'), FLY = birdFrames, PERCH = perchFrames;

/* pointer / tilt → --nx, --ny on the wall (one rAF per frame at most); nothing to do when motion is reduced */
export function useWallMotion(ref) {
  useEffect(() => {
    const el = ref.current; if (!el || reduce) return;
    let raf = 0, nx = 0, ny = 0;
    const apply = () => { raf = 0; el.style.setProperty('--nx', nx.toFixed(3)); el.style.setProperty('--ny', ny.toFixed(3)); };
    const set = (a, b) => { nx = a; ny = b; if (!raf) raf = requestAnimationFrame(apply); };
    const move = e => { const p = pointerNorm(e.clientX, e.clientY, innerWidth, innerHeight); set(p.nx, p.ny); };
    const tilt = e => { const p = tiltNorm(e.gamma, e.beta); set(p.nx, p.ny); };
    addEventListener('pointermove', move, {passive: true});
    // iOS asks the user before it shares tilt (requestPermission); we never ask, so there it stays still
    const canTilt = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function';
    if (canTilt) addEventListener('deviceorientation', tilt, {passive: true});
    return () => { removeEventListener('pointermove', move); if (canTilt) removeEventListener('deviceorientation', tilt); cancelAnimationFrame(raf); };
  }, [ref]);
}

/* behind the door */
export function Wall() {
  return <>
    <Layer name="far" items={FAR} amp={8}/>
    <Layer name="mid" items={MID} amp={14}/>
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
export function WallNear() { return <Layer name="near" items={NEAR} amp={26}/>; }

/* the bird that lands on the door, looks around and leaves: put it inside the door */
export function Bird() {
  return <div className="mg-bird" aria-hidden="true"><Pixel frames={FLY} dur=".42" className="fly"/><Pixel frames={PERCH} dur="2.4" className="perch"/></div>;
}
