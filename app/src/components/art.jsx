/* art.jsx — the small markup helpers of circles.js (ransom, stampHtml, statusChip, artImg) as components */
import {Fragment} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {RS, ROT, YOFF, graphemes, workStatus} from '../lib/art.js';

function Chip({c, i, seed}) {
  const st = RS[(i + seed) % RS.length], k = (i * 3 + seed) % ROT.length;
  return <span className={/^\s+$/.test(c) ? 'sp' : undefined}
    style={{'--r': ROT[k] + 'deg', '--y': YOFF[k] + 'px', '--k': i, background: st.bg, color: st.fg, fontFamily: st.ff, fontWeight: st.w || 400}}>{c}</span>;
}

/* <Ransom as="h2" text="..." seed={2} wrap/> — wrap: every WORD is one unbreakable unit (.rw is nowrap);
   words are split on spaces or on U+200B, the invisible break mark that Thai text needs */
export function Ransom({text, seed = 0, wrap = false, as: Tag = 'span', ...rest}) {
  if (!wrap) return <Tag {...rest}>{graphemes(text).map((c, i) => <Chip key={i} c={c} i={i} seed={seed}/>)}</Tag>;
  let i = 0;
  return <Tag {...rest}>{text.split(/(\s+|​)/).filter(Boolean).map((tok, n) => {
    if (tok === '​') return null;
    const chips = graphemes(tok).map(c => { const k = i++; return <Chip key={k} c={c} i={k} seed={seed}/>; });
    return /^\s+$/.test(tok) ? <Fragment key={n}>{chips}</Fragment> : <span key={n} className="rw">{chips}</span>;
  })}</Tag>;
}

export function Stamp({p}) {
  const {t} = useLang(), s = workStatus(p);
  return s ? <i className={`stamp ${s}`}>{t(s === 'sold' ? 'st_sold' : 'st_res')}</i> : null;
}

export function StatusChip({p}) {
  const {t} = useLang(), s = workStatus(p);
  return s ? <span className={`chip ${s}`}>{t(s === 'sold' ? 'st_sold' : 'st_res')}</span> : null;
}

export function ArtImg({a, k}) {
  const {titleL} = useLang(), p = a.pieces[k];
  return p.img ? <img src={p.img} alt={titleL(p)} loading="lazy" decoding="async" draggable="false"/> : null;
}
