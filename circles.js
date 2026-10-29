/* circles.js — shared by index.html and cutaway.html: language (TH/EN), toast, ransom type, forms, mobile menu.
   Needs artists.js first. */

/* ---------- CONFIG: change these lines to go live ----------
   endpoint : a form-backend URL (Formspree, Getform, your own API). It receives JSON via POST.
              While it is empty, forms fall back to opening the visitor's email app (mailto:) and the newsletter is kept in this browser only.
   support  : the site's own bank QR, shown by the Support button: {bank, name, no, qr}. Replace the SAMPLE values (and delete `sample: true`) with your real account. Empty = "Coming soon".
   donate   : the https:// link of your support page (Ko-fi, Stripe Payment Link, ...). While it is empty the Support button on the home page shows "Coming soon" instead of a link.
   shop     : false (kept for old links; nothing reads it). The site is DONATION-ONLY: nothing is sold, there are no prices, buy buttons or buy pages. Every "Donate to <artist>" button opens the donation dialog (sample QR until real bank data is in artists.js).
   lakPerUsd: how many Lao kip one US dollar is worth. Every artist's QR is a Lao (kip) account, so donation amounts are shown in kip in every language, rounded to a tidy figure
              (under 1,000,000 to the nearest 10,000, from 1,000,000 up to the nearest 100,000); Thai and English add "≈ $n" so the size is still clear. 0 = dollars everywhere.
   supabaseUrl, supabaseKey: the Supabase project URL and its publishable (anon) key. Nothing reads them yet; the artist dashboard will.
   manage   : false until the artists' settings page (manage.html) is published. While false the footer "Settings" link is hidden (no dead link). tools/dist.mjs flips it to true in dist/ when it ships manage.html.
   contact  : where "join" requests go. Artists' own addresses are in artists.js (they use the reserved .example domain until you replace them). */
const CONFIG = { shop: false, manage: false, support: {bank: 'LAO QR (LAPNet)', name: 'KAISONE YORTCHAN MR', qr: 'art/qr/arne.png'}, endpoint: 'https://formspree.io/f/maeqeaqn', donate: '', contact: 'arne4959@gmail.com', turnstileSiteKey: '0x4AAAAAAFRit2gggdNBXNji',
  lakPerUsd: 22400,
  analytics: '',   // OFF. To count visits without cookies: make a free GoatCounter site and put 'https://YOURNAME.goatcounter.com/count' here. Then ALSO update privacy.html (it says there is no analytics). docs/GO-LIVE.md
  supabaseUrl: 'https://lgkqvfmnqdpajddishio.supabase.co', supabaseKey: 'sb_publishable_vDPIYxQA0JiZCumJ_qMuhg_BxFSfuXp' };   // supabase*: the artists' database (supabase/README.md). The publishable key is meant to be public: the access rules in the database protect the data, never put a secret / service_role key here.
// lakPerUsd: approximate rate, October 2026. It does NOT update itself: change it by hand when the kip moves.
// turnstileSiteKey: optional Cloudflare Turnstile key (free CAPTCHA). Only used together with `endpoint`; the endpoint must verify the token it receives as `captcha`.
/* breadcrumb: items = [[label, href]...], the last one (no href) is the page you are on. cls 'bc-dark' on dark pages */
const breadcrumbHtml = (items, cls = '') => `<div class="bc ${cls}" role="navigation" aria-label="${esc(t('bc_aria'))}"><ol>${items.map((x, i) => i === items.length - 1 || !x[1] ? `<li aria-current="page"><span>${esc(x[0])}</span></li>` : `<li><a href="${esc(x[1])}">${esc(x[0])}</a></li>`).join('')}</ol></div>`;

const httpsUrl = u => { try { return new URL(u).protocol === 'https:' ? u : ''; } catch (e) { return ''; } };
const donateOk = () => !!httpsUrl(CONFIG.donate);
/* Laos: support is a bank QR (BCEL OnePay / LAO QR), not a card link. artists.js: support:{bank, name, no, qr, sample}. CONFIG.support is the same for the site itself.
   Money goes straight to that account; circles never holds it. No account filled in = a disabled "Coming soon" button, never a dead link. */
const supOf = A => { const s = A && A.support; return s && (s.qr || s.no) ? s : null; };
const canDonate = A => !!A && (sampleMode(A) || !!supOf(A));   // sample artists always can (generated SAMPLE QR); a real artist needs bank details
const supportHtml = A => canDonate(A)
  ? `<button type="button" class="btn pk" data-support="${esc(A.id)}">${esc(t('pf_supb', {a: nameL(A)}))}</button>`
  : `<button type="button" class="btn pk soon" disabled aria-disabled="true" title="${esc(t('don_soon'))}">${esc(t('pf_supb', {a: nameL(A)}))}</button>`;
function supportBtn(el, A) {   // turn an existing button into the support-the-artist button (the click is handled by the page)
  const ok = canDonate(A);
  el.textContent = t('pf_supb', {a: nameL(A)});
  el.classList.remove('ghost'); el.classList.toggle('soon', !ok);
  el.disabled = !ok; el.setAttribute('aria-disabled', String(!ok));
  if (ok) el.removeAttribute('title'); else el.title = t('don_soon');
}
function openSupport(info, who) {
  const d = mountDialog('dlg-support'), row = (k, v) => v ? `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>` : '';
  shell(d, esc(t('sup_qr_t', {a: who})), `<div class="sup-dlg">`
    + (info.sample ? `<p class="sup-sample" role="note">${esc(t('sup_sample'))}</p>` : '')
    + (info.qr ? `<img class="sup-qr" src="${esc(info.qr)}" alt="${esc(t('sup_qr_t', {a: who}))}" width="240" height="240">` : '')
    + `<dl class="sup-dl">${row('sup_bank', info.bank)}${row('sup_acc_name', info.name)}${row('sup_acc_no', info.no)}</dl>`
    + `<p class="note">${esc(t('sup_direct', {a: who}))}</p>` + (info.qr ? `<p class="note">${esc(t('sup_hint'))}</p>` : '')
    + `<div class="act">${info.qr ? `<a class="btn" href="${esc(info.qr)}" download="circles-qr" target="_blank" rel="noopener">${esc(t('sup_save'))}</a>` : ''}${info.no ? `<button type="button" class="btn ghost" data-copy-acc>${esc(t('sup_copy'))}</button>` : ''}<button type="button" class="btn ghost" data-close>${esc(t('close'))}</button></div></div>`);
  d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
  const cp = d.querySelector('[data-copy-acc]');
  if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(info.no); toast(t('sup_copied')); } catch (e) {} };
  d.showModal();
}
document.addEventListener('click', e => {   // any [data-support] button: "site" = CONFIG.support, otherwise an artist id
  const b = e.target.closest && e.target.closest('[data-support]'); if (!b || b.disabled) return;
  const id = b.dataset.support, A = id === 'site' ? null : ARTISTS.find(x => x.id === id);
  if (id === 'site') openSupportCircles();
  else if (A && canDonate(A)) openDonate(A, 0, b.dataset.for || '');   // data-for: the work that inspired the donation (the money still goes to the artist)
});

/* ---------- SAMPLE payment mode (tips on profile pages, the buy page) ----------
   While there is no real payment data (no Supabase URL / key in CONFIG, or the artist is sample data: no `live` flag) every payment screen is a DEMO:
   a generated QR clearly marked SAMPLE, a "I have paid" notice form, and a fake success. Nothing is sent over the network and no file is read.
   The only trace is localStorage (circles-sample-v1: which works are on hold, which tips were "sent" in this browser). Real artists with real payment details are not touched. */
const ownReal = A => !!A && !isSample(A) && !!supOf(A) && !supOf(A).sample;   // the owner's own entry in artists.js (no `live` flag) with his real bank QR: nothing to demo, nothing is sent
const sampleMode = A => !A || (!ownReal(A) && (!(CONFIG.supabaseUrl && CONFIG.supabaseKey) || !A.live));
const isSample = a => !!a && /\.example$/i.test(String(a.email || ''));   // the sample artists carry a *.example e-mail; a real artist (the owner, or one pulled from Supabase) has none
const realDonate = A => !sampleMode(A) && !!supOf(A) && !supOf(A).sample;   // real artist + real payment details: no demo banner, no pretend form, no made-up tips
const SM_KEY = 'circles-sample-v1'; let smMem = {};
const smGet = () => { try { const o = JSON.parse(localStorage.getItem(SM_KEY)); if (o && typeof o === 'object') return o; } catch (e) {} return smMem; };
const smPut = o => { smMem = o; try { localStorage.setItem(SM_KEY, JSON.stringify(o)); } catch (e) {} };
const smTip = (id, usd) => { const o = smGet(); smPut({...o, tips: [...(o.tips || []), {a: id, u: usd, at: Date.now()}].slice(-20)}); };
function sampleQrSvg(seed, cap) {   // a made-up QR-looking picture (random pattern, three finder squares) with a SAMPLE label over the middle. It is not a valid code on purpose.
  let h = 1779033703 ^ String(seed).length; for (const c of String(seed)) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = h << 13 | h >>> 19; }
  const rnd = () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  const N = 29, Q = 4, U = 6, W = (N + Q * 2) * U, finder = (x, y) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  let r = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() < .5) r += `<rect x="${(x + Q) * U}" y="${(y + Q) * U}" width="${U}" height="${U}"/>`;
  for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
    const X = (fx + Q) * U, Y = (fy + Q) * U;
    r += `<rect x="${X}" y="${Y}" width="${7 * U}" height="${7 * U}"/><rect x="${X + U}" y="${Y + U}" width="${5 * U}" height="${5 * U}" fill="#fff"/><rect x="${X + 2 * U}" y="${Y + 2 * U}" width="${3 * U}" height="${3 * U}"/>`;
  }
  const c = W / 2;
  r += `<g transform="rotate(-12 ${c} ${c})"><rect x="${c - 78}" y="${c - 26}" width="156" height="52" fill="#FFD21F" stroke="#0E0D0C" stroke-width="4"/><text x="${c}" y="${c + 4}" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="26" letter-spacing="3" fill="#0E0D0C" stroke="none">SAMPLE</text><text x="${c}" y="${c + 20}" text-anchor="middle" font-family="IBM Plex Sans Thai,sans-serif" font-size="13" font-weight="700" fill="#0E0D0C" stroke="none">ตัวอย่าง</text></g>`;
  return `<svg class="sup-qr sm-qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" role="img" aria-label="${esc(cap)}"><rect width="${W}" height="${W}" fill="#fff"/><g fill="#0E0D0C">${r}</g></svg>`;
}
function samplePayHtml(A, usd, who) {   // banner + QR + account block + amount, shared by the tip dialog and the buy page
  const info = supOf(A) || CONFIG.support || {}, real = !sampleMode(A) && supOf(A) && !info.sample, row = (k, v) => v ? `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>` : '';
  return `<div class="sup-dlg sm-pay">`
    + (real ? '' : `<p class="sup-sample" role="note">${esc(t('sm_banner'))}</p>`)
    + (usd > 0 ? `<p class="sm-amt">${esc(t('tip_amt', {m: money(usd)}))}</p>` : '')
    + (real ? (info.qr ? `<div class="qr-plate"><img class="sup-qr" src="${esc(info.qr)}" alt="${esc(t('sup_qr_t', {a: who}))}" width="240" height="240"></div>` : '')   // a real artist who has not uploaded a QR yet shows the account only, never a made-up QR
        : `<div class="qr-plate">${sampleQrSvg(A.id + ':' + usd, t('sm_qr_alt'))}</div>`)
    + `<dl class="sup-dl">${row('sup_bank', info.bank)}${row('sup_acc_name', real ? info.name : 'SAMPLE')}${row('sup_acc_no', real ? info.no : '000 000 000 000')}</dl>`
    + `<p class="note">${esc(t('sup_direct', {a: who}))}</p></div>`;
}
const SM_MAX = 2 * 1024 * 1024;
function sampleNoticeHtml() {   // the "I've donated" notice: name, e-mail, optional slip image (max 2 MB). No CAPTCHA in sample mode.
  return `<form class="sm-form" novalidate>
    <p class="note" role="note">${esc(t('sm_banner'))}</p>
    <div class="row"><label>${esc(t('id_name'))}<input name="name" required maxlength="80" autocomplete="name"></label><label>${esc(t('id_email'))}<input name="email" type="email" required maxlength="120" autocomplete="email"></label></div>
    <label>${esc(t('pay_slip'))}<input name="slip" type="file" accept="image/*"></label>
    <p class="sm-err note" role="alert" hidden></p>
    <div class="act"><button class="btn pk" type="submit">${esc(t('pay_submit'))}</button><button type="button" class="btn ghost" data-sm-back>${esc(t('pay_back'))}</button></div></form>`;
}
function sampleNoticeWire(root, onOk, onBack) {   // validates by hand (name, e-mail, slip type / size), waits a moment like a real send would, then calls onOk. No fetch, the file is never read.
  const form = root.querySelector('.sm-form'), err = form.querySelector('.sm-err'), slip = form.elements.slip;
  const fail = k => { err.textContent = t(k); err.hidden = false; };
  const slipBad = () => { const f = slip.files && slip.files[0]; return !f ? '' : !/^image\//.test(f.type) ? 'pay_slip_type' : f.size > SM_MAX ? 'pay_slip_big' : ''; };
  slip.addEventListener('change', () => { const k = slipBad(); if (k) fail(k); else err.hidden = true; });
  form.addEventListener('submit', e => {
    e.preventDefault(); err.hidden = true;
    const n = form.elements.name, m = form.elements.email;
    if (!n.value.trim()) { fail('pay_need_name'); n.focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(m.value.trim())) { fail('pay_need_email'); m.focus(); return; }
    const k = slipBad(); if (k) { fail(k); slip.focus(); return; }
    const b = form.querySelector('[type=submit]'); b.disabled = true; b.setAttribute('aria-busy', 'true'); (b.querySelector('.bl-t') || b).textContent = t('pay_sending');
    setTimeout(onOk, reduce ? 0 : 700);
  });
  form.querySelector('[data-sm-back]')?.addEventListener('click', onBack);
}
/* The donation dialog (every "Support <artist>" button): 0) pick an amount (skipped when one is given) -> 1) QR + account, how to donate -> 2) "I've donated" notice -> 3) fake thank-you.
   forTitle = the work that inspired the gift (shown only as a note, the money goes to the artist). Sample mode: nothing is sent, see the block above. */
/* ---------- punk-ui: cube.*, donate-flow.*, times.*, notices.js are loaded on demand (see HOOKUP.md), so no page needs new <script> tags.
   punkLoad(['cube','donate']) -> Promise<bool>; false = a file failed to load and the caller falls back to the plain version. ---------- */
const PUNK_V = {"cube.css":"cc63938c", "cube.js":"9e59b414", "donate-flow.css":"8bb61ff5", "donate-flow.js":"875f72ed", "times.css":"7f5133c3", "notices.js":"229efaae", "times.js":"5bf0c24a"};   // filled by tools/stamp.mjs: file -> content hash, so a changed file is fetched fresh instead of from the browser cache
const PUNK_FILES = {cube: ['cube.css', 'cube.js'], donate: ['cube.css', 'cube.js', 'donate-flow.css', 'donate-flow.js'], times: ['times.css', 'notices.js', 'times.js']};
const punkLoaded = {};
const punkLoad = names => Promise.all([].concat(...names.map(n => PUNK_FILES[n])).filter((f, i, a) => a.indexOf(f) === i).map(f => punkLoaded[f] || (punkLoaded[f] = new Promise((ok, no) => {
  const css = f.endsWith('.css'), el = document.createElement(css ? 'link' : 'script');
  const u = PUNK_V[f] ? f + '?v=' + PUNK_V[f] : f; if (css) { el.rel = 'stylesheet'; el.href = u; } else { el.src = u; }
  el.onload = ok; el.onerror = () => { delete punkLoaded[f]; no(new Error(f)); }; document.head.appendChild(el);
})))).then(() => true, () => false);
/* the works of the REAL artists for THE CIRCLES TIMES / the ticker. res is 0 on purpose: sampleRes() invents counts for every artist, and a real artist has no real counts yet (needs a server) */
const punkWorks = () => ARTISTS.filter(a => !isSample(a)).flatMap(a => a.pieces.map((p, k) => ({aid: a.id, artist: nameL(a), title: titleL(p), img: p.img, href: `studio-${a.id}.html?work=${k}`, say: pk(p, 'say') || (p.concept ? pk(p.concept, 'quote') : ''), res: 0, views: 0, added: p.added})));
let punkOff = false;   // set when the new donate window could not load: the old dialog then takes over
function punkDonate(A, usd, forTitle) {
  const w = A.pieces.find(p => forTitle && [p.t, p.tEn, p.titleLo].includes(forTitle)) || (forTitle ? null : A.pieces[0]) || {};
  CirclesDonateFlow.open({lang: LANG, amount: usd > 0 ? usd : 0, artist: {id: A.id, name: nameL(A), support: supOf(A) || {}},
    work: {title: w.t ? titleL(w) : '', voice: w.t ? (pk(w, 'say') || (w.concept ? pk(w.concept, 'quote') : '')) : ''}, circles: CONFIG.support, onSupportCircles: openSupportCircles, money});
}
const DON_AMOUNTS = [3, 5, 10];   // preset donations in US dollars
function openDonate(A, usd, forTitle) {
  if (!punkOff && realDonate(A)) { punkLoad(['donate']).then(ok => { if (ok) punkDonate(A, usd, forTitle); else { punkOff = true; openDonate(A, usd, forTitle); } }); return; }   // a real artist gets the 3-step poster window; sample artists keep the demo dialog below
  const d = mountDialog('dlg-tip'), who = nameL(A), title = () => esc(t('pf_supb', {a: who})), real = realDonate(A), N = real ? 3 : 4;   // real: pick amount -> QR + account -> thanks (the "I have donated" form only exists in the demo)
  const close = '<button type="button" class="btn ghost" data-close>' + esc(t('close')) + '</button>', wireClose = () => d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
  const forNote = forTitle ? `<p class="sm-for">${esc(t('don_for', {t: forTitle}))}</p>` : '';
  const step0 = () => {
    shell(d, title(), `<div class="sup-dlg">${forNote}<p class="note don-trust">${esc(t('don_trust', {a: who}))}</p><p class="sm-amt">${esc(t('tip_h'))}</p><div class="pf-tips-r">${DON_AMOUNTS.map(n => `<button type="button" class="pf-amt" data-amt="${n}">${esc(money(n))}</button>`).join('')}</div>
      <form class="pf-tipf" novalidate><label for="don-n">${esc(t('tip_other'))}</label><input id="don-n" name="n" type="number" inputmode="numeric" min="1" max="1000" step="1" placeholder="12"><button type="submit" class="btn pk">${esc(t('tip_go'))}</button></form>
      <p class="pf-tiperr" role="alert" hidden>${esc(t('tip_bad'))}</p><div class="act">${close}</div></div>`, [1, N, '1']);
    wireClose();
    d.querySelectorAll('[data-amt]').forEach(b => b.onclick = () => { usd = +b.dataset.amt; step1(); });
    const f = d.querySelector('.pf-tipf'), inp = f.elements.n, err = d.querySelector('.pf-tiperr');
    f.addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!/^\d{1,4}$/.test(v) || +v < 1 || +v > 1000) { err.hidden = false; inp.focus(); return; } usd = +v; step1(); });
    inp.addEventListener('input', () => { err.hidden = true; });
  };
  const step1 = () => {
    const info = supOf(A) || CONFIG.support || {}, real = realDonate(A);   // the same test as the floor count above: a real artist never gets the pretend "I have donated" form, with or without an account number
    shell(d, title(), samplePayHtml(A, usd, who).replace('<dl class="sup-dl">', `${forNote}<p class="note">${esc(t('don_how'))}</p><dl class="sup-dl">`).replace('</dl>', `</dl><p class="note don-check">${esc(t('don_check'))}</p><p class="note">${esc(t('don_fee'))}</p>`)
      + `<div class="sup-dlg sm-act"><div class="act"><button type="button" class="btn pk" data-sm-sent>${esc(t('tip_sent'))}</button>${real && info.no ? `<button type="button" class="btn ghost" data-copy-acc>${esc(t('sup_copy'))}</button>` : ''}${close}</div></div>`, [2, N, '2']);
    wireClose(); d.querySelector('[data-sm-sent]').onclick = real ? stepReal : step2;
    const cp = d.querySelector('[data-copy-acc]');
    if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(info.no); toast(t('sup_copied')); } catch (e) {} };
  };
  const step2 = () => {
    shell(d, esc(t('pay_notice_h')), sampleNoticeHtml(), [3, 4, '3']); wireClose();
    sampleNoticeWire(d, step3, step1); d.querySelector('input[name=name]').focus();
  };
  const stepReal = () => {   // a real transfer: nothing is recorded or sent from here, so the page says exactly that
    shell(d, esc(t('real_done_h')), `<div class="cdlg-done" role="status"><div class="stone" aria-hidden="true"><span class="st-h">♥</span><b>${esc(money(usd))}</b><span class="st-l">${esc(who)} · ${new Date().getFullYear()}</span></div><p class="intro">${esc(t('real_done_p', {a: who}))}</p>`
      + `<div class="after"><h3>${esc(t('af_h'))}</h3><p>${esc(t('af_p'))}</p><button type="button" class="btn ghost" data-sc>${esc(t('af_btn'))}</button></div><div class="act">${close}</div></div>`, [3, 3, '4']);
    wireClose(); d.querySelector('[data-close]').focus();
  };
  const step3 = () => {
    smTip(A.id, usd);
    shell(d, esc(t('pay_done_h')), `<div class="cdlg-done" role="status"><div class="stone" aria-hidden="true"><span class="st-h">♥</span><b>${esc(money(usd))}</b><span class="st-l">${esc(who)} · ${new Date().getFullYear()}</span></div><p class="intro">${esc(t('pay_done_tip', {a: who, m: money(usd)}))}</p><p class="sup-sample">${esc(t('sm_banner'))}</p>`
      + `<div class="after"><h3>${esc(t('af_h'))}</h3><p>${esc(t('af_p'))}</p><button type="button" class="btn ghost" data-sc>${esc(t('af_btn'))}</button></div><div class="act">${close}</div></div>`, [4, 4, '4']);
    wireClose(); d.querySelector('[data-close]').focus();
  };
  if (usd > 0) step1(); else step0();
  if (!d.open) d.showModal();
}
/* ---------- "Support circles": money for the site itself, kept apart from every artist donation ----------
   Its own window (floors 1 amount, 2 scan, 3 thanks) and its own sample QR. A gold plate on every step says whose money this is. CONFIG.support (a real, non-sample bank QR) replaces the sample once it exists.
   The gift is remembered under its own key (circles-sample-v1 .circles); it is never added to an artist's total and never counts in the highlights. Opened by any [data-sc] button (the footer link, the box after an artist thank-you). */
const SC_AMOUNTS = [1, 3, 5];
function openSupportCircles() {
  const d = mountDialog('dlg-sc'), info = CONFIG.support, real = !!info && !info.sample && !!(info.qr || info.no), row = (k, v) => v ? `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>` : '';
  const close = '<button type="button" class="btn ghost" data-close>' + esc(t('close')) + '</button>', wireClose = () => d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
  const plate = `<p class="sc-plate"><b>${esc(t('sc_k'))}</b>${esc(t('sc_not'))}</p>`, banner = real ? '' : `<p class="sup-sample" role="note">${esc(t('sm_banner'))}</p>`;
  let usd = 0;
  const step0 = () => {
    shell(d, esc(t('sc_title')), `<div class="sup-dlg">${plate}${banner}<p class="sm-amt">${esc(t('sc_pick'))}</p><div class="pf-tips-r">${SC_AMOUNTS.map(n => `<button type="button" class="pf-amt" data-amt="${n}">${esc(money(n))}</button>`).join('')}</div>
      <form class="pf-tipf" novalidate><label for="sc-n">${esc(t('tip_other'))}</label><input id="sc-n" name="n" type="number" inputmode="numeric" min="1" max="1000" step="1" placeholder="2"><button type="submit" class="btn pk">${esc(t('tip_go'))}</button></form>
      <p class="pf-tiperr" role="alert" hidden>${esc(t('tip_bad'))}</p><div class="act">${close}</div></div>`, [1, 3, '1']);
    wireClose();
    d.querySelectorAll('[data-amt]').forEach(b => b.onclick = () => { usd = +b.dataset.amt; step1(); });
    const f = d.querySelector('.pf-tipf'), inp = f.elements.n, err = d.querySelector('.pf-tiperr');
    f.addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!/^\d{1,4}$/.test(v) || +v < 1 || +v > 1000) { err.hidden = false; inp.focus(); return; } usd = +v; step1(); });
    inp.addEventListener('input', () => { err.hidden = true; });
  };
  const step1 = () => {
    shell(d, esc(t('sc_title')), `<div class="sup-dlg sm-pay"><p class="sm-amt">${esc(t('sc_total', {m: money(usd)}))}</p>${plate}${banner}
      ${real && !info.qr ? '' : `<div class="qr-plate">${real ? `<img class="sup-qr" src="${esc(info.qr)}" alt="${esc(t('sc_qr_t'))}" width="240" height="240">` : sampleQrSvg('circles:' + usd, t('sm_qr_alt'))}</div>`}<p class="note">${esc(t('sc_how'))}</p>
      <dl class="sup-dl">${row('sup_bank', real ? info.bank : '')}${row('sup_acc_name', real ? info.name : t('sc_acc'))}${row('sup_acc_no', real ? info.no : '')}</dl>
      <div class="act"><button type="button" class="btn pk" data-sc-sent>${esc(t('sc_sent'))}</button>${close}</div><button type="button" class="linkish" data-sc-back>${esc(t('change_amt'))}</button></div>`, [2, 3, '2']);
    wireClose(); d.querySelector('[data-sc-sent]').onclick = step2; d.querySelector('[data-sc-back]').onclick = step0;
  };
  const step2 = () => {
    const o = smGet(); smPut({...o, circles: [...(o.circles || []), {u: usd, at: Date.now()}].slice(-20)});
    shell(d, esc(t(real ? 'sc_done_r_h' : 'sc_done_h')), `<div class="cdlg-done" role="status"><div class="stone" aria-hidden="true"><span class="st-h">♥</span><b>${esc(money(usd))}</b><span class="st-l">circles · ${new Date().getFullYear()}</span></div>
      <p class="intro">${esc(t(real ? 'sc_done_r_p' : 'sc_done_p', {m: money(usd)}))}</p>${real ? '' : `<p class="sup-sample">${esc(t('sm_banner'))}</p>`}<div class="act">${close}</div></div>`, [3, 3, '4']);
    wireClose(); d.querySelector('[data-close]').focus();
  };
  document.querySelectorAll('dialog[open]').forEach(x => { if (x !== d) x.close(); });
  step0(); if (!d.open) d.showModal();
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-sc]')) openSupportCircles(); });

/* ---------- "Resonated" (sample numbers) ----------
   The ranking of the weekly highlights: taps of the "Resonated" button, views break ties. Until there are real visitors the counts are stable made-up numbers
   (a hash of the work) plus this browser's own tap (localStorage circles-res-v1). Donation amounts are never part of it. */
const hash32 = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const sampleRes = (aid, k) => 40 + hash32(aid + ':' + k + ':r') % 320;
const sampleViews = (aid, k) => 700 + hash32(aid + ':' + k + ':v') % 3600;
const RES_KEY = 'circles-res-v1'; let resMem = {};
const resGet = () => { try { const o = JSON.parse(localStorage.getItem(RES_KEY)); if (o && typeof o === 'object') return o; } catch (e) {} return resMem; };
const resMine = (aid, k) => !!resGet()[aid + ':' + k];
const resCount = (aid, k) => sampleRes(aid, k) + (resMine(aid, k) ? 1 : 0);
function resToggle(aid, k) { const o = {...resGet()}, key = aid + ':' + k; if (o[key]) delete o[key]; else o[key] = 1; resMem = o; try { localStorage.setItem(RES_KEY, JSON.stringify(o)); } catch (e) {} return !!o[key]; }
const sayOf = p => pk(p, 'say') || pk(p, 'q') || '';   // the one sentence the artist wrote about the work (older data: the quote)

/* ---------- fullscreen zoom of an artwork ----------
   zoomBtnHtml() is the button (put it inside the element that holds the picture, with class .zoom-host on that element); a click on any [data-zoom] opens that host's <img> in openZoom().
   Wheel / pinch zooms, drag pans, double-click or double-tap toggles, + - 0 and the arrow keys work, Esc / the close button / a tap outside the picture close it. Only transform changes. */
const zoomBtnHtml = () => `<button type="button" class="zoom-btn" data-zoom aria-label="${esc(t('zoom_btn'))}" title="${esc(t('zoom_btn'))}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg></button>`;
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-zoom]'); if (!b) return;
  const img = (b.closest('.zoom-host') || document).querySelector('img'); if (img && (img.currentSrc || img.src)) openZoom(img.currentSrc || img.src, img.alt);
});
function openZoom(src, alt) {
  const d = mountDialog('dlg-zoom'); d.classList.add('zoomdlg');
  d.innerHTML = `<div class="zm-bar"><span class="zm-hint">${esc(t('zoom_hint'))}</span><div class="zm-tools">`
    + `<button type="button" data-zi aria-label="${esc(t('zoom_in'))}">+</button><button type="button" data-zo aria-label="${esc(t('zoom_out'))}">−</button><button type="button" data-zr aria-label="${esc(t('zoom_reset'))}">1×</button>`
    + `<button type="button" data-close aria-label="${esc(t('close'))}">✕</button></div></div>`
    + `<div class="zm-stage" tabindex="0" role="group" aria-label="${esc(alt || t('zoom_btn'))}"><img class="zm-img" src="${esc(src)}" alt="${esc(alt || '')}" draggable="false"></div>`;
  const st = d.querySelector('.zm-stage'), im = d.querySelector('.zm-img'), MAX = 8;
  let sc = 1, x = 0, y = 0;
  const clamp = () => {   // the picture cannot be dragged away: along an axis it may only move while it is larger than the stage
    const w = im.offsetWidth * sc, h = im.offsetHeight * sc, mx = Math.max(0, (w - st.clientWidth) / 2), my = Math.max(0, (h - st.clientHeight) / 2);
    x = Math.min(mx, Math.max(-mx, x)); y = Math.min(my, Math.max(-my, y));
  };
  const paint = () => { clamp(); im.style.transform = `translate(${x}px,${y}px) scale(${sc})`; st.classList.toggle('zm-in', sc > 1.01); };
  const zoomAt = (cx, cy, ns) => {   // keep the point under (cx, cy) (client coordinates) where it is
    ns = Math.min(MAX, Math.max(1, ns)); const r = st.getBoundingClientRect(), px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2);
    x = px - (px - x) * (ns / sc); y = py - (py - y) * (ns / sc); sc = ns; paint();
  };
  const mid = () => { const r = st.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  st.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, sc * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018))); }, {passive: false});
  const ptr = new Map(); let moved = 0, pinch = 0, last = 0;
  st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  st.addEventListener('pointermove', e => {
    const p = ptr.get(e.pointerId); if (!p) return;
    if (ptr.size === 2) {
      ptr.set(e.pointerId, [e.clientX, e.clientY]); const [a, b] = [...ptr.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch > 0) zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, sc * dist / pinch); pinch = dist; moved = 99; return;
    }
    const dx = e.clientX - p[0], dy = e.clientY - p[1]; ptr.set(e.pointerId, [e.clientX, e.clientY]); moved += Math.abs(dx) + Math.abs(dy);
    if (sc > 1.01) { x += dx; y += dy; paint(); }
  });
  const up = e => {
    const had = ptr.delete(e.pointerId); if (!had) return;
    if (ptr.size === 0 && moved < 6 && e.type === 'pointerup') {
      if (e.target === st) { d.close(); return; }                                    // a tap outside the picture closes
      const now = Date.now(); if (now - last < 320) { zoomAt(e.clientX, e.clientY, sc > 1.5 ? 1 : 3); last = 0; } else last = now;   // double tap / click
    }
  };
  st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
  const step = f => { const [cx, cy] = mid(); zoomAt(cx, cy, sc * f); };
  d.querySelector('[data-zi]').onclick = () => step(1.5); d.querySelector('[data-zo]').onclick = () => step(1 / 1.5);
  d.querySelector('[data-zr]').onclick = () => { sc = 1; x = 0; y = 0; paint(); };
  d.querySelector('[data-close]').onclick = () => d.close();
  st.addEventListener('keydown', e => {
    const k = e.key, mv = {ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60]}[k];
    if (k === '+' || k === '=') step(1.5); else if (k === '-' || k === '_') step(1 / 1.5); else if (k === '0') { sc = 1; x = 0; y = 0; paint(); }
    else if (mv && sc > 1.01) { x += mv[0]; y += mv[1]; paint(); } else return;
    e.preventDefault();
  });
  d.addEventListener('close', () => { d.classList.remove('zoomdlg'); d.innerHTML = ''; }, {once: true});
  d.showModal(); st.focus({preventScroll: true});
}
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
/* ===== lite:decide ===== phones, very weak devices (2 cores or 2 GB) and data-saver get fewer moving things. ?lite or ?full in the address forces it. */
const LITE = (() => { try {
  const q = new URLSearchParams(location.search);
  if (q.has('full')) return false;
  if (q.has('lite')) return true;
  const phone = matchMedia('(pointer:coarse)').matches && innerWidth < 900;
  const weak = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
  const save = !!(navigator.connection && navigator.connection.saveData);
  return phone || weak || save;
} catch (e) { return false; } })();
if (LITE) document.documentElement.classList.add('lite');
const $ = q => document.querySelector(q);
const NF = new Intl.NumberFormat('en-US');          // built once: constructing Intl objects per call is slow
const usd = n => '$' + NF.format(n);
/* donation amounts: money(n) is plain text for n US dollars, shown in kip (the currency of the artists' QR): "110,000 ₭" on Lao pages, "110,000 ₭ ≈ $5" on Thai and English ones. CONFIG.lakPerUsd = 0 → "$5". */
const lakOn = () => +CONFIG.lakPerUsd > 0;
const lakRound = k => { const step = k < 1e6 ? 1e4 : 1e5; return Math.round(k / step) * step; };
const lak = n => NF.format(lakRound(n * CONFIG.lakPerUsd)) + ' ₭';
const money = n => !lakOn() ? usd(n) : LANG === 'lo' ? lak(n) : lak(n) + ' ≈ ' + usd(n);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/* ---------- strings ---------- */
const STR = {
th: {
  sc_h:'ทางลัด', sc_rand:'สุ่มดูงาน', sc_new:'ศิลปินใหม่', sc_hl:'ไฮไลต์สัปดาห์นี้', sc_find:'ค้นหาชื่อ',
  /* UX pass (2026-10-18) */
  hi_soon:'ไฮไลต์จะเริ่มเมื่อมีผู้ชมกดถูกใจจริง ตอนนี้ยังไม่มีข้อมูล',
  real_done_h:'ขอบคุณที่สนับสนุน', real_done_p:'เงินที่โอนไปเข้าบัญชีของ {a} โดยตรง {a} จะเห็นยอดในแอปธนาคารของตัวเอง ตอนนี้ circles ยังไม่เก็บข้อมูลการโอนของคุณ',
  lr_k:'ห้องสุดท้าย', mus_prof2:'เรื่องของ{a}',
  hero_cta2:'ดูผลงานเด่น', hero_t1:'ตอนนี้ไม่หักค่าธรรมเนียม', hero_t2:'เงินเข้าบัญชีศิลปินโดยตรง', f_branch:'สาขา',
  /* trust copy (2026-10-18) */
  don_trust:'เงินก้อนนี้เข้าบัญชีของ {a} โดยตรง · circles ไม่หักค่าธรรมเนียม ไม่ผ่านมือใคร', don_check:'ก่อนกดยืนยันในแอปธนาคาร ให้เช็กว่าชื่อผู้รับตรงกับชื่อบัญชีด้านบน',
  don_fee:'ยอดที่เห็นเป็นยอดอ้างอิง สกุลเงินที่โอนจริงและค่าธรรมเนียมธนาคาร (ถ้ามี) เป็นไปตามธนาคารของคุณ circles ไม่หักเพิ่ม',
  st_note:'circles ไม่หักค่าธรรมเนียม ค่าธรรมเนียมธนาคาร (ถ้ามี) เป็นไปตามธนาคารของผู้โอน',
  ji_lead:'ฝากชื่อไว้ได้เลย หน้านี้คือการแสดงความสนใจ ยังไม่ใช่การสมัคร และยังไม่ใช่การยืนยันว่าได้เข้าร่วม',
  ji_wait:'เมืองนี้มีคนดูแลคนเดียว เราจะอ่านรายชื่อเมื่อพร้อม ยังบอกไม่ได้ว่าจะติดต่อกลับเมื่อไหร่ และอาจไม่ได้ติดต่อทุกคน ไม่ต้องกดเร่งนะ',
  ji_h:'ฝากชื่อไว้ก่อน',
  ji_name:'ชื่อหรือชื่อศิลปินที่อยากให้แสดง',
  ji_name_s:'นามปากกาก็ได้',
  ji_name_ph:'เช่น นภา',
  ji_contact:'ช่องทางติดต่อ',
  ji_contact_s:'อีเมลหรือ Instagram อย่างใดอย่างหนึ่ง',
  ji_contact_ph:'napha@email.com หรือ @napha',
  ji_link:'ลิงก์ผลงาน',
  ji_link_s:'ที่ที่เห็นงานของคุณ เช่น Instagram, Behance, เว็บส่วนตัว',
  ji_send:'ฝากชื่อไว้ก่อน',
  ji_note:'เราใช้ช่องทางติดต่อและลิงก์นี้เพื่อพิจารณาการเข้าร่วมเท่านั้น ไม่นำไปใช้อย่างอื่น ขอให้ลบได้ทุกเมื่อ · <a href="privacy.html">ความเป็นส่วนตัว</a>',
  ji_st:'ยังไม่ใช่การตอบรับ',
  ji_done_h:'ได้รับข้อมูลแล้ว',
  ji_done_p:'ขอบคุณที่สนใจ นี่เป็นเพียงการที่เราเก็บชื่อของคุณไว้ เราจะติดต่อกลับเมื่อพร้อม ซึ่งอาจใช้เวลานาน และอาจไม่ได้ติดต่อทุกคน ไม่ต้องส่งซ้ำนะ',
  ji_done_btn:'ไปเดินชมเมือง →',
  ji_e_name:'ใส่ชื่อที่อยากให้แสดงก่อนนะ',
  ji_e_contact:'ใส่อีเมลหรือ Instagram ไว้ให้เราติดต่อ',
  ji_e_link:'ลิงก์ผลงานดูไม่ครบ ลองเช็กอีกที',
  ji_e_fail:'ส่งไม่ผ่าน ลองอีกครั้งในอีกสักครู่ ข้อมูลที่กรอกยังอยู่ครบ',
  jn_verify:'เมื่อเปิดรับ เราไม่คัดงานและไม่ตัดสินรสนิยม สิ่งเดียวที่เรายืนยันคือบัญชีรับเงินเป็นของคุณ โดยจะขอภาพหน้าจอที่เห็นเพียงชื่อบัญชีกับเลข 4 ตัวท้าย (บังส่วนที่เหลือ) ดูแลเฉพาะผู้ดูแลเว็บ และลบภายใน 30 วันหลังตรวจเสร็จ รายละเอียดอยู่ในนโยบายความเป็นส่วนตัว ตอนนี้เรายังไม่เก็บภาพนี้',
  jn_closed_h:'ตอนนี้ยังไม่เปิดรับคำขอมีตึก', jn_closed_p:'เมืองเพิ่งเริ่ม ตอนนี้มีตึกแรกหนึ่งหลัง คือของ Arne เรายังไม่รับคำขอจากศิลปินคนอื่น และหน้านี้ไม่มีฟอร์มและไม่เก็บข้อมูลใดๆ เมื่อพร้อมรับ เราจะประกาศที่หน้าแรกก่อน',
  cw_back_first:'เข้าไปดูตึกแรก →',
  sup_led_in:'รับแล้ว', sup_led_out:'ใช้ไปแล้ว', sup_led_left:'คงเหลือ', sup_led_none:'ยังไม่มี',
  nav_city:'เมือง', nav_about:'เกี่ยวกับ', nav_map:'แผนที่', nav_join:'ขอมีตึก', menu_aria:'เมนู', lang_aria:'เปลี่ยนภาษา',
  wave:'คลื่นลูกใหม่', f_wave:'★ คลื่นลูกใหม่', fnote_wave:'ไฮไลต์ {n} ตึกคลื่นลูกใหม่ในแถบเมืองแล้ว',
  ld_top:'circles · เมืองของศิลปิน', ld_text:'กำลังสร้างเมือง…', ld_skip:'ข้ามการเปิดเรื่อง',
  legal_privacy:'นโยบายความเป็นส่วนตัว', legal_terms:'เงื่อนไขการใช้งาน',
  consent_form:'ส่งข้อความนี้แสดงว่าคุณรับทราบ<a href="privacy.html">นโยบายความเป็นส่วนตัว</a> ข้อมูลของคุณจะถูกส่งถึงผู้รับที่ระบุเท่านั้น',
  news_consent:'สมัครแล้วถือว่ารับ<a href="privacy.html">นโยบายความเป็นส่วนตัว</a> ยกเลิกได้ทุกเมื่อ',
  hero_hl1:'เมืองของศิลปิน', hero_hl2:'พื้นที่สำหรับงานศิลปะ', hero_hl3:'ที่ไม่ยอมเงียบ',
  hero_lead:'ตึกคอนกรีตหนึ่งหลัง ศิลปินหนึ่งคน ไม่มีหอศิลป์ ไม่มีคนกลาง เดินเข้าไป ดูงาน แล้วสนับสนุนตรงถึง\u2060คน\u2060ทำ', hero_cta:'เข้าชมเมือง →',
  city_h:'เมือง', city_p:'ลากหรือเลื่อนไปทางขวาเพื่อเดินผ่านเมือง ตึกแต่ละหลังคือสตูดิโอของศิลปินหนึ่งคน ภาพที่ฝังอยู่ในคอนกรีตคือผลงานจริง',
  pager_l:'เลื่อนซ้าย', pager_r:'เลื่อนขวา', strip_aria:'เมืองของศิลปิน เลื่อนซ้ายขวา', bd_aria:'เข้าตึกของ{a} {d}', works_n:'{n} WORKS',
  mani_k:'Manifesto', mani1:'ไม่มี\u200bหอศิลป์', mani2:'ไม่มี\u200bคนกลาง', mani3:'ไม่มี\u200bค่าหัวคิว', mani4:'มีแค่คนทำ กับคนดู',
  mani_aria:'ไม่มีหอศิลป์ ไม่มีคนกลาง ไม่มีค่าหัวคิว มีแค่คนทำกับคนดู',
  mani_note:'ที่นี่ศิลปินรับการสนับสนุนตรงจากคนที่รักงาน และคุยกับคนดูเอง ไม่มีใครมานั่งขวางระหว่างเรากับงาน เพราะงานศิลปะควรเดินจากมือคนทำไปถึงมือคนรัก ไม่ใช่แวะจ่ายค่าผ่านทางก่อน',
  how_i:'3 steps', how_h:'วิธีใช้งาน',
  s1_h:'เลือกตึก', s1_p:'ลากเดินผ่านเมือง ตึกหนึ่งหลังคือศิลปินหนึ่งคน เห็นรูปทรงแล้วถูกใจหลังไหน ก็ชี้หลังนั้น ไม่ต้องมีใครแนะนำ',
  s2_h:'เดินเข้าไปดูงาน', s2_p:'เปิดประตูตึก ไล่ดูทีละชั้น ทีละห้อง ผลงานแขวนอยู่บนผนังคอนกรีตจริง ๆ จับไม่ได้ แต่ดูได้นานเท่าที่อยากดู',
  s3_h:'สนับสนุนตรงถึงศิลปิน', s3_p:'เจอชิ้นที่ตามไปถึงในฝัน ก็ขอบคุณคนทำโดยตรง สนับสนุนเท่าที่อยากให้ เงินทุกบาทเข้ากระเป๋าคนวาด ไม่มีใครหักก่อน',
  feat_i:'Featured', feat_h:'ผลงานเด่นสัปดาห์นี้', feat_h_all:'ผลงานทั้งหมดในเมือง',
  sort_label:'เรียงตาม', sort_cur:'คัดมาให้',   sort_new:'ใหม่ล่าสุด',
  all_btn:'ดูทั้งหมด {n} ชิ้น', less_btn:'ดูเฉพาะชิ้นเด่น', feat_count:'แสดง {n} ชิ้น', card_aria:'{t} โดย{a} {p}',
  map_i:'The', map_h:'แผนที่เมือง', map_p:'มองจากข้างบน เมืองแบ่งเป็นย่านตามสาขา กดย่านหรือปุ่มกรอง แล้วตึกในแถบเมืองด้านบนจะสว่างขึ้นให้',
  filters_aria:'กรองตามสาขา', f_all:'ทั้งหมด', district:'ย่าน', plaza:'PLAZA · จัตุรัสกลางเมือง',
  fnote:'ไฮไลต์ {n} ตึกสาขา{d}ในแถบเมืองแล้ว', fnote_go:'ดูตึกในแถบเมือง ↑', fnote_in:'เข้าไปในตึก →', fnote_x:'ล้างตัวกรอง ✕',
  spot_i:'Artist of the week', spot_h:'นภา',
  q1:'ทำไมถึงเลิกส่งงานเข้าหอศิลป์?', a1:'ส่งไปสิบสองรอบ ได้คำตอบว่า "น่าสนใจ แต่ยังไม่ใช่ตอนนี้" ครบสิบสองรอบ สุดท้ายก็เข้าใจว่า "ตอนนี้" ของพวกเขาไม่เคยมาถึง เลยเลิกรอ',
  q2:'ทำไมต้องห้องว่างกับหมอก?', a2:'เพราะที่ว่างคือที่เดียวที่ไม่มีใครมาบอกว่าต้องรู้สึกยังไง ห้องว่างหนึ่งห้อง คนดูร้อยคน ได้ร้อยเรื่อง ไม่ต้องมีคิวเรเตอร์แปลให้',
  q3:'ถ้าคนเดินเข้ามาแล้วไม่สนับสนุนล่ะ?', a3:'ก็ไม่เป็นไร เดินดูฟรี นั่งเถียงกับภาพได้ ถ้าวันไหนงานตามไปหลอนถึงบ้าน ค่อยกลับมาสนับสนุนคนวาดตรง ๆ ไม่มีใครเก็บค่าแนะนำ',
  spot_cta:'เข้าไปในตึกนภา →', spot_meta:'NO.01 · {d} · ตั้งแต่ {y} · {c}',
  stats_aria:'ตัวเลขของเมือง', st1:'ศิลปินในเมือง', st2:'ผลงานในตึก', st3:'สาขาศิลปะ', st4:'เงินที่ถึงมือศิลปิน',
  join_k:'Get a building', join_i:'Your', join_h:'อยากมีตึกของตัวเอง?',
  p1_h:'ตึกเป็นของคุณ', p1_p:'จัดห้อง วางงาน เปลี่ยนชั้นได้ตามใจ ตึกหนึ่งหลังคือศิลปินหนึ่งคน ไม่มีใครมาแชร์ผนังด้วย',
  p2_h:'เงินเข้าคุณ 100%', p2_p:'รับเงินสนับสนุนตรงถึงมือ ไม่มีค่าคอมมิชชัน ไม่มีค่าฝากขาย ไม่มีใครหักก่อนถึงมือ',
  p3_h:'ไม่มีใครคัดงาน', p3_p:'ไม่มีคณะกรรมการ ไม่มีธีมประจำปี ไม่ถามว่าจบจากไหน ทำมาแล้วอยากให้คนเห็น ก็สร้างตึกได้เลย',
  join_btn:'ขอมีตึก →', jn_kick:'สำหรับศิลปิน', jn_cta:'เล่าให้เราฟังสั้น ๆ ว่าคุณทำงานแบบไหน แนบลิงก์ผลงาน แล้วเราจะติดต่อกลับทางอีเมล', jb_p:'รับการสนับสนุนตรง ไม่มีใครคัดงาน ขอแค่ยืนยันว่าบัญชีรับเงินเป็นของคุณ', jb_btn:'ขอมีตึกของคุณ →', skip_main:'ข้ามไปที่เนื้อหา',
  foot_h:'ศิลปะ<em>ไม่รอ</em>ใคร', foot_p:'อยากมีตึกในเมืองนี้ ส่งงานมาได้เลย เราไม่ถามว่าคุณเป็นใคร เราดูแค่ว่างานคุณเป็นยังไง ขอแค่บัญชีรับเงินเป็นของคุณจริง', foot_btn:'ขอมีตึก →',
  foot_menu:'เมนู', foot_social:'โซเชียล', foot_manifesto:'เกี่ยวกับ', foot_how:'วิธีใช้งาน', foot_feat:'ผลงานเด่น', foot_map:'แผนที่เมือง', foot_join:'ขอมีตึก',
  news_label:'ข่าวจากเมือง ตึกใหม่ งานใหม่ ส่งตรงถึงกล่องอีเมล ไม่สแปม ไม่ขายต่อ', news_btn:'สมัคร →', foot_copy:'© 2026 CIRCLES · เมืองเพิ่งเริ่ม ตอนนี้มีตึกแรกหนึ่งหลัง · NO GALLERY. NO MIDDLEMAN.',
  social_soon:'ลิงก์โซเชียลจะเปิดตอนเว็บขึ้นออนไลน์',
  /* dialogs + feedback */
  close:'ปิด', jd_title:'ขอมี<em>ตึก</em>ในเมืองนี้', jd_intro:'เล่าให้ฟังสั้น ๆ ว่าคุณทำอะไร ไม่ต้องมีประวัติยาว ไม่ต้องมีใครรับรอง เราดูที่งาน',
  jd_name:'ชื่อ / นามปากกา', jd_email:'อีเมล', jd_disc:'สาขา', jd_other:'อื่น ๆ', jd_link:'ลิงก์ผลงาน (เว็บ / Instagram / Drive)', jd_msg:'เล่าเกี่ยวกับงานของคุณ', jd_pay_h:'ช่องทางรับการสนับสนุน (ไม่บังคับ)', jd_pay_note:'ใส่ธนาคารและเลขบัญชีที่อยากให้คนสนับสนุนโอนเข้า เมื่อเราตอบอีเมล จะขอรูป QR รับเงินจากแอปธนาคารของคุณ เงินเข้าบัญชีคุณโดยตรง', jd_bank:'ธนาคาร', jd_send:'ส่งคำขอ →', jd_cancel:'ยกเลิก',
  jd_subject:'ขอมีตึกใน circles — {n}',   id_name:'ชื่อของคุณ', id_email:'อีเมลของคุณ',  
   
  done_mail:'เปิดแอปอีเมลของคุณแล้ว', done_mail_p:'กดส่งในแอปอีเมลเพื่อให้ข้อความถึงปลายทาง ถ้าไม่มีอะไรเปิดขึ้น ให้คัดลอกข้อความด้านล่างแล้วส่งเอง', done_sent:'ส่งเรียบร้อย', done_sent_p:'ขอบคุณ ข้อความถึงปลายทางแล้ว',
  copy_msg:'คัดลอกข้อความ', copied:'คัดลอกแล้ว', copy_fail:'คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง', to_label:'ถึง',
  news_saved:'บันทึกอีเมลไว้ในเครื่องนี้แล้ว (ยังไม่ได้เชื่อมระบบส่งจดหมาย)', news_sent:'สมัครรับข่าวเรียบร้อย', news_fail:'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง',
  captcha_wait:'รอให้การตรวจสอบเสร็จก่อนส่ง', note_mailto:'ตอนนี้ฟอร์มนี้ทำงานผ่านแอปอีเมลของคุณ', demo_note:'ข้อมูลศิลปินและอีเมลในเว็บนี้เป็นข้อมูลตัวอย่าง',
  /* cutaway */
  cw_est:'ก่อตั้ง {y}', cw_back:'← กลับไปเดินเมือง', cw_hint:'▼ ภาพตัดตึกทีละชั้น กดที่ผลงานเพื่อดูรายละเอียดเต็ม', cw_section:'SECTION A–A · ไม่มีลิฟต์ ใช้บันไดเท่านั้น',
  mus_name:'พิพิธภัณฑ์ของ{a}', mus_aria:'โถงแสดงภาพของ{a}', mus_prev:'← ภาพก่อน', mus_next:'เดินต่อ →', mus_more:'รายละเอียดและแนวคิด', mus_map:'ผังตึก', mus_hint:'▼ เดินดูภาพทีละชิ้น ใช้ลูกศร ← → บนคีย์บอร์ดได้ กดที่ภาพที่สว่างเพื่อดูรายละเอียดเต็ม',
  pf_h:'โปรไฟล์ของ{a}',   pf_cn:'แนวคิดของงาน{a}', pf_nw:'ผลงานในพิพิธภัณฑ์',  pf_ny:'เริ่มทำงานศิลปะ', pf_tl:'เส้นทางที่ผ่านมา',
  pf_wh:'ผลงานในพิพิธภัณฑ์', pf_hover:'แตะหรือชี้ที่ภาพเพื่อดูผลงาน', pf_all:'เดินเข้าไปดูทั้งหมด →', pf_sup1:'ชอบงานของ{a}?', pf_sup2:'ช่วยให้สร้างงานต่อ', pf_supn:'ทุกการสนับสนุนไปถึงศิลปินโดยตรง ช่วงเริ่มต้นนี้ Circles ยังไม่หักค่าธรรมเนียมจากศิลปิน', pf_supb:'โดเนทให้{a}',sup_qr_t:'สแกนเพื่อสนับสนุน{a}', sup_bank:'ธนาคาร', sup_acc_name:'ชื่อบัญชี', sup_acc_no:'เลขบัญชี', sup_copy:'คัดลอกเลขบัญชี', sup_copied:'คัดลอกแล้ว', sup_direct:'เงินเข้าบัญชีของ {a} โดยตรง circles ไม่ได้รับเงินแทน', sup_sample:'ข้อมูลตัวอย่างเท่านั้น ห้ามโอนเงิน', search_ph:'ค้นหาศิลปิน…', search_aria:'ค้นหาศิลปินจากชื่อ สาขา หรือเมือง', fnote_q:'พบ {n} ตึกที่ตรงกับคำค้น', fnote_q0:'ไม่พบศิลปินที่ตรงกับคำค้น', calm_off:'หยุดการเคลื่อนไหว', calm_on:'เปิดการเคลื่อนไหว', share_btn:'แชร์', share_copied:'คัดลอกลิงก์แล้ว', sup_hint:'บนมือถือ: บันทึกรูป QR แล้วเปิดแอปธนาคารของคุณ (เช่น BCEL One) เลือกสแกนจากรูปในเครื่อง', sup_save:'บันทึกรูป QR', pf_soon:'เร็วๆ นี้', sm_tag:'ตัวอย่าง / SAMPLE', sm_banner:'ตัวอย่าง (SAMPLE) · นี่คือการสาธิต ไม่มีอะไรถูกส่งออกไป ห้ามโอนเงินจริง', sm_qr_alt:'QR ตัวอย่าง ไม่ใช่ของจริง', tip_h:'เลือกจำนวนที่อยากสนับสนุน', tip_other:'จำนวนอื่น (USD)', tip_go:'ต่อไป', tip_bad:'ใส่จำนวนเต็ม 1–1000 ดอลลาร์', tip_amt:'ยอดสนับสนุน {m}', tip_sent:'ฉันโอนแล้ว', pay_notice_h:'แจ้งว่าโอนแล้ว', pay_slip:'สลิปโอนเงิน (ไม่บังคับ รูปภาพไม่เกิน 2 MB)', pay_slip_big:'ไฟล์ใหญ่เกิน 2 MB', pay_slip_type:'ต้องเป็นไฟล์รูปภาพ', pay_need_name:'กรอกชื่อ', pay_need_email:'กรอกอีเมลให้ถูกต้อง', pay_submit:'ส่งแจ้งโอน', pay_sending:'กำลังส่ง…', pay_back:'ย้อนกลับ', pay_done_h:'แจ้งโอนแล้ว · ขอบคุณ (สาธิต)', pay_done_tip:'บันทึกการแจ้งโอน {m} ให้ {a} แบบจำลองแล้ว ของจริง {a} จะกดยืนยันเมื่อเห็นยอดเข้าบัญชีของตัวเอง นี่คือการสาธิต ไม่มีอะไรถูกส่งออกไปและไม่มีเงินเคลื่อนไหว',        dlg_supn:'เงินเข้าบัญชีศิลปินโดยตรง ตอนนี้ circles ไม่หักค่าธรรมเนียม', don_done_real:'ส่งแจ้งแล้ว ศิลปินจะตรวจยอดและตอบกลับทางอีเมลที่คุณให้ไว้ ขอบคุณที่สนับสนุน', don_e_captcha:'ยืนยันตัวตนไม่ผ่าน ลองใหม่อีกครั้ง', don_e_busy:'ศิลปินมีแจ้งค้างอยู่มาก ลองใหม่ภายหลัง', don_e_rate:'ลองบ่อยเกินไป รอสักครู่', don_e_not_found:'ไม่พบศิลปินหรือผลงานนี้', don_e_bad_field:'ข้อมูลไม่ครบหรือไม่ถูกต้อง', don_e_net:'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง', don_e_slip:'ใช้ไฟล์สลิปนี้ไม่ได้ (JPG, PNG หรือ WebP)', don_none:'ศิลปินยังไม่ได้ใส่ข้อมูลบัญชีรับเงิน', don_work:'โดเนท · ได้แรงบันดาลใจจากงานนี้', bio_more:'อ่านต่อ', bio_less:'ย่อ', don_for:'เพื่อผลงาน “{t}”', don_how:'สแกน QR ด้วยแอปธนาคาร (เช่น BCEL One) หรือโอนเข้าบัญชีด้านล่าง แล้วกด “ฉันโอนแล้ว” เงินเข้าศิลปินโดยตรง ตอนนี้ circles ไม่หักค่าธรรมเนียม',        zoom_btn:'ขยายภาพเต็มจอ', zoom_in:'ซูมเข้า', zoom_out:'ซูมออก', zoom_reset:'ขนาดพอดี', zoom_hint:'เลื่อนล้อเมาส์หรือหยิกนิ้วเพื่อซูม ลากเพื่อเลื่อน กด Esc เพื่อปิด', hint_swipe:'▼ ปัดซ้าย-ขวาเพื่อเดินดูภาพ แตะที่ภาพเพื่อดูรายละเอียดเต็ม', nav_all:'ศิลปินทั้งหมด', bc_aria:'เส้นทางหน้า', bc_city:'เมือง', bc_artists:'ศิลปิน', bc_work:'ผลงาน',   
  pf_walk:'เดินเข้าพิพิธภัณฑ์ →', pf_ask:'ถามศิลปิน', pf_ig:'Instagram', pf_share:'แชร์โปรไฟล์ ↗', pf_copy:'คัดลอกลิงก์', pf_copied:'คัดลอกลิงก์แล้ว', pf_marq:'ART NOT SORRY ★ วงกลมไม่มีวันจบ ★ CIRCLES ★ เดินเข้าพิพิธภัณฑ์ ★ ',
  mus_prof:'ดูโปรไฟล์ศิลปิน', title_pf:'โปรไฟล์ของ{a} — circles', desc_pf:'รู้จัก{a} ศิลปินสาขา{d} แนวคิดของงาน ผลงานในพิพิธภัณฑ์ และช่องทางสนับสนุน',
  fold_spot:'อ่านบทสัมภาษณ์ 3 ข้อ', fold_foot:'เมนู',
        
           
     
      
   
  cw_meta:'{d} · ตั้งแต่ {y} · {c}', cw_view:'ดูรายละเอียด {t}', cw_prev:'← ตึกก่อนหน้า', cw_next:'ตึกถัดไป →', cw_roof:'{n} · STUDIO',
  lb_artist:'ศิลปิน', lb_year:'ปี', lb_medium:'วัสดุ', lb_size:'ขนาด',  w_prev:'← ชิ้นก่อน', w_next:'ชิ้นถัดไป →',                v_city:"ดูแบบตึก", v_map:"ดูแบบแผนที่", v_aria:"เลือกมุมมองเมือง", cw_look:'ดูรายละเอียด →', d_by:'โดย <b>{a}</b> · {d} · {c}',  d_story:'ที่มาของงานชิ้นนี้', cc_h:'แนวคิดของงาน', cc_origin:'ที่มา', cc_mat:'วัสดุ', cc_steps:'ขั้นตอนการทำ', cc_step:'ขั้นที่ {n}',
  cy_h:'วงกลมไม่มีปลายทาง ศิลปะก็เหมือนกัน', cy_p:'ชื่อ Circles มาจากความเชื่อว่างานศิลปะไม่มีวันจบ ศิลปินทำชิ้นหนึ่งเสร็จ ก็มีชิ้นต่อไปรออยู่เสมอ การสนับสนุนจากคนดูไม่ใช่จุดสิ้นสุด แต่เป็นแรงให้ทำต่อ และเมืองนี้ก็วนไปแบบนั้นเรื่อย ๆ', cy_1:'วาด', cy_2:'โชว์ในตึก', cy_3:'มีคนสนับสนุน', cy_4:'วาดต่อ', cy_aria:'วงจร 4 ขั้น: วาด โชว์ในตึก มีคนสนับสนุน แล้ววนกลับไปวาดต่อ',
  sup_h:'สนับสนุน Circles', sup_p:'ตอนนี้ศิลปินรับเงินเต็ม ไม่มีค่าธรรมเนียม เว็บอยู่ได้ด้วยเงินสนับสนุน ถ้ามีค่าธรรมเนียมในอนาคต เราจะบอกล่วงหน้า', sup_where:'เงินสนับสนุนไปไหน', sup_r1:'ค่าเซิร์ฟเวอร์และโดเมน', sup_r2:'การดูแลและพัฒนาเว็บ', sup_r3:'กิจกรรมและพื้นที่ใหม่สำหรับศิลปิน', sup_note:'ยังไม่มีการกำหนดสัดส่วน เราจะประกาศรายรับและรายจ่ายจริงเมื่อมีเงินสนับสนุนเข้ามา เงินที่คุณให้ศิลปินผ่านปุ่ม “สนับสนุน” ของแต่ละงานโอนตรงเข้าบัญชีของศิลปิน ไม่ผ่านมือ circles และไม่มีการหักค่าธรรมเนียม', don_btn:'สนับสนุน →', don_soon:'เร็วๆ นี้',   
  title_idx:'circles — เมืองของศิลปิน สนับสนุนตรงถึงคนทำ', title_cw:'ตึกของ{a} — circles',
  desc_idx:'circles เมืองของศิลปิน ตึกคอนกรีตหนึ่งหลังคือศิลปินหนึ่งคน ไม่มีหอศิลป์ ไม่มีคนกลาง เดินเข้าไปดูงานแล้วสนับสนุนตรงถึง\u2060คน\u2060ทำ',
  desc_cw:'เดินเข้าไปในตึกของ{a} ศิลปินสาขา{d} ดูผลงานทีละชั้น แล้วสนับสนุนตรงถึงศิลปิน',
  nf_h:'ตึกนี้ยังไม่ได้สร้าง', nf_p:'ไม่มีศิลปินคนนี้ในเมือง กลับไปเดินดูตึกที่มีอยู่',
  mq:['ศิลปินไม่มีกฎ','SUPPORT ART','สนับสนุนตรงถึงคนทำ','NO MIDDLEMAN','เมืองของศิลปิน','ART NOT SORRY'],
  nav_hi:'ไฮไลต์',
  nav_lg:'ย่านตำนาน',
  dist_k:'ป้ายทาง',
  dist_aria:'ทางลัดไปที่ต่าง ๆ ในเมือง',
  dist_city:'ตึกศิลปิน',
  dist_hi:'ไฮไลต์สัปดาห์นี้',
  dist_lg:'ย่านตำนาน',
  hi_h:'ไฮไลต์ประจำสัปดาห์',
  hi_meta:'ผลงานและแนวคิดที่คนดูถูกใจที่สุดในสัปดาห์นี้ เรียงจากปุ่ม “ถูกใจ” ไม่นับยอดเงินโดเนท',
  hi_week:'สัปดาห์ที่ {n} · {r} {y}',
  hi_how_k:'นับยังไง',
  hi_how:'เรียงจากจำนวนคนกด “ถูกใจ” ในสัปดาห์นี้ ถ้าเท่ากันดูจากจำนวนคนดู ไม่นับยอดเงินโดเนท',
  hi_not:'ไม่ใช่การแข่งขัน ทุกงานดีในแบบของตัวเอง ไฮไลต์นี้แค่บอกว่าสัปดาห์นี้คนดูถูกใจอะไร',
  hi_t_w:'ผลงาน',
  hi_t_c:'แนวคิด',
  hi_t_n:'ศิลปินใหม่น่าจับตา',
  hi_by:'โดย {a}',
  hi_views:'{n} คนดู',
  hi_res:'♥ {n} ถูกใจ',
  hi_open:'อันดับ {n}: {t} โดย {a}',
  hi_dir:'อันดับ 4–6',
  hi_c_lead:'แนวคิดที่คนกด “ถูกใจ” มากที่สุดในสัปดาห์นี้ ทุกประโยคเป็นคำของศิลปินเอง',
  hi_own:'คำของศิลปินเอง',
  hi_from:'จากงาน “{t}”',
  hi_n_lead:'ที่สำหรับศิลปินที่เพิ่งเข้าร่วมไม่เกิน 3 เดือน สัปดาห์ละ 1 คน ยอดยังน้อยก็มีที่ยืน',
  hi_n_badge:'ศิลปินใหม่น่าจับตา',
  hi_joined:'เข้าร่วมเมื่อ {n} สัปดาห์ก่อน',
  hi_n_go:'ไปดูตึกของ{a}',
  hi_n_more:'น่าจับตาเหมือนกัน',
  res_btn:'ถูกใจ',
  res_on:'ถูกใจแล้ว',
  lg_h:'ย่านตำนาน',
  lg_meta:"ภาพวาดของผู้วางรากฐานศิลปะ คัดทีละชิ้น ใส่เครดิตทุกชิ้น ย่านนี้ไม่มีปุ่มโดเนท",
  lg_lead:"ภาพวาดของคนที่วางรากฐานให้ศิลปะ คัดทีละชิ้นโดย circles ใช้เฉพาะภาพที่หมดลิขสิทธิ์จากคลังภาพของพิพิธภัณฑ์ และใส่เครดิตทุกชิ้น คำของจิตรกรในแต่ละห้องเป็นคำของเขาเองพร้อมที่มา ส่วนบันทึกประวัติเป็นคำของ circles",
  lg_nodon:'ย่านนี้ไม่มีปุ่มโดเนท เพราะเจ้าของงานจากไปแล้ว ถ้าอยากสนับสนุนศิลปินที่ยังทำงานอยู่ ไปดูไฮไลต์ประจำสัปดาห์',
  lg_go:'ไปสนับสนุนศิลปินที่ยังทำงานอยู่', lg_open:'ดูประวัติและผลงานของเขา →',
  lg_img:"ภาพวาด",
  lg_count:"{n} ภาพบนผนัง",
  foot_set:'ตั้งค่า (ศิลปิน)',   nav_don:'บริจาค', foot_report:'แจ้งปัญหา',   rp_work:'แจ้งงานนี้',
  mk_go:'เข้าไปในตึกของผม →',   mk_k:'ตึกแรกของเมือง', mk_h:'งานของผม', mk_p:'เมืองนี้เริ่มจากงานเล็ก ๆ ที่ผมทำเอง ตัดแปะ ซ้อนภาพ ใส่ดาวแดง ผมเป็นนักศึกษาไอทีปีหนึ่งที่เวียงจันทน์ ภาพเหล่านี้เป็นฝีมือผม ใช้เป็นเสียงของเมืองไปก่อนที่ศิลปินคนอื่นจะเข้ามา', mk_a1:'ภาพตัดแปะภาพวาดสระบัวและคำว่า ART ซ้ำ ๆ มีดาวแดงลอยทับ', mk_a2:'ภาพม้าขาวสีเทา มีดาวแดงบนหน้าผาก', mk_a3:'ภาพตัดแปะสีเขียวสะท้อนแสง มีดาวสีชมพูและจุดสีส้ม',
  lg_f_title:"ชื่อภาพ",
  lg_f_maker:"จิตรกร · ปี",
  lg_f_own:"แนวคิดของเขา ในคำของเขาเอง",
  lg_f_src:'ที่มา',
  lg_f_hist:"บันทึกประวัติ (คำของ circles ไม่ใช่คำของจิตรกร)",
  lg_f_credit:'เครดิตไฟล์และสัญญาอนุญาต',
  sc_link:'ช่วยให้ circles ไปต่อ',
  sc_title:'ช่วย circles',
  sc_k:'เงินให้ circles',
  sc_not:'เงินก้อนนี้เข้าบัญชี circles เพื่อดูแลเว็บ ไม่ไปถึงศิลปิน และไม่เกี่ยวกับที่โดเนทให้ศิลปิน จะช่วยหรือไม่ก็ได้',
  sc_pick:'เลือกจำนวนที่อยากช่วย circles',
  sc_acc:'circles (ตัวอย่าง)',
  sc_qr_t:'สแกนเพื่อช่วย circles',
  sc_how:'สแกน QR ด้วยแอปธนาคาร แล้วกด “ฉันช่วยแล้ว” (สาธิต: ไม่มีเงินเคลื่อนไหวจริง)',
  sc_sent:'ฉันช่วยแล้ว',
  sc_total:'ช่วย circles {m}',
  sc_done_h:'ขอบคุณที่ช่วย circles (สาธิต)',
  sc_done_p:'บันทึกการช่วย circles {m} แบบจำลองแล้ว เงินก้อนนี้ไม่ได้ไปถึงศิลปิน นี่คือการสาธิต ไม่มีเงินเคลื่อนไหว',
  af_h:'อยากช่วยให้เว็บนี้ไปต่อไหม',
  af_p:'เงินที่โอนไปเข้าบัญชีของศิลปินโดยตรง circles ไม่หักอะไรเลย ถ้าอยากช่วยค่าดูแลเว็บ มีช่องแยกให้ ช่วยหรือไม่ก็ได้',
  af_btn:'ช่วย circles (แยกจากศิลปิน)',
  fl_k:'ชั้น',
  fl_sr:'ขั้นที่ {n} จาก {m}: {s}',
  fl_1:'เลือกยอด',
  fl_2:'สแกนจ่าย',
  fl_3:'แจ้งโอน',
  fl_4:'ขอบคุณ',
  room_k:'ห้อง',
  change_amt:'เปลี่ยนจำนวน',
  pay_notice_p:'{a} จะเห็นชื่อและข้อความของคุณในหน้าจัดการของศิลปิน',
  v_h:'ศิลปินเล่าเอง',
  v_stamp:'เขียนโดยศิลปิน',
  v_say:'งานนี้อยากบอกว่า',
  v_why:'ที่มาของงาน',
  v_look:'อยากให้ดูตรงนี้',
  v_by:'— {a} เจ้าของผลงาน',
  v_tb_by:'ผู้เขียน',
  v_tb_work:'ผลงาน',
  v_note:'ทั้งหมดเป็นคำของศิลปินเอง circles ไม่แก้ไขและไม่ตีความแทน',
  v_soon:'เร็วๆ นี้', v_soon_p:'ยังไม่มีคำของศิลปินสำหรับชิ้นนี้ {a} จะเขียนเองเมื่อพร้อม เราไม่เขียนแทน',
  cc_soon_p:'{a} ยังไม่ได้เขียนแนวคิดของงานชิ้นนี้ ที่มา วัสดุ และขั้นตอนจะมาอยู่ตรงนี้เมื่อศิลปินเขียนเอง',
  f_say:'งานนี้อยากบอกอะไร (ประโยคเดียว)',
  f_why:'ที่มาของงาน',
  f_look:'อยากให้ดูตรงไหน',
  pf_say_k:'ศิลปินเล่าเอง',
  sc_done_r_h:'ขอบคุณที่ช่วย circles',
  sc_done_r_p:'ขอบคุณที่ช่วยดูแลเว็บ {m} ทีมงานจะเห็นยอดเมื่อเงินเข้าบัญชี circles เงินก้อนนี้ไม่ได้ไปถึงศิลปิน',
  /* studio tower (2026-10-22): ideas / sketches / works floors, stages in the work window */
  tw_hint_k:'ลองเล่น', tw_hint1:'กดหน้าต่างเพื่อเข้าไปดูงาน', tw_hint:'กดปุ่มลิฟต์เพื่อเปิดไฟชั้นนั้น ชั้นอื่นจะมืดลง กดหน้าต่างเพื่อเข้าไปดูงาน',
  tw_roof:'ตึกของ {n}', tw_don:'โดเนทให้ {a}', tw_lift:'ลิฟต์', tw_lift_all:'เปิดไฟทั้งตึก', tw_fl:'ชั้น {n}', tw_fl_r:'ชั้น {a}–{b}',
  tw_cat_idea:'ไอเดีย', tw_cat_sketch:'สเก็ตช์', tw_cat_work:'ผลงานจริง',
  tw_room_idea:'ดาดฟ้า · ไอเดีย', tw_room_sketch:'ห้องสเก็ตช์', tw_room_work:'ห้องจัดแสดง',
  tw_more:'แสดง {n} จาก {m} ชิ้น ดูครบทุกชิ้นในตารางเทียบด้านล่าง',
  tw_lobby_k:'ล็อบบี้', tw_sup_site:'สนับสนุน circles',
  tw_lobby_note:'circles ไม่หักเปอร์เซ็นต์จากศิลปิน เงินที่โดเนทให้ศิลปินไปถึงศิลปินโดยตรง ส่วนการสนับสนุน circles แยกต่างหาก ไม่เกี่ยวกัน',
  st_idea:'ไอเดีย', st_sketch:'สเก็ตช์', st_draft:'ร่าง', st_final:'ผลงานจริง',
  st_none_idea:'ยังไม่มีไอเดีย', st_none_sketch:'ยังไม่มีสเก็ตช์', st_none_draft:'ยังไม่มีร่าง', st_none_final:'ยังไม่มีภาพ',
  st_h:'ขั้นตอนของงานชิ้นนี้', st_tabs:'เลือกขั้นตอน', st_peel:'ลอกชั้น', st_peel_hint:'เลื่อนเพื่อดูภาพค่อย ๆ เปลี่ยนจากไอเดียไปเป็นงานจริง', st_tl:'เส้นเวลาของงาน',
  st_none_all:'ศิลปินยังไม่ได้ใส่ไอเดีย สเก็ตช์ หรือร่างของงานชิ้นนี้ ตอนนี้มีแต่ผลงานจริง',
  st_sheet_h:'ตารางเทียบ · ทุกงาน × ทุกขั้น', st_sheet_p:'กดช่องไหนก็ได้เพื่อเปิดงานชิ้นนั้นที่ขั้นตอนนั้น ช่องลายขีดคือขั้นที่ศิลปินยังไม่ได้ใส่', st_work:'ผลงาน', st_open:'เปิด {t} · {s}',
},
en: {
  sc_h:'Shortcuts', sc_rand:'Random artwork', sc_new:'New artists', sc_hl:'This week\'s highlights', sc_find:'Search by name',
  /* UX pass (2026-10-18) */
  hi_soon:'Highlights start once real visitors press Resonated. There is no data yet.',
  real_done_h:'Thank you for supporting', real_done_p:'The money you sent went straight to {a}’s account, and {a} will see it in their own bank app. For now circles keeps no record of your transfer.',
  lr_k:'Last room', mus_prof2:"{a}'s story",
  hero_cta2:'See featured work', hero_t1:'No fee taken for now', hero_t2:'Money goes straight to the artist', f_branch:'Art form',
  /* trust copy (2026-10-18) */
  don_trust:'This money goes straight to {a}’s own account · circles takes no fee and never holds it', don_check:'Before you confirm in your bank app, check that the recipient name matches the account name above.',
  don_fee:'The amount shown is a reference. The currency actually sent and any bank fee are set by your own bank. circles adds nothing.',
  st_note:'circles takes no fee. Any bank fee is set by the sender’s bank.',
  ji_lead:'Leave your name here. This page only shows your interest. It is not an application and it does not confirm that you have joined.',
  ji_wait:'One person looks after this city. We will read the list when we are ready. We cannot say when we will get back to you, and we may not reach everyone, so there is no need to chase us.',
  ji_h:'Leave your name',
  ji_name:'Your name or artist name, as you want it shown',
  ji_name_s:'A pen name is fine',
  ji_name_ph:'e.g. Napha',
  ji_contact:'How to reach you',
  ji_contact_s:'Email or Instagram, either one',
  ji_contact_ph:'napha@email.com or @napha',
  ji_link:'Link to your work',
  ji_link_s:'Where we can see it, e.g. Instagram, Behance or your own site',
  ji_send:'Leave my name',
  ji_note:'We use your contact and link only to consider your request. We do not use them for anything else, and you can ask us to delete them at any time. · <a href="privacy.html">Privacy</a>',
  ji_st:'Not an acceptance yet',
  ji_done_h:'We got it',
  ji_done_p:'Thank you for your interest. This only means we have kept your name. We will get back to you when we are ready, which may take a long time, and we may not reach everyone. No need to send it again.',
  ji_done_btn:'Walk the city →',
  ji_e_name:'Add the name you want shown first',
  ji_e_contact:'Add an email or Instagram so we can reach you',
  ji_e_link:'That link looks incomplete. Please check it',
  ji_e_fail:'It did not go through. Try again in a moment; what you typed is still here',
  jn_verify:'When requests open, we still do not jury work or judge taste. The one thing we check is that the payout account is yours. We will ask for a screenshot that shows only the account name and the last 4 digits (hide the rest). Only the site admin sees it, and it is deleted within 30 days after the check. Details are in the privacy policy. We do not collect this screenshot now.',
  jn_closed_h:'Building requests are not open yet', jn_closed_p:'The city has only just started, with one building so far: Arne’s. We are not taking requests from other artists yet, and this page has no form and collects nothing. When we are ready, we will announce it on the home page first.',
  cw_back_first:'Visit the first building →',
  sup_led_in:'Received', sup_led_out:'Spent', sup_led_left:'Left', sup_led_none:'None yet',
  nav_city:'City', nav_about:'About', nav_map:'Map', nav_join:'Get a building', menu_aria:'Menu', lang_aria:'Switch language',
  wave:'NEW WAVE', f_wave:'★ New wave', fnote_wave:'Highlighted {n} new-wave building(s) in the strip',
  ld_top:'circles · a city of artists', ld_text:'Building the city…', ld_skip:'Skip intro',
  legal_privacy:'Privacy policy', legal_terms:'Terms of use',
  consent_form:'By sending this you accept the <a href="privacy.html">privacy policy</a>. Your details go only to the recipient named above.',
  news_consent:'By subscribing you accept the <a href="privacy.html">privacy policy</a>. Unsubscribe any time.',
  hero_hl1:'A city of artists', hero_hl2:'Room for art', hero_hl3:"that won't shut up",
  hero_lead:'One concrete building, one artist. No gallery, no middleman. Walk in, look at the work, then support the person who made it, directly.', hero_cta:'Enter the city →',
  city_h:'City', city_p:"Drag or scroll right to walk through the city. Each building is one artist's studio, and the pictures set into the concrete are real works.",
  pager_l:'Scroll left', pager_r:'Scroll right', strip_aria:'City of artists, scroll left and right', bd_aria:"Enter {a}'s building, {d}", works_n:'{n} WORKS',
  mani_k:'Manifesto', mani1:'NO GALLERY', mani2:'NO MIDDLEMAN', mani3:'NO CUT TAKEN', mani4:'JUST MAKER + VIEWER',
  mani_aria:'No gallery. No middleman. No cut taken. Just the maker and the viewer.',
  mani_note:"Here artists are supported directly by the people who love their work, and talk to them themselves. Nobody sits between us and the work, because art should travel from the maker's hand to the lover's hand, not stop to pay a toll first.",
  how_i:'3 steps', how_h:'How to use it',
  s1_h:'Pick a building', s1_p:"Drag through the city. One building is one artist. See a shape you like, point at it. Nobody needs to recommend anything.",
  s2_h:'Walk in and look', s2_p:"Open the door and go floor by floor, room by room. The work hangs on real concrete walls. You can't touch it, but you can look as long as you like.",
  s3_h:'Support the artist directly', s3_p:'Found the piece that follows you home? Thank the maker directly and support them as much as you like. Every cent goes to the artist, nobody skims first.',
  feat_i:'Featured', feat_h:"This week's picks", feat_h_all:'Every work in the city',
  sort_label:'Sort by', sort_cur:'Curated',   sort_new:'Newest',
  all_btn:'Show all {n} works', less_btn:'Featured only', feat_count:'Showing {n} works', card_aria:'{t} by {a}, {p}',
  map_i:'The', map_h:'City map', map_p:'From above, the city splits into districts by discipline. Tap a district or a filter and the matching buildings light up in the strip above.',
  filters_aria:'Filter by discipline', f_all:'All', district:'DISTRICT', plaza:'PLAZA · CITY SQUARE',
  fnote:'Highlighted {n} building(s) in the {d} district', fnote_go:'See buildings in the strip ↑', fnote_in:'Enter building →', fnote_x:'Clear filter ✕',
  spot_i:'Artist of the week', spot_h:'Napha',
  q1:'Why did you stop sending work to galleries?', a1:"Twelve submissions, and twelve times the answer was 'interesting, but not right now'. In the end I understood their 'now' never arrives, so I stopped waiting.",
  q2:'Why empty rooms and fog?', a2:'Because empty space is the only place nobody tells you how to feel. One empty room, a hundred viewers, a hundred stories. No curator needed to translate.',
  q3:"What if people walk in and don't donate?", a3:"That's fine. Looking is free, argue with the painting as long as you like. If a piece haunts you all the way home, come back and support the painter directly. Nobody charges a finder's fee.",
  spot_cta:"Enter Napha's building →", spot_meta:'NO.01 · {d} · since {y} · {c}',
  stats_aria:'The city in numbers', st1:'Artists in the city', st2:'Works inside the buildings', st3:'Art forms', st4:'Of the money reaches the artist',
  join_k:'Get a building', join_i:'Your', join_h:'Want a building of your own?',
  p1_h:'The building is yours', p1_p:"Arrange rooms, hang work, change floors however you like. One building, one artist. Nobody shares your walls.",
  p2_h:'You keep 100%', p2_p:'Get supported directly. No commission, no consignment fee, nobody skims before it reaches you.',
  p3_h:'No one judges the work', p3_p:"No committee, no yearly theme, nobody asks where you graduated. Made something you want people to see? You can build.",
  join_btn:'Get a building →', jn_kick:'For artists', jn_cta:'Tell us briefly what you make and add a link to your work. We will get back to you by email.', jb_p:'Get supported directly, no jury. We only check that the payout account is yours.', jb_btn:'Get your own building →', skip_main:'Skip to content',
  foot_h:'Art <em>waits</em> for no one', foot_p:"Want a building in this city? Send us your work. We won't ask who you are, only what your work is like. We only need the payout account to really be yours.", foot_btn:'Get a building →',
  foot_menu:'Menu', foot_social:'Social', foot_manifesto:'About', foot_how:'How it works', foot_feat:'Featured', foot_map:'City map', foot_join:'Get a building',
  news_label:'News from the city: new buildings, new work, straight to your inbox. No spam, never resold.', news_btn:'Subscribe →', foot_copy:'© 2026 CIRCLES · the city has only just started, one building so far · NO GALLERY. NO MIDDLEMAN.',
  social_soon:'Social links open when the site goes live',
  close:'Close', jd_title:'Request a <em>building</em> in this city', jd_intro:"Tell us briefly what you make. No long CV, no references. We look at the work.",
  jd_name:'Name / pen name', jd_email:'Email', jd_disc:'Discipline', jd_other:'Other', jd_link:'Link to your work (site / Instagram / Drive)', jd_msg:'Tell us about your work', jd_pay_h:'How people can support you (optional)', jd_pay_note:'Add the bank and account you want supporters to pay into. When we reply by email we will ask for the receive-money QR from your bank app. The money goes straight to you.', jd_bank:'Bank', jd_send:'Send request →', jd_cancel:'Cancel',
  jd_subject:'Building request for circles — {n}',   id_name:'Your name', id_email:'Your email',  
   
  done_mail:'Your email app is opening', done_mail_p:"Press send in your email app so the message reaches its destination. If nothing opened, copy the text below and send it yourself.", done_sent:'Sent', done_sent_p:'Thank you. The message has been delivered.',
  copy_msg:'Copy message', copied:'Copied', copy_fail:"Couldn't copy. Select the text and copy it yourself.", to_label:'To',
  news_saved:'Email saved in this browser only (no mailing system is connected yet)', news_sent:"You're subscribed", news_fail:"Couldn't send. Please try again.",
  captcha_wait:'Please wait for the verification to finish', note_mailto:'For now this form works through your email app', demo_note:'Artist details and emails on this site are sample data',
  cw_est:'Est. {y}', cw_back:'← Back to the city', cw_hint:'▼ The building cut open, floor by floor. Click a work for full details', cw_section:'SECTION A–A · NO LIFT, STAIRS ONLY',
  mus_name:"{a}'s museum", mus_aria:"{a}'s picture hall", mus_prev:'← Previous', mus_next:'Walk on →', mus_more:'Details & concept', mus_map:'Floor plan', mus_hint:'▼ Walk the hall one work at a time. Use the ← → keys. Click the lit work for full details',
  pf_h:"{a}'s profile",   pf_cn:"{a}'s concept", pf_nw:'works in the museum',  pf_ny:'making art since', pf_tl:'The road so far',
  pf_wh:'Works in the museum', pf_hover:'Tap or point at a picture to see the work', pf_all:'Walk in and see them all →', pf_sup1:"Like {a}'s work?", pf_sup2:'Help keep it going', pf_supn:'Every bit of support goes straight to the artist. For now Circles takes no fee from artists.', pf_supb:'Donate to {a}',sup_qr_t:'Scan to support {a}', sup_bank:'Bank', sup_acc_name:'Account name', sup_acc_no:'Account number', sup_copy:'Copy account number', sup_copied:'Copied', sup_direct:'The money goes straight to {a}\'s account. circles never holds it.', sup_sample:'Sample data only. Do not transfer money.', search_ph:'Search artists…', search_aria:'Search artists by name, discipline or city', fnote_q:'{n} building(s) match your search', fnote_q0:'No artist matches your search', calm_off:'Pause motion', calm_on:'Resume motion', share_btn:'Share', share_copied:'Link copied', sup_hint:'On a phone: save the QR image, then open your bank app (for example BCEL One) and scan it from your gallery.', sup_save:'Save QR image', pf_soon:'Coming soon', sm_tag:'SAMPLE', sm_banner:'SAMPLE · this is a demo. Nothing is sent. Do not transfer real money.', sm_qr_alt:'Sample QR, not real', tip_h:'Choose an amount to give', tip_other:'Other amount (USD)', tip_go:'Continue', tip_bad:'Enter a whole number from 1 to 1000 dollars', tip_amt:'Donation: {m}', tip_sent:"I've donated", pay_notice_h:'I\'ve donated', pay_slip:'Transfer slip (optional, image up to 2 MB)', pay_slip_big:'The file is larger than 2 MB', pay_slip_type:'It must be an image file', pay_need_name:'Please enter your name', pay_need_email:'Please enter a valid e-mail', pay_submit:'Send notice', pay_sending:'Sending…', pay_back:'Back', pay_done_h:'Notice sent · thank you (demo)', pay_done_tip:'A pretend transfer notice of {m} to {a} was recorded. For real, {a} confirms it once the money shows up in their own account. This is a demo: nothing was sent and no money moved.',        dlg_supn:'The money goes straight to the artist. For now circles takes no fee.', don_done_real:'Notice sent. The artist will check the amount and write to the e-mail you gave. Thank you for your support!', don_e_captcha:'Verification failed. Try again.', don_e_busy:'The artist has many notices waiting. Try again later.', don_e_rate:'Too many tries. Wait a moment.', don_e_not_found:'This artist or work was not found', don_e_bad_field:'Some details are missing or wrong', don_e_net:'Could not send. Try again.', don_e_slip:'The slip file cannot be used (JPG, PNG or WebP)', don_none:'The artist has not added payment details yet', don_work:'Donate · inspired by this work', bio_more:'More', bio_less:'Less', don_for:'For the work “{t}”', don_how:'Scan the QR with your bank app (for example BCEL One) or transfer to the account below, then press “I have donated”. The money goes straight to the artist. For now circles takes no fee.',        zoom_btn:'View the artwork fullscreen', zoom_in:'Zoom in', zoom_out:'Zoom out', zoom_reset:'Fit to screen', zoom_hint:'Scroll or pinch to zoom, drag to move, Esc to close', hint_swipe:'▼ Swipe left and right to walk the hall. Tap a work for full details', nav_all:'All artists', bc_aria:'Breadcrumb', bc_city:'City', bc_artists:'Artists', bc_work:'Work',   
  pf_walk:'Walk into the museum →', pf_ask:'Ask the artist', pf_ig:'Instagram', pf_share:'Share profile ↗', pf_copy:'Copy link', pf_copied:'Link copied', pf_marq:'ART NOT SORRY ★ CIRCLES NEVER END ★ CIRCLES ★ WALK INTO THE MUSEUM ★ ',
  mus_prof:'View artist profile', title_pf:"{a}'s profile — circles", desc_pf:"Meet {a}, {d} artist: the ideas behind the work, the works in the museum, and a way to support them.",
  fold_spot:'Read the 3-question interview', fold_foot:'Menu',
        
           
     
      
   
  cw_meta:'{d} · since {y} · {c}', cw_view:'View details of {t}', cw_prev:'← Previous building', cw_next:'Next building →', cw_roof:'{n} · STUDIO',
  lb_artist:'Artist', lb_year:'Year', lb_medium:'Medium', lb_size:'Size',  w_prev:'← Previous work', w_next:'Next work →',                v_city:"Buildings", v_map:"Map", v_aria:"Choose how to see the city", cw_look:'View details →', d_by:'by <b>{a}</b> · {d} · {c}',  d_story:'The story behind it', cc_h:'Concept of the work', cc_origin:'Origin', cc_mat:'Materials', cc_steps:'How it was made', cc_step:'Step {n}',
  cy_h:'A circle has no end. Neither does art.', cy_p:'The name Circles comes from the belief that art is never finished. When an artist completes one piece, the next is already waiting. Support is not an ending. It is what lets the artist keep going, and the city keeps turning that way.', cy_1:'Draw', cy_2:'Show in the building', cy_3:'Someone supports', cy_4:'Draw again', cy_aria:'A loop of 4 steps: draw, show in the building, someone supports, then back to drawing again',
  sup_h:'Support Circles', sup_p:'Right now artists keep the full amount, with no fees. The site runs on support. If we ever add a fee, we will tell you in advance.', sup_where:'Where the support goes', sup_r1:'Servers and domain', sup_r2:'Running and improving the site', sup_r3:'Events and new space for artists', sup_note:'No shares are set yet. We will publish real income and spending once support comes in. Money you give an artist through a work’s “Support” button goes straight to that artist’s own account. It does not pass through circles and nothing is deducted.', don_btn:'Support →', don_soon:'Coming soon',   
  title_idx:'circles — a city of artists. Support the maker directly', title_cw:"{a}'s building — circles",
  desc_idx:'circles is a city of artists. One concrete building is one artist. No gallery, no middleman. Walk in, look at the work, support the maker directly.',
  desc_cw:"Walk into {a}'s building. {d} artist. See the work floor by floor, then support the artist directly.",
  nf_h:"This building doesn't exist yet", nf_p:'No artist by that name lives here. Go back and walk the buildings that do.',
  mq:['NO RULES FOR ARTISTS','SUPPORT ART','SUPPORT THE MAKER','NO MIDDLEMAN','CITY OF ARTISTS','ART NOT SORRY'],
  nav_hi:'Highlights',
  nav_lg:'Legends',
  dist_k:'Signposts',
  dist_aria:'Shortcuts to places in the city',
  dist_city:'Artists’ buildings',
  dist_hi:'This week',
  dist_lg:'Legends',
  hi_h:'Weekly highlights',
  hi_meta:'The works and ideas people resonated with most this week. Ranked by the Resonated button; donation amounts never count.',
  hi_week:'Week {n} · {r} {y}',
  hi_how_k:'How it’s counted',
  hi_how:'Ranked by how many people tapped “Resonated” this week; views break ties. Donation amounts never count.',
  hi_not:'Not a competition. Every work is good in its own way; this only shows what moved people this week.',
  hi_t_w:'Works',
  hi_t_c:'Concepts',
  hi_t_n:'New artist to watch',
  hi_by:'by {a}',
  hi_views:'{n} views',
  hi_res:'♥ {n} resonated',
  hi_open:'Number {n}: {t} by {a}',
  hi_dir:'Numbers 4–6',
  hi_c_lead:'The concepts people resonated with most this week. Every line is the artist’s own words.',
  hi_own:'Artist’s own words',
  hi_from:'from “{t}”',
  hi_n_lead:'A spot for an artist who joined less than 3 months ago, one each week, even with small numbers.',
  hi_n_badge:'New artist to watch',
  hi_joined:'Joined {n} weeks ago',
  hi_n_go:'Visit {a}’s building',
  hi_n_more:'Also worth watching',
  res_btn:'Resonated',
  res_on:'Resonated',
  lg_open:'His story and work →',
  lg_h:'Legends',
  lg_meta:"Paintings by the people who laid the foundations of art. Picked one piece at a time, every piece credited. No donate button here.",
  lg_lead:"Paintings by the people who laid the foundations of art. Picked one piece at a time by circles, only public-domain images from museum archives, every piece credited. The words in each room are the painter’s own, with their source. The historical note is circles’ own.",
  lg_nodon:'There is no donate button here: these makers have passed away. To support artists who are still working, see this week’s highlights.',
  lg_go:'Support living artists',
  lg_img:"Paintings",
  lg_count:"{n} paintings on the walls",
  foot_set:'Settings (artists)',   nav_don:'Donate', foot_report:'Report a problem',   rp_work:'Report this work',
  mk_go:'Walk into my building →',   mk_k:'The city’s first building', mk_h:'My own work', mk_p:'This city started from small things I made myself: collage, layered images, red stars. I am a first-year IT student in Vientiane. These pieces are mine, and they are the voice of the city until other artists arrive.', mk_a1:'Collage of a water-lily pond painting with the word ART repeated and red stars floating over it', mk_a2:'Grey-toned white horse with a red star on its forehead', mk_a3:'Neon green collage with pink stars and orange dots',
  lg_f_title:"Title",
  lg_f_maker:"Painter · year",
  lg_f_own:"His concept, in his own words",
  lg_f_src:'Source',
  lg_f_hist:"Historical note (circles’ words, not the painter’s)",
  lg_f_credit:'File credit and license',
  sc_link:'Help circles keep going',
  sc_title:'Support circles',
  sc_k:'Money for circles',
  sc_not:'This goes to circles’ own account to run the site. It does not reach any artist and is separate from your donation to an artist. Entirely optional.',
  sc_pick:'Choose how much to give circles',
  sc_acc:'circles (sample)',
  sc_qr_t:'Scan to support circles',
  sc_how:'Scan the QR with your banking app, then tap “I’ve given” (demo: no real money moves).',
  sc_sent:'I’ve given',
  sc_total:'Support circles: {m}',
  sc_done_h:'Thank you for supporting circles (demo)',
  sc_done_p:'A pretend gift of {m} to circles was recorded. It did not go to any artist. This is a demo: no money moved.',
  af_h:'Want to help this site keep going?',
  af_p:'The money you just sent goes straight into the artist’s own account and circles takes nothing out. If you’d like to help with running costs, there is a separate option. Entirely up to you.',
  af_btn:'Support circles (separate from the artist)',
  fl_k:'Floor',
  fl_sr:'Step {n} of {m}: {s}',
  fl_1:'Amount',
  fl_2:'Scan',
  fl_3:'Notice',
  fl_4:'Thanks',
  room_k:'Room',
  change_amt:'Change amount',
  pay_notice_p:'{a} sees your name and message in the artist’s dashboard.',
  v_h:'In the artist’s words',
  v_stamp:'Written by the artist',
  v_say:'What this work says',
  v_why:'Where it came from',
  v_look:'Look here',
  v_by:'— {a}, who made this work',
  v_tb_by:'Written by',
  v_tb_work:'Work',
  v_note:'These are the artist’s own words. circles does not edit or interpret them.',
  v_soon:'Coming soon', v_soon_p:'No words from the artist for this work yet. {a} will write them when ready; we do not write them for anyone.',
  cc_soon_p:'{a} has not written the concept for this work yet. Its origin, material and steps will appear here once the artist writes them.',
  f_say:'What this work says (one sentence)',
  f_why:'Where it came from',
  f_look:'Where to look',
  pf_say_k:'In the artist’s words',
  sc_done_r_h:'Thank you for supporting circles',
  sc_done_r_p:'Thank you for helping run the site with {m}. It is counted when it reaches circles’ account. It did not go to any artist.',
  /* studio tower (2026-10-22): ideas / sketches / works floors, stages in the work window */
  tw_hint_k:'Try it', tw_hint1:'Click a window to step inside the work.', tw_hint:'Press a lift button to light that floor; the others go dark. Click a window to step inside the work.',
  tw_roof:"{n}'S BUILDING", tw_don:'Donate to {a}', tw_lift:'Lift', tw_lift_all:'Light the whole building', tw_fl:'Floor {n}', tw_fl_r:'Floors {a}–{b}',
  tw_cat_idea:'Ideas', tw_cat_sketch:'Sketches', tw_cat_work:'Finished works',
  tw_room_idea:'Roof deck · ideas', tw_room_sketch:'Sketch room', tw_room_work:'Gallery',
  tw_more:'Showing {n} of {m} works. See all of them in the contact sheet below.',
  tw_lobby_k:'Lobby', tw_sup_site:'Support circles',
  tw_lobby_note:'circles takes no cut from artists. A donation to the artist goes straight to the artist. Supporting circles is separate and unrelated.',
  st_idea:'Idea', st_sketch:'Sketch', st_draft:'Draft', st_final:'Final',
  st_none_idea:'No idea note yet', st_none_sketch:'No sketch yet', st_none_draft:'No draft yet', st_none_final:'No picture yet',
  st_h:'How this work grew', st_tabs:'Choose a stage', st_peel:'Peel', st_peel_hint:'Slide to watch the picture change from idea to finished work', st_tl:'Timeline of the work',
  st_none_all:'The artist has not added an idea, sketch or draft for this work yet. For now there is only the finished piece.',
  st_sheet_h:'Contact sheet · every work × every stage', st_sheet_p:'Press any cell to open that work at that stage. Hatched cells are stages the artist has not added.', st_work:'Work', st_open:'Open {t} · {s}',
},
/* lo:begin */
// DRAFT lo: every line below needs native review (written by Claude, not a native speaker). Keys not listed fall back to Thai.
lo: {
  sc_h: "ທາງລັດ", sc_rand: "ສຸ່ມເບິ່ງງານ", sc_new: "ສິລະປິນໃໝ່", sc_hl: "ໄຮໄລທ໌ອາທິດນີ້", sc_find: "ຄົ້ນຫາຊື່",   // DRAFT lo: needs native review
  nav_city: "ເມືອງ",   // DRAFT lo: needs native review
  nav_about: "ກ່ຽວກັບ",   // DRAFT lo: needs native review
  nav_map: "ແຜນທີ່",   // DRAFT lo: needs native review
  menu_aria: "ເມນູ",   // DRAFT lo: needs native review
  lang_aria: "ປ່ຽນພາສາ",   // DRAFT lo: needs native review
  foot_manifesto: "ກ່ຽວກັບ",   // DRAFT lo: needs native review
  foot_how: "ວິທີໃຊ້ງານ",   // DRAFT lo: needs native review
  foot_feat: "ຜົນງານເດັ່ນ",   // DRAFT lo: needs native review
  foot_map: "ແຜນທີ່ເມືອງ",   // DRAFT lo: needs native review
  foot_join: "ຂໍມີຕຶກ",   // DRAFT lo: needs native review
  close: "ປິດ",   // DRAFT lo: needs native review
  copy_msg: "ສຳເນົາຂໍ້ຄວາມ",   // DRAFT lo: needs native review
  copied: "ສຳເນົາແລ້ວ",   // DRAFT lo: needs native review
  copy_fail: "ສຳເນົາບໍ່ໄດ້ ລອງເລືອກຂໍ້ຄວາມແລ້ວສຳເນົາເອງ",   // DRAFT lo: needs native review
  news_fail: "ສົ່ງບໍ່ສຳເລັດ ລອງໃໝ່ອີກຄັ້ງ",   // DRAFT lo: needs native review
  captcha_wait: "ລໍຖ້າການກວດສອບສຳເລັດກ່ອນສົ່ງ",   // DRAFT lo: needs native review
  cw_back: "← ກັບໄປຍ່າງເບິ່ງເມືອງ",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  w_prev: "← ຊິ້ນກ່ອນ",   // DRAFT lo: needs native review
  w_next: "ຊິ້ນຕໍ່ໄປ →",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  cw_view: "ເບິ່ງລາຍລະອຽດ {t}",   // DRAFT lo: needs native review
  mus_name: "ພິພິທະພັນຂອງ{a}",   // DRAFT lo: needs native review
  mus_aria: "ຫ້ອງສະແດງພາບຂອງ{a}",   // DRAFT lo: needs native review
  mus_prev: "← ພາບກ່ອນ",   // DRAFT lo: needs native review
  mus_next: "ຍ່າງຕໍ່ →",   // DRAFT lo: needs native review
  mus_more: "ລາຍລະອຽດ ແລະ ແນວຄິດ",   // DRAFT lo: needs native review
  mus_map: "ແຜນຜັງຕຶກ",   // DRAFT lo: needs native review
  mus_prof: "ເບິ່ງໂປຣໄຟລ໌ສິລະປິນ",   // DRAFT lo: needs native review
  pf_walk: "ຍ່າງເຂົ້າພິພິທະພັນ →",   // DRAFT lo: needs native review
  pf_ask: "ຖາມສິລະປິນ",   // DRAFT lo: needs native review
  mus_hint: "▼ ຍ່າງເບິ່ງພາບເທື່ອລະຊິ້ນ ໃຊ້ລູກສອນ ← → ເທິງຄີບອດໄດ້ ກົດທີ່ພາບທີ່ສະຫວ່າງເພື່ອເບິ່ງລາຍລະອຽດເຕັມ",   // DRAFT lo: needs native review
  lb_artist: "ສິລະປິນ",   // DRAFT lo: needs native review
  lb_year: "ປີ",   // DRAFT lo: needs native review
  lb_medium: "ວັດສະດຸ",   // DRAFT lo: needs native review
  lb_size: "ຂະໜາດ",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  d_story: "ທີ່ມາຂອງຜົນງານຊິ້ນນີ້",   // DRAFT lo: needs native review
  d_by: "ໂດຍ <b>{a}</b> · {d} · {c}",   // DRAFT lo: needs native review
  cc_h: "ແນວຄິດຂອງຜົນງານ",   // DRAFT lo: needs native review
  cc_origin: "ທີ່ມາ",   // DRAFT lo: needs native review
  cc_mat: "ວັດສະດຸ",   // DRAFT lo: needs native review
  cc_steps: "ຂັ້ນຕອນການເຮັດ",   // DRAFT lo: needs native review
  cc_step: "ຂັ້ນທີ {n}",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  nf_h: "ຕຶກນີ້ຍັງບໍ່ໄດ້ສ້າງ",   // DRAFT lo: needs native review
  nf_p: "ບໍ່ມີສິລະປິນຄົນນີ້ໃນເມືອງ ກັບໄປຍ່າງເບິ່ງຕຶກທີ່ມີຢູ່",   // DRAFT lo: needs native review
  consent_form: "ການສົ່ງຂໍ້ຄວາມນີ້ ໝາຍຄວາມວ່າທ່ານຮັບຊາບ<a href=\"privacy.html\">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</a> ຂໍ້ມູນຂອງທ່ານຈະຖືກສົ່ງເຖິງຜູ້ຮັບທີ່ລະບຸເທົ່ານັ້ນ",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  id_name: "ຊື່ຂອງທ່ານ",   // DRAFT lo: needs native review
  id_email: "ອີເມວຂອງທ່ານ",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  done_sent: "ສົ່ງສຳເລັດແລ້ວ",   // DRAFT lo: needs native review
  done_sent_p: "ຂອບໃຈ ຂໍ້ຄວາມເຖິງປາຍທາງແລ້ວ",   // DRAFT lo: needs native review
  done_mail: "ກຳລັງເປີດແອັບອີເມວຂອງທ່ານ",   // DRAFT lo: needs native review
  done_mail_p: "ກົດສົ່ງໃນແອັບອີເມວເພື່ອໃຫ້ຂໍ້ຄວາມເຖິງປາຍທາງ ຖ້າບໍ່ມີຫຍັງເປີດຂຶ້ນ ໃຫ້ສຳເນົາຂໍ້ຄວາມດ້ານລຸ່ມແລ້ວສົ່ງເອງ",   // DRAFT lo: needs native review
  note_mailto: "ຕອນນີ້ຟອມນີ້ເຮັດວຽກຜ່ານແອັບອີເມວຂອງທ່ານ",   // DRAFT lo: needs native review
  jd_cancel: "ຍົກເລີກ",   // DRAFT lo: needs native review
  jd_send: "ສົ່ງຄຳຂໍ →",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  f_wave: "★ ຄື້ນລູກໃໝ່",   // DRAFT lo: needs native review
  legal_privacy: "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ",   // DRAFT lo: needs native review
  legal_terms: "ເງື່ອນໄຂການນຳໃຊ້",   // DRAFT lo: needs native review
  hero_hl1: "ເມືອງຂອງສິລະປິນ",   // DRAFT lo: needs native review
  hero_hl2: "ພື້ນທີ່ສຳລັບງານສິລະປະ",   // DRAFT lo: needs native review
  hero_hl3: "ທີ່ບໍ່ຍອມງຽບ",   // DRAFT lo: needs native review
  hero_lead: "ຕຶກຄອນກຣີດໜຶ່ງຫຼັງ ສິລະປິນໜຶ່ງຄົນ ບໍ່ມີຫໍສິລະປະ ບໍ່ມີຄົນກາງ ຍ່າງເຂົ້າໄປ ເບິ່ງຜົນງານ ແລ້ວສະໜັບສະໜູນກົງເຖິງຄົນເຮັດ",   // DRAFT lo: needs native review
  hero_cta: "ເຂົ້າຊົມເມືອງ →",   // DRAFT lo: needs native review
  city_h: "ເມືອງ",   // DRAFT lo: needs native review
  city_p: "ລາກ ຫຼື ເລື່ອນໄປທາງຂວາເພື່ອຍ່າງຜ່ານເມືອງ ຕຶກແຕ່ລະຫຼັງແມ່ນສະຕູດິໂອຂອງສິລະປິນໜຶ່ງຄົນ ພາບທີ່ຝັງຢູ່ໃນຄອນກຣີດແມ່ນຜົນງານຈິງ",   // DRAFT lo: needs native review
  mani1: "ບໍ່ມີ​ຫໍສິລະປະ",   // DRAFT lo: needs native review
  mani2: "ບໍ່ມີ​ຄົນກາງ",   // DRAFT lo: needs native review
  mani3: "ບໍ່ມີ​ຄ່ານາຍໜ້າ",   // DRAFT lo: needs native review
  mani4: "ມີແຕ່ຄົນເຮັດ ກັບຄົນເບິ່ງ",   // DRAFT lo: needs native review
  mani_aria: "ບໍ່ມີຫໍສິລະປະ ບໍ່ມີຄົນກາງ ບໍ່ມີຄ່ານາຍໜ້າ ມີແຕ່ຄົນເຮັດກັບຄົນເບິ່ງ",   // DRAFT lo: needs native review
  mani_note: "ທີ່ນີ້ສິລະປິນໄດ້ຮັບການສະໜັບສະໜູນໂດຍກົງຈາກຄົນທີ່ຮັກງານ ແລະ ລົມກັບຄົນເບິ່ງເອງ ບໍ່ມີໃຜມານັ່ງຂັ້ນລະຫວ່າງພວກເຮົາກັບຜົນງານ ເພາະງານສິລະປະຄວນເດີນທາງຈາກມືຄົນເຮັດໄປເຖິງມືຄົນຮັກ ບໍ່ແມ່ນແວະຈ່າຍຄ່າຜ່ານທາງກ່ອນ",   // DRAFT lo: needs native review
  how_h: "ວິທີໃຊ້ງານ",   // DRAFT lo: needs native review
  s1_h: "ເລືອກຕຶກ",   // DRAFT lo: needs native review
  s1_p: "ລາກຍ່າງຜ່ານເມືອງ ຕຶກໜຶ່ງຫຼັງແມ່ນສິລະປິນໜຶ່ງຄົນ ເຫັນຮູບຮ່າງແລ້ວຖືກໃຈຫຼັງໃດ ກໍຊີ້ຫຼັງນັ້ນ ບໍ່ຕ້ອງມີໃຜແນະນຳ",   // DRAFT lo: needs native review
  s2_h: "ຍ່າງເຂົ້າໄປເບິ່ງຜົນງານ",   // DRAFT lo: needs native review
  s2_p: "ເປີດປະຕູຕຶກ ໄລ່ເບິ່ງເທື່ອລະຊັ້ນ ເທື່ອລະຫ້ອງ ຜົນງານແຂວນຢູ່ເທິງຝາຄອນກຣີດຈິງໆ ຈັບບໍ່ໄດ້ ແຕ່ເບິ່ງໄດ້ດົນເທົ່າທີ່ຢາກເບິ່ງ",   // DRAFT lo: needs native review
  s3_h: "ສະໜັບສະໜູນກົງເຖິງສິລະປິນ",   // DRAFT lo: needs native review
  s3_p: "ເຈິຊິ້ນທີ່ຕິດຕາມໄປຮອດໃນຝັນ ກໍຂອບໃຈຄົນເຮັດໂດຍກົງ ສະໜັບສະໜູນຕາມທີ່ຢາກໃຫ້ ເງິນທຸກກີບເຂົ້າກະເປົາຄົນແຕ້ມ ບໍ່ມີໃຜຫັກກ່ອນ",   // DRAFT lo: needs native review
  feat_h: "ຜົນງານເດັ່ນອາທິດນີ້",   // DRAFT lo: needs native review
  feat_h_all: "ຜົນງານທັງໝົດໃນເມືອງ",   // DRAFT lo: needs native review
  sort_label: "ຈັດຮຽງຕາມ",   // DRAFT lo: needs native review
  sort_cur: "ຄັດມາໃຫ້",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  sort_new: "ໃໝ່ລ່າສຸດ",   // DRAFT lo: needs native review
  all_btn: "ເບິ່ງທັງໝົດ {n} ຊິ້ນ",   // DRAFT lo: needs native review
  feat_count: "ສະແດງ {n} ຊິ້ນ",   // DRAFT lo: needs native review
  card_aria: "{t} ໂດຍ{a} {p}",   // DRAFT lo: needs native review
  map_h: "ແຜນທີ່ເມືອງ",   // DRAFT lo: needs native review
  map_p: "ເບິ່ງຈາກທາງເທິງ ເມືອງແບ່ງເປັນຍ່ານຕາມສາຂາ ກົດຍ່ານ ຫຼື ປຸ່ມກັ່ນຕອງ ແລ້ວຕຶກໃນແຖບເມືອງດ້ານເທິງຈະສະຫວ່າງຂຶ້ນໃຫ້",   // DRAFT lo: needs native review
  filters_aria: "ກັ່ນຕອງຕາມສາຂາ",   // DRAFT lo: needs native review
  f_all: "ທັງໝົດ",   // DRAFT lo: needs native review
  spot_h: "ນະພາ",   // DRAFT lo: needs native review
  q1: "ເປັນຫຍັງຈຶ່ງເລີກສົ່ງງານເຂົ້າຫໍສິລະປະ?",   // DRAFT lo: needs native review
  a1: "ສົ່ງໄປສິບສອງຮອບ ໄດ້ຄຳຕອບວ່າ \"ໜ້າສົນໃຈ ແຕ່ຍັງບໍ່ແມ່ນຕອນນີ້\" ຄົບສິບສອງຮອບ ສຸດທ້າຍກໍເຂົ້າໃຈວ່າ \"ຕອນນີ້\" ຂອງພວກເຂົາບໍ່ເຄີຍມາເຖິງ ເລີຍເລີກລໍຖ້າ",   // DRAFT lo: needs native review
  q2: "ເປັນຫຍັງຕ້ອງຫ້ອງວ່າງກັບໝອກ?",   // DRAFT lo: needs native review
  a2: "ເພາະທີ່ວ່າງແມ່ນບ່ອນດຽວທີ່ບໍ່ມີໃຜມາບອກວ່າຕ້ອງຮູ້ສຶກແນວໃດ ຫ້ອງວ່າງໜຶ່ງຫ້ອງ ຄົນເບິ່ງຮ້ອຍຄົນ ໄດ້ຮ້ອຍເລື່ອງ ບໍ່ຕ້ອງມີຄີວເຣເຕີແປໃຫ້",   // DRAFT lo: needs native review
  q3: "ຖ້າຄົນເຂົ້າມາແລ້ວບໍ່ສະໜັບສະໜູນເດ?",   // DRAFT lo: needs native review
  a3: "ກໍບໍ່ເປັນຫຍັງ ເບິ່ງຟຣີ ນັ່ງຖຽງກັບພາບໄດ້ ຖ້າມື້ໃດຜົນງານຕິດຕາມໄປຫຼອນເຖິງເຮືອນ ຄ່ອຍກັບມາສະໜັບສະໜູນຄົນແຕ້ມໂດຍກົງ ບໍ່ມີໃຜເກັບຄ່າແນະນຳ",   // DRAFT lo: needs native review
  spot_cta: "ເຂົ້າໄປໃນຕຶກນະພາ →",   // DRAFT lo: needs native review
  spot_meta: "NO.01 · {d} · ຕັ້ງແຕ່ {y} · {c}",   // DRAFT lo: needs native review
  stats_aria: "ຕົວເລກຂອງເມືອງ",   // DRAFT lo: needs native review
  join_h: "ຢາກມີຕຶກຂອງຕົນເອງບໍ?",   // DRAFT lo: needs native review
  join_btn: "ຂໍມີຕຶກ →",   // DRAFT lo: needs native review
  foot_h: "ສິລະປະ<em>ບໍ່ລໍ</em>ໃຜ",   // DRAFT lo: needs native review
  foot_p: "ຢາກມີຕຶກໃນເມືອງນີ້ ສົ່ງຜົນງານມາໄດ້ເລີຍ ພວກເຮົາບໍ່ຖາມວ່າທ່ານເປັນໃຜ ພວກເຮົາເບິ່ງແຕ່ວ່າຜົນງານຂອງທ່ານເປັນແນວໃດ ພຽງແຕ່ຂໍໃຫ້ບັນຊີຮັບເງິນເປັນຂອງທ່ານແທ້",   // DRAFT lo: needs native review
  foot_btn: "ຂໍມີຕຶກ →",   // DRAFT lo: needs native review
  foot_menu: "ເມນູ",   // DRAFT lo: needs native review
  foot_social: "ໂຊຊຽວ",   // DRAFT lo: needs native review
  news_label: "ຂ່າວຈາກເມືອງ ຕຶກໃໝ່ ຜົນງານໃໝ່ ສົ່ງຕົງເຖິງກ່ອງອີເມວ ບໍ່ສະແປມ ບໍ່ຂາຍຕໍ່",   // DRAFT lo: needs native review
  news_btn: "ສະໝັກ →",   // DRAFT lo: needs native review
  foot_copy: "© 2026 CIRCLES · ເມືອງເພິ່ງເລີ່ມ ຕອນນີ້ມີຕຶກທຳອິດໜຶ່ງຫຼັງ · NO GALLERY. NO MIDDLEMAN.",   // DRAFT lo: needs native review
  news_saved: "ບັນທຶກອີເມວໄວ້ໃນເຄື່ອງນີ້ແລ້ວ (ຍັງບໍ່ໄດ້ເຊື່ອມລະບົບສົ່ງຈົດໝາຍ)",   // DRAFT lo: needs native review
  news_sent: "ສະໝັກຮັບຂ່າວສຳເລັດແລ້ວ",   // DRAFT lo: needs native review
  cy_h: "ວົງມົນບໍ່ມີປາຍທາງ ສິລະປະກໍຄືກັນ",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  cy_1: "ແຕ້ມ",   // DRAFT lo: needs native review
  cy_2: "ສະແດງໃນຕຶກ",   // DRAFT lo: needs native review
  cy_3: "ມີຄົນສະໜັບສະໜູນ",   // DRAFT lo: needs native review
  cy_4: "ແຕ້ມຕໍ່",   // DRAFT lo: needs native review
  cy_aria: "ວົງຈອນ 4 ຂັ້ນ: ແຕ້ມ ສະແດງໃນຕຶກ ມີຄົນສະໜັບສະໜູນ ແລ້ວວົນກັບໄປແຕ້ມຕໍ່",   // DRAFT lo: needs native review
  sup_h: "ສະໜັບສະໜູນ Circles",   // DRAFT lo: needs native review
  sup_p: "ຕອນນີ້ສິລະປິນຮັບເງິນເຕັມ ບໍ່ມີຄ່າທຳນຽມ ເວັບຢູ່ໄດ້ດ້ວຍເງິນສະໜັບສະໜູນ ຖ້າມີຄ່າທຳນຽມໃນອະນາຄົດ ພວກເຮົາຈະບອກລ່ວງໜ້າ",   // DRAFT lo: needs native review
  sup_where: "ເງິນສະໜັບສະໜູນໄປໃສ",   // DRAFT lo: needs native review
  sup_r1: "ຄ່າເຊີບເວີ ແລະ ໂດເມນ",   // DRAFT lo: needs native review
  sup_r2: "ການດູແລ ແລະ ພັດທະນາເວັບ",   // DRAFT lo: needs native review
  sup_r3: "ກິດຈະກຳ ແລະ ພື້ນທີ່ໃໝ່ສຳລັບສິລະປິນ",   // DRAFT lo: needs native review
  sup_note: "ຍັງບໍ່ໄດ້ກຳນົດສັດສ່ວນ ເຮົາຈະປະກາດລາຍຮັບ ແລະ ລາຍຈ່າຍຈິງເມື່ອມີເງິນສະໜັບສະໜູນເຂົ້າມາ ເງິນທີ່ທ່ານໃຫ້ສິລະປິນຜ່ານປຸ່ມ “ສະໜັບສະໜູນ” ຂອງແຕ່ລະຜົນງານ ໂອນຕົງເຂົ້າບັນຊີຂອງສິລະປິນ ບໍ່ຜ່ານ circles ແລະ ບໍ່ຫັກຄ່າທຳນຽມ",   // DRAFT lo: needs native review
  don_btn: "ສະໜັບສະໜູນ →",   // DRAFT lo: needs native review
  don_soon: "ໄວໆນີ້",   // DRAFT lo: needs native review
  mq: ["ສິລະປິນບໍ່ມີກົດ", "SUPPORT ART", "ສະໜັບສະໜູນກົງເຖິງຄົນເຮັດ", "NO MIDDLEMAN", "ເມືອງຂອງສິລະປິນ", "ART NOT SORRY"],   // DRAFT lo: needs native review
  nav_join: "ຂໍມີຕຶກ",   // DRAFT lo: needs native review
  mani_k: "Manifesto",   // DRAFT lo: needs native review
  how_i: "3 steps",   // DRAFT lo: needs native review
  feat_i: "Featured",   // DRAFT lo: needs native review
  map_i: "The",   // DRAFT lo: needs native review
  spot_i: "Artist of the week",   // DRAFT lo: needs native review
  join_k: "Get a building",   // DRAFT lo: needs native review
  join_i: "Your",   // DRAFT lo: needs native review
  pf_ig: "Instagram",   // DRAFT lo: needs native review
  works_n: "{n} WORKS",   // DRAFT lo: needs native review
  fold_spot: "ອ່ານບົດສຳພາດ 3 ຂໍ້",   // DRAFT lo: needs native review
  fold_foot: "ເມນູ",   // DRAFT lo: needs native review
  pf_h: "ໂປຣໄຟລ໌ຂອງ{a}",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  pf_cn: "ແນວຄິດຂອງຜົນງານ{a}",   // DRAFT lo: needs native review
  pf_nw: "ຜົນງານໃນພິພິທະພັນ",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  pf_ny: "ເລີ່ມເຮັດງານສິລະປະ",   // DRAFT lo: needs native review
  pf_tl: "ເສັ້ນທາງທີ່ຜ່ານມາ",   // DRAFT lo: needs native review
  pf_wh: "ຜົນງານໃນພິພິທະພັນ",   // DRAFT lo: needs native review
  pf_hover: "ແຕະ ຫຼື ຊີ້ທີ່ພາບເພື່ອເບິ່ງຜົນງານ",   // DRAFT lo: needs native review
  pf_all: "ຍ່າງເຂົ້າໄປເບິ່ງທັງໝົດ →",   // DRAFT lo: needs native review
  pf_sup1: "ມັກຜົນງານຂອງ{a}ບໍ?",   // DRAFT lo: needs native review
  pf_sup2: "ຊ່ວຍໃຫ້ສ້າງງານຕໍ່",   // DRAFT lo: needs native review
  pf_supn: "ທຸກການສະໜັບສະໜູນໄປເຖິງສິລະປິນໂດຍກົງ ໃນຊ່ວງເລີ່ມຕົ້ນນີ້ Circles ຍັງບໍ່ຫັກຄ່າທຳນຽມຈາກສິລະປິນ",   // DRAFT lo: needs native review
  pf_supb: "ບໍລິຈາກໃຫ້{a}",
  don_work: "ບໍລິຈາກ · ໄດ້ແຮງບັນດານໃຈຈາກຜົນງານນີ້",   // DRAFT lo: needs native review
  bio_more: "ອ່ານຕໍ່", bio_less: "ຍໍ້",   // DRAFT lo: needs native review
  sup_qr_t: "ສະແກນເພື່ອສະໜັບສະໜູນ{a}",   // DRAFT lo: needs native review
  sup_bank: "ທະນາຄານ",   // DRAFT lo: needs native review
  sup_acc_name: "ຊື່ບັນຊີ",   // DRAFT lo: needs native review
  sup_acc_no: "ເລກບັນຊີ",   // DRAFT lo: needs native review
  sup_copy: "ສຳເນົາເລກບັນຊີ",   // DRAFT lo: needs native review
  sup_copied: "ສຳເນົາແລ້ວ",   // DRAFT lo: needs native review
  sup_direct: "ເງິນເຂົ້າບັນຊີຂອງ {a} ໂດຍກົງ circles ບໍ່ໄດ້ຮັບເງິນແທນ",   // DRAFT lo: needs native review
  sup_sample: "ຂໍ້ມູນຕົວຢ່າງເທົ່ານັ້ນ ຢ່າໂອນເງິນ",   // DRAFT lo: needs native review
  search_ph: "ຄົ້ນຫາສິລະປິນ…",   // DRAFT lo: needs native review
  search_aria: "ຄົ້ນຫາສິລະປິນຈາກຊື່ ສາຂາ ຫຼືເມືອງ",   // DRAFT lo: needs native review
  fnote_q: "ພົບ {n} ຕຶກທີ່ກົງກັບຄຳຄົ້ນຫາ",   // DRAFT lo: needs native review
  fnote_q0: "ບໍ່ພົບສິລະປິນທີ່ກົງກັບຄຳຄົ້ນຫາ",   // DRAFT lo: needs native review
  calm_off: "ຢຸດການເຄື່ອນໄຫວ",   // DRAFT lo: needs native review
  calm_on: "ເປີດການເຄື່ອນໄຫວ",   // DRAFT lo: needs native review
  share_btn: "ແຊຣ໌",   // DRAFT lo: needs native review
  share_copied: "ສຳເນົາລິ້ງແລ້ວ",   // DRAFT lo: needs native review
  sup_hint: "ເທິງມືຖື: ບັນທຶກຮູບ QR ແລ້ວເປີດແອັບທະນາຄານຂອງທ່ານ (ເຊັ່ນ BCEL One) ເລືອກສະແກນຈາກຮູບໃນເຄື່ອງ",   // DRAFT lo: needs native review
  sup_save: "ບັນທຶກຮູບ QR",   // DRAFT lo: needs native review
  pf_soon: "ໄວໆນີ້",   // DRAFT lo: needs native review
  pf_share: "ແຊໂປຣໄຟລ໌ ↗",   // DRAFT lo: needs native review
  pf_copy: "ສຳເນົາລິ້ງ",   // DRAFT lo: needs native review
  pf_copied: "ສຳເນົາລິ້ງແລ້ວ",   // DRAFT lo: needs native review
  pf_marq: "ART NOT SORRY ★ ວົງມົນບໍ່ມີມື້ຈົບ ★ CIRCLES ★ ຍ່າງເຂົ້າພິພິທະພັນ ★ ",   // DRAFT lo: needs native review
  wave: "ຄື້ນລູກໃໝ່",   // DRAFT lo: needs native review
  cw_est: "ກໍ່ຕັ້ງ {y}",   // DRAFT lo: needs native review
  cw_hint: "▼ ພາບຕັດຕຶກເທື່ອລະຊັ້ນ ກົດທີ່ຜົນງານເພື່ອເບິ່ງລາຍລະອຽດເຕັມ",   // DRAFT lo: needs native review
  cw_section: "SECTION A–A · ບໍ່ມີລິຟ ໃຊ້ຂັ້ນໄດເທົ່ານັ້ນ",   // DRAFT lo: needs native review
  cw_meta: "{d} · ຕັ້ງແຕ່ {y} · {c}",   // DRAFT lo: needs native review
  cw_prev: "← ຕຶກກ່ອນໜ້າ",   // DRAFT lo: needs native review
  cw_next: "ຕຶກຖັດໄປ →",   // DRAFT lo: needs native review
  cw_roof: "{n} · STUDIO",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  cw_look: "ເບິ່ງລາຍລະອຽດ →",   // DRAFT lo: needs native review
  jn_kick: "ສຳລັບສິລະປິນ",   // DRAFT lo: needs native review
  jn_cta: "ເລົ່າໃຫ້ພວກເຮົາຟັງສັ້ນໆວ່າທ່ານເຮັດງານແບບໃດ ແນບລິ້ງຜົນງານ ແລ້ວພວກເຮົາຈະຕິດຕໍ່ກັບທາງອີເມວ",   // DRAFT lo: needs native review
  jb_p: "ຮັບການສະໜັບສະໜູນໂດຍກົງ ບໍ່ມີໃຜຄັດງານ ພຽງແຕ່ຢືນຢັນວ່າບັນຊີຮັບເງິນເປັນຂອງທ່ານ",   // DRAFT lo: needs native review
  jb_btn: "ຂໍມີຕຶກຂອງເຈົ້າ →",   // DRAFT lo: needs native review
  jd_title: "ຂໍມີ<em>ຕຶກ</em>ໃນເມືອງນີ້",   // DRAFT lo: needs native review
  jd_intro: "ເລົ່າໃຫ້ຟັງສັ້ນໆວ່າທ່ານເຮັດຫຍັງ ບໍ່ຕ້ອງມີປະຫວັດຍາວ ບໍ່ຕ້ອງມີໃຜຮັບຮອງ ພວກເຮົາເບິ່ງທີ່ຜົນງານ",   // DRAFT lo: needs native review
  jd_name: "ຊື່ / ນາມປາກກາ",   // DRAFT lo: needs native review
  jd_email: "ອີເມວ",   // DRAFT lo: needs native review
  jd_disc: "ສາຂາ",   // DRAFT lo: needs native review
  jd_other: "ອື່ນໆ",   // DRAFT lo: needs native review
  jd_link: "ລິ້ງຜົນງານ (ເວັບ / Instagram / Drive)",   // DRAFT lo: needs native review
  jd_msg: "ເລົ່າກ່ຽວກັບຜົນງານຂອງທ່ານ",   // DRAFT lo: needs native review
  jd_pay_h: "ຊ່ອງທາງຮັບການສະໜັບສະໜູນ (ບໍ່ບັງຄັບ)",   // DRAFT lo: needs native review
  jd_pay_note: "ໃສ່ທະນາຄານ ແລະເລກບັນຊີທີ່ຢາກໃຫ້ຜູ້ສະໜັບສະໜູນໂອນເຂົ້າ ເມື່ອເຮົາຕອບອີເມລ ຈະຂໍຮູບ QR ຮັບເງິນຈາກແອັບທະນາຄານຂອງທ່ານ ເງິນເຂົ້າບັນຊີຂອງທ່ານໂດຍກົງ",   // DRAFT lo: needs native review
  jd_bank: "ທະນາຄານ",   // DRAFT lo: needs native review
  title_pf: "ໂປຣໄຟລ໌ຂອງ{a} — circles",   // DRAFT lo: needs native review
     // DRAFT lo: needs native review
  title_idx: "circles — ເມືອງຂອງສິລະປິນ ສະໜັບສະໜູນກົງເຖິງຄົນເຮັດ",   // DRAFT lo: needs native review
  title_cw: "ຕຶກຂອງ{a} — circles",   // DRAFT lo: needs native review
  desc_idx: "circles ເມືອງຂອງສິລະປິນ ຕຶກຄອນກຣີດໜຶ່ງຫຼັງແມ່ນສິລະປິນໜຶ່ງຄົນ ບໍ່ມີຫໍສິລະປະ ບໍ່ມີຄົນກາງ ຍ່າງເຂົ້າໄປເບິ່ງຜົນງານແລ້ວສະໜັບສະໜູນກົງເຖິງຄົນເຮັດ",   // DRAFT lo: needs native review
  desc_cw: "ຍ່າງເຂົ້າໄປໃນຕຶກຂອງ{a} ສິລະປິນສາຂາ{d} ເບິ່ງຜົນງານເທື່ອລະຊັ້ນ ແລ້ວສະໜັບສະໜູນກົງເຖິງສິລະປິນ",   // DRAFT lo: needs native review
  fnote_wave: "ໄຮໄລທ໌ {n} ຕຶກຄື້ນລູກໃໝ່ໃນແຖບເມືອງແລ້ວ",   // DRAFT lo: needs native review
  ld_top: "circles · ເມືອງຂອງສິລະປິນ",   // DRAFT lo: needs native review
  ld_skip: "ຂ້າມການເປີດເລື່ອງ",   // DRAFT lo: needs native review
  ld_text: "ກຳລັງສ້າງເມືອງ…",   // DRAFT lo: needs native review
  pager_l: "ເລື່ອນຊ້າຍ",   // DRAFT lo: needs native review
  pager_r: "ເລື່ອນຂວາ",   // DRAFT lo: needs native review
  strip_aria: "ເມືອງຂອງສິລະປິນ ເລື່ອນຊ້າຍຂວາ",   // DRAFT lo: needs native review
  bd_aria: "ເຂົ້າຕຶກຂອງ{a} {d}",   // DRAFT lo: needs native review
  less_btn: "ເບິ່ງສະເພາະຊິ້ນເດັ່ນ",   // DRAFT lo: needs native review
  district: "ຍ່ານ",   // DRAFT lo: needs native review
  plaza: "PLAZA · ຈະຕຸລັດກາງເມືອງ",   // DRAFT lo: needs native review
  fnote: "ໄຮໄລທ໌ {n} ຕຶກສາຂາ{d}ໃນແຖບເມືອງແລ້ວ",   // DRAFT lo: needs native review
  fnote_go: "ເບິ່ງຕຶກໃນແຖບເມືອງ ↑",   // DRAFT lo: needs native review
  fnote_in: "ເຂົ້າໄປໃນຕຶກ →",   // DRAFT lo: needs native review
  fnote_x: "ລ້າງຕົວກັ່ນຕອງ ✕",   // DRAFT lo: needs native review
  st1: "ສິລະປິນໃນເມືອງ",   // DRAFT lo: needs native review
  st2: "ຜົນງານໃນຕຶກ",   // DRAFT lo: needs native review
  st3: "ສາຂາສິລະປະ",   // DRAFT lo: needs native review
  st4: "ເງິນທີ່ເຖິງມືສິລະປິນ",   // DRAFT lo: needs native review
  p1_h: "ຕຶກເປັນຂອງທ່ານ",   // DRAFT lo: needs native review
  p1_p: "ຈັດຫ້ອງ ວາງຜົນງານ ປ່ຽນຊັ້ນໄດ້ຕາມໃຈ ຕຶກໜຶ່ງຫຼັງແມ່ນສິລະປິນໜຶ່ງຄົນ ບໍ່ມີໃຜມາແບ່ງຝາດ້ວຍ",   // DRAFT lo: needs native review
  p2_h: "ເງິນເຂົ້າທ່ານ 100%",   // DRAFT lo: needs native review
  p2_p: "ຮັບເງິນສະໜັບສະໜູນຕົງເຖິງມື ບໍ່ມີຄ່ານາຍໜ້າ ບໍ່ມີຄ່າຝາກຂາຍ ບໍ່ມີໃຜຫັກກ່ອນຮອດມື",   // DRAFT lo: needs native review
  p3_h: "ບໍ່ມີໃຜຄັດງານ",   // DRAFT lo: needs native review
  p3_p: "ບໍ່ມີຄະນະກຳມະການ ບໍ່ມີຫົວຂໍ້ປະຈຳປີ ບໍ່ຖາມວ່າຮຽນຈົບຈາກໃສ ເຮັດມາແລ້ວຢາກໃຫ້ຄົນເຫັນ ກໍສ້າງຕຶກໄດ້ເລີຍ",   // DRAFT lo: needs native review
  skip_main: "ຂ້າມໄປທີ່ເນື້ອຫາ",   // DRAFT lo: needs native review
  social_soon: "ລິ້ງໂຊຊຽວຈະເປີດຕອນເວັບຂຶ້ນອອນລາຍ",   // DRAFT lo: needs native review
  to_label: "ເຖິງ",   // DRAFT lo: needs native review
  demo_note: "ຂໍ້ມູນສິລະປິນ ແລະ ອີເມວໃນເວັບນີ້ເປັນຂໍ້ມູນຕົວຢ່າງ",   // DRAFT lo: needs native review
  v_city: "ເບິ່ງແບບຕຶກ",   // DRAFT lo: needs native review
  v_map: "ເບິ່ງແບບແຜນທີ່",   // DRAFT lo: needs native review
  v_aria: "ເລືອກມຸມມອງເມືອງ",   // DRAFT lo: needs native review
  // TODO lo: news_consent (falls back to Thai) - newsletter consent (privacy wording): needs a proper translation, not a guess
  // TODO lo: jd_subject (falls back to Thai) - subject line of the join-request email that reaches the site owner: left in Thai so the owner can read it
  nav_hi: "ໄຮໄລທ໌",   // DRAFT lo: needs native review
  nav_lg: "ຍ່ານຕຳນານ",   // DRAFT lo: needs native review
  dist_k: "ປ້າຍທາງ",   // DRAFT lo: needs native review
  dist_aria: "ທາງລັດໄປບ່ອນຕ່າງໆໃນເມືອງ",   // DRAFT lo: needs native review
  dist_city: "ຕຶກສິລະປິນ",   // DRAFT lo: needs native review
  dist_hi: "ໄຮໄລທ໌ອາທິດນີ້",   // DRAFT lo: needs native review
  dist_lg: "ຍ່ານຕຳນານ",   // DRAFT lo: needs native review
  hi_h: "ໄຮໄລທ໌ປະຈຳອາທິດ",   // DRAFT lo: needs native review
  hi_meta: "ຜົນງານ ແລະ ແນວຄິດທີ່ຄົນເບິ່ງຖືກໃຈທີ່ສຸດໃນອາທິດນີ້ ຈັດອັນດັບຈາກປຸ່ມ “ຖືກໃຈ” ບໍ່ນັບຍອດເງິນບໍລິຈາກ",   // DRAFT lo: needs native review
  hi_week: "ອາທິດທີ {n} · {r} {y}",   // DRAFT lo: needs native review
  hi_how_k: "ນັບແນວໃດ",   // DRAFT lo: needs native review
  hi_how: "ຈັດອັນດັບຈາກຈຳນວນຄົນກົດ “ຖືກໃຈ” ໃນອາທິດນີ້ ຖ້າເທົ່າກັນເບິ່ງຈາກຈຳນວນຄົນເບິ່ງ ບໍ່ນັບຍອດເງິນບໍລິຈາກ",   // DRAFT lo: needs native review
  hi_not: "ບໍ່ແມ່ນການແຂ່ງຂັນ ທຸກຜົນງານດີໃນແບບຂອງຕົນເອງ ໄຮໄລທ໌ນີ້ພຽງບອກວ່າອາທິດນີ້ຄົນເບິ່ງຖືກໃຈຫຍັງ",   // DRAFT lo: needs native review
  hi_t_w: "ຜົນງານ",   // DRAFT lo: needs native review
  hi_t_c: "ແນວຄິດ",   // DRAFT lo: needs native review
  hi_t_n: "ສິລະປິນໃໝ່ໜ້າຕິດຕາມ",   // DRAFT lo: needs native review
  hi_by: "ໂດຍ {a}",   // DRAFT lo: needs native review
  hi_views: "{n} ຄົນເບິ່ງ",   // DRAFT lo: needs native review
  hi_res: "♥ {n} ຖືກໃຈ",   // DRAFT lo: needs native review
  hi_open: "ອັນດັບ {n}: {t} ໂດຍ {a}",   // DRAFT lo: needs native review
  hi_dir: "ອັນດັບ 4–6",   // DRAFT lo: needs native review
  hi_c_lead: "ແນວຄິດທີ່ຄົນກົດ “ຖືກໃຈ” ຫຼາຍທີ່ສຸດໃນອາທິດນີ້ ທຸກປະໂຫຍກແມ່ນຄຳຂອງສິລະປິນເອງ",   // DRAFT lo: needs native review
  hi_own: "ຄຳຂອງສິລະປິນເອງ",   // DRAFT lo: needs native review
  hi_from: "ຈາກຜົນງານ “{t}”",   // DRAFT lo: needs native review
  hi_n_lead: "ບ່ອນສຳລັບສິລະປິນທີ່ເພິ່ງເຂົ້າຮ່ວມບໍ່ເກີນ 3 ເດືອນ ອາທິດລະ 1 ຄົນ ຍອດຍັງໜ້ອຍກໍມີບ່ອນຢືນ",   // DRAFT lo: needs native review
  hi_n_badge: "ສິລະປິນໃໝ່ໜ້າຕິດຕາມ",   // DRAFT lo: needs native review
  hi_joined: "ເຂົ້າຮ່ວມເມື່ອ {n} ອາທິດກ່ອນ",   // DRAFT lo: needs native review
  hi_n_go: "ໄປເບິ່ງຕຶກຂອງ{a}",   // DRAFT lo: needs native review
  hi_n_more: "ໜ້າຕິດຕາມຄືກັນ",   // DRAFT lo: needs native review
  res_btn: "ຖືກໃຈ",   // DRAFT lo: needs native review
  res_on: "ຖືກໃຈແລ້ວ",   // DRAFT lo: needs native review
  lg_h: "ຍ່ານຕຳນານ",   // DRAFT lo: needs native review
  lg_meta: "ຮູບແຕ້ມຂອງຜູ້ວາງຮາກຖານສິລະປະ ຄັດເລືອກເທື່ອລະຊິ້ນ ໃສ່ເຄຣດິດທຸກຊິ້ນ ຍ່ານນີ້ບໍ່ມີປຸ່ມບໍລິຈາກ",   // DRAFT lo: needs native review
  lg_lead: "ຮູບແຕ້ມຂອງຄົນທີ່ວາງຮາກຖານໃຫ້ສິລະປະ ຄັດເລືອກເທື່ອລະຊິ້ນໂດຍ circles ໃຊ້ສະເພາະຮູບທີ່ໝົດລິຂະສິດຈາກຄັງຮູບຂອງພິພິທະພັນ ແລະ ໃສ່ເຄຣດິດທຸກຊິ້ນ ຄຳຂອງນັກແຕ້ມໃນແຕ່ລະຫ້ອງເປັນຄຳຂອງເຂົາເອງພ້ອມທີ່ມາ ສ່ວນບັນທຶກປະຫວັດເປັນຄຳຂອງ circles",   // DRAFT lo: needs native review
  lg_nodon: "ຍ່ານນີ້ບໍ່ມີປຸ່ມບໍລິຈາກ ເພາະເຈົ້າຂອງຜົນງານຈາກໄປແລ້ວ ຖ້າຢາກສະໜັບສະໜູນສິລະປິນທີ່ຍັງເຮັດວຽກຢູ່ ໄປເບິ່ງໄຮໄລທ໌ປະຈຳອາທິດ",   // DRAFT lo: needs native review
  lg_go: "ໄປສະໜັບສະໜູນສິລະປິນທີ່ຍັງເຮັດວຽກຢູ່",   // DRAFT lo: needs native review
  lg_img: "ຮູບແຕ້ມ",   // DRAFT lo: needs native review
  lg_count: "{n} ຮູບຢູ່ເທິງຝາ",   // DRAFT lo: needs native review
  news_consent: "ສະໝັກແລ້ວຖືວ່າຮັບ<a href=\"privacy.html\">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</a> ຍົກເລີກໄດ້ທຸກເວລາ",   // DRAFT lo: needs native review
  jd_subject: "ຂໍມີຕຶກໃນ circles — {n}",   // DRAFT lo: needs native review
  don_done_real: "ສົ່ງແຈ້ງແລ້ວ ສິລະປິນຈະກວດຍອດແລະຕອບກັບທາງອີເມວທີ່ທ່ານໃຫ້ໄວ້ ຂອບໃຈທີ່ສະໜັບສະໜູນ",   // DRAFT lo: needs native review
  don_e_captcha: "ຢືນຢັນຕົວຕົນບໍ່ຜ່ານ ລອງໃໝ່ອີກຄັ້ງ",   // DRAFT lo: needs native review
  don_e_busy: "ສິລະປິນມີແຈ້ງຄ້າງຢູ່ຫຼາຍ ລອງໃໝ່ພາຍຫຼັງ",   // DRAFT lo: needs native review
  don_e_rate: "ລອງເລື້ອຍເກີນໄປ ລໍຖ້າຈັກໜ້ອຍ",   // DRAFT lo: needs native review
  don_e_not_found: "ບໍ່ພົບສິລະປິນຫຼືຜົນງານນີ້",   // DRAFT lo: needs native review
  don_e_bad_field: "ຂໍ້ມູນບໍ່ຄົບຫຼືບໍ່ຖືກຕ້ອງ",   // DRAFT lo: needs native review
  don_e_net: "ສົ່ງບໍ່ສຳເລັດ ລອງໃໝ່ອີກຄັ້ງ",   // DRAFT lo: needs native review
  don_e_slip: "ໃຊ້ໄຟລ໌ສະລິບນີ້ບໍ່ໄດ້ (JPG, PNG ຫຼື WebP)",   // DRAFT lo: needs native review
  don_none: "ສິລະປິນຍັງບໍ່ໄດ້ໃສ່ຂໍ້ມູນບັນຊີຮັບເງິນ",   // DRAFT lo: needs native review
  hint_swipe: "▼ ປັດຊ້າຍ-ຂວາເພື່ອເດີນເບິ່ງຮູບ ແຕະທີ່ຮູບເພື່ອເບິ່ງລາຍລະອຽດເຕັມ",   // DRAFT lo: needs native review
  desc_pf: "ຮູ້ຈັກ{a} ສິລະປິນສາຂາ{d} ແນວຄິດຂອງງານ ຜົນງານໃນພິພິທະພັນ ແລະຊ່ອງທາງສະໜັບສະໜູນ",   // DRAFT lo: needs native review
  cy_p: "ຊື່ Circles ມາຈາກຄວາມເຊື່ອວ່າງານສິລະປະບໍ່ມີວັນຈົບ ສິລະປິນເຮັດຊິ້ນໜຶ່ງສຳເລັດ ກໍມີຊິ້ນຕໍ່ໄປລໍຢູ່ສະເໝີ ການສະໜັບສະໜູນຈາກຄົນເບິ່ງບໍ່ແມ່ນຈຸດສິ້ນສຸດ ແຕ່ເປັນແຮງໃຫ້ເຮັດຕໍ່ ແລະເມືອງນີ້ກໍວຽນໄປແບບນັ້ນເລື້ອຍໆ",   // DRAFT lo: needs native review
  lg_open: "ເບິ່ງປະຫວັດແລະຜົນງານຂອງເຂົາ →",   // DRAFT lo: needs native review
  foot_set: "ຕັ້ງຄ່າ (ສິລະປິນ)",   // DRAFT lo: needs native review
  nav_don: "ບໍລິຈາກ",   // DRAFT lo: needs native review
  mk_go: 'ເຂົ້າໄປໃນຕຶກຂອງຂ້ອຍ →',   mk_k: 'ຕຶກທຳອິດຂອງເມືອງ', mk_h: 'ຜົນງານຂອງຂ້ອຍ', mk_p: 'ເມືອງນີ້ເລີ່ມຈາກງານນ້ອຍໆທີ່ຂ້ອຍເຮັດເອງ ຕັດແປະ ຊ້ອນຮູບ ໃສ່ດາວແດງ ຂ້ອຍເປັນນັກສຶກສາໄອທີປີໜຶ່ງຢູ່ວຽງຈັນ ຮູບເຫຼົ່ານີ້ເປັນຝີມືຂ້ອຍ ເປັນສຽງຂອງເມືອງກ່ອນທີ່ສິລະປິນຄົນອື່ນຈະເຂົ້າມາ', mk_a1: 'ຮູບຕັດແປະຮູບແຕ້ມສະນ້ຳດອກບົວແລະຄຳວ່າ ART ຊ້ຳໆ ມີດາວແດງລອຍທັບ', mk_a2: 'ຮູບມ້າຂາວສີເທົາ ມີດາວແດງເທິງໜ້າຜາກ', mk_a3: 'ຮູບຕັດແປະສີຂຽວສະທ້ອນແສງ ມີດາວສີບົວແລະຈຸດສີສົ້ມ',   // DRAFT lo: needs native review
  rp_work: "ແຈ້ງຜົນງານນີ້",   // DRAFT lo: needs native review
  foot_report: "ແຈ້ງບັນຫາ",   // DRAFT lo: needs native review
  lg_f_title: "ຊື່ຮູບ",   // DRAFT lo: needs native review
  lg_f_maker: "ນັກແຕ້ມ · ປີ",   // DRAFT lo: needs native review
  lg_f_own: "ແນວຄິດຂອງເຂົາ ໃນຄຳຂອງເຂົາເອງ",   // DRAFT lo: needs native review
  lg_f_src: "ທີ່ມາ",   // DRAFT lo: needs native review
  lg_f_hist: "ບັນທຶກປະຫວັດ (ຄຳຂອງ circles ບໍ່ແມ່ນຄຳຂອງນັກແຕ້ມ)",   // DRAFT lo: needs native review
  lg_f_credit: "ເຄຣດິດໄຟລ໌ ແລະ ສັນຍາອະນຸຍາດ",   // DRAFT lo: needs native review
  sc_link: "ຊ່ວຍໃຫ້ circles ໄປຕໍ່",   // DRAFT lo: needs native review
  sc_title: "ຊ່ວຍ circles",   // DRAFT lo: needs native review
  sc_k: "ເງິນໃຫ້ circles",   // DRAFT lo: needs native review
  sc_not: "ເງິນກ້ອນນີ້ເຂົ້າບັນຊີ circles ເພື່ອດູແລເວັບ ບໍ່ໄປຮອດສິລະປິນ ແລະ ບໍ່ກ່ຽວກັບທີ່ບໍລິຈາກໃຫ້ສິລະປິນ ຈະຊ່ວຍ ຫຼື ບໍ່ກໍໄດ້",   // DRAFT lo: needs native review
  sc_pick: "ເລືອກຈຳນວນທີ່ຢາກຊ່ວຍ circles",   // DRAFT lo: needs native review
  sc_acc: "circles (ຕົວຢ່າງ)",   // DRAFT lo: needs native review
  sc_qr_t: "ສະແກນເພື່ອຊ່ວຍ circles",   // DRAFT lo: needs native review
  sc_how: "ສະແກນ QR ດ້ວຍແອັບທະນາຄານ ແລ້ວກົດ “ຂ້ອຍຊ່ວຍແລ້ວ” (ສາທິດ: ບໍ່ມີເງິນເຄື່ອນໄຫວຈິງ)",   // DRAFT lo: needs native review
  sc_sent: "ຂ້ອຍຊ່ວຍແລ້ວ",   // DRAFT lo: needs native review
  sc_total: "ຊ່ວຍ circles {m}",   // DRAFT lo: needs native review
  sc_done_h: "ຂອບໃຈທີ່ຊ່ວຍ circles (ສາທິດ)",   // DRAFT lo: needs native review
  sc_done_p: "ບັນທຶກການຊ່ວຍ circles {m} ແບບຈຳລອງແລ້ວ ເງິນກ້ອນນີ້ບໍ່ໄດ້ໄປຮອດສິລະປິນ ນີ້ແມ່ນການສາທິດ ບໍ່ມີເງິນເຄື່ອນໄຫວ",   // DRAFT lo: needs native review
  af_h: "ຢາກຊ່ວຍໃຫ້ເວັບນີ້ໄປຕໍ່ບໍ",   // DRAFT lo: needs native review
  af_p: "ເງິນທີ່ໂອນໄປເຂົ້າບັນຊີຂອງສິລະປິນໂດຍກົງ circles ບໍ່ຫັກຫຍັງເລີຍ ຖ້າຢາກຊ່ວຍຄ່າດູແລເວັບ ມີຊ່ອງແຍກໃຫ້ ຊ່ວຍ ຫຼື ບໍ່ກໍໄດ້",   // DRAFT lo: needs native review
  af_btn: "ຊ່ວຍ circles (ແຍກຈາກສິລະປິນ)",   // DRAFT lo: needs native review
  fl_k: "ຊັ້ນ",   // DRAFT lo: needs native review
  fl_sr: "ຂັ້ນທີ {n} ຈາກ {m}: {s}",   // DRAFT lo: needs native review
  fl_1: "ເລືອກຍອດ",   // DRAFT lo: needs native review
  fl_2: "ສະແກນຈ່າຍ",   // DRAFT lo: needs native review
  fl_3: "ແຈ້ງໂອນ",   // DRAFT lo: needs native review
  fl_4: "ຂອບໃຈ",   // DRAFT lo: needs native review
  room_k: "ຫ້ອງ",   // DRAFT lo: needs native review
  change_amt: "ປ່ຽນຈຳນວນ",   // DRAFT lo: needs native review
  pay_notice_p: "{a} ຈະເຫັນຊື່ ແລະ ຂໍ້ຄວາມຂອງທ່ານໃນໜ້າຈັດການຂອງສິລະປິນ",   // DRAFT lo: needs native review
  v_h: "ສິລະປິນເລົ່າເອງ",   // DRAFT lo: needs native review
  v_stamp: "ຂຽນໂດຍສິລະປິນ",   // DRAFT lo: needs native review
  v_say: "ຜົນງານນີ້ຢາກບອກວ່າ",   // DRAFT lo: needs native review
  v_why: "ທີ່ມາຂອງຜົນງານ",   // DRAFT lo: needs native review
  v_look: "ຢາກໃຫ້ເບິ່ງຕົງນີ້",   // DRAFT lo: needs native review
  v_by: "— {a} ເຈົ້າຂອງຜົນງານ",   // DRAFT lo: needs native review
  v_tb_by: "ຜູ້ຂຽນ",   // DRAFT lo: needs native review
  v_tb_work: "ຜົນງານ",   // DRAFT lo: needs native review
  v_note: "ທັງໝົດເປັນຄຳຂອງສິລະປິນເອງ circles ບໍ່ແກ້ໄຂ ແລະ ບໍ່ຕີຄວາມແທນ",   // DRAFT lo: needs native review
  v_soon: "ໄວໆ ນີ້",   // DRAFT lo: needs native review
  cc_soon_p: "{a} ຍັງບໍ່ໄດ້ຂຽນແນວຄິດຂອງຜົນງານຊິ້ນນີ້ ທີ່ມາ ວັດສະດຸ ແລະ ຂັ້ນຕອນຈະມາຢູ່ບ່ອນນີ້ເມື່ອສິລະປິນຂຽນເອງ",   // DRAFT lo: needs native review
  v_soon_p: "ຍັງບໍ່ມີຄຳຂອງສິລະປິນສຳລັບຊິ້ນນີ້ {a} ຈະຂຽນເອງເມື່ອພ້ອມ ພວກເຮົາບໍ່ຂຽນແທນ",   // DRAFT lo: needs native review
  f_say: "ຜົນງານນີ້ຢາກບອກຫຍັງ (ປະໂຫຍກດຽວ)",   // DRAFT lo: needs native review
  f_why: "ທີ່ມາຂອງຜົນງານ",   // DRAFT lo: needs native review
  f_look: "ຢາກໃຫ້ເບິ່ງຕົງໃດ",   // DRAFT lo: needs native review
  pf_say_k: "ສິລະປິນເລົ່າເອງ",   // DRAFT lo: needs native review
  tip_h: "ເລືອກຈຳນວນທີ່ຢາກສະໜັບສະໜູນ",   // DRAFT lo: needs native review
  tip_other: "ຈຳນວນອື່ນ (USD)",   // DRAFT lo: needs native review
  tip_go: "ຕໍ່ໄປ",   // DRAFT lo: needs native review
  tip_bad: "ໃສ່ຈຳນວນເຕັມ 1–1000 ໂດລາ",   // DRAFT lo: needs native review
  tip_amt: "ຍອດສະໜັບສະໜູນ {m}",   // DRAFT lo: needs native review
  tip_sent: "ຂ້ອຍໂອນແລ້ວ",   // DRAFT lo: needs native review
  sm_tag: "ຕົວຢ່າງ / SAMPLE",   // DRAFT lo: needs native review
  sm_banner: "ຕົວຢ່າງ (SAMPLE) · ນີ້ແມ່ນການສາທິດ ບໍ່ມີຫຍັງຖືກສົ່ງອອກໄປ ຢ່າໂອນເງິນຈິງ",   // DRAFT lo: needs native review
  sm_qr_alt: "QR ຕົວຢ່າງ ບໍ່ແມ່ນຂອງຈິງ",   // DRAFT lo: needs native review
  pay_notice_h: "ແຈ້ງວ່າໂອນແລ້ວ",   // DRAFT lo: needs native review
  pay_slip: "ສະລິບໂອນເງິນ (ບໍ່ບັງຄັບ ຮູບບໍ່ເກີນ 2 MB)",   // DRAFT lo: needs native review
  pay_slip_big: "ໄຟລ໌ໃຫຍ່ເກີນ 2 MB",   // DRAFT lo: needs native review
  pay_slip_type: "ຕ້ອງເປັນໄຟລ໌ຮູບພາບ",   // DRAFT lo: needs native review
  pay_need_name: "ໃສ່ຊື່",   // DRAFT lo: needs native review
  pay_need_email: "ໃສ່ອີເມວໃຫ້ຖືກຕ້ອງ",   // DRAFT lo: needs native review
  pay_submit: "ສົ່ງແຈ້ງໂອນ",   // DRAFT lo: needs native review
  pay_sending: "ກຳລັງສົ່ງ…",   // DRAFT lo: needs native review
  pay_back: "ຍ້ອນກັບ",   // DRAFT lo: needs native review
  pay_done_h: "ແຈ້ງໂອນແລ້ວ · ຂອບໃຈ (ສາທິດ)",   // DRAFT lo: needs native review
  pay_done_tip: "ບັນທຶກການແຈ້ງໂອນ {m} ໃຫ້ {a} ແບບຈຳລອງແລ້ວ ຂອງຈິງ {a} ຈະກົດຢືນຢັນເມື່ອເຫັນຍອດເຂົ້າບັນຊີຂອງຕົນເອງ ນີ້ແມ່ນການສາທິດ ບໍ່ມີຫຍັງຖືກສົ່ງອອກໄປ ແລະ ບໍ່ມີເງິນເຄື່ອນໄຫວ",   // DRAFT lo: needs native review
  dlg_supn: "ເງິນເຂົ້າບັນຊີສິລະປິນໂດຍກົງ ຕອນນີ້ circles ບໍ່ຫັກຄ່າທຳນຽມ",   // DRAFT lo: needs native review
  don_for: "ເພື່ອຜົນງານ “{t}”",   // DRAFT lo: needs native review
  don_how: "ສະແກນ QR ດ້ວຍແອັບທະນາຄານ (ເຊັ່ນ BCEL One) ຫຼື ໂອນເຂົ້າບັນຊີດ້ານລຸ່ມ ແລ້ວກົດ “ຂ້ອຍໂອນແລ້ວ” ເງິນເຂົ້າສິລະປິນໂດຍກົງ ຕອນນີ້ circles ບໍ່ຫັກຄ່າທຳນຽມ",   // DRAFT lo: needs native review
  zoom_btn: "ຂະຫຍາຍຮູບເຕັມຈໍ",   // DRAFT lo: needs native review
  zoom_in: "ຊູມເຂົ້າ",   // DRAFT lo: needs native review
  zoom_out: "ຊູມອອກ",   // DRAFT lo: needs native review
  zoom_reset: "ຂະໜາດພໍດີ",   // DRAFT lo: needs native review
  zoom_hint: "ເລື່ອນລໍ້ເມົາສ໌ ຫຼື ຫຍິກນິ້ວເພື່ອຊູມ ລາກເພື່ອເລື່ອນ ກົດ Esc ເພື່ອປິດ",   // DRAFT lo: needs native review
  nav_all: "ສິລະປິນທັງໝົດ",   // DRAFT lo: needs native review
  bc_aria: "ເສັ້ນທາງໜ້າ",   // DRAFT lo: needs native review
  bc_city: "ເມືອງ",   // DRAFT lo: needs native review
  bc_artists: "ສິລະປິນ",   // DRAFT lo: needs native review
  bc_work: "ຜົນງານ",   // DRAFT lo: needs native review
  sc_done_r_h: "ຂອບໃຈທີ່ຊ່ວຍ circles",   // DRAFT lo: needs native review
  sc_done_r_p: "ຂອບໃຈທີ່ຊ່ວຍດູແລເວັບ {m} ທີມງານຈະເຫັນຍອດເມື່ອເງິນເຂົ້າບັນຊີ circles ເງິນກ້ອນນີ້ບໍ່ໄດ້ໄປຮອດສິລະປິນ",   // DRAFT lo: needs native review
  /* UX pass (2026-10-18) */
  hi_soon: "ໄຮໄລທ໌ຈະເລີ່ມເມື່ອມີຜູ້ຊົມກົດຖືກໃຈຈິງ ຕອນນີ້ຍັງບໍ່ມີຂໍ້ມູນ",   // DRAFT lo: needs native review
  real_done_h: "ຂອບໃຈທີ່ສະໜັບສະໜູນ",   // DRAFT lo: needs native review
  real_done_p: "ເງິນທີ່ໂອນໄປເຂົ້າບັນຊີຂອງ {a} ໂດຍກົງ {a} ຈະເຫັນຍອດໃນແອັບທະນາຄານຂອງຕົນເອງ ຕອນນີ້ circles ຍັງບໍ່ເກັບຂໍ້ມູນການໂອນຂອງທ່ານ",   // DRAFT lo: needs native review
  lr_k: "ຫ້ອງສຸດທ້າຍ",   // DRAFT lo: needs native review
  mus_prof2: "ເລື່ອງຂອງ{a}",   // DRAFT lo: needs native review
  hero_cta2: "ເບິ່ງຜົນງານເດັ່ນ",   // DRAFT lo: needs native review
  hero_t1: "ຕອນນີ້ບໍ່ຫັກຄ່າທຳນຽມ",   // DRAFT lo: needs native review
  hero_t2: "ເງິນເຂົ້າບັນຊີສິລະປິນໂດຍກົງ",   // DRAFT lo: needs native review
  f_branch: "ສາຂາ",   // DRAFT lo: needs native review
  /* trust copy (2026-10-18) */
  don_trust: "ເງິນກ້ອນນີ້ເຂົ້າບັນຊີຂອງ {a} ໂດຍກົງ · circles ບໍ່ຫັກຄ່າທຳນຽມ ບໍ່ຜ່ານມືໃຜ",   // DRAFT lo: needs native review
  don_check: "ກ່ອນກົດຢືນຢັນໃນແອັບທະນາຄານ ໃຫ້ກວດວ່າຊື່ຜູ້ຮັບກົງກັບຊື່ບັນຊີດ້ານເທິງ",   // DRAFT lo: needs native review
  don_fee: "ຍອດທີ່ເຫັນເປັນຍອດອ້າງອີງ ສະກຸນເງິນທີ່ໂອນຈິງ ແລະ ຄ່າທຳນຽມທະນາຄານ (ຖ້າມີ) ເປັນໄປຕາມທະນາຄານຂອງທ່ານ circles ບໍ່ຫັກເພີ່ມ",   // DRAFT lo: needs native review
  st_note: "circles ບໍ່ຫັກຄ່າທຳນຽມ ຄ່າທຳນຽມທະນາຄານ (ຖ້າມີ) ເປັນໄປຕາມທະນາຄານຂອງຜູ້ໂອນ",   // DRAFT lo: needs native review
  ji_lead: "ຝາກຊື່ໄວ້ໄດ້ເລີຍ ໜ້ານີ້ແມ່ນການສະແດງຄວາມສົນໃຈ ຍັງບໍ່ແມ່ນການສະໝັກ ແລະຍັງບໍ່ແມ່ນການຢືນຢັນວ່າໄດ້ເຂົ້າຮ່ວມ",   // DRAFT lo: needs native review
  ji_wait: "ເມືອງນີ້ມີຄົນດູແລຄົນດຽວ ພວກເຮົາຈະອ່ານລາຍຊື່ເມື່ອພ້ອມ ຍັງບອກບໍ່ໄດ້ວ່າຈະຕິດຕໍ່ກັບເມື່ອໃດ ແລະອາດຈະບໍ່ໄດ້ຕິດຕໍ່ທຸກຄົນ ບໍ່ຕ້ອງຮີບຮ້ອນເນາະ",   // DRAFT lo: needs native review
  ji_h: "ຝາກຊື່ໄວ້ກ່ອນ",   // DRAFT lo: needs native review
  ji_name: "ຊື່ ຫຼື ຊື່ສິລະປິນທີ່ຢາກໃຫ້ສະແດງ",   // DRAFT lo: needs native review
  ji_name_s: "ນາມປາກກາກໍໄດ້",   // DRAFT lo: needs native review
  ji_name_ph: "ເຊັ່ນ ນະພາ",   // DRAFT lo: needs native review
  ji_contact: "ຊ່ອງທາງຕິດຕໍ່",   // DRAFT lo: needs native review
  ji_contact_s: "ອີເມວ ຫຼື Instagram ອັນໃດອັນໜຶ່ງ",   // DRAFT lo: needs native review
  ji_contact_ph: "napha@email.com ຫຼື @napha",   // DRAFT lo: needs native review
  ji_link: "ລິ້ງຜົນງານ",   // DRAFT lo: needs native review
  ji_link_s: "ບ່ອນທີ່ເຫັນຜົນງານຂອງທ່ານ ເຊັ່ນ Instagram, Behance, ເວັບສ່ວນຕົວ",   // DRAFT lo: needs native review
  ji_send: "ຝາກຊື່ໄວ້ກ່ອນ",   // DRAFT lo: needs native review
  ji_note: "ພວກເຮົາໃຊ້ຊ່ອງທາງຕິດຕໍ່ ແລະ ລິ້ງນີ້ເພື່ອພິຈາລະນາການເຂົ້າຮ່ວມເທົ່ານັ້ນ ບໍ່ນຳໄປໃຊ້ຢ່າງອື່ນ ຂໍໃຫ້ລຶບໄດ້ທຸກເວລາ · <a href=\"privacy.html\">ຄວາມເປັນສ່ວນຕົວ</a>",   // DRAFT lo: needs native review
  ji_st: "ຍັງບໍ່ແມ່ນການຕອບຮັບ",   // DRAFT lo: needs native review
  ji_done_h: "ໄດ້ຮັບຂໍ້ມູນແລ້ວ",   // DRAFT lo: needs native review
  ji_done_p: "ຂອບໃຈທີ່ສົນໃຈ ນີ້ເປັນພຽງການທີ່ພວກເຮົາເກັບຊື່ຂອງທ່ານໄວ້ ພວກເຮົາຈະຕິດຕໍ່ກັບເມື່ອພ້ອມ ເຊິ່ງອາດໃຊ້ເວລາດົນ ແລະອາດຈະບໍ່ໄດ້ຕິດຕໍ່ທຸກຄົນ ບໍ່ຕ້ອງສົ່ງຊ້ຳເນາະ",   // DRAFT lo: needs native review
  ji_done_btn: "ໄປຍ່າງຊົມເມືອງ →",   // DRAFT lo: needs native review
  ji_e_name: "ໃສ່ຊື່ທີ່ຢາກໃຫ້ສະແດງກ່ອນເນາະ",   // DRAFT lo: needs native review
  ji_e_contact: "ໃສ່ອີເມວ ຫຼື Instagram ໄວ້ໃຫ້ພວກເຮົາຕິດຕໍ່",   // DRAFT lo: needs native review
  ji_e_link: "ລິ້ງຜົນງານເບິ່ງຄືບໍ່ຄົບ ລອງກວດອີກເທື່ອ",   // DRAFT lo: needs native review
  ji_e_fail: "ສົ່ງບໍ່ຜ່ານ ລອງໃໝ່ອີກໃນຈັກໜ້ອຍ ຂໍ້ມູນທີ່ກອກຍັງຢູ່ຄົບ",   // DRAFT lo: needs native review
  jn_verify: "ເມື່ອເປີດຮັບ ພວກເຮົາຍັງບໍ່ຄັດງານ ແລະ ບໍ່ຕັດສິນລົດນິຍົມ ສິ່ງດຽວທີ່ຢືນຢັນແມ່ນບັນຊີຮັບເງິນເປັນຂອງທ່ານ ໂດຍຈະຂໍພາບໜ້າຈໍທີ່ເຫັນພຽງຊື່ບັນຊີ ແລະ ເລກ 4 ຕົວທ້າຍ (ປິດສ່ວນທີ່ເຫຼືອ) ສະເພາະຜູ້ດູແລເວັບເບິ່ງໄດ້ ແລະ ລຶບພາຍໃນ 30 ວັນຫຼັງກວດແລ້ວ ລາຍລະອຽດຢູ່ໃນນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ ດຽວນີ້ພວກເຮົາຍັງບໍ່ເກັບພາບນີ້",   // DRAFT lo: needs native review
  jn_closed_h: "ດຽວນີ້ຍັງບໍ່ເປີດຮັບຄຳຂໍມີຕຶກ",   // DRAFT lo: needs native review
  cw_back_first: "ເຂົ້າໄປເບິ່ງຕຶກທຳອິດ →",   // DRAFT lo: needs native review
  jn_closed_p: "ເມືອງເພິ່ງເລີ່ມ ດຽວນີ້ມີຕຶກທຳອິດໜຶ່ງຫຼັງ ຄືຂອງ Arne ພວກເຮົາຍັງບໍ່ຮັບຄຳຂໍຈາກສິລະປິນຄົນອື່ນ ແລະ ໜ້ານີ້ບໍ່ມີຟອມ ແລະ ບໍ່ເກັບຂໍ້ມູນໃດໆ ເມື່ອພ້ອມຮັບ ພວກເຮົາຈະປະກາດທີ່ໜ້າທຳອິດກ່ອນ",   // DRAFT lo: needs native review
  sup_led_in: "ໄດ້ຮັບແລ້ວ",   // DRAFT lo: needs native review
  sup_led_out: "ໃຊ້ໄປແລ້ວ",   // DRAFT lo: needs native review
  sup_led_left: "ຄົງເຫຼືອ",   // DRAFT lo: needs native review
  sup_led_none: "ຍັງບໍ່ມີ",   // DRAFT lo: needs native review
  /* studio tower (2026-10-22): ideas / sketches / works floors, stages in the work window */
  tw_hint1: "ກົດປ່ອງຢ້ຽມເພື່ອເຂົ້າໄປເບິ່ງຜົນງານ",   // DRAFT lo: needs native review (the end of tw_hint)
  tw_hint_k: "ລອງຫຼິ້ນ",   // DRAFT lo: needs native review
  tw_hint: "ກົດປຸ່ມລິບເພື່ອເປີດໄຟຊັ້ນນັ້ນ ຊັ້ນອື່ນຈະມືດລົງ ກົດປ່ອງຢ້ຽມເພື່ອເຂົ້າໄປເບິ່ງຜົນງານ",   // DRAFT lo: needs native review
  tw_roof: "ຕຶກຂອງ {n}",   // DRAFT lo: needs native review
  tw_don: "ບໍລິຈາກໃຫ້ {a}",   // DRAFT lo: needs native review
  tw_lift: "ລິບ",   // DRAFT lo: needs native review
  tw_lift_all: "ເປີດໄຟທັງຕຶກ",   // DRAFT lo: needs native review
  tw_fl: "ຊັ້ນ {n}",   // DRAFT lo: needs native review
  tw_fl_r: "ຊັ້ນ {a}–{b}",   // DRAFT lo: needs native review
  tw_cat_idea: "ແນວຄິດ",   // DRAFT lo: needs native review
  tw_cat_sketch: "ສະເກັດ",   // DRAFT lo: needs native review
  tw_cat_work: "ຜົນງານຈິງ",   // DRAFT lo: needs native review
  tw_room_idea: "ດາດຟ້າ · ແນວຄິດ",   // DRAFT lo: needs native review
  tw_room_sketch: "ຫ້ອງສະເກັດ",   // DRAFT lo: needs native review
  tw_room_work: "ຫ້ອງວາງສະແດງ",   // DRAFT lo: needs native review
  tw_more: "ສະແດງ {n} ຈາກ {m} ຊິ້ນ ເບິ່ງຄົບທຸກຊິ້ນໃນຕາຕະລາງປຽບທຽບດ້ານລຸ່ມ",   // DRAFT lo: needs native review
  tw_lobby_k: "ລັອບບີ້",   // DRAFT lo: needs native review
  tw_sup_site: "ສະໜັບສະໜູນ circles",   // DRAFT lo: needs native review
  tw_lobby_note: "circles ບໍ່ຫັກເປີເຊັນຈາກສິລະປິນ ເງິນທີ່ບໍລິຈາກໃຫ້ສິລະປິນໄປຮອດສິລະປິນໂດຍກົງ ສ່ວນການສະໜັບສະໜູນ circles ແຍກຕ່າງຫາກ",   // DRAFT lo: needs native review
  st_idea: "ແນວຄິດ",   // DRAFT lo: needs native review
  st_sketch: "ສະເກັດ",   // DRAFT lo: needs native review
  st_draft: "ຮ່າງ",   // DRAFT lo: needs native review
  st_final: "ຜົນງານຈິງ",   // DRAFT lo: needs native review
  st_none_idea: "ຍັງບໍ່ມີແນວຄິດ",   // DRAFT lo: needs native review
  st_none_sketch: "ຍັງບໍ່ມີສະເກັດ",   // DRAFT lo: needs native review
  st_none_draft: "ຍັງບໍ່ມີຮ່າງ",   // DRAFT lo: needs native review
  st_none_final: "ຍັງບໍ່ມີຮູບ",   // DRAFT lo: needs native review
  st_h: "ຂັ້ນຕອນຂອງຜົນງານຊິ້ນນີ້",   // DRAFT lo: needs native review
  st_tabs: "ເລືອກຂັ້ນຕອນ",   // DRAFT lo: needs native review
  st_peel: "ປອກຊັ້ນ",   // DRAFT lo: needs native review
  st_peel_hint: "ເລື່ອນເພື່ອເບິ່ງຮູບຄ່ອຍໆປ່ຽນຈາກແນວຄິດໄປເປັນຜົນງານຈິງ",   // DRAFT lo: needs native review
  st_tl: "ເສັ້ນເວລາຂອງຜົນງານ",   // DRAFT lo: needs native review
  st_none_all: "ສິລະປິນຍັງບໍ່ໄດ້ໃສ່ແນວຄິດ ສະເກັດ ຫຼື ຮ່າງຂອງຜົນງານຊິ້ນນີ້ ດຽວນີ້ມີແຕ່ຜົນງານຈິງ",   // DRAFT lo: needs native review
  st_sheet_h: "ຕາຕະລາງປຽບທຽບ · ທຸກຜົນງານ × ທຸກຂັ້ນ",   // DRAFT lo: needs native review
  st_sheet_p: "ກົດຊ່ອງໃດກໍໄດ້ເພື່ອເປີດຜົນງານຊິ້ນນັ້ນທີ່ຂັ້ນຕອນນັ້ນ ຊ່ອງລາຍຂີດຄືຂັ້ນທີ່ສິລະປິນຍັງບໍ່ໄດ້ໃສ່",   // DRAFT lo: needs native review
  st_work: "ຜົນງານ",   // DRAFT lo: needs native review
  st_open: "ເປີດ {t} · {s}",   // DRAFT lo: needs native review
},
/* lo:end */
};

/* ---------- language ---------- */
let LANG = (() => {
  try {
    const q = new URLSearchParams(location.search).get('lang'); if (q === 'th' || q === 'en' || q === 'lo') return q;
    const s = localStorage.getItem('circles-lang'); if (s === 'th' || s === 'en' || s === 'lo') return s;
  } catch (e) {}
  const nav = String((navigator.languages && navigator.languages[0]) || navigator.language || 'th').toLowerCase();
  return nav.startsWith('th') ? 'th' : nav.startsWith('lo') ? 'lo' : 'en';
})();
const t = (k, v) => {
  let s = STR[LANG][k]; if (s === undefined) s = STR.th[k]; if (s === undefined) return k;
  if (v && typeof s === 'string') for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
};
const pk = (o, k) => { const v = (LANG === 'en' && o[k + 'En'] != null) ? o[k + 'En'] : (LANG === 'lo' && o[k + 'Lo'] != null) ? o[k + 'Lo'] : o[k]; return v == null ? '' : v; };   // Lo fields are optional: a missing one is the Thai text
const nameL = a => pk(a, 'name'), discL = a => LANG === 'en' ? (DISC_EN[a.disc] || a.disc) : LANG === 'lo' ? (DISC_LO[a.disc] || a.disc) : a.disc, cityL = a => LANG === 'en' ? (CITY_EN[a.city] || a.city) : LANG === 'lo' ? (CITY_LO[a.city] || a.city) : a.city;
const titleL = p => (LANG === 'lo' && p.titleLo != null) ? p.titleLo : pk(p, 't');   // a work's title; Lao uses titleLo (Lao-script spelling), missing = the Thai title
const bldgL = a => LANG === 'en' ? `${nameL(a)}'s building` : LANG === 'lo' ? 'ຕຶກຂອງ' + nameL(a) : 'ตึกของ' + a.name;   // "NO.04 · ตึกของ…" and the building's aria-label
const fmtSize = p => p.s == null ? (LANG === 'lo' && p.sLo != null ? p.sLo : '') : LANG === 'en' ? p.s.replace('ซม.', 'cm').replace('สูง', 'H') : (LANG === 'lo' && p.sLo != null) ? p.sLo : p.s;   // a work may have no size
/* the language button cycles TH -> EN -> ລາວ -> TH; it shows the language it will switch to */
const LANGS_ORDER = ['th', 'en', 'lo'], LANG_NEXT = {th: 'en', en: 'lo', lo: 'th'}, LANG_BTN = {th: 'TH', en: 'EN', lo: 'ລາວ'}, LANG_NAME = {th: 'ภาษาไทย', en: 'English', lo: 'ພາສາລາວ'};
const langHooks = [];
const onLang = fn => { langHooks.push(fn); };
function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-html]').forEach(el => { el.innerHTML = t(el.dataset.tHtml); });
  document.querySelectorAll('[data-t-alt]').forEach(el => { el.setAttribute('alt', t(el.dataset.tAlt)); });
  document.querySelectorAll('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
  document.querySelectorAll('[data-t-ph]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.tPh)); });
  langSeg();
  const mb = $('#menu-btn'); if (mb) mb.setAttribute('aria-label', t('menu_aria'));
  langHooks.forEach(fn => fn());
}
/* the language switch: all three languages side by side, the current one marked (replaces the old single button that showed the NEXT language) */
function langSeg(build) {
  let g = $('#lang');
  if (build && g && g.tagName === 'BUTTON') {
    const d = document.createElement('div'); d.className = 'lang-seg'; d.id = 'lang'; d.setAttribute('role', 'group');
    d.innerHTML = LANGS_ORDER.map(l => `<button type="button" data-l="${l}" lang="${l}">${LANG_BTN[l]}</button>`).join('');
    d.addEventListener('click', e => { const b = e.target.closest('button[data-l]'); if (b && b.dataset.l !== LANG) setLang(b.dataset.l); });
    g.replaceWith(d); g = d;
  }
  if (!g || !g.classList.contains('lang-seg')) return;
  g.setAttribute('aria-label', t('lang_aria'));
  g.querySelectorAll('button').forEach(b => { const on = b.dataset.l === LANG; b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', LANG_NAME[b.dataset.l]); });
}
function setLang(l) {
  LANG = l; try { localStorage.setItem('circles-lang', l); } catch (e) {}
  applyLang();
}
function setMeta(title, desc) {
  document.title = title;
  const set = (sel, v) => { const m = document.querySelector(sel); if (m) m.setAttribute('content', v); };
  set('meta[name="description"]', desc); set('meta[property="og:title"]', title); set('meta[property="og:description"]', desc);
  set('meta[name="twitter:title"]', title); set('meta[name="twitter:description"]', desc);
}

/* ---------- ransom-note type: 4 colourways, small tilt ---------- */
const RS = [
  {bg:'#0E0D0C',fg:'#F4F1E8',ff:'Anton'}, {bg:'#FF2E88',fg:'#0E0D0C',ff:'Anton'},
  {bg:'#F4F1E8',fg:'#0E0D0C',ff:'"Special Elite"'}, {bg:'#E8B730',fg:'#0E0D0C',ff:'Chonburi',w:400},
];
const ROT = [-3, 2, -1.5, 3.5, -2.5, 1.5, -3.5, 2.5], YOFF = [0, -2, 1, -1, 2, 0, -2, 1];
const SEG = window.Intl && Intl.Segmenter ? new Intl.Segmenter('th', {granularity: 'grapheme'}) : null;
function graphemes(s) { return SEG ? Array.from(SEG.segment(s), x => x.segment) : Array.from(s); }
function ransom(el, text, seed = 0, wrap = false) {
  const chip = (c, i) => {
    const st = RS[(i + seed) % RS.length], k = (i * 3 + seed) % ROT.length, tl = /[\u0E00-\u0EFF]/.test(c);   // tl: a Thai or Lao letter: it carries stacked marks, so its tile is taller (.tl) and uses the font that places them best
    const ff = tl ? (st.ff === 'Chonburi' ? 'Chonburi,IBM Plex Sans Thai,var(--lao)' : 'IBM Plex Sans Thai,var(--lao)') : st.ff,   /* no quotes: a " would end the style="…" attribute (the old Special Elite bug) */
      fw = tl && st.ff !== 'Chonburi' ? 700 : st.w || 400;
    return `<span${/^\s+$/.test(c) ? ' class="sp"' : tl ? ' class="tl"' : ''} style="--r:${ROT[k]}deg;--y:${YOFF[k]}px;--k:${i};background:${st.bg};color:${st.fg};font-family:${ff};font-weight:${fw}">${esc(c)}</span>`;
  };
  if (!wrap) { el.innerHTML = graphemes(text).map(chip).join(''); return; }
  /* wrap mode: every WORD is one unbreakable unit (.rw is nowrap), so a line may only break between words.
     Words are separated by a space (the space stays a blank chip) or by U+200B, an invisible "you may break here" that
     Thai text needs because Thai has no spaces. */
  let i = 0;
  el.innerHTML = text.split(/(\s+|\u200b)/).filter(Boolean).map(tok => {
    if (tok === '\u200b') return '';
    const chips = graphemes(tok).map(c => chip(c, i++)).join('');
    return /^\s+$/.test(tok) ? chips : `<span class="rw">${chips}</span>`;
  }).join('');
}

/* abstract placeholder built from an artist's own colours — sits behind each artwork <img> in case it fails to load */
function artBg(c, k) {
  const A = c[0], B = c[1 % c.length], C = c[2 % c.length], g = 'repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0 1px,transparent 1px 7px)';
  return [
    `${g},linear-gradient(180deg,${A} 0 40%,${B} 40% 66%,${C} 66%)`,
    `${g},radial-gradient(circle at 34% 40%,${A} 0 22%,transparent 22.5%),radial-gradient(circle at 68% 64%,${B} 0 30%,transparent 30.5%),${C}`,
    `${g},radial-gradient(circle at 50% 50%,${C} 0 18%,transparent 18.5%),linear-gradient(135deg,${A} 0 50%,${B} 50%)`,
    `${g},repeating-linear-gradient(90deg,${A} 0 16%,${B} 16% 30%,${C} 30% 40%)`,
  ][k % 4];
}
/* artwork markup: real/generated image over the colour placeholder */
/* sale status of a work: '' (for sale), 'sold' or 'reserved'; and the artist's own payment link (https only) */
const httpsHost = u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.includes('.'); } catch (e) { return false; } };
const artImg = (a, k) => { const p = a.pieces[k]; return p.img ? `<img src="${esc(p.img)}" alt="${esc(titleL(p))}" loading="lazy" decoding="async" draggable="false">` : ''; };
const artistById = id => ARTISTS.find(a => a.id === id);

/* ---------- toast ---------- */
function toast(m) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = m; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- delivery: endpoint if configured, otherwise the visitor's email app ---------- */
async function deliver(kind, to, subject, fields) {
  const body = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
  if (CONFIG.endpoint) {
    try {
      const r = await fetch(CONFIG.endpoint, {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({kind, to, subject, ...fields})});
      if (r.ok) return {mode: 'sent', body};
    } catch (e) {}
    return {mode: 'fail', body};
  }
  location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return {mode: 'mailto', body, to, subject};
}

function mountDialog(id) {
  let d = document.getElementById(id);
  if (!d) { d = document.createElement('dialog'); d.id = id; d.className = 'cdlg'; document.body.appendChild(d); d.addEventListener('click', e => { if (e.target === d) d.close(); }); }
  return d;
}
/* Every window is a small concrete building: a riveted beam on top (black name plate with pink tape, the lift-style floor sign, a bolted close button),
   the room, and a yellow/black hazard footing. floor = [n, of, key]: "floor n of `of`", labelled by the string fl_<key> (donation steps; omitted for plain forms). */
function floorHtml(n, of, label) {
  return `<div class="cdlg-fl" aria-hidden="true"><small>${esc(t('fl_k'))}</small><b>${n}<i>/${of}</i></b><span>${esc(label)}</span></div><span class="sr">${esc(t('fl_sr', {n, m: of, s: label}))}</span>`;
}
function dlgShell(title, inner, floor) {
  return `<div class="cdlg-h"><div class="cdlg-t"><h2>${title}</h2></div>${floor ? floorHtml(floor[0], floor[1], t('fl_' + floor[2])) : ''}<button type="button" class="cdlg-x" data-close aria-label="${esc(t('close'))}">✕</button></div><div class="cdlg-b">${inner}</div><div class="cdlg-foot" aria-hidden="true"></div>`;
}
/* every window is named by its heading: sets the content, then points aria-labelledby at the h2 */
function shell(d, ...args) {
  d.innerHTML = dlgShell(...args);
  const h = d.querySelector('.cdlg-t h2'); if (h) { h.id = d.id + '-t'; d.setAttribute('aria-labelledby', h.id); }
}
function showDone(d, res, to) {
  const ok = res.mode === 'sent', fail = res.mode === 'fail';
  shell(d, esc(t(ok ? 'done_sent' : fail ? 'news_fail' : 'done_mail')),
    `<div class="cdlg-done" role="status"><p class="intro">${esc(t(ok ? 'done_sent_p' : fail ? 'news_fail' : 'done_mail_p'))}</p>` +
    (ok ? '' : `<p class="note">${esc(t('to_label'))}: ${esc(to)}</p><pre id="done-pre">${esc(res.body)}</pre>`) +
    `<div class="act">${ok ? '' : `<button type="button" class="btn" data-copy>${esc(t('copy_msg'))}</button>`}<button type="button" class="btn ghost" data-close>${esc(t('close'))}</button></div></div>`);
  const pre = d.querySelector('#done-pre');
  d.querySelector('[data-copy]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(pre.textContent); toast(t('copied')); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(t('copy_fail')); }
  });
  d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => d.close()));
}
function wireForm(d, onSubmit) {
  d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => d.close()));
  const form = d.querySelector('form');
  if (CONFIG.endpoint && CONFIG.turnstileSiteKey) mountTurnstile(form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.querySelector('.hp input')?.value) return;          // honeypot
    if (CONFIG.endpoint && CONFIG.turnstileSiteKey && !new FormData(form).get('cf-turnstile-response')) { toast(t('captcha_wait')); return; }
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try { await onSubmit(Object.fromEntries(new FormData(form))); } finally { btn.disabled = false; }
  });
}

/* optional CAPTCHA (Cloudflare Turnstile): loaded only when a site key is configured */
function mountTurnstile(form) {
  const holder = document.createElement('div'); holder.className = 'cf-holder'; form.querySelector('.act').before(holder);
  const draw = () => window.turnstile && window.turnstile.render(holder, {sitekey: CONFIG.turnstileSiteKey});
  if (window.turnstile) { draw(); return; }
  if (!document.getElementById('cf-ts')) { const s = document.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = draw; document.head.appendChild(s); }
  else document.getElementById('cf-ts').addEventListener('load', draw);
}

/* "ขอมีตึก" — join request */
function openJoin() {
  const d = mountDialog('dlg-join');
  const opts = [...new Set(ARTISTS.map(a => a.disc))].map(x => `<option value="${esc(x)}">${esc(LANG === 'en' ? (DISC_EN[x] || x) : LANG === 'lo' ? (DISC_LO[x] || x) : x)}</option>`).join('') + `<option value="other">${esc(t('jd_other'))}</option>`;
  shell(d, t('jd_title'),
    `<form><p class="intro">${esc(t('jd_intro'))}</p>
      <div class="row"><label>${esc(t('jd_name'))}<input name="name" required maxlength="80" autocomplete="name"></label><label>${esc(t('jd_email'))}<input name="email" type="email" required maxlength="120" autocomplete="email"></label></div>
      <label>${esc(t('jd_disc'))}<select name="discipline">${opts}</select></label>
      <label>${esc(t('jd_link'))}<input name="link" type="url" placeholder="https://" maxlength="200"></label>
      <label>${esc(t('jd_msg'))}<textarea name="message" required maxlength="1500"></textarea></label>
      <fieldset class="jd-pay"><legend>${esc(t('jd_pay_h'))}</legend><p class="note">${esc(t('jd_pay_note'))}</p>
        <div class="row"><label>${esc(t('jd_bank'))}<select name="bank"><option value="">—</option><option value="BCEL">BCEL</option><option value="LDB">LDB</option><option value="other">${esc(t('jd_other'))}</option></select></label><label>${esc(t('sup_acc_name'))}<input name="account_name" maxlength="80"></label></div>
        <label>${esc(t('sup_acc_no'))}<input name="account_no" inputmode="numeric" maxlength="40"></label></fieldset>
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      <p class="note">${t('consent_form')}</p>
      <div class="act"><button class="btn" type="submit">${esc(t('jd_send'))}</button><button class="btn ghost" type="button" data-close>${esc(t('jd_cancel'))}</button></div>
      ${CONFIG.endpoint ? '' : `<p class="note">${esc(t('note_mailto'))}</p>`}</form>`);
  wireForm(d, async f => {
    const res = await deliver('join', CONFIG.contact, t('jd_subject', {n: f.name}), {name: f.name, email: f.email, discipline: d.querySelector('select[name=discipline]').selectedOptions[0].textContent, link: f.link, message: f.message, bank: f.bank, account_name: f.account_name, account_no: f.account_no, captcha: f['cf-turnstile-response']});
    showDone(d, res, CONFIG.contact);
  });
  if (!d.open) d.showModal();
}


/* newsletter */
async function subscribeNews(form) {
  if (form.querySelector('.hp-n')?.value) return;          // honeypot: bots fill every field
  const email = form.querySelector('input[type=email]').value.trim(); if (!email) return;
  if (CONFIG.endpoint) {
    const res = await deliver('newsletter', CONFIG.contact, 'newsletter', {email});
    toast(t(res.mode === 'sent' ? 'news_sent' : 'news_fail')); if (res.mode === 'sent') form.reset(); return;
  }
  try { const list = JSON.parse(localStorage.getItem('circles-news') || '[]'); if (!list.includes(email)) list.push(email); localStorage.setItem('circles-news', JSON.stringify(list)); } catch (e) {}
  toast(t('news_saved')); form.reset();
}

/* ---------- nav wiring: language + mobile menu ---------- */
/* Support button: a real link only when CONFIG.donate is an https:// URL, otherwise a disabled "Coming soon" button (never a dead link) */
function wireDonate() {
  const el = $('#donate-btn'); if (!el) return;
  if (supOf({support: CONFIG.support})) { el.disabled = false; el.removeAttribute('aria-disabled'); el.classList.remove('soon'); el.dataset.support = 'site'; el.dataset.t = 'don_btn'; el.textContent = t('don_btn'); return; }
  let ok = false; try { ok = new URL(CONFIG.donate).protocol === 'https:'; } catch (e) {}
  if (!ok) return;
  const a = document.createElement('a');
  a.id = el.id; a.className = 'btn pk';
  a.href = CONFIG.donate; a.target = '_blank'; a.rel = 'noopener'; a.dataset.t = 'don_btn';
  el.replaceWith(a);
}

function wireNav() {
  wireDonate();
  document.querySelectorAll('.links, #mnav').forEach(nav => {   // "All artists": next to "City" in the top bar and the phone menu, on every page (it goes to the search + filter row on the home page)
    const city = nav.querySelector('a[href$="#city"]'); if (!city || nav.querySelector('[data-all]') || ARTISTS.length < 3) return;   // the search + filter row is hidden while the city has fewer than three artists
    const a = document.createElement('a'); a.href = city.getAttribute('href').replace(/#city$/, '#all-artists'); a.dataset.t = 'nav_all'; a.dataset.all = ''; a.textContent = t('nav_all'); city.after(a);
  });
  langSeg(true);
  document.querySelectorAll('#mnav').forEach(mn => { const j = mn.querySelector('a[href$="join.html"]'); if (j) { j.classList.add('mn-join'); mn.prepend(j); } });   // the artists' door goes first in the phone menu
  const mb = $('#menu-btn'), mn = $('#mnav'); if (!mb || !mn) return;
  const set = open => { mb.setAttribute('aria-expanded', open); mn.classList.toggle('open', open); mn.toggleAttribute('inert', !open); };
  set(false);
  mb.addEventListener('click', e => { e.stopPropagation(); set(mb.getAttribute('aria-expanded') !== 'true'); });
  mn.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  addEventListener('click', e => { if (!e.target.closest('#mnav')) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

/* ===== spin:begin ===== */
/* ================= 3D spinning logo (a thick coin, like a LEGO-game loading brick) =================
   The logo <svg>s already in the pages are swapped for a coin at load time, so no page markup changes:
   · nav logo        hover or tap: one spin with a bounce · it also flips when the language changes
   · home loader     hop, spin in the air, squash on landing (loops while the page loads)
   · home hero arch  floats; tap or click it: fast spin that slows, wobbles and settles
   · page changes    a black curtain with a spinning coin covers the jump between pages
   Everything stays still for visitors who ask for reduced motion. */
function coin3d(host, {front = '#orb', back = '#orb-s', depth = 7, n = 13, mode = ''} = {}) {
  const edges = Array.from({length: n}, (_, i) =>
    `<i class="c3-edge${i === 0 || i === n - 1 ? ' hi' : ''}" style="transform:translateZ(${(-depth + 2 * depth * i / (n - 1)).toFixed(2)}px)"></i>`).join('');
  host.classList.add('c3');
  if (mode) host.classList.add('c3-m' + mode);
  host.innerHTML = `<span class="c3-lift"><span class="c3-coin">${edges}` +
    `<span class="c3-face" style="transform:translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${front}"/></svg></span>` +
    `<span class="c3-face" style="transform:rotateY(180deg) translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${back}"/></svg></span></span></span>`;
  return host;
}
function coinPlay(host, cls) {
  if (reduce || !host) return;
  const c = host.querySelector('.c3-coin'); if (!c) return;
  c.classList.remove('c3-once', 'c3-settle'); void c.offsetWidth; c.classList.add(cls);
  c.addEventListener('animationend', () => c.classList.remove(cls), {once: true});
}
function coinSwap(svg, opts) {
  if (!svg || !document.getElementById('orb')) return null;
  const span = document.createElement('span');
  const cls = svg.getAttribute('class'); if (cls) span.className = cls;
  if (svg.id) span.id = svg.id;
  span.setAttribute('aria-hidden', 'true');
  svg.replaceWith(span);
  return coin3d(span, opts);
}
(function initCoins() {
  if (!document.getElementById('orb')) return;
  const navCoins = [];
  document.querySelectorAll('.brand > svg').forEach(svg => {
    const brand = svg.parentElement, c = coinSwap(svg, {front: '#orb-s', back: '#orb-s', depth: 2, n: 5});
    navCoins.push(c);
    brand.addEventListener('pointerenter', () => coinPlay(c, 'c3-once'));
    brand.addEventListener('click', () => coinPlay(c, 'c3-once'));
  });
  let first = true;
  onLang(() => { if (first) { first = false; return; } navCoins.forEach(c => coinPlay(c, 'c3-once')); });
  coinSwap(document.querySelector('svg.loader-orb'), {mode: 'hop'});
  coinSwap(document.querySelector('#curtain > svg'), {mode: 'spin', depth: 5, n: 9});
  const hero = coinSwap(document.querySelector('#arch-par > svg'), {mode: 'float', depth: 9, n: 15});
  if (hero) {
    hero.setAttribute('aria-hidden', 'false'); hero.setAttribute('role', 'button'); hero.tabIndex = 0;
    hero.setAttribute('aria-label', LANG === 'en' ? 'Spin the circles badge' : 'หมุนโลโก้ circles');
    const go = () => coinPlay(hero, 'c3-settle');
    hero.addEventListener('click', go);
    hero.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    setTimeout(go, 2600);                       // one spin by itself after the page has settled, so people learn it moves
  }
})();

/* page change curtain: covers the jump between pages with a spinning coin */
(function pageCurtain() {
  const html = document.documentElement, KEY = 'circles-pgc';
  const make = () => {
    const el = document.createElement('div'); el.className = 'pgc'; el.setAttribute('aria-hidden', 'true');
    el.appendChild(document.createElement('span'));
    document.body.appendChild(el);
    if (document.getElementById('orb')) coin3d(el.firstChild, {mode: 'spin', depth: 5, n: 9});
    return el;
  };
  // arriving: the page was opened through the curtain, so lift it off
  let arrived = false;
  try { arrived = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
  if (arrived && !reduce) {
    const el = make(); el.classList.add('on', 'still');
    html.classList.remove('pgc-in');
    void el.offsetWidth; el.classList.remove('still');
    setTimeout(() => { el.classList.add('up'); setTimeout(() => el.remove(), 450); }, 260);
  } else html.classList.remove('pgc-in');
  if (reduce) return;
  // leaving: catch plain clicks on links to other pages of this site
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page (anchors)
    e.preventDefault();
    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    const el = make(); void el.offsetWidth; el.classList.add('on');
    setTimeout(() => { location.href = url.href; }, 430);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.pgc').forEach(el => el.remove()); });
})();
/* ===== spin:end ===== */
/* ===== lite:start ===== */
/* pause the hero and the city while they are off screen: nothing animates where nobody looks */
(function pauseOffscreen() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('zz-off', !en.isIntersecting)), {rootMargin: '120px 0px'});
  const go = () => document.querySelectorAll('#hero, #city').forEach(el => io.observe(el));
  /* "Report a problem" link in the page footers: goes to the contact address in CONFIG (so it becomes real when CONFIG.contact is real) */
  const rp = () => document.querySelectorAll('a.rp').forEach(a => {
    const live = CONFIG.contact && !/\.example$/i.test(CONFIG.contact);   // a *.example address goes nowhere: no dead "report" link until a real one is set
    if (live) a.href = 'mailto:' + CONFIG.contact + '?subject=' + encodeURIComponent('circles: problem report');
    const w = a.closest('.rp-w'); if (w) w.hidden = !live; else a.hidden = !live;
  });
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', rp) : rp();
  /* Footer "Settings" link (artists only): shown only when manage.html is published (CONFIG.manage), so no page links to a 404 */
  const mg = () => document.querySelectorAll('.mg-w').forEach(w => { w.hidden = !CONFIG.manage; });
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', mg) : mg();
  /* Visit counter: OFF unless CONFIG.analytics is set. GoatCounter: no cookies, no personal id. Skipped when the browser sends Do-Not-Track / Global Privacy Control and on local addresses. */
  (() => {
    const u = CONFIG.analytics;
    if (!u || !/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(u)) return;
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
    const s = document.createElement('script'); s.async = true; s.src = 'https://gc.zgo.at/count.js'; s.dataset.goatcounter = u; document.head.appendChild(s);
  })();
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
})();
/* ===== lite:end ===== */


/* ---------- ease of use: skip link, "pause motion", floating Share / Support buttons ---------- */
(function ux() {
  const calmGet = () => { try { return localStorage.getItem('circles-calm') === '1'; } catch (e) { return false; } };
  const setCalm = on => { document.documentElement.toggleAttribute('data-calm', on); if (on) document.documentElement.setAttribute('data-calm', '1'); try { localStorage.setItem('circles-calm', on ? '1' : '0'); } catch (e) {} };
  if (calmGet()) document.documentElement.setAttribute('data-calm', '1');
  const pageArtist = () => {
    const m = document.querySelector('[data-studio],[data-profile]');
    const id = m ? (m.dataset.studio || m.dataset.profile) : (/cutaway\.html$/i.test(location.pathname) ? new URLSearchParams(location.search).get('id') : '');
    return id && typeof ARTISTS !== 'undefined' ? ARTISTS.find(a => a.id === id) : null;
  };
  async function shareHere() {
    const url = location.href.split('#')[0];
    try { if (navigator.share) { await navigator.share({title: document.title, url}); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); toast(t('share_copied')); } catch (e) {}
  }
  function mount() {
    const main = document.getElementById('main');
    if (main && !document.querySelector('.skip')) {
      const a = document.createElement('a'); a.className = 'skip'; a.href = '#main'; a.dataset.t = 'skip_main'; a.textContent = t('skip_main');
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      document.body.prepend(a);
    }
    /* Pause motion and Share are not floating: they sit in the page footer (a quiet row), so nothing covers the work on a phone */
    const foot = document.querySelector('footer');
    if (!document.querySelector('.calm')) {
      const row = document.createElement('div'); row.className = 'foot-tools';
      const b = document.createElement('button'); b.type = 'button'; b.className = 'calm';
      const paint = () => { const on = document.documentElement.getAttribute('data-calm') === '1', lab = t(on ? 'calm_on' : 'calm_off'); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', lab); b.title = lab; b.innerHTML = `<span aria-hidden="true">${on ? '▶' : '❚❚'}</span><span class="calm-t"> ${esc(lab)}</span>`; };
      b.addEventListener('click', () => { setCalm(document.documentElement.getAttribute('data-calm') !== '1'); paint(); });
      paint(); onLang(paint); row.appendChild(b);
      if (pageArtist()) {
        const sh = document.createElement('button'); sh.type = 'button'; sh.className = 'calm share-foot'; sh.addEventListener('click', shareHere);
        const ps = () => { sh.innerHTML = `<span aria-hidden="true">↗</span><span class="calm-t"> ${esc(t('share_btn'))}</span>`; sh.setAttribute('aria-label', t('share_btn')); sh.title = t('share_btn'); };
        ps(); onLang(ps); row.appendChild(sh);
      }
      const sc = document.createElement('button'); sc.type = 'button'; sc.className = 'calm sc-foot'; sc.dataset.sc = '';   // "Help circles keep going": money for the site, separate from any artist
      const pc = () => { sc.textContent = t('sc_link'); }; pc(); onLang(pc); row.appendChild(sc);
      (foot || document.body).appendChild(row);
    }
    if (!document.querySelector('.pl-dist') && foot) {   // street signs to the other districts of the city (the page you are on is marked)
      const here = document.body.dataset.page || '', dist = document.createElement('nav'); dist.className = 'pl-dist'; dist.setAttribute('aria-label', t('dist_aria'));
      const paint = () => { dist.setAttribute('aria-label', t('dist_aria')); dist.innerHTML = `<span class="pl-dist-k">${esc(t('dist_k'))}</span>` + [['index.html#city', 'dist_city', 'home'], ['highlights.html', 'dist_hi', 'highlights'], ['legends.html', 'dist_lg', 'legends']].map(([h, k, pg]) => `<a class="pl-sign" href="${h}"${here === pg ? ' aria-current="page"' : ''}>${esc(t(k))}</a>`).join(''); };
      paint(); onLang(paint); foot.before(dist);
    }
    const A = pageArtist();
    if (A && !document.querySelector('.fab-wrap') && canDonate(A)) {
      const w = document.createElement('div'); w.className = 'fab-wrap';
      const su = document.createElement('button'); su.type = 'button'; su.className = 'btn pk fab-s fab-sup'; su.dataset.support = A.id;
      const paint = () => { su.textContent = t('pf_supb', {a: nameL(A)}); };
      paint(); onLang(paint); w.append(su); document.body.appendChild(w); document.documentElement.classList.add('has-fab');
      let raf = 0;   // hidden on the first screen (nothing is covered there) and while the page's own (primary) Donate button is on screen; the quiet per-work links do not count
      const check = () => { raf = 0; const vh = innerHeight, away = scrollY < 160 || [...document.querySelectorAll('[data-support]:not(.fab-s):not([data-quiet])')].some(el => { const r = el.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < vh; }); su.classList.toggle('away', away); w.classList.toggle('away', away); };   // the wrapper too: on phones it is a bar with its own border
      const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
      addEventListener('scroll', queue, {passive: true}); addEventListener('resize', queue); setTimeout(queue, 800); setInterval(queue, 2000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
