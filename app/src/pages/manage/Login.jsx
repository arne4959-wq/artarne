/* Login.jsx — the concrete door. Invite only: no sign-up button. The e-mail gets a one-time link (magic link). */
import {useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {Ransom} from '../../components/art.jsx';
import {isEmail} from '../../lib/manage.js';
import {supabase, supabaseReady} from '../../lib/supabase.js';

/* floating shapes behind the door: [shape, left %, top %, size px, colour token, tilt deg, float seconds, delay seconds] */
const BITS = [
  ['star', 6, 14, 30, 'pink', 12, 7, 0], ['dot', 14, 64, 18, 'gold', 0, 6, 1.2], ['ring', 4, 40, 34, 'paper', 0, 9, .4], ['plus', 22, 86, 24, 'tartan-red', 15, 8, 2],
  ['tri', 11, 24, 26, 'gold', -14, 8, 1.6], ['dot', 27, 8, 14, 'tartan-red', 0, 7, .8], ['sq', 17, 48, 16, 'pink', 25, 6.5, 2.4], ['star', 30, 70, 20, 'paper', -10, 9, 3],
  ['star', 93, 18, 26, 'gold', -8, 8, .6], ['ring', 88, 56, 30, 'pink', 0, 7, 1.8], ['dot', 95, 78, 20, 'paper', 0, 6, .2], ['plus', 80, 10, 22, 'pink', 20, 9, 2.2],
  ['tri', 84, 82, 28, 'tartan-red', 16, 7.5, 1], ['sq', 90, 36, 14, 'gold', -20, 6.5, 2.8], ['dot', 73, 28, 16, 'pink', 0, 8, 3.4], ['plus', 76, 66, 18, 'gold', -12, 7, 1.4],
];
const Bits = () => <div className="mg-conf" aria-hidden="true">
  {BITS.map(([k, x, y, z, c, r, d, w], i) => <i key={i} className={'b-' + k} style={{left: x + '%', top: y + '%', '--z': z + 'px', '--c': `var(--${c})`, '--r': r + 'deg', '--t': d + 's', '--w': w + 's'}}/>)}
</div>;

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
    <Bits/>
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
