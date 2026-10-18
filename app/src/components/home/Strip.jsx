/* Strip.jsx — the city: the draggable strip of buildings, the three depth layers behind them (far / mid / sky), the light and dust in front,
   the pixel people at the doors and walking the street, the birds. From site.js and hd2d.js; nothing about the look is new.
   Whatever the pointer or the scroll changes (--sx, .drag, .lit/.dim, tilt) is set on the DOM by id, as before, so React never fights it. */
import {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {reduce, LITE} from '../../lib/env.js';
import {monument, midCitySvg, farCitySvg} from '../../lib/monument.js';
import {noLabel, openStudio} from '../../lib/home.js';
import {dustTile} from '../../lib/pixel.js';
import {standOf, WALKERS, BIRDS, BIRD_FRAMES, FX_RAYS} from '../../lib/hd2d.js';
import {observeIn} from '../../lib/useHome.js';
import {Ransom} from '../art.jsx';
import Pixel from '../Pixel.jsx';

const drag = {moved: false};   // set while a drag moved the strip: the click that ends a drag must not open a building

const PIN = <svg className="pin" viewBox="0 0 64 22" aria-hidden="true"><path d="M10,6 H52 M10,15 H44" stroke="#8d8d8d" strokeWidth="2.6" strokeLinecap="round" fill="none"/><path d="M10,6 C0,6 0,15 10,15" stroke="#8d8d8d" strokeWidth="2.6" fill="none" strokeLinecap="round"/><rect x="44" y="3" width="14" height="15" rx="4" fill="#bdbdbd" stroke="#6d6d6d" strokeWidth="2"/></svg>;

function Building({a, i}) {
  const L = useLang(), {t, nameL, discL, titleL, bldgL, lang} = L, ref = useRef(null);
  // the drawing (a string of SVG) goes in front of the tag, exactly where the old script put it
  useLayoutEffect(() => {
    const el = ref.current; el.insertAdjacentHTML('afterbegin', monument(a));
    return () => el.querySelectorAll(':scope > svg').forEach(s => s.remove());
  }, [a]);
  useLayoutEffect(() => {   // what has words in it follows the language
    const el = ref.current;
    el.querySelector('.mon').setAttribute('aria-label', bldgL(a));
    el.querySelectorAll('.tile title').forEach(x => { if (x.dataset.k == null) x.dataset.k = a.titles.indexOf(x.textContent); const k = +x.dataset.k; if (k >= 0) x.textContent = lang === 'lo' ? titleL(a.pieces[k]) : a.titles[k]; });   // tooltips: Lao gets titleLo, th / en keep the Thai title
  }, [a, lang]);   // eslint-disable-line react-hooks/exhaustive-deps
  const st = standOf(a.kind);
  return <a className="bd" ref={ref} href={`studio-${a.id}.html`} draggable="false" style={{'--i': i, '--s': a.scale}} data-cur="ENTER" data-id={a.id}
    onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; e.preventDefault(); if (!drag.moved) openStudio(a.id, null, reduce); }}>   {/* plain click = animated page change; ctrl/cmd/middle click keeps "open in new tab" */}
    <div className="tag">{PIN}<div className="no">{`${noLabel(i)} · ${t('works_n', {n: a.works.length})}`}</div>
      <Ransom as="span" className="nm rn" role="img" aria-label={nameL(a)} text={nameL(a)} seed={i}/>
      <div className="ds">{discL(a)}</div><div className="wl">{a.pieces.map(p => titleL(p)).join(' · ')}</div>
      {a.wave && <i className="wv">★ {t('wave')}</i>}</div>
    {st && <div className="stand" style={{'--x': st.cfg.x}} aria-hidden="true"><div className="lift"><Pixel frames={st.frames} dur={2.6 + (st.cfg.x % 7) * .17}/></div></div>}
  </a>;
}

/* drag with inertia, the arrow keys, the progress bar, the parallax variable --sx, the tilt of a building under the mouse */
function useStrip(count) {
  useEffect(() => {
    const strip = document.getElementById('strip'), inner = document.getElementById('strip-in'), prog = document.getElementById('progress-i'), bar = document.getElementById('progress');
    const undo = [];
    let down = false, sx = 0, sl = 0, lastX = 0, lastT = 0, vel = 0, inertia = 0;
    const on = (t, ev, f, o) => { t.addEventListener(ev, f, o); undo.push(() => t.removeEventListener(ev, f, o)); };
    on(strip, 'pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(inertia);
      down = true; drag.moved = false; sx = lastX = e.clientX; sl = strip.scrollLeft; lastT = performance.now(); vel = 0;
    });
    on(window, 'pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5 && !drag.moved) { drag.moved = true; strip.classList.add('drag'); }
      if (!drag.moved) return;
      strip.scrollLeft = sl - dx;
      const now = performance.now(), dt = Math.max(1, now - lastT);
      vel = .8 * vel + .2 * ((lastX - e.clientX) / dt * 16);
      lastX = e.clientX; lastT = now;
    });
    const end = () => {
      if (!down) return;
      down = false; strip.classList.remove('drag');
      if (drag.moved && !reduce) (function glide() { if (Math.abs(vel) < .3) return; strip.scrollLeft += vel; vel *= .94; inertia = requestAnimationFrame(glide); })();
      setTimeout(() => { drag.moved = false; }, 0);
    };
    on(window, 'pointerup', end); on(window, 'pointercancel', end);
    const go = d => { cancelAnimationFrame(inertia); strip.scrollBy({left: d * 460, behavior: 'smooth'}); };
    on(strip, 'keydown', e => { if (e.target !== strip) return; if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    // progress bar + the parallax variable (one rAF per frame)
    let ticking = false, par = null;
    const onStrip = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const max = strip.scrollWidth - strip.clientWidth, r = max > 0 ? strip.scrollLeft / max : 0;
        const w = Math.max(.12, strip.clientWidth / strip.scrollWidth), track = bar.clientWidth;
        prog.style.transform = `translateX(${r * (1 - w) * track}px) scaleX(${w})`;
        if (!reduce) { par = par || inner.querySelectorAll('.far,.mid,.sky,.sun'); par.forEach(el => el.style.setProperty('--sx', strip.scrollLeft)); }
        ticking = false;
      });
    };
    on(strip, 'scroll', onStrip, {passive: true}); on(window, 'resize', onStrip);
    on(bar, 'click', e => { const rect = bar.getBoundingClientRect(); strip.scrollTo({left: (e.clientX - rect.left) / rect.width * (strip.scrollWidth - strip.clientWidth), behavior: 'smooth'}); });
    onStrip();
    // the width of the layers that follow the street (the people and birds measure their lap from it)
    const setW = () => { const w = inner.offsetWidth + 'px'; inner.querySelector('.fg')?.style.setProperty('--W', w); inner.querySelector('.sky')?.style.setProperty('--W', w); };
    setW(); on(window, 'resize', setW);
    // buildings rise as the strip scrolls them into view
    undo.push(observeIn([...document.querySelectorAll('.bd')], strip));
    // tilt under the mouse
    if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      document.querySelectorAll('.bd').forEach(bd => {
        const svg = bd.querySelector('.mon');
        on(bd, 'pointermove', e => { const r = bd.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; svg.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg'); svg.style.setProperty('--rx', (py * -5).toFixed(2) + 'deg'); });
        on(bd, 'pointerleave', () => { svg.style.setProperty('--ry', '0deg'); svg.style.setProperty('--rx', '0deg'); });
      });
    }
    return () => { undo.forEach(f => f()); cancelAnimationFrame(inertia); };
  }, [count]);
}

export function scrollCity(d) { const s = document.getElementById('strip'); if (s) s.scrollBy({left: d * 460, behavior: 'smooth'}); }

export default function Strip({artists, hidden}) {
  const {t} = useLang();
  useStrip(artists.length);
  useLayoutEffect(() => {   // tallest building = widest scale x the drawing's 1.4 height/width
    document.documentElement.style.setProperty('--bk', (Math.max(...artists.map(a => a.scale)) * 1.4).toFixed(3));
  }, [artists]);
  const far = useMemo(farCitySvg, []), mid = useMemo(midCitySvg, []);
  const walkers = LITE ? WALKERS.slice(0, 3) : WALKERS, birds = LITE ? BIRDS.slice(0, 2) : BIRDS;
  const dust = useMemo(() => [dustTile(11, 34, 4, .75), dustTile(29, 56, 2, .6)], []);
  return <div className="stage">
    <div className="strip" id="strip" tabIndex={0} aria-label={t('strip_aria')} hidden={hidden}>
      <div className="strip-in" id="strip-in">
        <div className="depth" id="depth">
          <div className="far" dangerouslySetInnerHTML={{__html: far}}/>
          <div className="sun ring"></div><div className="sun dot"></div><div className="sun ring2"></div>
          <div className="mid" dangerouslySetInnerHTML={{__html: mid}}/>
          <div className="sky" aria-hidden="true">
            {birds.map((b, i) => <div key={i} className={'bird' + (b.rev ? ' rev' : '')} style={{'--y': b.y, '--T': b.T + 's', '--o': -(b.T * b.o) + 's', '--rx': Math.round(300 + i * 700) + 'px'}}>
              <div className="bob" style={{'--bd': (2.2 + i * .5) + 's'}}><div className="flip" style={b.rev ? {transform: 'scaleX(-1)'} : undefined}><Pixel frames={BIRD_FRAMES} dur={.5 + i * .06}/></div></div></div>)}
          </div>
        </div>
        <div className="ground tartan"></div>
        {artists.map((a, i) => <Building key={a.id} a={a} i={i}/>)}
        <div className="fg" aria-hidden="true">
          {walkers.map((w, i) => <div key={i} className={'walker' + (w.rev ? ' rev' : '')} style={{'--T': w.T + 's', '--o': -(w.T * (i + .35) / walkers.length) + 's', '--rx': Math.round(160 + i * 560 + (i % 2) * 120) + 'px'}}>
            <div className="flip" style={w.rev ? {transform: 'scaleX(-1)'} : undefined}><Pixel frames={w.frames} dur={.72}/></div></div>)}
        </div>
      </div>
    </div>
    <div className="fx" aria-hidden="true">
      {FX_RAYS.map((r, i) => <i key={i} className="ray" style={{'--x': r.x + '%', '--w': r.w + '%', '--T': r.T + 's', '--o': -r.o + 's'}}/>)}
      <div className="dust a" style={{backgroundImage: `url(${dust[0]})`}}/><div className="dust b" style={{backgroundImage: `url(${dust[1]})`}}/>
    </div>
  </div>;
}
