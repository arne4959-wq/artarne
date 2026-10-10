/* TEMPORARY check page for step 2 of the migration (data, strings, helpers, CSS are wired up).
   The real pages replace this in the next steps. */
import {useState} from 'react';
import {useLang, Tx} from './lib/i18n.jsx';
import {LANG_NEXT, LANG_BTN, LANG_NAME} from './lib/lang.js';
import {ARTISTS, artBg} from './lib/art.js';
import {usePageStyles} from './lib/pageStyle.js';
import {Ransom, Stamp, StatusChip, ArtImg} from './components/art.jsx';
import home from './styles/home.js';
import studio from './styles/studio.js';
import buy from './styles/buy.js';
import profile from './styles/profile.js';
import join from './styles/join.js';
import privacy from './styles/privacy.js';
import terms from './styles/terms.js';
import notFound from './styles/notFound.js';

const PAGES = {home, studio, buy, profile, join, privacy, terms, notFound};

export default function App() {
  const L = useLang(), nx = LANG_NEXT[L.lang];
  const [page, setPage] = useState('home');
  usePageStyles(PAGES[page]);
  return (
    <main id="migration-check" style={{padding: '24px 16px', maxWidth: 1100, margin: '0 auto'}}>
      <p>
        <button id="lang" className="lang" type="button" lang={nx} aria-label={`${LANG_BTN[nx]} — ${LANG_NAME[nx]}`} onClick={() => L.setLang(nx)}>{LANG_BTN[nx]}</button>
        {' '}
        <label>page CSS <select id="page-css" value={page} onChange={e => setPage(e.target.value)}>
          {Object.keys(PAGES).map(p => <option key={p}>{p}</option>)}
        </select></label>
        {' '}<small>({PAGES[page].length} style blocks)</small>
      </p>
      <Ransom as="h1" id="hl" text={L.t('hero_hl1')} seed={1} wrap/>
      <Tx as="p" k="hero_lead"/>
      <Tx as="p" k="consent_form" html/>
      <ul id="artists" style={{listStyle: 'none', padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))'}}>
        {ARTISTS.map(a => a.pieces.map((p, k) => (
          <li key={a.id + k} data-id={`${a.id}-${k}`} style={{background: 'var(--paper,#F4F1E8)', border: '2px solid #0E0D0C', padding: 8}}>
            <div style={{position: 'relative', aspectRatio: p.ar, background: artBg(a.works, k), overflow: 'hidden'}}>
              <ArtImg a={a} k={k}/><Stamp p={p}/>
            </div>
            <b className="ti">{L.titleL(p)}</b> <StatusChip p={p}/><br/>
            <span className="by">{L.bldgL(a)} · {L.discL(a)} · {L.cityL(a)}</span><br/>
            <span className="pr" dangerouslySetInnerHTML={{__html: L.moneyHtml(p.p, p)}}/> · <span className="sz">{L.fmtSize(p)}</span>
          </li>
        )))}
      </ul>
    </main>
  );
}
