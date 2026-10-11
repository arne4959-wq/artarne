/* Pixel — one pixel-art sprite: its frames (16 x 16, see lib/pixel.js) are drawn once onto canvases and stacked; CSS shows one at a time
   (opacity with steps(), no script per frame). Scale it with --px on the element or a parent. `frames` must be a stable array. */
import {useLayoutEffect, useRef} from 'react';
import {canvasOf} from '../lib/pixel.js';

export default function Pixel({frames, dur = 1, className = ''}) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    ref.current.replaceChildren(...frames.map((rows, i) => { const c = canvasOf(rows); c.style.setProperty('--i', i); c.setAttribute('aria-hidden', 'true'); return c; }));
  }, [frames]);
  return <div ref={ref} className={`spr n${frames.length} ${className}`} style={{'--n': frames.length, '--dur': dur + 's'}}/>;
}
