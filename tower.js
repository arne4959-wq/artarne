/* tower.js — the artist's studio as a cut-open concrete tower (cutaway.html / studio-<id>.html).
   It replaces the 3D picture hall (museum.js stays only because it draws the pixel visitors).
   Top to bottom: roof sign (name + Donate) · IDEAS floor · SKETCHES floor · FINISHED WORKS floor · lobby (bio + Support circles).
   A floor holds at most 3 windows per row (and at most 3 rows per kind), each window is one work at one stage and opens the work window.
   The lift on the side lights one floor and dims the others. Under the tower: a contact sheet (every work x every stage).
   The work window (stage tabs, "peel" slider, timeline) is the page's own dialog; this file only builds its pieces: TW.layersHtml / TW.panelHtml.

   Optional per-work fields in artists.js (an empty one shows an honest empty window, never an invented picture):
     idea, ideaEn, ideaLo   a few lines of text      sketch, draft   an image (relative path or https address)
     stages: {idea, sketch, draft, final}   dates as 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD'  (final falls back to the work's year)
   Needs (from circles.js): t, esc, pk, titleL, nameL, canDonate. Rules live in tower.css (every class starts with .tw- or .stg-). */
const TW = (function () {
  'use strict';
  const STAGES = ['idea', 'sketch', 'draft', 'final'];
  const CATS = [['idea', 'idea'], ['sketch', 'sketch'], ['work', 'final']];     // floors from the roof down: [lift key, stage shown on that floor]
  const PER_ROW = 3, MAX_ROWS = 3;
  const safeSrc = u => typeof u === 'string' && (/^https:\/\/[^\s"'<>]+$/.test(u) || /^[\w][\w.\/-]*$/.test(u)) ? u : '';   // an artist's address: https, or a file of this site
  const dateOf = d => /^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(d || '')) ? String(d) : '';
  const fmtOn = d => { const m = dateOf(d).split('-'); return m.length === 3 ? `${m[2]}/${m[1]}/${m[0]}` : m.length === 2 ? `${m[1]}/${m[0]}` : m[0] || ''; };

  /* one work at one stage: {s, has, text|src, on} */
  function stage(p, s) {
    const on = dateOf(p.stages && p.stages[s]) || (s === 'final' && p.y ? dateOf(String(p.y)) : '');
    if (s === 'idea') { const x = String(pk(p, 'idea') || '').trim(); return {s, has: !!x, text: x, on}; }
    const src = safeSrc(s === 'sketch' ? p.sketch : s === 'draft' ? p.draft : p.img);
    return {s, has: !!src, src, on};
  }
  const stagesOf = p => STAGES.map(s => stage(p, s));
  const hasProcess = p => stagesOf(p).some(x => x.s !== 'final' && (x.has || dateOf(p.stages && p.stages[x.s])));   // any idea, sketch or draft (or a date for one)
  const num = k => String(k + 1).padStart(2, '0');
  const none = s => t('st_none_' + s);

  /* ---------------- the tower ---------------- */
  function windowHtml(A, k, st) {
    const p = A.pieces[k], title = titleL(p);
    const glass = st.s === 'idea'
      ? (st.has ? `<span class="tw-note"><i class="tw-tape" aria-hidden="true"></i><span>${esc(st.text)}</span></span>` : `<span class="tw-empty">${esc(none('idea'))}</span>`)
      : (st.has ? `<img src="${esc(st.src)}" alt="" loading="lazy" decoding="async" draggable="false">` : `<span class="tw-empty">${esc(none(st.s))}</span>`);
    return `<button type="button" class="tw-win tw-${st.s}${st.has ? '' : ' tw-void'}" data-k="${k}" data-s="${st.s}" aria-label="${esc(title + ' — ' + t('st_' + st.s) + (st.has ? '' : ' (' + none(st.s) + ')'))}">`
      + `<span class="tw-glass">${glass}</span><span class="tw-cap" aria-hidden="true"><b>${num(k)}</b> ${esc(title)}</span></button>`;
  }

  function html(A, idx) {
    const n = A.pieces.length, shown = Math.min(n, PER_ROW * MAX_ROWS), rows = Math.ceil(shown / PER_ROW), total = rows * CATS.length;
    const floor = (cat, st, r, level) => {
      const ks = []; for (let k = r * PER_ROW; k < Math.min(shown, (r + 1) * PER_ROW); k++) ks.push(k);
      return `<section class="tw-fl" data-f="${cat}" aria-label="${esc(t('tw_fl', {n: level}) + ' · ' + t('tw_room_' + cat))}">`
        + `<div class="tw-lab"><b>${esc(t('tw_fl', {n: level}))}</b><span>${esc(t('tw_room_' + cat))}</span></div>`
        + ks.map(k => windowHtml(A, k, stage(A.pieces[k], st))).join('') + '</section>';
    };
    let h = '', level = total;
    for (const [cat, st] of CATS) for (let r = 0; r < rows; r++) h += floor(cat, st, r, level--);
    const range = i => rows === 1 ? t('tw_fl', {n: total - i * rows}) : t('tw_fl_r', {a: total - i * rows - rows + 1, b: total - i * rows});
    const lift = CATS.map(([cat], i) => `<button type="button" data-lift="${cat}" aria-pressed="false"><span aria-hidden="true">↑</span> ${esc(range(i))}<small>${esc(t('tw_cat_' + cat))}</small></button>`).join('')
      + `<button type="button" class="all" data-lift="all" aria-pressed="true">${esc(t('tw_lift_all'))}</button>`;
    const don = canDonate(A) ? `<button type="button" class="btn pk tw-don" data-support="${esc(A.id)}">${esc(t('tw_don', {a: nameL(A)}))}</button>` : '';
    return `<div class="tw" id="tw">`
      + `<p class="tw-hint"><mark>${esc(t('tw_hint_k'))}</mark> ${esc(t('tw_hint'))}</p>`
      + `<div class="tw-grid">`
      + `<div class="tw-bld" id="tw-bld" data-lit="all">`
      + `<div class="tw-roof"><i class="tw-ant" aria-hidden="true"></i><div class="tw-sign"><b>${esc(t('tw_roof', {n: nameL(A).toUpperCase()}))}</b></div>${don}</div>`
      + h
      + `<section class="tw-lobby" aria-labelledby="tw-lobby-h"><div class="tw-door" aria-hidden="true"><img src="people/stand.png" width="20" height="28" alt=""></div>`
      + `<div class="tw-lob-t"><small>${esc(t('tw_lobby_k'))}</small><h2 id="tw-lobby-h">${esc(nameL(A))}</h2><p>${esc(pk(A, 'bio'))}</p>`
      + `<p class="tw-note-fee">${esc(t('tw_lobby_note'))}</p>`
      + `<div class="tw-lob-act"><button type="button" class="btn pk" data-support="site">${esc(t('tw_sup_site'))}</button><a class="lr-prof" href="profile-${esc(A.id)}.html">${esc(t('mus_prof2', {a: nameL(A)}))}</a></div></div></section>`
      + `<div class="tw-ground" aria-hidden="true"></div></div>`
      + `<div class="tw-lift" role="group" aria-label="${esc(t('tw_lift'))}"><small>${esc(t('tw_lift'))}</small>${lift}</div>`
      + `</div>`
      + (n > shown ? `<p class="tw-more">${esc(t('tw_more', {n: shown, m: n}))}</p>` : '')
      + (n ? sheetHtml(A) : '') + `</div>`;
  }

  /* the contact sheet: every work (row) x every stage (column) */
  function sheetHtml(A) {
    const head = STAGES.map(s => `<th scope="col">${esc(t('st_' + s))}</th>`).join('');
    const rowsH = A.pieces.map((p, k) => `<tr><th scope="row"><b>${num(k)}</b><span>${esc(titleL(p))}</span></th>`
      + stagesOf(p).map(st => {
        const inner = st.s === 'idea' ? (st.has ? `<span class="tw-snip">${esc(st.text)}</span>` : '<i aria-hidden="true">—</i>')
          : (st.has ? `<img src="${esc(st.src)}" alt="" loading="lazy" decoding="async" draggable="false">` : '<i aria-hidden="true">—</i>');
        return `<td><button type="button" class="tw-cell${st.has ? '' : ' tw-void'}" data-k="${k}" data-s="${st.s}" aria-label="${esc(t('st_open', {t: titleL(p), s: t('st_' + st.s)}) + (st.has ? '' : ' (' + none(st.s) + ')'))}">${inner}</button></td>`;
      }).join('') + '</tr>').join('');
    return `<section class="tw-sheet" aria-labelledby="tw-sheet-h"><div class="tw-sheet-in"><div class="tw-sheet-top"><h2 id="tw-sheet-h">${esc(t('st_sheet_h'))}</h2></div>`
      + `<p class="tw-sheet-p">${esc(t('st_sheet_p'))}</p><div class="tw-sheet-sc"><table class="tw-sheet-t"><thead><tr><th scope="col">${esc(t('st_work'))}</th>${head}</tr></thead><tbody>${rowsH}</tbody></table></div></div></section>`;
  }

  /* the lift: light one floor kind, dim the others */
  function bind(root) {
    const bld = root.querySelector('#tw-bld'); if (!bld) return;
    root.querySelector('.tw-lift').addEventListener('click', e => {
      const b = e.target.closest('[data-lift]'); if (!b) return;
      bld.dataset.lit = b.dataset.lift;
      root.querySelectorAll('.tw-lift [data-lift]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
  }

  /* ---------------- the work window: stage layers + the panel with tabs, peel and timeline ---------------- */
  function layerHtml(A, k, st) {
    const inner = st.s === 'idea'
      ? (st.has ? `<div class="stg-note"><i class="tw-tape" aria-hidden="true"></i><p>${esc(st.text)}</p></div>` : `<div class="stg-void"><span>${esc(none('idea'))}</span></div>`)
      : (st.has ? `<img src="${esc(st.src)}" alt="${esc(titleL(A.pieces[k]) + ' — ' + t('st_' + st.s))}" draggable="false">` : `<div class="stg-void"><span>${esc(none(st.s))}</span></div>`);
    return `<div class="stg-layer" data-stage="${st.s}">${inner}</div>`;
  }
  const layersHtml = (A, k) => `<div class="stg-stack">${stagesOf(A.pieces[k]).map(st => layerHtml(A, k, st)).join('')}</div>`;

  function panelHtml(A, k) {
    const sts = stagesOf(A.pieces[k]), proc = hasProcess(A.pieces[k]);
    const tabs = sts.map((st, i) => `<button type="button" class="stg-tab${st.has ? '' : ' void'}" data-stage="${st.s}" aria-pressed="false" aria-label="${esc(t('st_' + st.s) + (st.has ? '' : ' (' + none(st.s) + ')'))}"><small>0${i + 1}</small>${esc(t('st_' + st.s))}</button>`).join('');
    const peel = proc
      ? `<div class="stg-peel"><label for="stg-range">${esc(t('st_peel'))}</label><input type="range" id="stg-range" min="0" max="3" step="0.01" value="3"><small>${esc(t('st_peel_hint'))}</small></div>`
        + `<ol class="stg-tl" aria-label="${esc(t('st_tl'))}">${sts.map(st => `<li data-stage="${st.s}"><button type="button" data-stage="${st.s}"><b>${esc(t('st_' + st.s))}</b><time>${esc(fmtOn(st.on)) || (st.has ? '' : '—')}</time></button></li>`).join('')}</ol>`
      : `<p class="stg-none">${esc(t('st_none_all'))}</p>`;
    return `<section class="stg" aria-labelledby="stg-h"><div class="stg-top"><h3 id="stg-h">${esc(t('st_h'))}</h3></div>`
      + `<div class="stg-tabs" role="group" aria-label="${esc(t('st_tabs'))}">${tabs}</div>${peel}</section>`;
  }

  /* cross-fade: layer i is fully shown at v === i, and fades out one step away */
  function setPeel(scope, v) {
    scope.querySelectorAll('.stg-layer').forEach((el, i) => {
      const o = Math.max(0, 1 - Math.abs(v - i)); el.style.opacity = o.toFixed(3);
      el.style.pointerEvents = Math.round(v) === i ? 'auto' : 'none'; el.setAttribute('aria-hidden', String(Math.round(v) !== i));
    });
  }

  return {STAGES, stage, stagesOf, hasProcess, fmtOn, html, bind, layersHtml, panelHtml, setPeel};
})();
