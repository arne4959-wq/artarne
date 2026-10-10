/* Dialogs.jsx — the form dialogs of circles.js (mountDialog, dlgShell, showDone, wireForm, mountTurnstile, openJoin).
   useDialogs().openJoin() opens the join request from anywhere (the old onclick="openJoin()").
   Same markup as before: <dialog id="dlg-join" class="cdlg"> in <body>, kept after closing. Inputs are uncontrolled
   (read with FormData on submit), like the old forms. */
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {CONFIG} from 'virtual:circles/config';
import {ARTISTS} from '../lib/art.js';
import {useLang} from '../lib/i18n.jsx';
import {deliver} from '../lib/forms.js';
import {useToast} from './Toast.jsx';

const DialogsCtx = createContext(null);
export const useDialogs = () => useContext(DialogsCtx);
const captchaOn = () => !!(CONFIG.endpoint && CONFIG.turnstileSiteKey);

/* <dialog> in <body>; opens with showModal() whenever `seq` changes; a click on the backdrop closes it */
function Dialog({id, seq, children}) {
  const ref = useRef(null);
  useEffect(() => { const d = ref.current; if (d && seq && !d.open) d.showModal(); }, [seq]);
  return createPortal(<dialog ref={ref} id={id} className="cdlg" onClick={e => { if (e.target === ref.current) ref.current.close(); }}>{children}</dialog>, document.body);
}
const close = e => e.currentTarget.closest('dialog').close();

function Head({title, html = false}) {
  const {t} = useLang();
  return <div className="cdlg-h">{html ? <h2 dangerouslySetInnerHTML={{__html: title}}/> : <h2>{title}</h2>}
    <button type="button" className="cdlg-x" data-close="" aria-label={t('close')} onClick={close}>✕</button></div>;
}

/* optional CAPTCHA (Cloudflare Turnstile): its script loads only when a site key is configured */
function Turnstile() {
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
    <div className="cdlg-done" role="status"><p className="intro">{t(ok ? 'done_sent_p' : fail ? 'news_fail' : 'done_mail_p')}</p>
      {!ok && <><p className="note">{t('to_label')}: {to}</p><pre id="done-pre" ref={pre}>{res.body}</pre></>}
      <div className="act">{!ok && <button type="button" className="btn" data-copy="" onClick={copy}>{t('copy_msg')}</button>}<button type="button" className="btn ghost" data-close="" onClick={close}>{t('close')}</button></div>
    </div>
  </>;
}

/* a form (wireForm): honeypot, CAPTCHA check, submit button disabled while sending, then the Done view */
function FormBody({title, sendKey, sendClass = 'btn', children, onSubmit}) {
  const {t} = useLang(), toast = useToast(), [busy, setBusy] = useState(false), [done, setDone] = useState(null);
  if (done) return <Done {...done}/>;
  const submit = async e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.querySelector('.hp input')?.value) return;          // honeypot
    if (captchaOn() && !new FormData(form).get('cf-turnstile-response')) { toast(t('captcha_wait')); return; }
    setBusy(true);
    try { setDone(await onSubmit(Object.fromEntries(new FormData(form)), form)); } finally { setBusy(false); }
  };
  return <>
    <Head title={title} html/>
    <form onSubmit={submit}>
      {children}
      <label className="hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      <p className="note" dangerouslySetInnerHTML={{__html: t('consent_form')}}/>
      {captchaOn() && <Turnstile/>}
      <div className="act"><button className={sendClass} type="submit" disabled={busy}>{t(sendKey)}</button><button className="btn ghost" type="button" data-close="" onClick={close}>{t('jd_cancel')}</button></div>
      {!CONFIG.endpoint && <p className="note">{t('note_mailto')}</p>}
    </form>
  </>;
}

/* "ขอมีตึก" — join request */
function JoinForm() {
  const L = useLang(), {t} = L;
  const discs = [...new Set(ARTISTS.map(a => a.disc))];
  return <FormBody title={t('jd_title')} sendKey="jd_send" onSubmit={async (f, form) => {
    const res = await deliver('join', CONFIG.contact, t('jd_subject', {n: f.name}), {name: f.name, email: f.email, discipline: form.querySelector('select').selectedOptions[0].textContent, link: f.link, message: f.message, captcha: f['cf-turnstile-response']});
    return {res, to: CONFIG.contact};
  }}>
    <p className="intro">{t('jd_intro')}</p>
    <div className="row"><label>{t('jd_name')}<input name="name" required maxLength={80} autoComplete="name"/></label><label>{t('jd_email')}<input name="email" type="email" required maxLength={120} autoComplete="email"/></label></div>
    <label>{t('jd_disc')}<select name="discipline">{discs.map(x => <option key={x} value={x}>{L.discL({disc: x})}</option>)}<option value="other">{t('jd_other')}</option></select></label>
    <label>{t('jd_link')}<input name="link" type="url" placeholder="https://" maxLength={200}/></label>
    <label>{t('jd_msg')}<textarea name="message" required maxLength={1500}/></label>
  </FormBody>;
}

export function DialogsProvider({children}) {
  // each open bumps a counter: the dialog is rebuilt (key) with a fresh form, like the old innerHTML rewrite
  const [join, setJoin] = useState(0);
  const openJoin = useCallback(() => setJoin(n => n + 1), []);
  return <DialogsCtx.Provider value={{openJoin}}>
    {children}
    {join > 0 && <Dialog id="dlg-join" seq={join}><JoinForm key={join}/></Dialog>}
  </DialogsCtx.Provider>;
}
