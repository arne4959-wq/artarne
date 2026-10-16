/* Zoom.jsx — fullscreen zoom of an artwork (openZoom() of circles.js). <ZoomProvider> keeps one dialog; useZoom() returns open(src, alt).
   Wheel / pinch zooms, drag pans, double-click or double-tap toggles, + - 0 and the arrow keys work, Esc / the close button / a tap outside the picture close it. Only transform changes. */
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useLang} from '../lib/i18n.jsx';

const ZoomCtx = createContext(() => {});
export const useZoom = () => useContext(ZoomCtx);

/* the little corner button that opens the zoom; put it inside the element with class .zoom-host that holds the <img> */
export function ZoomBtn() {
  const {t} = useLang(), open = useZoom();
  return <button type="button" className="zoom-btn" data-zoom="" aria-label={t('zoom_btn')} title={t('zoom_btn')}
    onClick={e => { const img = (e.currentTarget.closest('.zoom-host') || document).querySelector('img'); if (img && (img.currentSrc || img.src)) open(img.currentSrc || img.src, img.alt); }}>
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" strokeLinecap="square"/></svg></button>;
}

const MAX = 8;
function ZoomDialog({pic, onClosed}) {
  const {t} = useLang(), dlg = useRef(null), st = useRef(null), im = useRef(null), s = useRef({sc: 1, x: 0, y: 0});
  const paint = useCallback(() => {
    const S = s.current, stage = st.current, img = im.current; if (!stage || !img) return;
    const w = img.offsetWidth * S.sc, h = img.offsetHeight * S.sc, mx = Math.max(0, (w - stage.clientWidth) / 2), my = Math.max(0, (h - stage.clientHeight) / 2);   // the picture cannot be dragged away
    S.x = Math.min(mx, Math.max(-mx, S.x)); S.y = Math.min(my, Math.max(-my, S.y));
    img.style.transform = `translate(${S.x}px,${S.y}px) scale(${S.sc})`; stage.classList.toggle('zm-in', S.sc > 1.01);
  }, []);
  const zoomAt = useCallback((cx, cy, ns) => {   // keep the point under (cx, cy) (client coordinates) where it is
    const S = s.current, r = st.current.getBoundingClientRect(), px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2);
    ns = Math.min(MAX, Math.max(1, ns)); S.x = px - (px - S.x) * (ns / S.sc); S.y = py - (py - S.y) * (ns / S.sc); S.sc = ns; paint();
  }, [paint]);
  const mid = () => { const r = st.current.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const step = f => { const [cx, cy] = mid(); zoomAt(cx, cy, s.current.sc * f); };
  const reset = () => { Object.assign(s.current, {sc: 1, x: 0, y: 0}); paint(); };
  useEffect(() => {
    const d = dlg.current, stage = st.current; s.current = {sc: 1, x: 0, y: 0};
    const wheel = e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, s.current.sc * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018))); };
    stage.addEventListener('wheel', wheel, {passive: false});   // React cannot make a wheel listener non-passive
    d.showModal(); stage.focus({preventScroll: true});
    return () => stage.removeEventListener('wheel', wheel);
  }, [zoomAt]);
  const ptr = useRef(new Map()), g = useRef({moved: 0, pinch: 0, last: 0});
  const down = e => {
    st.current.setPointerCapture(e.pointerId); ptr.current.set(e.pointerId, [e.clientX, e.clientY]); g.current.moved = 0;
    if (ptr.current.size === 2) { const [a, b] = [...ptr.current.values()]; g.current.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  };
  const move = e => {
    const p = ptr.current.get(e.pointerId); if (!p) return;
    if (ptr.current.size === 2) {
      ptr.current.set(e.pointerId, [e.clientX, e.clientY]); const [a, b] = [...ptr.current.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (g.current.pinch > 0) zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, s.current.sc * dist / g.current.pinch); g.current.pinch = dist; g.current.moved = 99; return;
    }
    const dx = e.clientX - p[0], dy = e.clientY - p[1]; ptr.current.set(e.pointerId, [e.clientX, e.clientY]); g.current.moved += Math.abs(dx) + Math.abs(dy);
    if (s.current.sc > 1.01) { s.current.x += dx; s.current.y += dy; paint(); }
  };
  const up = e => {
    if (!ptr.current.delete(e.pointerId)) return;
    if (ptr.current.size === 0 && g.current.moved < 6 && e.type === 'pointerup') {
      if (e.target === st.current) { dlg.current.close(); return; }                                       // a tap outside the picture closes
      const now = Date.now(); if (now - g.current.last < 320) { zoomAt(e.clientX, e.clientY, s.current.sc > 1.5 ? 1 : 3); g.current.last = 0; } else g.current.last = now;   // double tap / click
    }
  };
  const key = e => {
    const k = e.key, mv = {ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60]}[k], S = s.current;
    if (k === '+' || k === '=') step(1.5); else if (k === '-' || k === '_') step(1 / 1.5); else if (k === '0') reset();
    else if (mv && S.sc > 1.01) { S.x += mv[0]; S.y += mv[1]; paint(); } else return;
    e.preventDefault();
  };
  return <dialog ref={dlg} id="dlg-zoom" className="cdlg zoomdlg" onClose={onClosed} onClick={e => { if (e.target === dlg.current) dlg.current.close(); }}>
    <div className="zm-bar"><span className="zm-hint">{t('zoom_hint')}</span><div className="zm-tools">
      <button type="button" data-zi="" aria-label={t('zoom_in')} onClick={() => step(1.5)}>+</button><button type="button" data-zo="" aria-label={t('zoom_out')} onClick={() => step(1 / 1.5)}>−</button><button type="button" data-zr="" aria-label={t('zoom_reset')} onClick={reset}>1×</button>
      <button type="button" data-close="" aria-label={t('close')} onClick={() => dlg.current.close()}>✕</button></div></div>
    <div className="zm-stage" tabIndex={0} role="group" aria-label={pic.alt || t('zoom_btn')} ref={st} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
      <img className="zm-img" src={pic.src} alt={pic.alt || ''} draggable="false" ref={im}/></div>
  </dialog>;
}

export function ZoomProvider({children}) {
  const [pic, setPic] = useState(null);
  const open = useCallback((src, alt) => setPic({src, alt}), []);
  return <ZoomCtx.Provider value={open}>{children}{pic && createPortal(<ZoomDialog key={pic.src} pic={pic} onClosed={() => setPic(null)}/>, document.body)}</ZoomCtx.Provider>;
}
