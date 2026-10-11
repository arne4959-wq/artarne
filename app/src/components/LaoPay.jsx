/* LaoPay — on a buy page: pay the artist straight through their LAO QR, then tell them ("I have paid").
   Shows only when the artist has put payment details into Supabase (manage.html → Get paid) and the work has no pay link of its own.
   circles never holds the money: the buyer transfers to the artist, the artist checks their bank app and presses "Money received". */
import {useEffect, useState} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {useMt} from '../lib/manageStrings.js';
import {fetchPayment, sendNotice, slipFromFile} from '../lib/payment.js';
import {useWiredForm, captchaOn, Turnstile} from './Dialogs.jsx';
import {useToast} from './Toast.jsx';
import {usePageStyles} from '../lib/pageStyle.js';
import laoStyles from '../styles/lao.js';
import {BT, H, Cell} from './Bits.jsx';

/* looks the artist's payment details up; draws nothing (and adds no CSS) for an artist who has none */
export default function LaoPay({A, k, p}) {
  const [pay, setPay] = useState(null);
  useEffect(() => { let live = true; fetchPayment(A.id).then(x => { if (live) setPay(x); }); return () => { live = false; }; }, [A.id]);
  return pay ? <LaoPayBlock A={A} k={k} p={p} pay={pay}/> : null;
}

function LaoPayBlock({A, k, p, pay}) {
  const L = useLang(), mt = useMt(), toast = useToast();
  usePageStyles(laoStyles);
  const [done, setDone] = useState(false), [err, setErr] = useState(''), [round, setRound] = useState(0);
  const {submit, busy} = useWiredForm(async f => {
    setErr('');
    let slip = null;
    const file = f.slip && f.slip.size ? f.slip : null;
    if (file) { try { slip = await slipFromFile(file); } catch (e) { setErr('lp_e_slip'); return; } }
    const r = await sendNotice({artist_id: A.id, position: k, buyer_name: f.name, buyer_email: f.email, ship_to: f.ship_to, message: f.message, captcha: f['cf-turnstile-response'] || '', slip});
    if (r.ok) setDone(true); else { setErr('lp_e_' + (['captcha', 'sold', 'busy', 'rate', 'not_found', 'bad_field'].includes(r.error) ? r.error : 'net')); setRound(n => n + 1); }
  });
  const kip = L.kip(p.p, p), usd = L.usdText(p.p);
  const copy = async () => { try { await navigator.clipboard.writeText(pay.account_no); toast(mt('lp_copied')); } catch (e) { toast(L.t('copy_fail')); } };
  return <section className="by-card by-lao" id="by-lao" aria-labelledby="by-h-lao">
    <H id="by-h-lao" text={mt('lp_h')} c="y"/>
    <ol className="lp-steps">{['lp_s1', 'lp_s2', 'lp_s3'].map(s => <li key={s}>{mt(s)}</li>)}</ol>
    <div className="lp-grid">
      <div className="lp-pay">
        {pay.qrUrl && <img className="lp-qr" src={pay.qrUrl} alt={mt('lp_qr_alt')} decoding="async" draggable="false"/>}
        <div className="lp-amount"><span>{mt('lp_amount')}</span><b>{kip || usd}</b>{kip && <small>{usd}</small>}</div>
        {pay.bank && <Cell l={mt('lp_bank')}>{pay.bank}</Cell>}
        {pay.account_name && <Cell l={mt('lp_name')}>{pay.account_name}</Cell>}
        {pay.account_no && <Cell l={mt('lp_no')}><span className="lp-no">{pay.account_no}</span> <button type="button" className="by-btn by-ghost lp-copy" onClick={copy}><BT>{mt('lp_copy')}</BT></button></Cell>}
        <p className="by-note">{mt('lp_safe')}</p>
      </div>
      <div className="lp-form">
        {done ? <div className="by-done" role="status"><b>{mt('lp_done_h')}</b><p>{mt('lp_done_p')}</p></div> : <>
          <h3 className="lp-h3">{mt('lp_form_h')}</h3>
          <form className="by-form" key={round} onSubmit={submit}>
            <div className="by-two"><label className="by-fld">{L.t('id_name')}<input name="name" required maxLength={80} autoComplete="name"/></label>
              <label className="by-fld">{L.t('id_email')}<input name="email" type="email" required maxLength={120} autoComplete="email"/></label></div>
            <label className="by-fld">{L.t('by_country')}<input name="ship_to" maxLength={300} autoComplete="street-address"/></label>
            <label className="by-fld">{mt('lp_slip')}<input name="slip" type="file" accept="image/jpeg,image/png,image/webp"/></label>
            <label className="hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
            <p className="by-note" dangerouslySetInnerHTML={{__html: L.t('consent_form')}}/>
            {captchaOn() && <Turnstile/>}
            {err && <p className="lp-err" role="alert">{mt(err)}</p>}
            <div className="act"><button className="by-btn by-pay" type="submit" disabled={busy}><BT>{busy ? mt('lp_sending') : mt('lp_send')}</BT></button></div>
          </form></>}
      </div>
    </div>
  </section>;
}
