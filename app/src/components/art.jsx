/* art.jsx — the small markup helpers of circles.js (ransom, artImg) as components */
import {Fragment} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {RS, ROT, YOFF, graphemes} from '../lib/art.js';

/* OLD_QUOTE_BUG: the old ransom() wrote font-family:"Special Elite" inside style="…", so the quote ended the attribute
   and those chips never got their font (or weight): they show the heading's font instead. Kept on purpose so the
   React pages look exactly like the old ones; set it to false to get the Special Elite chips that were intended. */
export const OLD_QUOTE_BUG = true;
function Chip({c, i, seed}) {
  const st = RS[(i + seed) % RS.length], k = (i * 3 + seed) % ROT.length, tl = /[\u0E00-\u0EFF]/.test(c);   // tl: a Thai or Lao letter: taller tile (.tl) and the font that places stacked marks best
  const font = tl ? {fontFamily: st.ff === 'Chonburi' ? 'Chonburi,IBM Plex Sans Thai,var(--lao)' : 'IBM Plex Sans Thai,var(--lao)', fontWeight: st.ff === 'Chonburi' ? (st.w || 400) : 700}
    : OLD_QUOTE_BUG && st.ff.includes('"') ? {} : {fontFamily: st.ff, fontWeight: st.w || 400};
  return <span className={/^\s+$/.test(c) ? 'sp' : tl ? 'tl' : undefined}
    style={{'--r': ROT[k] + 'deg', '--y': YOFF[k] + 'px', '--k': i, background: st.bg, color: st.fg, ...font}}>{c}</span>;
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

export function ArtImg({a, k}) {
  const {titleL} = useLang(), p = a.pieces[k];
  return p.img ? <img src={p.img} alt={titleL(p)} loading="lazy" decoding="async" draggable="false"/> : null;
}
