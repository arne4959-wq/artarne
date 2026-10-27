/* WorkDialog.jsx — the artwork window of a studio page (fillDlg() of cutaway.html): the picture, "In the artist's words" with the
   "written by the artist" stamp, the details, the concept, a Resonated button and the quiet Donate link. A small concrete room: a riveted beam on
   top with the room number like a floor sign, the picture with tape, a hazard-stripe footing (same parts as the other windows, see Dialogs.jsx).
   Donations go to the artist only (this work is named as the inspiration); there is no shop here. */
import {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useLang} from '../lib/i18n.jsx';
import {esc} from '../lib/lang.js';
import {artBg} from '../lib/art.js';
import {canDonate} from '../lib/donate.js';
import {resMine, resCount, resToggle} from '../lib/places.js';
import {reduce} from '../lib/env.js';
import {STAGES, stage as stageOf, stagesOf, hasProcess, fmtOn} from '../lib/tower.js';
import {ArtImg} from './art.jsx';
import {useDialogs} from './Dialogs.jsx';
import {useZoom} from './Zoom.jsx';

/* "In the artist's words": the artist's own three fields (say / why / look); empty when the artist wrote none */
function Voice({A, p}) {
  const L = useLang(), {t} = L, say = L.pk(p, 'say'), why = L.pk(p, 'why'), look = L.pk(p, 'look');
  if (!say && !why && !look) return null;
  const rows = [[why, 'v_why', '01'], [look, 'v_look', '02']].filter(x => x[0]);
  return <><section className="voice" aria-labelledby="v-h"><div className="v-top"><h3 id="v-h">{t('v_h')}</h3><span className="v-stamp">{t('v_stamp')}</span></div>
    {say ? <><p className="v-say">“{say}”</p><p className="v-by">{t('v_by', {a: L.nameL(A)})}</p></> : null}
    {rows.length ? <dl className="v-rows">{rows.map(x => <div key={x[2]}><dt><b>{x[2]}</b>{t(x[1])}</dt><dd>{x[0]}</dd></div>)}</dl> : null}
    <div className="v-tb"><span>{t('v_tb_by')}<b>{L.nameL(A)}</b></span><span>{t('v_tb_work')}<b>{L.titleL(p)} · {p.y}</b></span></div></section><p className="v-note">{t('v_note')}</p></>;
}

/* the concept block: no concept = no block, never an empty one */
function Concept({A, p}) {
  const L = useLang(), {t} = L, c = p.concept, steps = c && Array.isArray(c.steps) ? c.steps.filter(x => x && (x.h || x.d)) : [];
  const has = !!(c && (c.origin || c.material || c.quote || steps.length));
  return <section className="dlg-concept" id="dlg-concept" aria-labelledby="dlg-cc-h" hidden={!has}>{!has ? null : <>
    <h3 id="dlg-cc-h"><small>CONCEPT</small>{t('cc_h')}</h3>
    {c.origin || c.material || c.quote ? <div className="cc-top">
      {c.origin || c.material ? <dl className="cc-dl">{c.origin ? <div><dt>{t('cc_origin')}</dt><dd>{L.pk(c, 'origin')}</dd></div> : null}{c.material ? <div><dt>{t('cc_mat')}</dt><dd>{L.pk(c, 'material')}</dd></div> : null}</dl> : null}
      {c.quote ? <blockquote className="cc-q">“{L.pk(c, 'quote')}”<cite>— {L.nameL(A)}</cite></blockquote> : null}</div> : null}
    {steps.length ? <ol className="cc-steps" aria-label={t('cc_steps')}>{steps.slice(0, 3).map((x, i) => <li key={i} className="cc-card"><i className="cc-tape" aria-hidden="true"></i><small>{t('cc_step', {n: i + 1})}</small><b>{L.pk(x, 'h')}</b><p>{L.pk(x, 'd')}</p></li>)}</ol> : null}</>}</section>;
}

/* the sample artists carry a *.example e-mail; the "Resonated" count is made up for them only */
const isSample = a => /\.example$/i.test(String(a.email || ''));
/* a fact row of the details list; an artist may leave the year, size or medium empty: no row, no "undefined" */
function Fact({k, v, cls}) { const {t} = useLang(); return v ? <div className={cls}><dt>{t(k)}</dt><dd>{v}</dd></div> : null; }

/* the "Resonated" button: the count is sample data plus this browser's own tap */
function Resonate({A, k}) {
  const {t} = useLang(), [, tick] = useState(0), on = resMine(A.id, k);
  return <button type="button" className="res-btn" id="dlg-res" aria-pressed={on} onClick={() => { resToggle(A.id, k); tick(n => n + 1); }}>
    <span aria-hidden="true">♥</span> {t(on ? 'res_on' : 'res_btn')} <b>{resCount(A.id, k)}</b></button>;
}


/* the four stage layers of the picture (idea / sketch / draft / final): an empty stage is an honest empty window, never an invented picture */
function Layers({A, k, peel}) {
  const L = useLang(), {t} = L, p = A.pieces[k], title = L.titleL(p), round = Math.round(peel);
  return <div className="stg-stack">{stagesOf(L, p).map((st, i) => {
    const none = <div className="stg-void"><span>{t('st_none_' + st.s)}</span></div>;
    const inner = st.s === 'idea'
      ? (st.has ? <div className="stg-note"><i className="tw-tape" aria-hidden="true"></i><p>{st.text}</p></div> : none)
      : (st.has ? <img src={st.src} alt={title + ' — ' + t('st_' + st.s)} draggable="false"/> : none);
    return <div key={st.s} className="stg-layer" data-stage={st.s} style={{opacity: Math.max(0, 1 - Math.abs(peel - i)).toFixed(3), pointerEvents: round === i ? 'auto' : 'none'}} aria-hidden={round !== i}>{inner}</div>;
  })}</div>;
}

/* the panel under the picture: stage tabs, the "peel" slider and the timeline; all three drive the same value (0 idea · 1 sketch · 2 draft · 3 final) */
function StagePanel({A, k, peel, go, drag}) {
  const L = useLang(), {t} = L, p = A.pieces[k], sts = stagesOf(L, p), proc = hasProcess(L, p), cur = STAGES[Math.round(peel)];
  const none = st => t('st_' + st.s) + (st.has ? '' : ' (' + t('st_none_' + st.s) + ')');
  return <section className="stg" aria-labelledby="stg-h"><div className="stg-top"><h3 id="stg-h">{t('st_h')}</h3></div>
    <div className="stg-tabs" role="group" aria-label={t('st_tabs')}>{sts.map((st, i) => <button key={st.s} type="button" className={'stg-tab' + (st.has ? '' : ' void')} data-stage={st.s} aria-pressed={cur === st.s} aria-label={none(st)} onClick={() => go(st.s)}><small>0{i + 1}</small>{t('st_' + st.s)}</button>)}</div>
    {proc ? <>
      <div className="stg-peel"><label htmlFor="stg-range">{t('st_peel')}</label><input type="range" id="stg-range" min="0" max="3" step="0.01" value={peel} aria-valuetext={t('st_' + cur)} onChange={e => drag(+e.target.value)}/><small>{t('st_peel_hint')}</small></div>
      <ol className="stg-tl" aria-label={t('st_tl')}>{sts.map(st => <li key={st.s} data-stage={st.s} className={cur === st.s ? 'on' : undefined}><button type="button" data-stage={st.s} onClick={() => go(st.s)}><b>{t('st_' + st.s)}</b><time>{fmtOn(st.on) || (st.has ? '' : '—')}</time></button></li>)}</ol>
    </> : <p className="stg-none">{t('st_none_all')}</p>}</section>;
}

/* k = the work shown; open = whether the window is on screen (the page owns both: the hall moves with it) */
export default function WorkDialog({A, k, open, show, onClosed, stage, seq, onStage}) {
  const L = useLang(), {t} = L, {openDonate} = useDialogs(), zoom = useZoom(), ref = useRef(null), p = A.pieces[k], n = A.pieces.length;
  const [peel, setPeel] = useState(3), raf = useRef(0), peelRef = useRef(3), cur = STAGES[Math.round(peel)];
  const put = useCallback(v => { peelRef.current = v; setPeel(v); }, []);
  useEffect(() => { const i = STAGES.indexOf(stage); if (i >= 0) { cancelAnimationFrame(raf.current); put(i); } }, [seq]);   // opened at a stage (a tower window, a contact-sheet cell, ?stage=)
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { if (open) onStage?.(cur); }, [cur, open]);   // the address follows the stage in view
  const go = s => {   // a tab or a timeline entry: slide there (at once with reduced motion)
    cancelAnimationFrame(raf.current); const to = STAGES.indexOf(s), from = peelRef.current;
    if (reduce || from === to) { put(to); return; }
    const t0 = performance.now(), dur = 240 + 120 * Math.abs(to - from);
    const step = now => { const q = Math.min(1, (now - t0) / dur), e = q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; put(q >= 1 ? to : from + (to - from) * e); if (q < 1) raf.current = requestAnimationFrame(step); };
    raf.current = requestAnimationFrame(step);
  };
  const drag = v => { cancelAnimationFrame(raf.current); put(v); };
  const zoomNow = () => { const img = ref.current.querySelector(`#dlg-frame .stg-layer[data-stage="${cur}"] img`); if (img) zoom(img.currentSrc || img.src, img.alt); };   // the picture of the stage you are looking at
  useEffect(() => { const d = ref.current; if (open && !d.open) d.showModal(); else if (!open && d.open) d.close(); }, [open]);
  const vh = !!(L.pk(p, 'say') || L.pk(p, 'why') || L.pk(p, 'look'));
  const [aw, ah] = p.ar.split('/').map(Number);
  return createPortal(<dialog className="work-dlg" id="dlg" aria-labelledby="dlg-t" ref={ref} onClose={onClosed}
    onClick={e => { if (e.target === ref.current) ref.current.close(); }}
    onKeyDown={e => { if (e.target.id === 'stg-range') return; if (e.key === 'ArrowLeft' && k > 0) show(k - 1); if (e.key === 'ArrowRight' && k < n - 1) show(k + 1); }}>
    <div className="cdlg-h wd-h"><div className="cdlg-t"><h2 id="dlg-t">{L.titleL(p)}</h2></div>
      <div className="cdlg-fl wd-room" id="dlg-fl" aria-hidden="true"><small>{t('room_k')}</small><b>0{k + 1}</b></div>
      <button type="button" className="cdlg-x" id="dlg-x" data-t-aria="close" aria-label={t('close')} onClick={() => ref.current.close()}>✕</button></div>
    <div className="dlg-in">
      <div className="dlg-art"><div className="frame zoom-host" id="dlg-frame" style={{'--ar': p.ar, '--art': artBg(A.works, k), '--arn': String(+(aw / ah).toFixed(4))}} data-cur={cur} data-void={stageOf(L, p, cur).has ? undefined : ''}>
        <i className="dlg-tape" aria-hidden="true"></i><Layers A={A} k={k} peel={peel}/>
        <button type="button" className="zoom-btn" data-zoom="" aria-label={t('zoom_btn')} title={t('zoom_btn')} onClick={zoomNow}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square"/></svg></button></div></div>
      <div className="dlg-body">
        <p className="dlg-by" id="dlg-by" dangerouslySetInnerHTML={{__html: t('d_by', {a: esc(L.nameL(A)), d: esc(L.discL(A)), c: esc(L.cityL(A))})}}/>
        <div id="dlg-stg"><StagePanel A={A} k={k} peel={peel} go={go} drag={drag}/></div>
        <div id="dlg-voice"><Voice A={A} p={p}/></div>
        <div className="dlg-story" id="dlg-story" hidden={!p.st || vh}>{p.st && !vh ? <><small id="dlg-sk">{t('d_story')}</small><blockquote id="dlg-q">{L.pk(p, 'q') || ''}</blockquote><p id="dlg-st">{L.pk(p, 'st')}</p></> : null}</div>
        <dl id="dlg-dl" hidden={!(p.y || L.fmtSize(p) || L.pk(p, 'm'))}><Fact k="lb_year" v={p.y}/><Fact k="lb_size" v={L.fmtSize(p)}/><Fact k="lb_medium" v={L.pk(p, 'm')} cls="w"/></dl>
        <div className="dlg-deal" hidden={!isSample(A)}><Resonate A={A} k={k} key={k}/></div>
        <div className="dlg-nav"><button type="button" id="dlg-prev" aria-label={t('w_prev')} disabled={k === 0} onClick={() => show(k - 1)}>←</button>
          <div className="dlg-th" id="dlg-th">{A.pieces.map((q, j) => <button key={j} type="button" className={'th' + (j === k ? ' on' : '')} data-th={j} style={{'--art': artBg(A.works, j)}} aria-label={L.titleL(q)} aria-current={j === k ? 'true' : undefined} onClick={() => show(j)}><ArtImg a={A} k={j}/></button>)}</div>
          <button type="button" id="dlg-next" aria-label={t('w_next')} disabled={k === n - 1} onClick={() => show(k + 1)}>→</button><span className="dlg-cnt" id="dlg-cnt">{k + 1} / {n}</span></div>
      </div>
    </div>
    <Concept A={A} p={p}/>
    <div className="dlg-bar" id="dlg-bar" hidden={!canDonate(A)}><small className="dlg-paynote" id="dlg-supn">{t('dlg_supn')}</small>
      <button type="button" className="btn pk" id="dlg-sup" data-support={A.id} data-for={L.titleL(p)} data-quiet="" hidden={!canDonate(A)} onClick={() => openDonate(A, 0, k)}>{t('pf_supb', {a: L.nameL(A)})}</button></div>
    <div className="cdlg-foot" aria-hidden="true"></div>
  </dialog>, document.body);
}
