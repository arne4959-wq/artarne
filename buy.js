/* buy.js — the buy page of one work (buy.html / buy-<id>-<k>.html, k = position of the work in artists.js, from 0).
   Look: design/buy-reference.html (reference only). Styles: buy.css, every rule starts with .by-.
   Data: artists.js (title, price, material, size, year, picture, quote, status, pay link). Not invented: anything unknown is a yellow [__]
   that comes from SHIPPING / RATES in circles.js. The message form is the site's own: deliver() / wireForm() / CONFIG.endpoint, nothing new.
   Uses from the page: t, esc, pk, usd, nameL, discL, cityL, fmtSize, workStatus, payLink, deliver, wireForm, CONFIG, SHIPPING, RATES, reduce.
   Exposes window.BUY = {mount}. */
(function () {
  const todo = v => v ? esc(v) : '<span class="by-todo">[__]</span>';
  // one tile per Thai syllable-ish cluster: a leading vowel stays with its consonant, tone marks / upper and lower vowels / a trailing า ะ ำ stay with it too
  const CL = /[เ-ไ]?[ก-ฮ][ัิ-ฺ็-๎]*[ะาำๅ]?|[^\s]/gu;
  const ROT = [-4, 3, -2, 5, -5, 2, -3];
  const LOGOS = [[-6, 14, 300, 26, 'turn'], [64, 46, 260, 22, 'turnr'], [-4, 72, 280, 30, 'turn'], [80, 2, 170, 18, 'turnr']];   // left%, top%, size px, seconds, direction

  function titleHtml(title) {
    let n = 0;
    const words = title.trim().split(/\s+/).map(w => `<span class="by-w">${(w.match(CL) || []).map(c => {
      const i = n++;
      return `<span class="by-rl by-l${i % 5}" style="--r:${ROT[i % 7]}deg;--d:${(i * .08).toFixed(2)}s" aria-hidden="true">${esc(c)}</span>`;
    }).join('')}</span>`);
    return `<span class="by-sr">${esc(title)}</span>${words.join('')}`;
  }

  function html(A, k) {
    const p = A.pieces[k], name = nameL(A), title = pk(p, 't'), sta = workStatus(p), pay = sta ? '' : payLink(p);
    const soldN = A.pieces.filter(x => workStatus(x) === 'sold').length + (+A.sold > 0 ? +A.sold : 0);
    const fx = [RATES.lak > 0 ? `${Math.round(p.p * RATES.lak).toLocaleString('en-US')} ${t('by_lak')}` : '', RATES.thb > 0 ? `${Math.round(p.p * RATES.thb).toLocaleString('en-US')} ${t('by_thb')}` : ''].filter(Boolean);
    const buyTxt = sta === 'sold' ? t('b_sold', {a: name}) : sta === 'reserved' ? t('b_res') : pay ? t('b_ask', {a: name}) : t('buy', {a: name});
    const pre = sta === 'sold' ? 'id_pre_sold' : sta === 'reserved' ? 'id_pre_res' : 'id_prefill';
    const stk = sta ? t(sta === 'sold' ? 'st_sold' : 'st_res') : t('by_one');
    const dot = sta ? t(sta === 'sold' ? 'st_sold' : 'st_res') : t('by_free');
    const steps = (pay ? ['p_how1', 'p_how2', 'p_how3'] : ['d_how1', 'd_how2', 'd_how3']);
    const reply = SHIPPING.replyDays ? esc(SHIPPING.replyDays) : '<span class="by-todo">[__]</span>';
    const back = `studio-${A.id}.html?work=${k}`;
    const ask = `<a class="by-btn ${sta || !pay ? 'by-pay' : 'by-ask'}" href="#by-ask" data-by-ask>${esc(buyTxt)}</a>`;
    const cta = `<div class="by-cta"><span class="by-bprice${sta ? ' by-strike' : ''}">${esc(usd(p.p))}</span>${pay ? `<a class="by-btn by-pay" href="${esc(pay)}" target="_blank" rel="noopener">${esc(t('b_pay'))}</a>` : ''}${ask}</div>`;
    const cell = (l, v) => `<div class="by-cell"><span>${esc(l)}</span><b>${v}</b></div>`;
    return `<div class="by" id="by">
  <div class="by-bg" aria-hidden="true">${LOGOS.map(l => `<i class="by-lg" style="left:${l[0]}%;top:${l[1]}%;width:${l[2]}px;height:${l[2]}px;--t:${l[3]}s;--sp:by-${l[4]}"></i>`).join('')}</div>
  <div class="by-marq" aria-hidden="true"><div class="by-marq-t">${esc(t('by_marq')).repeat(10)}</div></div>
  <div class="by-wrap">
    <a class="by-back" href="${esc(back)}">${esc(t('by_back', {a: name}))}</a>
    <div class="by-hero">
      <div class="by-pic">
        <div class="by-frame"><img src="${esc(p.img)}" alt="${esc(title + ' — ' + name)}" decoding="async" draggable="false"><span class="by-tape by-tape-a"></span></div>
        <span class="by-sticker" aria-hidden="true">${esc(stk)}</span>
      </div>
      <div class="by-info">
        <div><span class="by-chip">${esc(name)} · ${esc(discL(A))} · ${esc(cityL(A))}</span>
          <h1 class="by-title" id="by-title">${titleHtml(title)}</h1>
          ${p.q ? `<p class="by-q">“${esc(pk(p, 'q'))}”</p>` : ''}</div>
        <div class="by-prow"><span class="by-price${sta ? ' by-strike' : ''}">${esc(usd(p.p))}</span>${sta ? `<span class="by-chip by-chip-st">${esc(dot)}</span>` : ''}${fx.length ? `<span class="by-fx">≈ ${esc(fx.join(' · '))}</span>` : ''}</div>
        ${cta}
        <p class="by-avail"><i class="by-dot${sta ? ' by-dot-off' : ''}" aria-hidden="true"></i>${esc(dot)} · ${esc(t('by_reply', {d: '@@'})).replace('@@', reply)}</p>
        <section class="by-card" aria-labelledby="by-h-detail"><span class="by-tape by-tape-b"></span><h2 id="by-h-detail">${esc(t('by_detail'))}</h2>
          ${cell(t('lb_medium'), esc(pk(p, 'm')))}${cell(t('lb_size'), esc(fmtSize(p)))}${cell(t('lb_year'), esc(p.y))}${cell(t('by_cert'), todo(SHIPPING.certificate))}</section>
      </div>
    </div>
    <div class="by-row3">
      <section class="by-card by-tilt-l" aria-labelledby="by-h-how"><span class="by-tape by-tape-c"></span><h2 id="by-h-how">${esc(t('by_how'))}</h2>
        ${steps.map((s, i) => `<div class="by-step"><b class="by-n by-n${i}">${i + 1}</b><div><b>${esc(t(s))}</b></div></div>`).join('')}</section>
      <section class="by-card by-tilt-r" aria-labelledby="by-h-ship"><span class="by-tape by-tape-d"></span><h2 id="by-h-ship">${esc(t('by_ship'))}</h2>
        ${cell(t('by_to'), todo(SHIPPING.regions))}${cell(t('by_fee'), todo(SHIPPING.fee))}${cell(t('by_days'), SHIPPING.days ? esc(t('by_dayu', {d: SHIPPING.days})) : todo(''))}${cell(t('by_break'), SHIPPING.returnDays ? esc(t('by_ret', {d: SHIPPING.returnDays})) : todo(''))}</section>
      <section class="by-safe" aria-labelledby="by-h-safe"><span class="by-tape by-tape-e"></span><div class="by-in2"><h2 id="by-h-safe">${esc(t('by_safe'))}</h2>
        <p>${esc(t('by_safe_p'))} <a href="mailto:${esc(CONFIG.contact)}">${esc(CONFIG.contact)}</a></p>
        ${pay ? `<p>${esc(t('d_paynote'))}</p>` : ''}
        <p>${[+A.since > 0 ? esc(t('by_since', {y: A.since})) : '', soldN > 0 ? esc(t('by_soldn', {n: soldN})) : ''].filter(Boolean).join(' · ')}</p></div></section>
    </div>
    <div class="by-askrow">
      <section class="by-card by-formcard" id="by-ask" aria-labelledby="by-h-ask"><h2 id="by-h-ask">${esc(t('by_ask_h', {a: name}))}</h2>
        <div class="by-box">${formHtml(A, k, pre)}</div></section>
      <div class="by-card by-after"><span>${esc(t('by_after'))}</span><b>${esc(t('by_after_p', {a: '@A', d: '@@'})).replace('@A', esc(name)).replace('@@', reply)}</b></div>
    </div>
  </div>
</div>`;
  }

  function formHtml(A, k, pre) {
    const p = A.pieces[k];
    return `<form class="by-form">
      <div class="by-two"><label class="by-fld">${esc(t('id_name'))}<input name="name" required maxlength="80" autocomplete="name"></label><label class="by-fld">${esc(t('id_email'))}<input name="email" type="email" required maxlength="120" autocomplete="email"></label></div>
      <label class="by-fld">${esc(t('by_country'))}<input name="ship_to" maxlength="120" autocomplete="country-name"></label>
      <label class="by-fld">${esc(t('id_msg'))}<textarea name="message" required maxlength="1500">${esc(t(pre, {t: pk(p, 't'), p: usd(p.p)}))}</textarea></label>
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      <p class="by-note">${t('consent_form')}</p>
      <div class="act"><button class="by-btn by-pay" type="submit">${esc(t('id_send'))}</button></div>
      ${CONFIG.endpoint ? '' : `<p class="by-note">${esc(t('note_mailto'))}</p>`}</form>`;
  }

  /* shrink the title until its longest word fits on one line (words may wrap, a word never does); remembers the width so a resize loop cannot start */
  let fitKey = '';
  function fitTitle() {
    const h = document.getElementById('by-title'); if (!h) return;
    const key = h.clientWidth + '|' + h.textContent.length; if (key === fitKey) return; fitKey = key;
    let fs = innerWidth <= 600 ? 52 : 66;
    h.style.setProperty('--by-fs', fs + 'px');
    for (let i = 0; i < 30 && fs > 20 && [...h.querySelectorAll('.by-w')].some(w => w.scrollWidth > h.clientWidth + 1); i++) { fs -= 2; h.style.setProperty('--by-fs', fs + 'px'); }
  }

  function mount(main, A, k) {
    const p = A.pieces[k];
    main.innerHTML = html(A, k); fitKey = '';
    document.body.classList.add('by-page');
    const box = main.querySelector('.by-box'), pre = workStatus(p) === 'sold' ? 'id_pre_sold' : workStatus(p) === 'reserved' ? 'id_pre_res' : 'id_prefill';
    fitTitle(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitKey = ''; fitTitle(); });
    if (!mount._ro && 'ResizeObserver' in window) { mount._ro = new ResizeObserver(fitTitle); }
    if (mount._ro) { mount._ro.disconnect(); mount._ro.observe(main); }

    const wire = () => wireForm(box, async f => {
      const res = await deliver('inquiry', A.email, t('id_subject', {t: pk(p, 't')}), {artist: nameL(A), work: pk(p, 't'), price: usd(p.p), name: f.name, email: f.email, ship_to: f.ship_to, message: f.message, captcha: f['cf-turnstile-response']});
      done(res);
    });
    const done = res => {
      const ok = res.mode === 'sent', fail = res.mode === 'fail';
      box.innerHTML = `<div class="by-done" role="status"><b>${esc(t(ok ? 'done_sent' : fail ? 'news_fail' : 'done_mail'))}</b><p>${esc(t(ok ? 'done_sent_p' : fail ? 'news_fail' : 'done_mail_p'))}</p>`
        + (ok || fail ? '' : `<pre id="by-pre">${esc(res.body)}</pre><button type="button" class="by-btn by-ghost" data-by-copy>${esc(t('copy_msg'))}</button>`)
        + `<button type="button" class="by-btn by-ghost" data-by-again>${esc(t('by_again'))}</button></div>`;
      box.querySelector('[data-by-again]').addEventListener('click', () => { box.innerHTML = formHtml(A, k, pre); wire(); });
      box.querySelector('[data-by-copy]')?.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(box.querySelector('#by-pre').textContent); toast(t('copied')); } catch (e) { toast(t('copy_fail')); }
      });
    };
    wire();
    main.querySelectorAll('[data-by-ask]').forEach(a => a.addEventListener('click', e => {      // a real #by-ask link; with JS it also scrolls softly and puts the cursor in the message
      const to = document.getElementById('by-ask'); if (!to) return;
      e.preventDefault(); to.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
      setTimeout(() => { const m = to.querySelector('textarea'); if (m) m.focus({preventScroll: true}); }, reduce ? 0 : 450);
    }));
  }
  window.BUY = {mount};
})();
