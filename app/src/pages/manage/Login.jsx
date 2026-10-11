/* Login.jsx — the concrete door. Invite only: no sign-up button. The e-mail gets a one-time link (magic link). */
import {useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {Ransom} from '../../components/art.jsx';
import {isEmail} from '../../lib/manage.js';
import {supabase, supabaseReady} from '../../lib/supabase.js';

export default function Login({linkBad = false}) {
  const mt = useMt();
  const [email, setEmail] = useState(''), [phase, setPhase] = useState('idle'), [err, setErr] = useState(linkBad ? 'lg_link_bad' : '');

  async function submit(e) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!isEmail(em)) { setErr('lg_bad'); return; }
    setErr(''); setPhase('sending');
    const {error} = await supabase().auth.signInWithOtp({email: em, options: {shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname}});
    // Not invited = Supabase refuses, and we still say "sent": the page must not tell strangers which e-mails are artists.
    if (error && (error.status === 429 || /rate|too many|seconds/i.test(error.message || ''))) { setErr('lg_wait'); setPhase('idle'); return; }
    if (error && !error.status) { setErr('lg_net'); setPhase('idle'); return; }   // no HTTP status = the request never arrived
    setPhase('sent');
  }

  return <main id="main" className="mg-wall">
    <div className="mg-tag" aria-hidden="true">CIRCLES</div>
    <section className="mg-door in" aria-labelledby="mg-title">
      <div className="mg-hazard" aria-hidden="true"></div>
      <span className="mg-bolt a" aria-hidden="true"></span><span className="mg-bolt b" aria-hidden="true"></span>
      <span className="mg-bolt c" aria-hidden="true"></span><span className="mg-bolt d" aria-hidden="true"></span>
      <div className="mg-kick">{mt('lg_kick')}</div>
      <div className="mg-stamp" aria-hidden="true">{mt('lg_stamp')}</div>
      <Ransom as="h1" className="rn" id="mg-title" aria-label={mt('lg_aria')} text={mt('lg_title')} seed={3} wrap/>
      {!supabaseReady ? <p className="mg-bad" role="alert">{mt('lg_setup')}</p>
        : phase === 'sent' ? <div className="mg-sent" role="status">
            <h2>{mt('lg_sent_h')}</h2><p>{mt('lg_sent_p')}</p>
            <button type="button" className="btn ghost" onClick={() => { setPhase('idle'); setEmail(''); }}>{mt('lg_again')}</button>
          </div>
        : <form onSubmit={submit} noValidate>
            <p className="mg-sub">{mt('lg_sub')}</p>
            {err === 'lg_link_bad' && <p className="mg-bad" role="alert">{mt(err)}</p>}
            <label className="mg-field"><span>{mt('lg_email')}</span>
              <input className="mg-slot" type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck="false" required
                value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.com" aria-invalid={err && err !== 'lg_link_bad' ? 'true' : undefined}/></label>
            {err && err !== 'lg_link_bad' && <p className="mg-err" role="alert">{mt(err)}</p>}
            <button type="submit" className="btn mg-go" disabled={phase === 'sending'}>{phase === 'sending' ? mt('lg_sending') : mt('lg_btn')}</button>
          </form>}
      <p className="mg-nokey"><span>{mt('lg_nokey')}</span> <a href="join.html">{mt('lg_join')}</a></p>
    </section>
  </main>;
}
