/* buy.html / buy-<id>-<k>.html — the buy page of one work (k = its position in artists.js, from 0). From buy.js + buy.html.
   Look: design/buy-reference.html. Anything unknown is a yellow [__] from SHIPPING / RATES (circles.js), never invented. */
import {useEffect, useRef, useState} from 'react';
import {CONFIG, SHIPPING, RATES} from 'virtual:circles/config';
import {useLang} from '../lib/i18n.jsx';
import {useMt} from '../lib/manageStrings.js';
import {usePageMeta} from '../lib/meta.js';
import {reduce} from '../lib/env.js';
import {artistById, workStatus, payLink} from '../lib/art.js';
import {deliver} from '../lib/forms.js';
import PageShell from '../components/PageShell.jsx';
import Nav, {MENU_FULL} from '../components/Nav.jsx';
import {MiniFoot, NotFoundSection, Fill, BT, H, Cell} from '../components/Bits.jsx';
import LaoPay from '../components/LaoPay.jsx';
import {useWiredForm, captchaOn, Turnstile} from '../components/Dialogs.jsx';
import {useToast} from '../components/Toast.jsx';
import sprite from 'virtual:circles/sprite/buy';
import styles from '../styles/buy.js';

/* showcase mode (CONFIG.shop === false): the buy pages are closed, the visitor goes to the artist's museum */
if (CONFIG.shop === false && typeof location !== 'undefined') {
  const bm = location.pathname.match(/buy-([a-z0-9-]+?)-\d+\.html$/i), bq = new URLSearchParams(location.search).get('id');
  if (bm) location.replace('studio-' + bm[1] + '.html');
  else if (/buy\.html$/i.test(location.pathname)) location.replace(bq ? 'cutaway.html?id=' + encodeURIComponent(bq) : 'index.html');
}

const LOGOS = [[-6, 14, 300, 26, 'turn'], [64, 46, 260, 22, 'turnr'], [-4, 72, 280, 30, 'turn'], [80, 2, 170, 18, 'turnr']];   // left%, top%, size px, seconds, direction
const Todo = ({v}) => v ? v : <span className="by-todo">[__]</span>;
const Money = ({cls, p}) => { const {moneyHtml} = useLang(); return <span className={cls} dangerouslySetInnerHTML={{__html: moneyHtml(p.p, p)}}/>; };

/* the message form; after sending it shows the result and a "send another" button that brings the form back */
function AskForm({A, k, pre}) {
  const L = useLang(), {t} = L, toast = useToast(), p = A.pieces[k];
  const [done, setDone] = useState(null), [round, setRound] = useState(0);
  const {submit, busy} = useWiredForm(async f => {
    setDone(await deliver('inquiry', A.email, t('id_subject', {t: L.titleL(p)}), {artist: L.nameL(A), work: L.titleL(p), price: L.money(p.p, p), name: f.name, email: f.email, ship_to: f.ship_to, message: f.message, captcha: f['cf-turnstile-response']}));
  });
  if (done) {
    const ok = done.mode === 'sent', fail = done.mode === 'fail';
    const copy = async () => { try { await navigator.clipboard.writeText(document.getElementById('by-pre').textContent); toast(t('copied')); } catch (e) { toast(t('copy_fail')); } };
    return <div className="by-done" role="status"><b>{t(ok ? 'done_sent' : fail ? 'news_fail' : 'done_mail')}</b><p>{t(ok ? 'done_sent_p' : fail ? 'news_fail' : 'done_mail_p')}</p>
      {!ok && !fail && <><pre id="by-pre">{done.body}</pre><button type="button" className="by-btn by-ghost" data-by-copy="" onClick={copy}><BT>{t('copy_msg')}</BT></button></>}
      <button type="button" className="by-btn by-ghost" data-by-again="" onClick={() => { setDone(null); setRound(r => r + 1); }}><BT>{t('by_again')}</BT></button></div>;
  }
  return <form className="by-form" key={round} onSubmit={submit}>
    <div className="by-two"><label className="by-fld">{t('id_name')}<input name="name" required maxLength={80} autoComplete="name"/></label><label className="by-fld">{t('id_email')}<input name="email" type="email" required maxLength={120} autoComplete="email"/></label></div>
    <label className="by-fld">{t('by_country')}<input name="ship_to" maxLength={120} autoComplete="country-name"/></label>
    <label className="by-fld">{t('id_msg')}<textarea name="message" required maxLength={1500} defaultValue={t(pre, {t: L.titleL(p), p: L.money(p.p, p)})}/></label>
    <label className="hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <p className="by-note" dangerouslySetInnerHTML={{__html: t('consent_form')}}/>
    {captchaOn() && <Turnstile/>}
    <div className="act"><button className="by-btn by-pay" type="submit" disabled={busy}><BT>{t('id_send')}</BT></button></div>
    {!CONFIG.endpoint && <p className="by-note">{t('note_mailto')}</p>}
  </form>;
}

function BuyBody({A, k}) {
  const L = useLang(), {t} = L, mt = useMt();
  const p = A.pieces[k], name = L.nameL(A), title = L.titleL(p), sta = workStatus(p), pay = sta ? '' : payLink(p);
  const soldN = A.pieces.filter(x => workStatus(x) === 'sold').length + (+A.sold > 0 ? +A.sold : 0);
  const fx = [RATES.thb > 0 ? `${Math.round(p.p * RATES.thb).toLocaleString('en-US')} ${t('by_thb')}` : ''].filter(Boolean);
  const buyTxt = sta === 'sold' ? t('b_sold', {a: name}) : sta === 'reserved' ? t('b_res') : pay ? t('b_ask', {a: name}) : t('buy', {a: name});
  const pre = sta === 'sold' ? 'id_pre_sold' : sta === 'reserved' ? 'id_pre_res' : 'id_prefill';
  const stk = sta ? t(sta === 'sold' ? 'st_sold' : 'st_res') : p.edition ? mt('w_ed', {n: p.edition}) : t('by_one');   // a work with an edition is not "one of a kind"
  const dot = sta ? t(sta === 'sold' ? 'st_sold' : 'st_res') : t('by_free');
  const steps = pay ? ['p_how1', 'p_how2', 'p_how3'] : ['d_how1', 'd_how2', 'd_how3'];
  const reply = SHIPPING.replyDays ? SHIPPING.replyDays : <span className="by-todo">[__]</span>;
  // a real #by-ask link; with JS it also scrolls softly and puts the cursor in the message
  const toAsk = e => {
    const to = document.getElementById('by-ask'); if (!to) return;
    e.preventDefault(); to.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
    setTimeout(() => { const m = to.querySelector('textarea'); if (m) m.focus({preventScroll: true}); }, reduce ? 0 : 450);
  };
  const since = [+A.since > 0 ? t('by_since', {y: A.since}) : '', soldN > 0 ? t('by_soldn', {n: soldN}) : ''].filter(Boolean).join(' · ');
  return <div className="by" id="by">
    <div className="by-bg" aria-hidden="true">{LOGOS.map((l, i) => <i key={i} className="by-lg" style={{left: l[0] + '%', top: l[1] + '%', width: l[2] + 'px', height: l[2] + 'px', '--t': l[3] + 's', '--sp': 'by-' + l[4]}}/>)}</div>
    <div className="by-marq" aria-hidden="true"><div className="by-marq-t">{t('by_marq').repeat(10)}</div></div>
    <div className="by-wrap">
      <a className="by-back" href={`studio-${A.id}.html?work=${k}`}>{t('by_back', {a: name})}</a>
      <div className="by-hero">
        <div className="by-pic">
          <div className="by-frame"><img src={p.img} alt={title + ' — ' + name} decoding="async" draggable="false"/><span className="by-tape by-tape-a"></span></div>
          <span className="by-sticker" aria-hidden="true">{stk}</span>
        </div>
        <div className="by-info">
          <div><span className="by-chip">{name} · {L.discL(A)} · {L.cityL(A)}</span>{' '/* the old template had a line break here: it shows as a space */}
            <h1 className="bl bl-y bl-dk by-title" id="by-title"><BT>{title}</BT></h1>
            {p.q ? <p className="by-q">“{L.pk(p, 'q')}”</p> : null}</div>
          <div className="by-prow"><Money cls={`by-price${sta ? ' by-strike' : ''}${L.lakOn ? ' by-kip' : ''}`} p={p}/>{sta ? <span className="by-chip by-chip-st">{dot}</span> : null}{fx.length ? <span className="by-fx">≈ {fx.join(' · ')}</span> : null}</div>
          <div className="by-cta"><Money cls={`by-bprice${sta ? ' by-strike' : ''}`} p={p}/>{pay ? <a className="by-btn by-pay" href={pay} target="_blank" rel="noopener"><BT>{t('b_pay')}</BT></a> : null}<a className={`by-btn ${sta || !pay ? 'by-pay' : 'by-ask'}`} href="#by-ask" data-by-ask="" onClick={toAsk}><BT>{buyTxt}</BT></a></div>
          <p className="by-avail"><i className={`by-dot${sta ? ' by-dot-off' : ''}`} aria-hidden="true"></i>{dot} · <Fill text={t('by_reply', {d: '@@'})} with={{'@@': reply}}/></p>
          <section className="by-card" aria-labelledby="by-h-detail"><span className="by-tape by-tape-b"></span><H id="by-h-detail" text={t('by_detail')} c="y"/>
            <Cell l={t('lb_medium')}>{L.pk(p, 'm')}</Cell><Cell l={t('lb_size')}>{L.fmtSize(p)}</Cell><Cell l={t('lb_year')}>{p.y}</Cell><Cell l={t('by_cert')}><Todo v={SHIPPING.certificate}/></Cell></section>
        </div>
      </div>
      <div className="by-row3">
        <section className="by-card by-tilt-l" aria-labelledby="by-h-how"><span className="by-tape by-tape-c"></span><H id="by-h-how" text={t('by_how')} c="p"/>
          {steps.map((s, i) => <div className="by-step" key={s}><b className={`by-n by-n${i}`}>{i + 1}</b><div><b>{t(s)}</b></div></div>)}</section>
        <section className="by-card by-tilt-r" aria-labelledby="by-h-ship"><span className="by-tape by-tape-d"></span><H id="by-h-ship" text={t('by_ship')} c="y"/>
          <Cell l={t('by_to')}><Todo v={SHIPPING.regions}/></Cell><Cell l={t('by_fee')}><Todo v={SHIPPING.fee}/></Cell>
          <Cell l={t('by_days')}>{SHIPPING.days ? t('by_dayu', {d: SHIPPING.days}) : <Todo/>}</Cell><Cell l={t('by_break')}>{SHIPPING.returnDays ? t('by_ret', {d: SHIPPING.returnDays}) : <Todo/>}</Cell></section>
        <section className="by-safe" aria-labelledby="by-h-safe"><span className="by-tape by-tape-e"></span><div className="by-in2"><H id="by-h-safe" text={t('by_safe')} c="w" dk/>
          <p>{t('by_safe_p')} <a href={`mailto:${CONFIG.contact}`}>{CONFIG.contact}</a></p>
          {pay ? <p>{t('d_paynote')}</p> : null}
          <p>{since}</p></div></section>
      </div>
      {!sta && !pay && <LaoPay A={A} k={k} p={p}/>}
      <div className="by-askrow">
        <section className="by-card by-formcard" id="by-ask" aria-labelledby="by-h-ask"><H id="by-h-ask" text={t('by_ask_h', {a: name})} c="p"/>
          <div className="by-box"><AskForm A={A} k={k} pre={pre}/></div></section>
        <div className="by-card by-after"><span>{t('by_after')}</span><b><Fill text={t('by_after_p', {a: '@A', d: '@@'})} with={{'@A': name, '@@': reply}}/></b></div>
      </div>
    </div>
  </div>;
}

export default function Buy({id, k}) {
  const L = useLang(), {t, lang} = L;
  const A = artistById(id || 'napha'), P = A && Number.isInteger(k) ? A.pieces[k] : null;
  usePageMeta(...(P ? [t('title_by', {t: L.titleL(P), a: L.nameL(A)}), t('desc_by', {t: L.titleL(P), a: L.nameL(A), d: L.discL(A), p: L.money(P.p, P)})] : [t('nf_h') + ' — circles', t('nf_p')]));
  useEffect(() => { if (!P) return; document.body.classList.add('by-page'); return () => document.body.classList.remove('by-page'); }, [P]);
  // the pre-built buy-<id>-<k>.html files carried these on <main>
  const built = /\/buy-[a-z0-9-]+-\d+\.html$/i.test(location.pathname) && P ? {'data-pre': '1', 'data-buy-id': A.id, 'data-buy-k': String(k)} : {};
  return <PageShell styles={styles} sprite={sprite}>
    <Nav links={[['index.html#city', 'nav_city'], ['index.html#manifesto', 'nav_about']]} join menu={MENU_FULL}/>
    {/* key: a language change rebuilds the page, like the old render() did (the form starts over in the new language) */}
    <main id="main" {...built}>{P ? <BuyBody key={lang} A={A} k={k}/> : <NotFoundSection/>}</main>
    <MiniFoot/>
  </PageShell>;
}
