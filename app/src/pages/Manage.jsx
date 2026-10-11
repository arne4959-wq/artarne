/* manage.html — where an invited artist signs in and looks after their own building (profile, works, getting paid).
   No old page: new in the React version. Data lives in Supabase (supabase/README.md). */
import {useEffect, useState} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import {useMt} from '../lib/manageStrings.js';
import {supabase, supabaseReady} from '../lib/supabase.js';
import PageShell from '../components/PageShell.jsx';
import Nav from '../components/Nav.jsx';
import sprite from 'virtual:circles/sprite/join';
import styles from '../styles/manage.js';
import Login from './manage/Login.jsx';
import Dashboard from './manage/Dashboard.jsx';

/* a magic link that failed (used already / expired) comes back as #error=…&error_description=… */
const linkFailed = () => /[#&?]error(_code|_description)?=/.test(location.hash + location.search);

export default function Manage() {
  const {lang} = useLang(), mt = useMt();
  const [session, setSession] = useState(supabaseReady ? undefined : null);   // undefined = still checking
  const [bad] = useState(linkFailed);
  usePageMeta(lang === 'en' ? 'Artist door — circles' : 'ประตูศิลปิน — circles', 'circles');
  useEffect(() => { document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex" data-manage>'); return () => document.head.querySelector('meta[data-manage]')?.remove(); }, []);
  useEffect(() => {
    if (!supabaseReady) return;
    const sb = supabase();
    const {data: sub} = sb.auth.onAuthStateChange((_event, s) => setSession(s));   // also fires when the link in the e-mail is opened
    sb.auth.getSession().then(({data}) => setSession(s => (s === undefined ? data.session : s)));
    return () => sub.subscription.unsubscribe();
  }, []);
  const signOut = async () => { await supabase().auth.signOut(); setSession(null); };

  return <PageShell styles={styles} sprite={sprite} lead={<a className="skip" href="#main">{mt('skip')}</a>}>
    <Nav links={[['index.html#city', 'nav_city']]}/>
    {session === undefined ? <main id="main" className="mg-wall"><p role="status" style={{font: '400 1.1rem var(--type)'}}>{mt('lg_checking')}</p></main>
      : session ? <Dashboard session={session} signOut={signOut}/>
      : <Login linkBad={bad}/>}
  </PageShell>;
}
