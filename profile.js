/* profile.js — the artist profile page body (profile.html / profile-<id>.html); the picture hall lives on studio-<id>.html.
   Look: design/profile-reference.html (reference only). Styles: profile.css, every rule starts with .pf-.
   Data: artists.js. Optional fields (tagline, concept, sold, since, timeline[], commission{open,until}, instagram) - an empty one hides its whole slot.
   Uses from the page: t, esc, pk, usd, nameL, discL, cityL, workStatus, openInquiry, CONFIG.
   Exposes window.PF = {mount}. */
(function () {
  const https = u => { try { return new URL(u).protocol === 'https:'; } catch (e) { return false; } };
  const chars = s => 'Segmenter' in Intl ? Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(s), x => x.segment) : Array.from(s);
  const TAPE = ['pink', 'gold'];
  const LOGOS = [   // left%, top%, size px, opacity, start angle, seconds per turn, direction, drift px
    [3, 3, 170, .28, -12, 12, 'turn', 30], [88, 2, 120, .22, 18, 18, 'turnr', -24], [92, 26, 200, .26, -6, 9, 'turn', -30], [2, 40, 230, .24, 10, 22, 'turnr', 26],
    [86, 62, 150, .28, 22, 14, 'turn', -20], [6, 80, 110, .24, -20, 10, 'turnr', 22], [46, 92, 190, .2, 4, 26, 'turn', 24]];

  function stats(A) {
    const sold = A.pieces.filter(p => workStatus(p) === 'sold').length + (+A.sold > 0 ? +A.sold : 0);
    return [
      [A.pieces.length, 'pf_nw', 'ink', -3], [sold, 'pf_ns', 'pink', 2], [+A.since > 0 ? A.since : 0, 'pf_ny', 'gold', -1.5]]
      .filter(s => s[0] > 0);
  }
  function html(A) {
    const name = nameL(A), n = A.pieces.length;
    const tagline = pk(A, 'tagline'), bio = pk(A, 'bio'), concept = pk(A, 'concept');
    const com = A.commission && A.commission.open ? A.commission : null, until = com && pk(com, 'until');
    const tl = Array.isArray(A.timeline) ? A.timeline.filter(x => x && x.y && (x.t || x.tEn)) : [];
    const ig = A.instagram && https(A.instagram) ? A.instagram : '';
    let d = 0; const delay = () => `style="--pf-d:${(d += .12).toFixed(2)}s"`;   // entrance order: each next element lands a little later
    const letters = chars(name).map((c, i) => `<span class="pf-ltr pf-in pf-drop pf-l${i % 3}" style="--r:${[-3, 2, -1.5, 2.5][i % 4]}deg;--pf-d:${(.5 + i * .14).toFixed(2)}s" aria-hidden="true">${esc(c)}</span>`).join('');
    const tags = [[discL(A), 'paper', -2], [cityL(A), 'gold', 1.5]].filter(x => x[0]).map((x, i) =>
      `<li class="pf-tag pf-in pf-pop pf-t-${x[1]}" style="--r:${x[2]}deg;--pf-d:${1 + i * .1}s">${esc(x[0])}</li>`).join('');
    const picks = A.pieces.slice(0, 4).map((p, k) => {
      const sta = workStatus(p), price = sta ? t('st_sold') : usd(p.p);
      return `<li class="pf-in pf-rise" style="--r:${[-3, 2, -1.5, 3][k]}deg;--pf-d:${(1.9 + k * .12).toFixed(2)}s"><a class="pf-pk" href="studio-${esc(A.id)}.html?work=${k}" style="--ar:${esc(p.ar || '1/1')}" aria-label="${esc(pk(p, 't') + ' · ' + (sta ? t('st_sold') : usd(p.p)))}">
        <span class="pf-tp pf-tp-${TAPE[(k + 1) % 2]}"></span>${p.img ? `<img src="${esc(p.img)}" alt="${esc(pk(p, 't'))}" loading="lazy" decoding="async" draggable="false">` : ''}
        <span class="pf-cap"><b>${esc(pk(p, 't'))}</b><span class="pf-cp${sta ? ' pf-strike' : ''}">${esc(price)}</span></span></a></li>`;
    }).join('');
    const can = https(CONFIG.donate);
    const supBtn = can
      ? `<a class="pf-sbtn" href="${esc(CONFIG.donate)}" target="_blank" rel="noopener">${esc(t('pf_supb', {a: name}))}</a>`
      : `<button type="button" class="pf-sbtn" disabled aria-disabled="true">${esc(t('pf_supb', {a: name}))}</button><span class="pf-soon" aria-hidden="true">${esc(t('pf_soon'))}</span>`;
    return `<section class="pf" id="pf" aria-labelledby="pf-name">
  <div class="pf-bg" aria-hidden="true">${['a', 'b', 'c', 'd'].map((c, i) => `<i class="pf-ring pf-ring-${c}" style="--pf-d:${i * 1.6}s"></i>`).join('')}<i class="pf-star"></i><i class="pf-dotb"></i>
    ${LOGOS.map(l => `<i class="pf-lg" style="left:${l[0]}%;top:${l[1]}%;width:${l[2]}px;height:${l[2]}px;--o:${l[3]};--a:${l[4]}deg;--t:${l[5]}s;--sp:pf-${l[6]};--dx:${l[7]}px"></i>`).join('')}</div>
  <div class="pf-in-wrap">
    <div class="pf-port pf-in pf-pop" style="--r:0deg;--pf-d:.1s" aria-hidden="true"><span class="pf-pic">${esc(chars(name)[0] || '')}</span><span class="pf-tp pf-tp-gold pf-tp-top"></span></div>
    <h2 class="pf-name" id="pf-name"><span class="pf-sr">${esc(name)}</span>${letters}</h2>
    <ul class="pf-tags" aria-label="${esc(t('lb_artist'))}">${tags}</ul>
    ${com ? `<p class="pf-open pf-in pf-pop" style="--r:-1.5deg;--pf-d:1.2s"><i class="pf-dot" aria-hidden="true"></i><b>${esc(t('pf_open'))}</b>${until ? ` <span>${esc(t('pf_until', {m: until}))}</span>` : ''}</p>` : ''}
    ${tagline || bio ? `<div class="pf-note pf-in pf-rise" style="--r:-.8deg;--pf-d:1.3s"><i class="pf-tp pf-tp-pink pf-tp-l"></i><i class="pf-tp pf-tp-pink pf-tp-r"></i>${tagline ? `<p class="pf-tag1">“${esc(tagline)}”</p>` : ''}${bio ? `<p class="pf-bio">${esc(bio)}</p>` : ''}</div>` : ''}
    ${concept ? `<div class="pf-cc pf-in pf-rise" style="--r:.8deg;--pf-d:1.6s"><span class="pf-cv" aria-hidden="true">CONCEPT</span><div><small>${esc(t('pf_cn', {a: name}))}</small><p>${esc(concept)}</p></div><i class="pf-tp pf-tp-gold pf-tp-c"></i></div>` : ''}
    <ul class="pf-stats">${stats(A).map((s, i) => `<li class="pf-st pf-st-${s[2]} pf-in pf-pop" style="--r:${s[3]}deg;--pf-d:${(1.6 + i * .08).toFixed(2)}s"><b>${s[0]}</b><span>${esc(t(s[1]))}</span></li>`).join('')}</ul>
    ${tl.length ? `<ol class="pf-tl pf-in pf-rise" style="--r:0deg;--pf-d:1.9s" aria-label="${esc(t('pf_tl'))}">${tl.map(x => `<li><b>${esc(x.y)}</b><span>${esc(pk(x, 't'))}</span></li>`).join('')}</ol>` : ''}
    <div class="pf-works">
      <div class="pf-wh"><h3>${esc(t('pf_wh'))}</h3><span class="pf-hv">${esc(t('pf_hover'))}</span></div>
      <ul class="pf-strip">${picks}</ul>
      <a class="pf-all" href="studio-${esc(A.id)}.html">${esc(t('pf_all'))}</a>
    </div>
    <div class="pf-sup pf-in pf-pop${can ? '' : ' draft-only'}" style="--r:-1deg;--pf-d:2.6s"><div class="pf-sbox">
      <span class="pf-heart" aria-hidden="true">♥</span>
      <div class="pf-stx"><h3>${esc(t('pf_sup1', {a: name}))} <span>${esc(t('pf_sup2'))}</span></h3><p>${esc(t('pf_supn'))}</p></div>
      <div class="pf-sb">${supBtn}</div></div><i class="pf-tp pf-tp-gold pf-tp-s"></i></div>
    <div class="pf-cta pf-in pf-rise" style="--r:0deg;--pf-d:2.2s">
      <a class="pf-go" href="studio-${esc(A.id)}.html">${esc(t('pf_walk'))}</a>
      <button type="button" class="pf-lk" data-pf-ask>${esc(t('pf_ask'))}</button>
      ${ig ? `<a class="pf-lk" href="${esc(ig)}" target="_blank" rel="noopener">${esc(t('pf_ig'))}</a>` : ''}
      <button type="button" class="pf-bt pf-bt-gold" data-pf-share>${esc(t('pf_share'))}</button>
      <button type="button" class="pf-bt" data-pf-copy>${esc(t('pf_copy'))}</button>
      <span class="pf-live" role="status" aria-live="polite"></span>
    </div>
  </div></section>`;
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try {   // old browsers / non-secure pages: select a throw-away field and copy
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  function mount(main, A) {                                        // profile-<id>.html: the page's <main> holds the strip and the profile, nothing else
    const marq = document.createElement('div'); marq.className = 'pf-marq'; marq.setAttribute('aria-hidden', 'true');
    marq.innerHTML = `<div class="pf-marq-t">${esc(t('pf_marq')).repeat(10)}</div>`;
    main.replaceChildren(marq);                                    // the yellow running strip sits right under the menu
    main.insertAdjacentHTML('beforeend', html(A));
    const sec = main.querySelector('#pf'), live = sec.querySelector('.pf-live');
    const url = () => new URL(`profile-${A.id}.html`, location.href).href;
    const say = m => { live.textContent = ''; setTimeout(() => { live.textContent = m; }, 30); clearTimeout(say._t); say._t = setTimeout(() => { live.textContent = ''; }, 3000); };
    sec.addEventListener('click', async e => {
      const pick = e.target.closest('.pf-pk');
      if (pick && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button)) { e.preventDefault(); openQuick(A.id, +new URL(pick.href).searchParams.get('work'), A.pieces.map((_, i) => [A.id, i])); return; }
      if (e.target.closest('[data-pf-ask]')) { const k = A.pieces.findIndex(p => !workStatus(p)); openInquiry(A.id, k < 0 ? 0 : k, ''); return; }
      if (e.target.closest('[data-pf-copy]')) { const ok = await copy(url()); say(t(ok ? 'pf_copied' : 'copy_fail')); return; }
      if (e.target.closest('[data-pf-share]')) {
        if (navigator.share) { try { await navigator.share({title: document.title, url: url()}); } catch (err) { /* cancelled */ } return; }
        const ok = await copy(url()); say(t(ok ? 'pf_copied' : 'copy_fail'));
      }
    });
  }
  window.PF = {mount};
})();
