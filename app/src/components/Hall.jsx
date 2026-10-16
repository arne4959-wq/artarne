/* Hall.jsx — the "private museum" of a studio page (museum.js): a hall seen from its middle, the artist's pictures hung on both walls and at the far end.
   One picture is under the spot, the rest are dimmed. "Walk on" / "Previous" (and the arrow keys) move the camera to the next picture.
   It is a few CSS 3D planes moved with one transform, not a 3D engine. The rules are in museum.css (every class starts with .mus-); the numbers are in lib/hall.js.
   `cur` (which picture is lit) lives in the page, because the detail window moves it too. */
import {useEffect, useMemo, useRef} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {useDialogs} from './Dialogs.jsx';
import {canDonate} from '../lib/donate.js';
import {W, H, FIRST, SPRITE_FILE, MAP, geometry, camT, px, artBox, benchAt, ribsAndLights, isGone, youAt, fitScale} from '../lib/hall.js';

const sayOf = (L, p) => L.pk(p, 'say') || L.pk(p, 'q') || '';   // the one sentence the artist wrote about the work (older data: the quote)
export {sayOf};

const Rib = ({d}) => <div className={'mus-rib' + (d.gone ? ' mus-gone' : '')} data-d={d.d} style={{left: -W / 2 + 'px', top: -H / 2 + 'px', width: W + 'px', height: H + 'px', transform: `translate3d(0,0,${-d.d}px)`}}>
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true"><path fillRule="evenodd" d={`M0 0H${W}V${H}H0Z M0 ${H}V160A${W / 2} 130 0 0 1 ${W} 160V${H}Z`}/><path className="mus-rib-lit" fill="none" d={`M0 160A${W / 2} 130 0 0 1 ${W} 160`}/></svg></div>;

/* a pixel visitor: the shared PNGs of people/ (drawn by tools/make-sprites.mjs) */
function Person({id, legs, x, d, flip, bob, min, cam}) {
  return <div className={'mus-ppl' + (legs === 'sit' ? ' sit' : '') + (isGone(d, min, cam) ? ' mus-gone' : '')} data-d={d} {...(min != null ? {'data-min': min} : {})}
    style={{transform: `translate3d(${x - 90}px,${H / 2 - 252}px,${-d}px)`}}>
    <span style={flip ? {transform: 'scaleX(-1)'} : undefined}><img className={bob ? 'mus-bob' : ''} style={{animationDelay: (bob * -0.7).toFixed(1) + 's'}} src={SPRITE_FILE[id]} alt="" width="180" height="252" draggable="false"/></span></div>;
}

function Art({s, p, on, G, onPick}) {
  const {titleL} = useLang(), box = artBox(s, G);
  return <button type="button" className={'mus-art' + (on ? ' is-on' : '')} data-k={s.k} style={box} aria-label={titleL(p)} onClick={() => onPick(s.k)}>
    <i className="mus-wash"></i><i className="mus-lamp"></i>{p.img ? <img src={p.img} alt={titleL(p)} width={s.w} height={s.h} decoding="async" draggable="false"/> : null}<i className="mus-dim"></i></button>;
}

function FloorPlan({G, cur, cam}) {
  const {t} = useLang(), {mx, mw, my, mh} = MAP, y = d => my + mh - d / G.L * mh;
  return <div className="mus-map" aria-hidden="true"><small>{t('mus_map')}</small>
    <svg viewBox="0 0 126 114" aria-hidden="true"><rect x={mx} y={my} width={mw} height={mh} className="mus-hall"/><path d={`M${mx + 24} ${my + mh}h22v6h-22z`} className="mus-door"/>
      {G.spots.map(s => s.side === 'E'
        ? <rect key={s.k} className={'mus-m' + (s.k === cur ? ' is-on' : '')} data-k={s.k} x={mx + 22} y={my - 1} width="26" height="4"/>
        : <rect key={s.k} className={'mus-m' + (s.k === cur ? ' is-on' : '')} data-k={s.k} x={s.side === 'L' ? mx - 2 : mx + mw - 2} y={y(s.d) - 8} width="4" height="16"/>)}
      <path id="mus-you" className="mus-you" d="M0 -6 L5 4 L-5 4Z" transform={`translate(63 ${youAt(cam, G).toFixed(1)})`}/></svg></div>;
}

export default function Hall({A, cur, go, openWork}) {
  const L = useLang(), {t, nameL, titleL, fmtSize} = L, {openDonate} = useDialogs();
  const G = useMemo(() => geometry(A), [A]), s = G.spots, now = s[Math.min(cur, G.n - 1)], cam = now.cam;
  const {ribs, sky} = useMemo(() => ribsAndLights(G), [G]), bd = useMemo(() => benchAt(G), [G]), bx = -W / 2 + 45;   // the bench stands flush against the left wall, facing the room
  const stage = useRef(null), vp = useRef(null), root = useRef(null), fitKey = useRef('');
  const on = k => k === cur, pick = k => { if (k === cur) openWork(k); else go(k); };
  const planeW = {width: W + 'px', height: G.L + 'px'};

  /* fit the hall into its stage (measured from the stylesheet's own height, never the inline one set last time) */
  useEffect(() => {
    const fit = () => {
      const st = stage.current, v = vp.current; if (!st || !v) return;
      const w = st.clientWidth, key = w + 'x' + innerHeight;
      if (key === fitKey.current) return;                            // same width and screen height as last time: nothing to do (also stops the observer re-firing on our own height change)
      fitKey.current = key; st.style.height = '';
      const f = fitScale(w, st.clientHeight);
      st.style.height = f.narrow ? f.height + 'px' : '';
      v.style.transform = `translate(-50%,-50%) scale(${f.sc})`;
    };
    fitKey.current = ''; fit();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(fit) : null; if (ro) ro.observe(root.current);   // the parent box: our own stage height changes do not re-trigger it into a loop
    addEventListener('resize', fit);
    return () => { if (ro) ro.disconnect(); removeEventListener('resize', fit); };
  }, [A]);

  /* arrow keys walk the hall, unless a window is open or the focus is in a form field */
  useEffect(() => {
    const key = e => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (document.querySelector('dialog[open]') || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return;
      if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); }
    };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [cur, go]);

  const p = A.pieces[cur], say = sayOf(L, p);
  const art = list => list.map(x => <Art key={x.k} s={x} p={A.pieces[x.k]} on={on(x.k)} G={G} onPick={pick}/>);
  return <section className="mus" id="mus" aria-label={t('mus_aria', {a: nameL(A)})} ref={root}>
    <div className="mus-stage" id="mus-stage" ref={stage}>
      <div className="mus-vp" id="mus-vp" ref={vp}><div className="mus-world" id="mus-world" style={{transform: camT(now)}}>
        <div className="mus-pl mus-ceil" style={{transform: `translate3d(0,${-H / 2}px,${-G.L / 2}px) rotateX(-90deg)`, ...planeW, margin: `${-G.L / 2}px 0 0 ${-W / 2}px`}}>
          {sky.map(d => <i key={d} className="mus-sky" style={{left: (W - 180) / 2 + 'px', top: px(d - 90)}}></i>)}</div>
        <div className="mus-pl mus-floor" style={{transform: `translate3d(0,${H / 2}px,${-G.L / 2}px) rotateX(90deg)`, ...planeW, margin: `${-G.L / 2}px 0 0 ${-W / 2}px`}}>
          {sky.map(d => <i key={d} className="mus-pool" style={{left: (W - 300) / 2 + 'px', top: px(G.L - d - 90)}}></i>)}</div>
        <div className="mus-pl mus-wl mus-left" style={{transform: `translate3d(${-W / 2}px,0,${-G.L / 2}px) rotateY(90deg)`, width: G.L + 'px', height: H + 'px', margin: `${-H / 2}px 0 0 ${-G.L / 2}px`}}>{art(s.filter(x => x.side === 'L'))}</div>
        <div className="mus-pl mus-wl mus-right" style={{transform: `translate3d(${W / 2}px,0,${-G.L / 2}px) rotateY(-90deg)`, width: G.L + 'px', height: H + 'px', margin: `${-H / 2}px 0 0 ${-G.L / 2}px`}}>{art(s.filter(x => x.side === 'R'))}</div>
        <div className="mus-pl mus-end" style={{width: W + 'px', height: H + 'px', margin: `${-H / 2}px 0 0 ${-W / 2}px`, transform: `translate3d(0,0,${-G.L}px)`}}>{art(s.filter(x => x.side === 'E'))}</div>
        {ribs.map(d => <Rib key={d} d={{d, gone: isGone(d, null, cam)}}/>)}
        <div className={'mus-bench' + (isGone(bd, null, cam) ? ' mus-gone' : '')} data-d={bd} style={{transform: `translate3d(${bx - 160}px,${H / 2 - 90}px,${-bd}px) rotateY(90deg)`}}><i></i><b></b><b></b></div>
        <Person id="sitA" legs="sit" x={bx + 30} d={bd - 20} flip={false} bob={1} cam={cam}/><Person id="sitB" legs="sit" x={bx + 30} d={bd + 90} flip={false} bob={2} cam={cam}/>
        <Person id="stand" legs="stand" x={-W / 2 + 60} d={FIRST + 430} flip bob={3} cam={cam}/><Person id="stand" legs="stand" x={-W / 2 + 50} d={G.L - 100} flip={false} bob={4} min={G.L - 900} cam={cam}/>
      </div></div>
      <div className="mus-plate"><small>CIRCLES · MUSEUM</small><b>{t('mus_name', {a: nameL(A)})}</b><a className="mus-prof" href={`profile-${A.id}.html`}>{t('mus_prof')}</a></div>
      <FloorPlan G={G} cur={cur} cam={cam}/>
      <div className="mus-ctl"><button type="button" className="btn mus-prev" id="mus-prev" disabled={cur === 0} onClick={() => go(cur - 1)}>{t('mus_prev')}</button><span className="mus-cnt" id="mus-cnt">{cur + 1} / {G.n}</span><button type="button" className="btn pk mus-next" id="mus-next" disabled={cur === G.n - 1} onClick={() => go(cur + 1)}>{t('mus_next')}</button></div>
    </div>
    <aside className="mus-label" id="mus-label" aria-live="polite">
      <i className="mus-tape"></i><small>{p.y} · {fmtSize(p)}</small><b>{titleL(p)}</b>{say ? <i className="mus-q">“{say}”</i> : null}
      <span className="mus-acts">{canDonate(A) ? <button type="button" className="mus-don" data-support={A.id} data-for={titleL(p)} data-quiet="" onClick={() => openDonate(A, 0, cur)}>{t('don_work')}</button> : null}<button type="button" className="mus-more" data-mus="more" onClick={() => openWork(cur)}>{t('mus_more')}</button></span>
    </aside>
  </section>;
}
