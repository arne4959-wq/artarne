/* highlights.js — highlights.html, the weekly highlights. SAMPLE DATA while there are no real visitors:
   "resonated" counts and views come from sampleRes() / sampleViews() in circles.js (stable made-up numbers) plus this browser's own taps.
   Ranking: the number of "Resonated" taps this week, views break ties. Donation amounts are never used (and do not exist on the page).
   Three groups: works (1-3 as towers, 4-6 on a lobby board), concepts (the artists' own words), one new artist to watch.
   Needs from circles.js: t, esc, pk, nameL, titleL, ARTISTS, resCount, sampleViews, onLang. */
(function () {
  'use strict';
  const NEW_SAMPLE = [{id: 'phrae', wk: 3}, {id: 'phop', wk: 5}, {id: 'pan', wk: 8}];   // sample: artists who joined less than 3 months ago (weeks since joining)
  const BG = ['#C4958A', '#E8B730', '#D4CFCA'];
  const $ = (s, r) => (r || document).querySelector(s);
  const chars = s => 'Segmenter' in Intl ? Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(s), x => x.segment) : Array.from(s);
  const nf = n => n.toLocaleString(LANG === 'th' ? 'th-TH' : LANG === 'lo' ? 'lo-LA' : 'en-US');

  function weekLabel() {   // "Week 41 · 6–12 Oct 2026": the Monday-to-Sunday week that contains today
    const d = new Date(), day = (d.getDay() + 6) % 7, mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day), sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    const jan4 = new Date(mon.getFullYear(), 0, 4), wk = 1 + Math.round(((mon - new Date(jan4.getFullYear(), 0, 4 - ((jan4.getDay() + 6) % 7))) / 864e5) / 7);
    const loc = LANG === 'th' ? 'th-TH-u-ca-gregory' : LANG === 'lo' ? 'lo-LA-u-ca-gregory' : 'en-GB';
    const f = new Intl.DateTimeFormat(loc, {day: 'numeric', month: 'short'}), y = sun.getFullYear();
    return t('hi_week', {n: wk, r: f.format(mon).replace(/\.$/, '') + '–' + f.format(sun).replace(/\.$/, ''), y});
  }
  const rows = () => ARTISTS.flatMap(a => a.pieces.map((p, k) => ({a, p, k, res: resCount(a.id, k), views: sampleViews(a.id, k)})))
    .sort((x, y) => y.res - x.res || y.views - x.views);
  const href = x => `studio-${x.a.id}.html?work=${x.k}`;

  function works() {
    const list = rows().slice(0, 6), order = [1, 0, 2];
    const tower = k => { const x = list[k], r = k + 1;
      return `<div class="pl-pc"><a class="pl-twr pl-r${r}" href="${esc(href(x))}" aria-label="${esc(t('hi_open', {n: r, t: titleL(x.p), a: nameL(x.a)}))}">
        <span class="pl-bb" style="aspect-ratio:${esc(x.p.ar)}"><img src="${esc(x.p.img)}" alt="" loading="lazy" decoding="async"></span><span class="pl-legs" aria-hidden="true"></span>
        <span class="pl-tb" aria-hidden="true"><b class="pl-rk">0${r}</b></span></a></div>`; };
    const cap = k => { const x = list[k];
      return `<p class="pl-cap"><b>${esc(titleL(x.p))}</b><span>${esc(t('hi_by', {a: nameL(x.a)}))}</span><span class="pl-ct">${esc(t('hi_res', {n: nf(x.res)}))} · ${esc(t('hi_views', {n: nf(x.views)}))}</span></p>`; };
    return `<div class="pl-podium">${order.map(tower).join('')}</div><div class="pl-caps" aria-hidden="true">${order.map(cap).join('')}</div>
      <div class="pl-dir"><p class="pl-dir-h">${esc(t('hi_dir'))}</p><ol>${list.slice(3, 6).map((x, j) =>
        `<li><a href="${esc(href(x))}"><span class="pl-n">0${j + 4}</span><span class="pl-tt">${esc(titleL(x.p))}<span class="pl-by">${esc(t('hi_by', {a: nameL(x.a)}))}</span></span><span class="pl-ct">${esc(t('hi_res', {n: nf(x.res)}))}<br>${esc(t('hi_views', {n: nf(x.views)}))}</span></a></li>`).join('')}</ol></div>`;
  }
  function concepts() {
    const list = rows().filter(x => pk(x.p, 'say')).slice(0, 4);
    return `<p class="pl-lead">${esc(t('hi_c_lead'))}</p><ol class="pl-cl">${list.map((x, j) =>
      `<li class="pl-cp"><span class="pl-n" aria-hidden="true">${j + 1}</span><div><q>${esc(pk(x.p, 'say'))}</q><div class="pl-meta"><span class="pl-own">${esc(t('hi_own'))}</span>
        <span>— ${esc(nameL(x.a))} · ${esc(t('hi_from', {t: titleL(x.p)}))}</span><span>${esc(t('hi_res', {n: nf(x.res)}))}</span></div></div></li>`).join('')}</ol>`;
  }
  function newcomers() {
    const items = NEW_SAMPLE.map(n => { const a = ARTISTS.find(x => x.id === n.id); if (!a) return null;
      const w = a.pieces.map((p, k) => ({p, k, res: resCount(a.id, k), views: sampleViews(a.id, k)})); const res = w.reduce((s, x) => s + x.res, 0), views = w.reduce((s, x) => s + x.views, 0);
      return {a, wk: n.wk, res, views, say: (w.find(x => pk(x.p, 'say')) || {p: {}}).p}; }).filter(Boolean).sort((x, y) => y.res - x.res || y.views - x.views);
    const f = items[0]; if (!f) return '';
    const av = (a, i) => `<span class="pl-av" style="background:${BG[i % 3]}" aria-hidden="true">${esc(chars(nameL(a))[0] || '')}</span>`;
    return `<p class="pl-lead">${esc(t('hi_n_lead'))}</p><div class="pl-newb"><div class="pl-feat">${av(f.a, 0)}<div>
      <p class="pl-badge">${esc(t('hi_n_badge'))}</p><h3>${esc(nameL(f.a))}</h3><p class="pl-j">${esc(t('hi_joined', {n: f.wk}))}</p>
      ${pk(f.say, 'say') ? `<q>${esc(pk(f.say, 'say'))}</q>` : ''}<p class="pl-ct">${esc(t('hi_res', {n: nf(f.res)}))} · ${esc(t('hi_views', {n: nf(f.views)}))}</p>
      <a class="pl-btn" href="studio-${esc(f.a.id)}.html">${esc(t('hi_n_go', {a: nameL(f.a)}))}</a></div></div>
      <p class="pl-more">${esc(t('hi_n_more'))}</p><ul class="pl-runs">${items.slice(1).map((r, i) =>
        `<li>${av(r.a, i + 1)}<div><b>${esc(nameL(r.a))}</b><span>${esc(t('hi_joined', {n: r.wk}))}</span></div><span class="pl-ct">${esc(t('hi_res', {n: nf(r.res)}))}</span></li>`).join('')}</ul></div>`;
  }

  function render() {
    $('#hi-week-t').textContent = weekLabel();
    $('#pan-w').innerHTML = works(); $('#pan-c').innerHTML = concepts(); $('#pan-n').innerHTML = newcomers();
  }
  function select(tab, focus) {
    document.querySelectorAll('#hi-tabs [role=tab]').forEach(tb => { const on = tb === tab; tb.setAttribute('aria-selected', String(on)); tb.tabIndex = on ? 0 : -1; document.getElementById(tb.getAttribute('aria-controls')).hidden = !on; });
    if (focus) tab.focus();
  }
  const tabs = $('#hi-tabs');
  tabs.addEventListener('click', e => { const tb = e.target.closest('[role=tab]'); if (tb) select(tb, false); });
  tabs.addEventListener('keydown', e => {
    const all = [...tabs.querySelectorAll('[role=tab]')], i = all.indexOf(document.activeElement); let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % all.length; else if (e.key === 'ArrowLeft') n = (i - 1 + all.length) % all.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = all.length - 1;
    if (n >= 0) { e.preventDefault(); select(all[n], true); }
  });
  window.HI = {render};
})();
