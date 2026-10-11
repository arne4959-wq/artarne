/* Login.jsx — the concrete door. Invite only: no sign-up button. The e-mail gets a one-time link (magic link). */
import {useEffect, useRef, useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {Ransom} from '../../components/art.jsx';
import {isEmail} from '../../lib/manage.js';
import {supabase, supabaseReady} from '../../lib/supabase.js';
import {reduce} from '../../lib/env.js';
import {Wall, WallNear, Bird, useWallMotion} from './Wall.jsx';
import KeyBurst from './KeyBurst.jsx';

export default function Login({linkBad = false}) {
  const mt = useMt();
  const [email, setEmail] = useState(''), [phase, setPhase] = useState('idle'), [err, setErr] = useState(linkBad ? 'lg_link_bad' : '');
  const [focus, setFocus] = useState(false), [bump, setBump] = useState(0), wall = useRef(null), timer = useRef(0);
  useWallMotion(wall);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function submit(e) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!isEmail(em)) { setErr('lg_bad'); setBump(b => b + 1); return; }   // the bolts rattle and the stamp lands again
    setErr(''); setPhase('sending');
    const {error} = await supabase().auth.signInWithOtp({email: em, options: {shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname}});
    // Not invited = Supabase refuses, and we still say "sent": the page must not tell strangers which e-mails are artists.
    if (error && (error.status === 429 || /rate|too many|seconds/i.test(error.message || ''))) { setErr('lg_wait'); setPhase('idle'); return; }
    if (error && !error.status) { setErr('lg_net'); setPhase('idle'); return; }   // no HTTP status = the request never arrived
    if (reduce) { setPhase('sent'); return; }
    setPhase('opening');                                              // the key flies into the lock, then the message shows
    timer.current = setTimeout(() => setPhase('sent'), 1250);
  }

  const busy = phase === 'sending' || phase === 'opening';
  return <main id="main" ref={wall} className={'mg-wall' + (focus ? ' focus' : '')}>
    <Wall/>
    <section className={'mg-door in' + (phase === 'opening' ? ' opening' : '')} aria-labelledby="mg-title">
      <div className="mg-hazard" aria-hidden="true"></div>
      {['a', 'b', 'c', 'd'].map(k => <span key={k + bump} className={'mg-bolt ' + k + (bump ? ' re' : '')} aria-hidden="true"></span>)}
      <div className="mg-kick">{mt('lg_kick')}</div>
      <svg className="mg-pin" viewBox="0 0 64 28" fill="none" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
        <g stroke="var(--black)" transform="translate(3 3)"><path d="M14 8H50"/><path d="M14 20H46Q61 20 61 13.5Q61 8 50 8"/><circle cx="9" cy="14" r="6"/></g>
        <g stroke="var(--paper)"><path d="M14 8H50"/><path d="M14 20H46Q61 20 61 13.5Q61 8 50 8"/><circle cx="9" cy="14" r="6"/><rect x="44" y="3" width="14" height="10" rx="4" fill="var(--paper)" stroke="none"/></g></svg>
      <div key={'st' + bump} className={'mg-stamp' + (bump ? ' re' : '')} aria-hidden="true">{mt('lg_stamp')}</div>
      <Bird/>
      <KeyBurst open={phase === 'opening'}/>
      <p className="mg-sr" role="status">{phase === 'opening' || phase === 'sent' ? mt('lg_sent_h') : ''}</p>
      <Ransom as="h1" className="rn" id="mg-title" aria-label={mt('lg_aria')} text={mt('lg_title')} seed={3} wrap/>
      {!supabaseReady ? <p className="mg-bad" role="alert">{mt('lg_setup')}</p>
        : phase === 'sent' ? <div className="mg-sent">
            <h2>{mt('lg_sent_h')}</h2><p>{mt('lg_sent_p')}</p>
            <button type="button" className="btn ghost" onClick={() => { setPhase('idle'); setEmail(''); }}>{mt('lg_again')}</button>
          </div>
        : <form onSubmit={submit} noValidate>
            <p className="mg-sub">{mt('lg_sub')}</p>
            {err === 'lg_link_bad' && <p className="mg-bad" role="alert">{mt(err)}</p>}
            <label className="mg-field"><span>{mt('lg_email')}</span>
              <input className="mg-slot" type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck="false" required
                value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} disabled={busy}
                placeholder="you@studio.com" aria-invalid={err && err !== 'lg_link_bad' ? 'true' : undefined}/></label>
            {err && err !== 'lg_link_bad' && <p className="mg-err" role="alert">{mt(err)}</p>}
            <button type="submit" className="btn mg-go" disabled={busy}>{busy ? mt('lg_sending') : mt('lg_btn')}</button>
          </form>}
      <p className="mg-nokey"><span>{mt('lg_nokey')}</span> <a href="join.html">{mt('lg_join')}</a></p>
    </section>
    <WallNear/>
  </main>;
}
