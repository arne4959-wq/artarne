/* studio.html / studio-<id>.html — the artist's building: their pictures in a private museum hall (components/Hall.jsx), the artwork window (WorkDialog.jsx).
   From cutaway.html + museum.js. Donation-only: the window offers "Donate · inspired by this work" (to the artist) and a Resonated button, nothing to buy.
   Not ported: the cut-open tower of ?floors (it was only the fallback before the hall) and its pixel punks (pixel-punks.js worked on that tower only). */
import {useCallback, useEffect, useRef, useState} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import {ARTISTS, artistById} from '../lib/art.js';
import {reduce} from '../lib/env.js';
import {hasHall} from '../lib/hall.js';
import PageShell from '../components/PageShell.jsx';
import Nav, {MENU_FULL} from '../components/Nav.jsx';
import {MiniFoot, NotFoundSection} from '../components/Bits.jsx';
import {Fab, ShareFoot, SkipLink} from '../components/Ux.jsx';
import {Ransom} from '../components/art.jsx';
import {ScLink} from '../components/Dist.jsx';
import {ZoomProvider} from '../components/Zoom.jsx';
import Hall from '../components/Hall.jsx';
import WorkDialog from '../components/WorkDialog.jsx';
import sprite from 'virtual:circles/sprite/cutaway';
import styles from '../styles/studio.js';

/* a block that slides in when it scrolls into view (class "reveal", then "in"); reduced motion and pre-built pages show it at once */
function Rv({el: Tag = 'div', i, className = '', now, children, ...rest}) {
  const ref = useRef(null), [on, setOn] = useState(now || reduce || !('IntersectionObserver' in window));
  useEffect(() => {
    if (on) return;
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { setOn(true); io.disconnect(); } }), {threshold: .15});
    io.observe(ref.current); return () => io.disconnect();
  }, [on]);
  return <Tag ref={ref} className={`${className} reveal${on ? ' in' : ''}`.trim()} style={{'--i': i}} {...rest}>{children}</Tag>;
}

const touchMq = typeof matchMedia === 'function' ? matchMedia('(max-width:700px),(pointer:coarse)') : {matches: false};
function useTouch() {
  const [touch, setTouch] = useState(touchMq.matches);
  useEffect(() => { const f = () => setTouch(touchMq.matches); touchMq.addEventListener?.('change', f); return () => touchMq.removeEventListener?.('change', f); }, []);
  return touch;
}

function Head({A, idx, now}) {
  const L = useLang(), {t} = L, [open, setOpen] = useState(false), touch = useTouch(), hall = hasHall(A);
  const hint = hall ? (touch ? 'hint_swipe' : 'mus_hint') : 'cw_hint';   // arrow keys on a desktop, swiping on a phone or touch screen
  return <header className="cut-head">
    <div className="bc bc-dark" role="navigation" aria-label={t('bc_aria')}><ol><li><a href="index.html#city">{t('bc_city')}</a></li><li aria-current="page"><span>{L.nameL(A)}</span></li></ol></div>
    <Rv i={1} className="kicker" now={now}>NO.{String(idx + 1).padStart(2, '0')} · {L.bldgL(A)}{A.wave ? ' · ★ ' + t('wave') : ''}</Rv>
    <Rv el={Ransom} as="h1" text={L.nameL(A)} seed={idx} i={2} className="rn" id="rn-title" aria-label={L.nameL(A)} now={now}/>
    <Rv i={3} className="est" now={now}><span>{t('cw_est', {y: A.since})}</span></Rv>
    <Rv i={3} className="meta" now={now}>{t('cw_meta', {d: L.discL(A), y: A.since, c: L.cityL(A)})}</Rv>
    <Rv el="p" i={4} className={'bio' + (open ? ' open' : '')} id="cut-bio" now={now}>{L.pk(A, 'bio')}</Rv>
    <button type="button" className="more" id="cut-more" aria-controls="cut-bio" aria-expanded={open} onClick={() => setOpen(o => !o)}>{t(open ? 'bio_less' : 'bio_more')}</button>
    <Rv i={5} className="hint" now={now} data-t={hint}>{t(hint)}</Rv>
  </header>;
}

function StudioBody({A, pre}) {
  const L = useLang(), {t} = L, idx = ARTISTS.indexOf(A), n = A.pieces.length;
  const prev = ARTISTS[(idx + ARTISTS.length - 1) % ARTISTS.length], next = ARTISTS[(idx + 1) % ARTISTS.length];
  const [cur, setCur] = useState(0), [openK, setOpenK] = useState(null), last = useRef(0);
  const go = useCallback(k => setCur(c => (k < 0 || k >= n || k === c) ? c : k), [n]);
  const url = k => { try { const u = new URL(location.href); if (k == null) u.searchParams.delete('work'); else u.searchParams.set('work', k); history.replaceState(null, '', u); } catch (e) { /* no history */ } };
  /* the hall follows the window: opening or paging the window moves the camera to that work */
  const openWork = useCallback(k => { if (k < 0 || k >= n) return; last.current = k; setCur(k); setOpenK(k); url(k); }, [n]);
  const closed = useCallback(() => { setOpenK(null); url(null); }, []);
  useEffect(() => {   // ?work=2 opens that work (a short pause lets the page settle first)
    const w = new URLSearchParams(location.search).get('work');
    if (w === null || !/^\d+$/.test(w) || +w >= n) return;
    const id = setTimeout(() => openWork(+w), reduce ? 0 : 700); return () => clearTimeout(id);
  }, [A.id, n, openWork]);
  const showK = openK ?? last.current;
  return <>
    <Head A={A} idx={idx} now={pre}/>
    <div className={'tower-wrap' + (hasHall(A) ? ' mus-on' : '')}>
      {hasHall(A) && <Hall A={A} cur={Math.min(cur, n - 1)} go={go} openWork={openWork}/>}
      <div className="tower-foot"><span>{t('cw_section')}</span><a className="btn pk" href="index.html#city">{t('cw_back')}</a></div>
      <div className="snav" role="navigation" aria-label="studios">
        <a className="sn prev" href={`studio-${prev.id}.html`}><small>{t('cw_prev')}</small><b>{L.nameL(prev)}</b><span>{L.discL(prev)}</span></a>
        <a className="sn next" href={`studio-${next.id}.html`}><small>{t('cw_next')}</small><b>{L.nameL(next)}</b><span>{L.discL(next)}</span></a>
      </div>
    </div>
    {hasHall(A) && <WorkDialog A={A} k={showK} open={openK != null} show={openWork} onClosed={closed}/>}
  </>;
}

export default function Studio({id}) {
  const L = useLang(), {t} = L, A = artistById(id || 'napha');
  usePageMeta(...(A ? [t('title_cw', {a: L.nameL(A)}), t('desc_cw', {a: L.nameL(A), d: L.discL(A)})] : [t('nf_h') + ' — circles', t('nf_p')]));
  useEffect(() => { document.body.classList.add('noir'); return () => document.body.classList.remove('noir'); }, []);
  const pre = /\/studio-[a-z0-9-]+\.html$/i.test(location.pathname) && !!A;   // the pre-built twin (studio-<id>.html): shown at once, no slide-in
  return <PageShell styles={styles} sprite={sprite} lead={<SkipLink/>}>
    <ZoomProvider>
      <Nav links={[['index.html#city', 'nav_city'], ['index.html#manifesto', 'nav_about']]} menu={MENU_FULL}/>
      <main id="main" tabIndex={-1} {...(pre ? {'data-pre': '1', 'data-studio': A.id} : {})}>{A ? <StudioBody key={A.id} A={A} pre={pre}/> : <NotFoundSection/>}</main>
      <MiniFoot/><div className="foot-tools">{A && <ShareFoot/>}<ScLink/></div>
      {A && <Fab A={A}/>}
    </ZoomProvider>
  </PageShell>;
}
