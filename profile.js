/* profile.js — the artist profile page body (profile.html / profile-<id>.html); the picture hall lives on studio-<id>.html.
   Look: design/profile-reference.html (reference only). Styles: profile.css, every rule starts with .pf-.
   Data: artists.js. Optional fields (tagline, concept, since, timeline[], instagram) - an empty one hides its whole slot.
   Uses from the page: t, esc, pk, money, breadcrumbHtml, canDonate, openDonate, DON_AMOUNTS, nameL, discL, cityL, CONFIG.
   Exposes window.PF = {mount}. */
(function () {
  const https = u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.includes('.'); } catch (e) { return false; } };
  const chars = s => 'Segmenter' in Intl ? Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(s), x => x.segment) : Array.from(s);
  const TAPE = ['pink', 'gold'];
  const LOGOS = [   // left%, top%, size px, opacity, start angle, seconds per turn, direction, drift px
    [3, 3, 170, .28, -12, 12, 'turn', 30], [88, 2, 120, .22, 18, 18, 'turnr', -24], [92, 26, 200, .26, -6, 9, 'turn', -30], [2, 40, 230, .24, 10, 22, 'turnr', 26],
    [86, 62, 150, .28, 22, 14, 'turn', -20], [6, 80, 110, .24, -20, 10, 'turnr', 22], [46, 92, 190, .2, 4, 26, 'turn', 24]];

  function stats(A) {
    return [
      [A.pieces.length, 'pf_nw', 'ink', -3], [+A.since > 0 ? A.since : 0, 'pf_ny', 'gold', -1.5]]
      .filter(s => s[0] > 0);
  }
  const TIPS = DON_AMOUNTS;   // preset donation amounts in US dollars (circles.js)
  function html(A) {
    const name = nameL(A), n = A.pieces.length;
    const tagline = pk(A, 'tagline'), bio = pk(A, 'bio'), concept = pk(A, 'concept');
    const tl = Array.isArray(A.timeline) ? A.timeline.filter(x => x && x.y && (x.t || x.tEn)) : [];
    const ig = A.instagram && https(A.instagram) ? A.instagram : '';
    let d = 0; const delay = () => `style="--pf-d:${(d += .12).toFixed(2)}s"`;   // entrance order: each next element lands a little later
    const letters = chars(name).map((c, i) => `<span class="pf-ltr pf-in pf-drop pf-l${i % 3}" style="--r:${[-3, 2, -1.5, 2.5][i % 4]}deg;--pf-d:${(.5 + i * .14).toFixed(2)}s" aria-hidden="true">${esc(c)}</span>`).join('');
    const tags = [[discL(A), 'paper', -2], [cityL(A), 'gold', 1.5]].filter(x => x[0]).map((x, i) =>
      `<li class="pf-tag pf-in pf-pop pf-t-${x[1]}" style="--r:${x[2]}deg;--pf-d:${1 + i * .1}s">${esc(x[0])}</li>`).join('');
    const picks = A.pieces.slice(0, 4).map((p, k) => {
      return `<li class="pf-in pf-rise" style="--r:${[-3, 2, -1.5, 3][k]}deg;--pf-d:${(1.9 + k * .12).toFixed(2)}s"><a class="pf-pk" href="studio-${esc(A.id)}.html?work=${k}" style="--ar:${esc(p.ar || '1/1')}" aria-label="${esc(titleL(p) + ' · ' + p.y)}">
        <span class="pf-tp pf-tp-${TAPE[(k + 1) % 2]}"></span>${p.img ? `<img src="${esc(p.img)}" alt="${esc(titleL(p))}" loading="lazy" decoding="async" draggable="false">` : ''}
        <span class="pf-cap"><b>${esc(titleL(p))}</b><span class="pf-cp">${esc(p.y)}</span></span></a></li>`;
    }).join('');
    const can = canDonate(A), tips = can;   // sample artists always get the donation block (a generated SAMPLE QR); a real one only with payment details
    const supBtn = can
      ? `<button type="button" class="pf-sbtn" data-support="${esc(A.id)}">${esc(t('pf_supb', {a: name}))}</button>`
      : `<button type="button" class="pf-sbtn" disabled aria-disabled="true">${esc(t('pf_supb', {a: name}))}</button><span class="pf-soon" aria-hidden="true">${esc(t('pf_soon'))}</span>`;
    return `<section class="pf" id="pf" aria-labelledby="pf-name">
  <div class="pf-bg" aria-hidden="true">${['a', 'b', 'c', 'd'].map((c, i) => `<i class="pf-ring pf-ring-${c}" style="--pf-d:${i * 1.6}s"></i>`).join('')}<i class="pf-star"></i><i class="pf-dotb"></i>
    ${LOGOS.map(l => `<i class="pf-lg" style="left:${l[0]}%;top:${l[1]}%;width:${l[2]}px;height:${l[2]}px;--o:${l[3]};--a:${l[4]}deg;--t:${l[5]}s;--sp:pf-${l[6]};--dx:${l[7]}px"></i>`).join('')}</div>
  <div class="pf-in-wrap">
    ${breadcrumbHtml([[t('bc_city'), 'index.html#city'], [name, '']])}
    <div class="pf-port pf-in pf-pop" style="--r:0deg;--pf-d:.1s" aria-hidden="true"><span class="pf-pic">${esc(chars(name)[0] || '')}</span><span class="pf-tp pf-tp-gold pf-tp-top"></span></div>
    <h2 class="pf-name" id="pf-name"><span class="pf-sr">${esc(name)}</span>${letters}</h2>
    <ul class="pf-tags" aria-label="${esc(t('lb_artist'))}">${tags}</ul>
    <div class="pf-works">
      <div class="pf-wh"><h3 class="bl bl-y"><span class="bl-t">${esc(t('pf_wh'))}</span></h3><span class="pf-hv">${esc(t('pf_hover'))}</span></div>
      <ul class="pf-strip">${picks}</ul>
      <a class="pf-all" href="studio-${esc(A.id)}.html">${esc(t('pf_all'))}</a>
    </div>
    ${tagline || bio ? `<div class="pf-note pf-in pf-rise" style="--r:-.8deg;--pf-d:1.3s"><i class="pf-tp pf-tp-pink pf-tp-l"></i><i class="pf-tp pf-tp-pink pf-tp-r"></i>${tagline ? `<p class="pf-tag1">“${esc(tagline)}”</p>` : ''}${bio ? `<p class="pf-bio">${esc(bio)}</p><button type="button" class="pf-more" data-pf-more aria-expanded="false">${esc(t('bio_more'))}</button>` : ''}</div>` : ''}
    ${concept ? `<div class="pf-cc pf-in pf-rise" style="--r:.8deg;--pf-d:1.6s"><span class="pf-cv" aria-hidden="true">CONCEPT</span><div><small>${esc(t('pf_cn', {a: name}))}</small><p>${esc(concept)}</p></div><i class="pf-tp pf-tp-gold pf-tp-c"></i></div>` : ''}
    <ul class="pf-stats">${stats(A).map((s, i) => `<li class="pf-st pf-st-${s[2]} pf-in pf-pop" style="--r:${s[3]}deg;--pf-d:${(1.6 + i * .08).toFixed(2)}s"><b>${s[0]}</b><span>${esc(t(s[1]))}</span></li>`).join('')}</ul>
    ${tl.length ? `<ol class="pf-tl pf-in pf-rise" style="--r:0deg;--pf-d:1.9s" aria-label="${esc(t('pf_tl'))}">${tl.map(x => `<li><b>${esc(x.y)}</b><span>${esc(pk(x, 't'))}</span></li>`).join('')}</ol>` : ''}
    <div class="pf-sup pf-in pf-pop" style="--r:-1deg;--pf-d:2.6s"><div class="pf-sbox">
      <span class="pf-heart" aria-hidden="true">♥</span>
      <div class="pf-stx"><h3 class="bl bl-y bl-dk"><span class="bl-t">${esc(t('pf_sup1', {a: name}))} ${esc(t('pf_sup2'))}</span></h3><p>${esc(t('pf_supn'))}</p></div>
      <div class="pf-sb">${supBtn}</div></div><i class="pf-tp pf-tp-gold pf-tp-s"></i>
      ${tips ? `<div class="pf-tips" id="pf-tips" role="group" aria-labelledby="pf-tips-h">
        <p class="pf-tips-h" id="pf-tips-h">${esc(t('tip_h'))}${sampleMode(A) ? ` <span class="pf-tips-s">${esc(t('sm_tag'))}</span>` : ''}</p>
        <div class="pf-tips-r">${TIPS.map(n => `<button type="button" class="pf-amt" data-pf-tip="${n}" aria-label="${esc(t('pf_supb', {a: name}) + ' ' + money(n))}">${esc(money(n))}</button>`).join('')}</div>
        <form class="pf-tipf" novalidate><label for="pf-tip-n">${esc(t('tip_other'))}</label>
          <input id="pf-tip-n" name="n" type="number" inputmode="numeric" min="1" max="1000" step="1" placeholder="12">
          <button type="submit" class="pf-bt">${esc(t('tip_go'))}</button></form>
        <p class="pf-tiperr" role="alert" hidden>${esc(t('tip_bad'))}</p></div>` : ''}</div>
    <div class="pf-cta pf-in pf-rise" style="--r:0deg;--pf-d:2.2s">
      <a class="pf-go bl bl-y bl-dk" href="studio-${esc(A.id)}.html"><span class="bl-t">${esc(t('pf_walk'))}</span></a>
      ${ig ? `<a class="pf-lk" href="${esc(ig)}" target="_blank" rel="noopener">${esc(t('pf_ig'))}</a>` : ''}
    </div>
  </div></section>`;
  }

  function mount(main, A) {                                        // profile-<id>.html: the page's <main> holds the strip and the profile, nothing else
    const marq = document.createElement('div'); marq.className = 'pf-marq'; marq.setAttribute('aria-hidden', 'true');
    marq.innerHTML = `<div class="pf-marq-t">${esc(t('pf_marq')).repeat(10)}</div>`;
    main.replaceChildren(marq);                                    // the yellow running strip sits right under the menu
    main.insertAdjacentHTML('beforeend', html(A));
    const sec = main.querySelector('#pf');
    const tipErr = sec.querySelector('.pf-tiperr'), tipIn = sec.querySelector('#pf-tip-n');
    sec.querySelector('.pf-tipf')?.addEventListener('submit', e => {   // a custom amount: a whole number of dollars, 1 to 1000
      e.preventDefault(); const v = tipIn.value.trim(), n = +v;
      if (!/^\d{1,4}$/.test(v) || n < 1 || n > 1000) { tipErr.hidden = false; tipIn.setAttribute('aria-invalid', 'true'); tipIn.focus(); return; }
      tipErr.hidden = true; tipIn.removeAttribute('aria-invalid'); openDonate(A, n);
    });
    tipIn?.addEventListener('input', () => { tipErr.hidden = true; tipIn.removeAttribute('aria-invalid'); });
    sec.addEventListener('click', e => {
      const mo = e.target.closest('[data-pf-more]'); if (mo) { const n = sec.querySelector('.pf-note'); const open = n.classList.toggle('open'); mo.textContent = t(open ? 'bio_less' : 'bio_more'); mo.setAttribute('aria-expanded', String(open)); return; }
      const tp = e.target.closest('[data-pf-tip]'); if (tp) { openDonate(A, +tp.dataset.pfTip); return; }
    });
  }
  window.PF = {mount};
})();
