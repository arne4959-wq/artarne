/* Dashboard.jsx — the control room: finds the artist's building (artists.user_id = the signed-in user), then three tabs. */
import {useCallback, useEffect, useState} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';
import ProfilePanel from './ProfilePanel.jsx';
import WorksPanel from './WorksPanel.jsx';
import PaymentPanel from './PaymentPanel.jsx';
import OrdersPanel from './OrdersPanel.jsx';

const TABS = [['profile', 'tab_profile'], ['works', 'tab_works'], ['orders', 'tab_orders'], ['pay', 'tab_pay']];

export default function Dashboard({session, signOut}) {
  const mt = useMt(), {lang} = useLang();
  const [st, setSt] = useState({phase: 'loading'}), [tab, setTab] = useState('works');
  const [fresh, setFresh] = useState(0), uid = session.user.id;   // fresh = payment notices waiting for the artist
  const load = useCallback(async () => {
    setSt({phase: 'loading'});
    const {data, error} = await supabase().from('artists').select('*').eq('user_id', uid).maybeSingle();
    setSt(error ? {phase: 'fail'} : data ? {phase: 'ok', artist: data} : {phase: 'none'});
  }, [uid]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {   // the badge on the Payments tab, before the tab is opened
    if (!st.artist) return;
    supabase().from('payment_notices').select('id', {count: 'exact', head: true}).eq('artist_id', st.artist.id).eq('status', 'new').then(({count}) => setFresh(count || 0));
  }, [st.artist]);

  const artist = st.artist, name = artist ? (lang === 'en' && artist.name_en) || (lang === 'lo' && artist.name_lo) || artist.name : '';
  return <>
    <header className="mg-room">
      <div className="mg-kick2">{mt('dash_kick')}</div>
      <h1>{artist ? mt('dash_hi', {a: name}) : session.user.email}</h1>
      <div className="mg-out"><button type="button" className="btn" onClick={signOut}>{mt('out')}</button></div>
    </header>
    <main id="main" className="mg-shell">
      {st.phase === 'loading' && <p role="status" className="mg-status">{mt('loading')}</p>}
      {st.phase === 'fail' && <div className="mg-bad" role="alert">{mt('load_fail')} <button type="button" className="mg-mini" style={{width: 'auto', marginLeft: '.6rem'}} onClick={load}>{mt('reload')}</button></div>}
      {st.phase === 'none' && <section className="mg-panel"><h2>{mt('nb_h')}</h2><p>{mt('nb_p', {e: session.user.email})}</p></section>}
      {artist && <>
        {!artist.approved && <p className="mg-note" role="status">{mt('hidden')}</p>}
        {artist.demo && <p className="mg-note warn">{mt('demo')}</p>}
        <div className="mg-tabs" role="tablist">
          {TABS.map(([k, label]) => <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`pan-${k}`} className="mg-tab" onClick={() => setTab(k)}>{mt(label)}{k === 'orders' && fresh > 0 && <b className="mg-badge" aria-label={String(fresh)}>{fresh}</b>}</button>)}
        </div>
        <div role="tabpanel" id={`pan-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'profile' && <ProfilePanel artist={artist} onSaved={a => setSt({phase: 'ok', artist: a})}/>}
          {tab === 'works' && <WorksPanel artist={artist}/>}
          {tab === 'orders' && <OrdersPanel artist={artist} onCount={setFresh}/>}
          {tab === 'pay' && <PaymentPanel artist={artist} userEmail={session.user.email}/>}
        </div>
      </>}
    </main>
  </>;
}
