/* WorkDialog.jsx — the artwork window of a studio page (fillDlg() of cutaway.html): the picture, "In the artist's words" with the
   "written by the artist" stamp, the details, the concept, a Resonated button and the quiet Donate link. A small concrete room: a riveted beam on
   top with the room number like a floor sign, the picture with tape, a hazard-stripe footing (same parts as the other windows, see Dialogs.jsx).
   Donations go to the artist only (this work is named as the inspiration); there is no shop here. */
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useLang} from '../lib/i18n.jsx';
import {esc} from '../lib/lang.js';
import {artBg} from '../lib/art.js';
import {canDonate} from '../lib/donate.js';
import {resMine, resCount, resToggle} from '../lib/places.js';
import {ArtImg} from './art.jsx';
import {useDialogs} from './Dialogs.jsx';
import {ZoomBtn} from './Zoom.jsx';

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

/* the "Resonated" button: the count is sample data plus this browser's own tap */
function Resonate({A, k}) {
  const {t} = useLang(), [, tick] = useState(0), on = resMine(A.id, k);
  return <button type="button" className="res-btn" id="dlg-res" aria-pressed={on} onClick={() => { resToggle(A.id, k); tick(n => n + 1); }}>
    <span aria-hidden="true">♥</span> {t(on ? 'res_on' : 'res_btn')} <b>{resCount(A.id, k)}</b></button>;
}

/* k = the work shown; open = whether the window is on screen (the page owns both: the hall moves with it) */
export default function WorkDialog({A, k, open, show, onClosed}) {
  const L = useLang(), {t} = L, {openDonate} = useDialogs(), ref = useRef(null), p = A.pieces[k], n = A.pieces.length;
  useEffect(() => { const d = ref.current; if (open && !d.open) d.showModal(); else if (!open && d.open) d.close(); }, [open]);
  const vh = !!(L.pk(p, 'say') || L.pk(p, 'why') || L.pk(p, 'look'));
  const [aw, ah] = p.ar.split('/').map(Number);
  return createPortal(<dialog className="work-dlg" id="dlg" aria-labelledby="dlg-t" ref={ref} onClose={onClosed}
    onClick={e => { if (e.target === ref.current) ref.current.close(); }}
    onKeyDown={e => { if (e.key === 'ArrowLeft' && k > 0) show(k - 1); if (e.key === 'ArrowRight' && k < n - 1) show(k + 1); }}>
    <div className="cdlg-h wd-h"><div className="cdlg-t"><h2 id="dlg-t">{L.titleL(p)}</h2></div>
      <div className="cdlg-fl wd-room" id="dlg-fl" aria-hidden="true"><small>{t('room_k')}</small><b>0{k + 1}</b></div>
      <button type="button" className="cdlg-x" id="dlg-x" data-t-aria="close" aria-label={t('close')} onClick={() => ref.current.close()}>✕</button></div>
    <div className="dlg-in">
      <div className="dlg-art"><div className="frame zoom-host" id="dlg-frame" style={{'--ar': p.ar, '--art': artBg(A.works, k), '--arn': String(+(aw / ah).toFixed(4))}}>
        {p.img ? <><i className="dlg-tape" aria-hidden="true"></i><ArtImg a={A} k={k}/><ZoomBtn/></> : null}</div></div>
      <div className="dlg-body">
        <p className="dlg-by" id="dlg-by" dangerouslySetInnerHTML={{__html: t('d_by', {a: esc(L.nameL(A)), d: esc(L.discL(A)), c: esc(L.cityL(A))})}}/>
        <div id="dlg-voice"><Voice A={A} p={p}/></div>
        <div className="dlg-story" id="dlg-story" hidden={!p.st || vh}>{p.st && !vh ? <><small id="dlg-sk">{t('d_story')}</small><blockquote id="dlg-q">{L.pk(p, 'q') || ''}</blockquote><p id="dlg-st">{L.pk(p, 'st')}</p></> : null}</div>
        <dl id="dlg-dl"><div><dt>{t('lb_year')}</dt><dd>{p.y}</dd></div><div><dt>{t('lb_size')}</dt><dd>{L.fmtSize(p)}</dd></div><div className="w"><dt>{t('lb_medium')}</dt><dd>{L.pk(p, 'm')}</dd></div></dl>
        <div className="dlg-deal">
          <button type="button" className="dlg-don" id="dlg-sup" data-support={A.id} data-for={L.titleL(p)} data-quiet="" hidden={!canDonate(A)} onClick={() => openDonate(A, 0, k)}>{t('don_work')}</button>
          <Resonate A={A} k={k} key={k}/><small className="dlg-paynote" id="dlg-supn">{t('dlg_supn')}</small></div>
        <div className="dlg-nav"><button type="button" id="dlg-prev" aria-label={t('w_prev')} disabled={k === 0} onClick={() => show(k - 1)}>←</button>
          <div className="dlg-th" id="dlg-th">{A.pieces.map((q, j) => <button key={j} type="button" className={'th' + (j === k ? ' on' : '')} data-th={j} style={{'--art': artBg(A.works, j)}} aria-label={L.titleL(q)} aria-current={j === k ? 'true' : undefined} onClick={() => show(j)}><ArtImg a={A} k={j}/></button>)}</div>
          <button type="button" id="dlg-next" aria-label={t('w_next')} disabled={k === n - 1} onClick={() => show(k + 1)}>→</button><span className="dlg-cnt" id="dlg-cnt">{k + 1} / {n}</span></div>
      </div>
    </div>
    <Concept A={A} p={p}/>
    <div className="cdlg-foot" aria-hidden="true"></div>
  </dialog>, document.body);
}
