/* Dialogs.jsx — the form dialogs of circles.js (mountDialog, dlgShell, showDone, wireForm, mountTurnstile, openJoin, openDonate).
   useDialogs().openJoin() opens the join request from anywhere (the old onclick="openJoin()"); openDonate(A, usd?, k?) opens the donation dialog
   (amount -> QR + account -> "I've donated" notice -> thank-you; sample artists get a generated SAMPLE QR and nothing is sent).
   Same markup as before: <dialog id="dlg-join" class="cdlg"> in <body>, kept after closing. Inputs are uncontrolled
   (read with FormData on submit), like the old forms. */
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {CONFIG} from 'virtual:circles/config';
import {ARTISTS} from '../lib/art.js';
import {useLang} from '../lib/i18n.jsx';
import {deliver} from '../lib/forms.js';
import {useToast} from './Toast.jsx';
import {DON_AMOUNTS, MAX_AMOUNT, sampleMode, validAmount, sampleQrSvg, rememberSampleDonation, rememberSampleCircles} from '../lib/donate.js';
import {fetchPayment, sendDonation, slipFromFile} from '../lib/payment.js';

const DialogsCtx = createContext(null);
export const useDialogs = () => useContext(DialogsCtx);
export const captchaOn = () => !!(CONFIG.endpoint && CONFIG.turnstileSiteKey);

/* <dialog> in <body>; opens with showModal() whenever `seq` changes; a click on the backdrop closes it */
function Dialog({id, seq, children}) {
  const ref = useRef(null);
  useEffect(() => { const d = ref.current; if (d && seq && !d.open) d.showModal(); }, [seq]);
  return createPortal(<dialog ref={ref} id={id} className="cdlg" onClick={e => { if (e.target === ref.current) ref.current.close(); }}>{children}</dialog>, document.body);
}
const close = e => e.currentTarget.closest('dialog').close();

/* the lift-style floor sign in the beam: floor n of `of`, labelled by the string fl_<key> (the same markup as floorHtml() in circles.js) */
function Floor({n, of, label}) {
  const {t} = useLang();
  return <><div className="cdlg-fl" aria-hidden="true"><small>{t('fl_k')}</small><b>{n}<i>/{of}</i></b><span>{label}</span></div><span className="sr">{t('fl_sr', {n, m: of, s: label})}</span></>;
}
/* the window is a small concrete building: a riveted beam on top (name plate, floor sign, bolted close button), the room, a hazard-stripe footing (see dlgShell() in circles.js) */
function Head({title, html = false, floor = null}) {
  const {t} = useLang();
  return <div className="cdlg-h"><div className="cdlg-t">{html ? <h2 dangerouslySetInnerHTML={{__html: title}}/> : <h2>{title}</h2>}</div>
    {floor && <Floor n={floor[0]} of={floor[1]} label={t('fl_' + floor[2])}/>}
    <button type="button" className="cdlg-x" data-close="" aria-label={t('close')} onClick={close}>✕</button></div>;
}
const Body = ({children}) => <><div className="cdlg-b">{children}</div><div className="cdlg-foot" aria-hidden="true"/></>;

/* Support dialog: the bank QR of an artist (or of the site). Money goes straight to that account. */
function SupportDialog({info, who}) {
  const {t} = useLang(), [copied, setCopied] = useState(false);
  const row = (k, v) => v ? <div><dt>{t(k)}</dt><dd>{v}</dd></div> : null;
  return <><Head title={t('sup_qr_t', {a: who})}/>
    <Body><div className="sup-dlg">
      {info.sample && <p className="sup-sample" role="note">{t('sup_sample')}</p>}
      {info.qr && <img className="sup-qr" src={info.qr} alt={t('sup_qr_t', {a: who})} width="240" height="240"/>}
      <dl className="sup-dl">{row('sup_bank', info.bank)}{row('sup_acc_name', info.name)}{row('sup_acc_no', info.no)}</dl>
      <p className="note">{t('sup_direct', {a: who})}</p>
      <div className="act">
        {info.no && <button type="button" className="btn" onClick={async () => { try { await navigator.clipboard.writeText(info.no); setCopied(true); } catch (e) {} }}>{t(copied ? 'sup_copied' : 'sup_copy')}</button>}
        <button type="button" className="btn ghost" onClick={close}>{t('close')}</button>
      </div>
    </div></Body></>;
}

/* optional CAPTCHA (Cloudflare Turnstile): its script loads only when a site key is configured */
export function Turnstile() {
  const ref = useRef(null);
  useEffect(() => {
    const draw = () => window.turnstile && ref.current && window.turnstile.render(ref.current, {sitekey: CONFIG.turnstileSiteKey});
    if (window.turnstile) { draw(); return; }
    let s = document.getElementById('cf-ts');
    if (!s) { s = document.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; document.head.appendChild(s); }
    s.addEventListener('load', draw, {once: true});
  }, []);
  return <div className="cf-holder" ref={ref}/>;
}

/* the result view (showDone): sent, failed, or "your email app is opening" with a copyable message */
function Done({res, to}) {
  const {t} = useLang(), toast = useToast(), pre = useRef(null);
  const ok = res.mode === 'sent', fail = res.mode === 'fail';
  const copy = async () => {
    try { await navigator.clipboard.writeText(pre.current.textContent); toast(t('copied')); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(pre.current); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(t('copy_fail')); }
  };
  return <>
    <Head title={t(ok ? 'done_sent' : fail ? 'news_fail' : 'done_mail')}/>
    <Body><div className="cdlg-done" role="status"><p className="intro">{t(ok ? 'done_sent_p' : fail ? 'news_fail' : 'done_mail_p')}</p>
      {!ok && <><p className="note">{t('to_label')}: {to}</p><pre id="done-pre" ref={pre}>{res.body}</pre></>}
      <div className="act">{!ok && <button type="button" className="btn" data-copy="" onClick={copy}>{t('copy_msg')}</button>}<button type="button" className="btn ghost" data-close="" onClick={close}>{t('close')}</button></div>
    </div></Body>
  </>;
}

/* wireForm of circles.js as a hook: honeypot, CAPTCHA check, submit button disabled while sending.
   onSubmit(fields, form) runs only for a real, verified submit. */
export function useWiredForm(onSubmit) {
  const {t} = useLang(), toast = useToast(), [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.querySelector('.hp input')?.value) return;          // honeypot
    if (captchaOn() && !new FormData(form).get('cf-turnstile-response')) { toast(t('captcha_wait')); return; }
    setBusy(true);
    try { await onSubmit(Object.fromEntries(new FormData(form)), form); } finally { setBusy(false); }
  };
  return {submit, busy};
}

/* a dialog form, then the Done view */
function FormBody({title, sendKey, sendClass = 'btn', children, onSubmit}) {
  const {t} = useLang(), [done, setDone] = useState(null);
  const {submit, busy} = useWiredForm(async (f, form) => setDone(await onSubmit(f, form)));
  if (done) return <Done {...done}/>;
  return <>
    <Head title={title} html/>
    <Body><form onSubmit={submit}>
      {children}
      <label className="hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      <p className="note" dangerouslySetInnerHTML={{__html: t('consent_form')}}/>
      {captchaOn() && <Turnstile/>}
      <div className="act"><button className={sendClass} type="submit" disabled={busy}>{t(sendKey)}</button><button className="btn ghost" type="button" data-close="" onClick={close}>{t('jd_cancel')}</button></div>
      {!CONFIG.endpoint && <p className="note">{t('note_mailto')}</p>}
    </form></Body>
  </>;
}

/* "ขอมีตึก" — join request */
function JoinForm() {
  const L = useLang(), {t} = L;
  const discs = [...new Set(ARTISTS.map(a => a.disc))];
  return <FormBody title={t('jd_title')} sendKey="jd_send" onSubmit={async (f, form) => {
    const res = await deliver('join', CONFIG.contact, t('jd_subject', {n: f.name}), {name: f.name, email: f.email, discipline: form.querySelector('select[name=discipline]').selectedOptions[0].textContent, link: f.link, message: f.message, bank: f.bank, account_name: f.account_name, account_no: f.account_no, captcha: f['cf-turnstile-response']});
    return {res, to: CONFIG.contact};
  }}>
    <p className="intro">{t('jd_intro')}</p>
    <div className="row"><label>{t('jd_name')}<input name="name" required maxLength={80} autoComplete="name"/></label><label>{t('jd_email')}<input name="email" type="email" required maxLength={120} autoComplete="email"/></label></div>
    <label>{t('jd_disc')}<select name="discipline">{discs.map(x => <option key={x} value={x}>{L.discL({disc: x})}</option>)}<option value="other">{t('jd_other')}</option></select></label>
    <label>{t('jd_link')}<input name="link" type="url" placeholder="https://" maxLength={200}/></label>
    <label>{t('jd_msg')}<textarea name="message" required maxLength={1500}/></label>
    <fieldset className="jd-pay"><legend>{t('jd_pay_h')}</legend><p className="note">{t('jd_pay_note')}</p>
      <div className="row"><label>{t('jd_bank')}<select name="bank"><option value="">—</option><option value="BCEL">BCEL</option><option value="LDB">LDB</option><option value="other">{t('jd_other')}</option></select></label><label>{t('sup_acc_name')}<input name="account_name" maxLength={80}/></label></div>
      <label>{t('sup_acc_no')}<input name="account_no" inputMode="numeric" maxLength={40}/></label></fieldset>
  </FormBody>;
}

/* the donation dialog: the same steps and strings as openDonate() in circles.js. k = the work that inspired the gift (optional). */
const SLIP_TYPES = ['image/jpeg', 'image/png', 'image/webp'], MAX_SLIP = 2 * 1024 * 1024;
function DonateForm({A, usd0, k}) {
  const L = useLang(), {t} = L, toast = useToast(), dialogs = useDialogs(), who = L.nameL(A), sample = sampleMode(A);
  const forTitle = k != null && A.pieces[k] ? L.titleL(A.pieces[k]) : '';
  const [step, setStep] = useState(usd0 > 0 ? 1 : 0), [usd, setUsd] = useState(usd0 || 0), [custom, setCustom] = useState(''), [bad, setBad] = useState(false);
  const known = A.support && (A.support.qr || A.support.no) ? {bank: A.support.bank, account_name: A.support.name, account_no: A.support.no, qrUrl: A.support.qr || ''} : undefined;   // from the last `npm run pull`
  const [pay, setPay] = useState(known), [err, setErr] = useState(''), [sending, setSending] = useState(false), [round, setRound] = useState(0);
  useEffect(() => { let live = true; if (!sample && !known) fetchPayment(A.id).then(x => { if (live) setPay(x); }); return () => { live = false; }; }, [A.id, sample]);   // payment details that the pull did not bring: ask the database
  const forNote = forTitle ? <p className="sm-for">{t('don_for', {t: forTitle})}</p> : null;
  const submit = async e => {
    e.preventDefault(); setErr('');
    const form = e.currentTarget, f = Object.fromEntries(new FormData(form)), slip = f.slip && f.slip.size ? f.slip : null;
    if (form.querySelector('.hp input')?.value) return;
    if (!String(f.name).trim()) { setErr('pay_need_name'); return; }
    if (!/^\S+@\S+\.\S+$/.test(String(f.email).trim())) { setErr('pay_need_email'); return; }
    if (slip && !SLIP_TYPES.includes(slip.type)) { setErr(sample ? 'pay_slip_type' : 'don_e_slip'); return; }
    if (slip && slip.size > MAX_SLIP) { setErr('pay_slip_big'); return; }
    if (sample) {                                            // demo: wait a moment like a real send, remember it in this browser, send nothing
      setSending(true); await new Promise(r => setTimeout(r, 600)); rememberSampleDonation(A.id, usd); setSending(false); setStep(3); return;
    }
    if (captchaOn() && !f['cf-turnstile-response']) { toast(t('captcha_wait')); return; }
    setSending(true);
    let sl = null; if (slip) { try { sl = await slipFromFile(slip); } catch (x) { setSending(false); setErr('don_e_slip'); return; } }
    const r = await sendDonation({artist_id: A.id, ...(k != null ? {position: k} : {}), donor_name: String(f.name).trim(), donor_email: String(f.email).trim(), amount: usd, currency: 'USD', captcha: f['cf-turnstile-response'] || '', slip: sl});
    setSending(false);
    if (r.ok) setStep(3); else { setErr('don_e_' + (['captcha', 'busy', 'rate', 'not_found', 'bad_field'].includes(r.error) ? r.error : 'net')); setRound(n => n + 1); }
  };
  const row = (key, v) => v ? <div><dt>{t(key)}</dt><dd>{v}</dd></div> : null;
  if (step === 0) return <><Head title={t('pf_supb', {a: who})} floor={[1, 4, '1']}/>
    <Body><div className="sup-dlg">{forNote}<p className="sm-amt">{t('tip_h')}</p>
      <div className="pf-tips-r">{DON_AMOUNTS.map(n => <button key={n} type="button" className="pf-amt" data-amt={n} onClick={() => { setUsd(n); setStep(1); }}>{L.money(n)}</button>)}</div>
      <form className="pf-tipf" noValidate onSubmit={e => { e.preventDefault(); if (!validAmount(custom)) { setBad(true); return; } setUsd(+custom); setStep(1); }}>
        <label htmlFor="don-n">{t('tip_other')}</label>
        <input id="don-n" name="n" type="number" inputMode="numeric" min="1" max={MAX_AMOUNT} step="1" placeholder="12" value={custom} aria-invalid={bad || undefined} onChange={e => { setCustom(e.target.value); setBad(false); }}/>
        <button type="submit" className="btn pk">{t('tip_go')}</button></form>
      {bad && <p className="pf-tiperr" role="alert">{t('tip_bad')}</p>}
      <div className="act"><button type="button" className="btn ghost" onClick={close}>{t('close')}</button></div></div></Body></>;
  if (step === 1) return <><Head title={t('pf_supb', {a: who})} floor={[2, 4, '2']}/>
    <Body><div className="sup-dlg sm-pay">
      {sample && <p className="sup-sample" role="note">{t('sm_banner')}</p>}
      <p className="sm-amt">{t('tip_amt', {m: L.money(usd)})}</p>
      {forNote}
      {sample ? <div className="qr-plate"><span dangerouslySetInnerHTML={{__html: sampleQrSvg(A.id + ':' + usd, t('sm_qr_alt'))}}/></div>
        : pay === undefined ? <p className="note" role="status">…</p>
        : pay ? (pay.qrUrl && <div className="qr-plate"><img className="sup-qr" src={pay.qrUrl} alt={t('sup_qr_t', {a: who})} width="240" height="240" decoding="async"/></div>) : <p className="note">{t('don_none')}</p>}
      <p className="note">{t('don_how')}</p>
      {(sample || pay) && <dl className="sup-dl">{row('sup_bank', sample ? 'BCEL' : pay.bank)}{row('sup_acc_name', sample ? 'SAMPLE' : pay.account_name)}{row('sup_acc_no', sample ? '000 000 000 000' : pay.account_no)}</dl>}
      <p className="note">{t('sup_direct', {a: who})}</p>
      <div className="act"><button type="button" className="btn pk" data-sm-sent="" disabled={!sample && !pay} onClick={() => setStep(2)}>{t('tip_sent')}</button><button type="button" className="btn ghost" onClick={close}>{t('close')}</button></div>
    </div></Body></>;
  if (step === 2) return <><Head title={t('pay_notice_h')} floor={[3, 4, '3']}/>
    <Body><form className="sm-form" key={round} noValidate onSubmit={submit}>
      {sample && <p className="note" role="note">{t('sm_banner')}</p>}
      <div className="row"><label>{t('id_name')}<input name="name" required maxLength={80} autoComplete="name"/></label><label>{t('id_email')}<input name="email" type="email" required maxLength={120} autoComplete="email"/></label></div>
      <label>{t('pay_slip')}<input name="slip" type="file" accept="image/*"/></label>
      <label className="hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      {!sample && captchaOn() && <Turnstile/>}
      {err && <p className="sm-err note" role="alert">{t(err)}</p>}
      <div className="act"><button className="btn pk" type="submit" disabled={sending}>{t(sending ? 'pay_sending' : 'pay_submit')}</button><button type="button" className="btn ghost" onClick={() => setStep(1)}>{t('pay_back')}</button></div></form></Body></>;
  return <><Head title={t('pay_done_h')} floor={[4, 4, '4']}/>
    <Body><div className="cdlg-done" role="status">
      <div className="stone" aria-hidden="true"><span className="st-h">♥</span><b>{L.money(usd)}</b><span className="st-l">{who} · {new Date().getFullYear()}</span></div>
      <p className="intro">{sample ? t('pay_done_tip', {a: who, m: L.money(usd)}) : t('don_done_real')}</p>{sample && <p className="sup-sample">{t('sm_banner')}</p>}
      <div className="after"><h3>{t('af_h')}</h3><p>{t('af_p')}</p><button type="button" className="btn ghost" data-sc="" onClick={e => { close(e); dialogs.openSupportCircles(); }}>{t('af_btn')}</button></div>
      <div className="act"><button type="button" className="btn ghost" onClick={close}>{t('close')}</button></div></div></Body></>;
}

/* "Support circles": money for the site itself, kept apart from every artist donation. Own sample QR (or CONFIG.support once it is real). Floors 1 amount, 2 scan, 3 thanks. */
const SC_AMOUNTS = [1, 3, 5];
function SupportCirclesForm() {
  const L = useLang(), {t} = L, info = CONFIG.support, real = !!info && !info.sample && !!(info.qr || info.no);
  const [step, setStep] = useState(0), [usd, setUsd] = useState(0), [custom, setCustom] = useState(''), [bad, setBad] = useState(false);
  const row = (key, v) => v ? <div><dt>{t(key)}</dt><dd>{v}</dd></div> : null;
  const plate = <p className="sc-plate"><b>{t('sc_k')}</b>{t('sc_not')}</p>;
  if (step === 0) return <><Head title={t('sc_title')} floor={[1, 3, '1']}/>
    <Body><div className="sup-dlg">{plate}{!real && <p className="sup-sample" role="note">{t('sm_banner')}</p>}<p className="sm-amt">{t('sc_pick')}</p>
      <div className="pf-tips-r">{SC_AMOUNTS.map(n => <button key={n} type="button" className="pf-amt" data-amt={n} onClick={() => { setUsd(n); setStep(1); }}>{L.money(n)}</button>)}</div>
      <form className="pf-tipf" noValidate onSubmit={e => { e.preventDefault(); if (!validAmount(custom)) { setBad(true); return; } setUsd(+custom); setStep(1); }}>
        <label htmlFor="sc-n">{t('tip_other')}</label>
        <input id="sc-n" name="n" type="number" inputMode="numeric" min="1" max={MAX_AMOUNT} step="1" placeholder="2" value={custom} aria-invalid={bad || undefined} onChange={e => { setCustom(e.target.value); setBad(false); }}/>
        <button type="submit" className="btn pk">{t('tip_go')}</button></form>
      {bad && <p className="pf-tiperr" role="alert">{t('tip_bad')}</p>}
      <div className="act"><button type="button" className="btn ghost" onClick={close}>{t('close')}</button></div></div></Body></>;
  if (step === 1) return <><Head title={t('sc_title')} floor={[2, 3, '2']}/>
    <Body><div className="sup-dlg sm-pay"><p className="sm-amt">{t('sc_total', {m: L.money(usd)})}</p>{plate}{!real && <p className="sup-sample" role="note">{t('sm_banner')}</p>}
      <div className="qr-plate">{real && info.qr ? <img className="sup-qr" src={info.qr} alt={t('sc_qr_t')} width="240" height="240" decoding="async"/> : <span dangerouslySetInnerHTML={{__html: sampleQrSvg('circles:' + usd, t('sm_qr_alt'))}}/>}</div>
      <p className="note">{t('sc_how')}</p>
      <dl className="sup-dl">{row('sup_bank', real ? info.bank : '')}{row('sup_acc_name', real ? info.name : t('sc_acc'))}{row('sup_acc_no', real ? info.no : '')}</dl>
      <div className="act"><button type="button" className="btn pk" data-sc-sent="" onClick={() => { rememberSampleCircles(usd); setStep(2); }}>{t('sc_sent')}</button><button type="button" className="btn ghost" onClick={close}>{t('close')}</button></div>
      <button type="button" className="linkish" data-sc-back="" onClick={() => setStep(0)}>{t('change_amt')}</button></div></Body></>;
  return <><Head title={t(real ? 'sc_done_r_h' : 'sc_done_h')} floor={[3, 3, '4']}/>
    <Body><div className="cdlg-done" role="status">
      <div className="stone" aria-hidden="true"><span className="st-h">♥</span><b>{L.money(usd)}</b><span className="st-l">circles · {new Date().getFullYear()}</span></div>
      <p className="intro">{t(real ? 'sc_done_r_p' : 'sc_done_p', {m: L.money(usd)})}</p>{!real && <p className="sup-sample">{t('sm_banner')}</p>}
      <div className="act"><button type="button" className="btn ghost" onClick={close}>{t('close')}</button></div></div></Body></>;
}

export function DialogsProvider({children}) {
  // each open bumps a counter: the dialog is rebuilt (key) with a fresh form, like the old innerHTML rewrite
  const [join, setJoin] = useState(0), [don, setDon] = useState(null), [sup, setSup] = useState(null), [sc, setSc] = useState(0);
  const openJoin = useCallback(() => setJoin(n => n + 1), []);
  const openDonate = useCallback((A, usd = 0, k = null) => { if (A) setDon(o => ({A, usd, k, seq: (o ? o.seq : 0) + 1})); }, []);
  const openSupport = useCallback((info, who) => { if (info) setSup(o => ({info, who, seq: (o ? o.seq : 0) + 1})); }, []);
  const openSupportCircles = useCallback(() => setSc(n => n + 1), []);
  return <DialogsCtx.Provider value={{openJoin, openDonate, openSupport, openSupportCircles}}>
    {children}
    {join > 0 && <Dialog id="dlg-join" seq={join}><JoinForm key={join}/></Dialog>}
    {don && <Dialog id="dlg-tip" seq={don.seq}><DonateForm key={don.seq} A={don.A} usd0={don.usd} k={don.k}/></Dialog>}
    {sc > 0 && <Dialog id="dlg-sc" seq={sc}><SupportCirclesForm key={sc}/></Dialog>}
    {sup && <Dialog id="dlg-support" seq={sup.seq}><SupportDialog key={sup.seq} info={sup.info} who={sup.who}/></Dialog>}
  </DialogsCtx.Provider>;
}
