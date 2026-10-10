/* buy.js — the buy page of one work (buy.html / buy-<id>-<k>.html, k = position of the work in artists.js, from 0).
   Look: design/buy-reference.html (reference only). Styles: buy.css, every rule starts with .by-.
   Data: artists.js (title, price, material, size, year, picture, quote, status, pay link). Not invented: anything unknown is a yellow [__]
   that comes from SHIPPING / RATES in circles.js. The message form is the site's own: deliver() / wireForm() / CONFIG.endpoint, nothing new.
   Uses from the page: t, esc, pk, money, nameL, discL, cityL, fmtSize, workStatus, payLink, deliver, wireForm, CONFIG, SHIPPING, RATES, money, moneyHtml, lakOn, reduce.
   Exposes window.BUY = {mount}. */
(function () {
  const todo = v => v ? esc(v) : '<span class="by-todo">[__]</span>';
  const H = (id, text, c, dk) => `<h2 class="bl bl-${c}${dk ? ' bl-dk' : ''} by-h" id="${id}"><span class="bl-t">${esc(text)}</span></h2>`;
  const BT = txt => `<span class="bl-t">${esc(txt)}</span>`;
  const LOGOS = [[-6, 14, 300, 26, 'turn'], [64, 46, 260, 22, 'turnr'], [-4, 72, 280, 30, 'turn'], [80, 2, 170, 18, 'turnr']];   // left%, top%, size px, seconds, direction

  function html(A, k) {
    const p = A.pieces[k], name = nameL(A), title = titleL(p), sta = workStatus(p), pay = sta ? '' : payLink(p);
    const soldN = A.pieces.filter(x => workStatus(x) === 'sold').length + (+A.sold > 0 ? +A.sold : 0);
    const fx = [RATES.thb > 0 ? `${Math.round(p.p * RATES.thb).toLocaleString('en-US')} ${t('by_thb')}` : ''].filter(Boolean);
    const buyTxt = sta === 'sold' ? t('b_sold', {a: name}) : sta === 'reserved' ? t('b_res') : pay ? t('b_ask', {a: name}) : t('buy', {a: name});
    const pre = sta === 'sold' ? 'id_pre_sold' : sta === 'reserved' ? 'id_pre_res' : 'id_prefill';
    const stk = sta ? t(sta === 'sold' ? 'st_sold' : 'st_res') : t('by_one');
    const dot = sta ? t(sta === 'sold' ? 'st_sold' : 'st_res') : t('by_free');
    const steps = (pay ? ['p_how1', 'p_how2', 'p_how3'] : ['d_how1', 'd_how2', 'd_how3']);
    const reply = SHIPPING.replyDays ? esc(SHIPPING.replyDays) : '<span class="by-todo">[__]</span>';
    const back = `studio-${A.id}.html?work=${k}`;
    const ask = `<a class="by-btn ${sta || !pay ? 'by-pay' : 'by-ask'}" href="#by-ask" data-by-ask>${BT(buyTxt)}</a>`;
    const cta = `<div class="by-cta"><span class="by-bprice${sta ? ' by-strike' : ''}">${moneyHtml(p.p, p)}</span>${pay ? `<a class="by-btn by-pay" href="${esc(pay)}" target="_blank" rel="noopener">${BT(t('b_pay'))}</a>` : ''}${ask}</div>`;
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
          <h1 class="bl bl-y bl-dk by-title" id="by-title"><span class="bl-t">${esc(title)}</span></h1>
          ${p.q ? `<p class="by-q">“${esc(pk(p, 'q'))}”</p>` : ''}</div>
        <div class="by-prow"><span class="by-price${sta ? ' by-strike' : ''}${lakOn() ? ' by-kip' : ''}">${moneyHtml(p.p, p)}</span>${sta ? `<span class="by-chip by-chip-st">${esc(dot)}</span>` : ''}${fx.length ? `<span class="by-fx">≈ ${esc(fx.join(' · '))}</span>` : ''}</div>
        ${cta}
        <p class="by-avail"><i class="by-dot${sta ? ' by-dot-off' : ''}" aria-hidden="true"></i>${esc(dot)} · ${esc(t('by_reply', {d: '@@'})).replace('@@', reply)}</p>
        <section class="by-card" aria-labelledby="by-h-detail"><span class="by-tape by-tape-b"></span>${H('by-h-detail', t('by_detail'), 'y')}
          ${cell(t('lb_medium'), esc(pk(p, 'm')))}${cell(t('lb_size'), esc(fmtSize(p)))}${cell(t('lb_year'), esc(p.y))}${cell(t('by_cert'), todo(SHIPPING.certificate))}</section>
      </div>
    </div>
    <div class="by-row3">
      <section class="by-card by-tilt-l" aria-labelledby="by-h-how"><span class="by-tape by-tape-c"></span>${H('by-h-how', t('by_how'), 'p')}
        ${steps.map((s, i) => `<div class="by-step"><b class="by-n by-n${i}">${i + 1}</b><div><b>${esc(t(s))}</b></div></div>`).join('')}</section>
      <section class="by-card by-tilt-r" aria-labelledby="by-h-ship"><span class="by-tape by-tape-d"></span>${H('by-h-ship', t('by_ship'), 'y')}
        ${cell(t('by_to'), todo(SHIPPING.regions))}${cell(t('by_fee'), todo(SHIPPING.fee))}${cell(t('by_days'), SHIPPING.days ? esc(t('by_dayu', {d: SHIPPING.days})) : todo(''))}${cell(t('by_break'), SHIPPING.returnDays ? esc(t('by_ret', {d: SHIPPING.returnDays})) : todo(''))}</section>
      <section class="by-safe" aria-labelledby="by-h-safe"><span class="by-tape by-tape-e"></span><div class="by-in2">${H('by-h-safe', t('by_safe'), 'w', true)}
        <p>${esc(t('by_safe_p'))} <a href="mailto:${esc(CONFIG.contact)}">${esc(CONFIG.contact)}</a></p>
        ${pay ? `<p>${esc(t('d_paynote'))}</p>` : ''}
        <p>${[+A.since > 0 ? esc(t('by_since', {y: A.since})) : '', soldN > 0 ? esc(t('by_soldn', {n: soldN})) : ''].filter(Boolean).join(' · ')}</p></div></section>
    </div>
    <div class="by-askrow">
      <section class="by-card by-formcard" id="by-ask" aria-labelledby="by-h-ask">${H('by-h-ask', t('by_ask_h', {a: name}), 'p')}
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
      <label class="by-fld">${esc(t('id_msg'))}<textarea name="message" required maxlength="1500">${esc(t(pre, {t: titleL(p), p: money(p.p, p)}))}</textarea></label>
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      <p class="by-note">${t('consent_form')}</p>
      <div class="act"><button class="by-btn by-pay" type="submit">${BT(t('id_send'))}</button></div>
      ${CONFIG.endpoint ? '' : `<p class="by-note">${esc(t('note_mailto'))}</p>`}</form>`;
  }

  function mount(main, A, k) {
    const p = A.pieces[k];
    main.innerHTML = html(A, k);
    document.body.classList.add('by-page');
    const box = main.querySelector('.by-box'), pre = workStatus(p) === 'sold' ? 'id_pre_sold' : workStatus(p) === 'reserved' ? 'id_pre_res' : 'id_prefill';

    const wire = () => wireForm(box, async f => {
      const res = await deliver('inquiry', A.email, t('id_subject', {t: titleL(p)}), {artist: nameL(A), work: titleL(p), price: money(p.p, p), name: f.name, email: f.email, ship_to: f.ship_to, message: f.message, captcha: f['cf-turnstile-response']});
      done(res);
    });
    const done = res => {
      const ok = res.mode === 'sent', fail = res.mode === 'fail';
      box.innerHTML = `<div class="by-done" role="status"><b>${esc(t(ok ? 'done_sent' : fail ? 'news_fail' : 'done_mail'))}</b><p>${esc(t(ok ? 'done_sent_p' : fail ? 'news_fail' : 'done_mail_p'))}</p>`
        + (ok || fail ? '' : `<pre id="by-pre">${esc(res.body)}</pre><button type="button" class="by-btn by-ghost" data-by-copy>${BT(t('copy_msg'))}</button>`)
        + `<button type="button" class="by-btn by-ghost" data-by-again>${BT(t('by_again'))}</button></div>`;
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
