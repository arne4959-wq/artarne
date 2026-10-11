/* Wall.jsx — the concrete wall behind the login door, alive in three depths:
     far / mid shapes (behind the door) · light shafts and dust · people on the kerb · near shapes (in front of the door's edge).
   Everything moves with transform or opacity only. The pointer (or the tilt of a phone) shifts each depth by a different amount. */
import {useEffect, useMemo} from 'react';
import Pixel from '../../components/Pixel.jsx';
import {LITE, reduce} from '../../lib/env.js';
import {walkFrames, standFrames, sitFrames, birdFrames, perchFrames, dustTile, pointerNorm, tiltNorm} from '../../lib/pixel.js';

/* [shape, left %, top %, size px, colour token, peeled corner?]  (the door covers the middle of the wall) */
const FAR = [['dot', 8, 22, 14, 'paper'], ['star', 16, 76, 18, 'gold'], ['tri', 3, 56, 16, 'pink'], ['plus', 24, 12, 14, 'tartan-red'], ['ring', 20, 90, 16, 'paper'],
  ['sq', 92, 26, 14, 'gold'], ['dot', 85, 70, 16, 'pink'], ['star', 97, 48, 16, 'paper'], ['plus', 73, 90, 16, 'gold'], ['tri', 66, 6, 16, 'tartan-red']];
const MID = [['star', 7, 12, 28, 'pink'], ['ring', 5, 44, 30, 'gold'], ['plus', 19, 60, 24, 'tartan-red'], ['sq', 12, 82, 22, 'pink', true],
  ['star', 92, 14, 26, 'gold'], ['ring', 90, 60, 30, 'pink'], ['tri', 82, 84, 28, 'paper'], ['sq', 95, 40, 20, 'tartan-red', true]];
const NEAR = [['star', 25, 13, 64, 'gold'], ['ring', 72, 9, 58, 'pink'], ['dot', 21, 83, 48, 'tartan-red'], ['plus', 74, 77, 56, 'paper'], ['tri', 71, 33, 52, 'gold']];

function Bit({s, i, amp}) {
  const [k, x, y, z, c, peel] = s, cls = ` b-${k}${peel ? ' peel' : ''}`;
  return <span className="sp" style={{left: x + '%', top: y + '%', '--z': z + 'px', '--c': `var(--${c})`, '--r': ((i * 47) % 50 - 25) + 'deg', '--t': (6 + (i * 1.7) % 4).toFixed(1) + 's', '--w': -((i * .9) % 5).toFixed(1) + 's', '--amp': amp + 'px'}}>
    <span className="fl"><span className="sn"><span className="bl"><i className={'sh' + cls}/><i className={'fg' + cls}/>{peel && <i className="fold"/>}</span></span></span></span>;
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
  const dust = useMemo(() => (LITE ? null : [dustTile(11, 34, 4, .75), dustTile(29, 56, 2, .6)]), []);
  return <>
    <Layer name="far" items={FAR} amp={8}/>
    <Layer name="mid" items={MID} amp={14}/>
    <div className="mg-fx" aria-hidden="true">
      {[{x: 6, w: 9, T: 9, o: 0}, {x: 28, w: 14, T: 12, o: 3}, {x: 53, w: 10, T: 10.5, o: 6}, {x: 78, w: 7, T: 13, o: 1.5}].map((r, i) =>
        <i key={i} className="mg-ray" style={{'--x': r.x + '%', '--w': r.w + '%', '--T': r.T + 's', '--o': -r.o + 's'}}/>)}
      {dust && <><div className="mg-dust a" style={{backgroundImage: `url(${dust[0]})`}}/><div className="mg-dust b" style={{backgroundImage: `url(${dust[1]})`}}/></>}
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
