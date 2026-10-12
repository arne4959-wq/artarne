/* legends.js — legends.html, the Legends district. ONLY THE FRAME is built: slots that can hold an image, a film or a piece of music, each with the
   fields a piece needs. There are at most two clearly marked SAMPLE slots (placeholder text, no real work); circles does not pick anything in here.
   arne curates: to add a piece, put a real entry in LEGENDS below (see the field list) and delete the matching sample / empty slot.
   No donate button anywhere in this district (the makers have passed away); one link leads to the living artists.
   LEGENDS entry: {type:'img'|'film'|'music', file:'legends/x.jpg' (an image) | 'legends/x.mp3' | 'legends/x.mp4', title, titleEn, maker, makerEn, year, own:'the maker\'s own words', ownEn, src:'where the words come from',
                   note:'history, NOT the maker\'s words', noteEn, credit:'file credit + licence'}  - every piece needs credit and licence.
   Needs from circles.js: t, esc, pk, onLang. */
(function () {
  'use strict';
  const LEGENDS = [];                    // real pieces: none yet. They are chosen one by one by the site owner.
  const SLOTS = [{type: 'img', sample: true}, {type: 'music', sample: true}, {type: 'film', empty: true}, {type: 'img', empty: true}];   // 2 marked samples + empty rooms
  const KEY = {img: 'lg_img', film: 'lg_film', music: 'lg_music'};
  let filter = 'all';
  const X = '<svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0L400 300M400 0L0 300" stroke="#8F8C85" stroke-width="2"/></svg>';

  function media(x, k) {
    if (x.type === 'music') return x.file
      ? `<div class="pl-media aud"><audio controls preload="none" src="${esc(x.file)}" aria-label="${esc(pk(x, 'title'))}"></audio></div>`
      : `<div class="pl-media aud"><button class="pl-play" type="button" disabled aria-label="${esc(t('lg_play'))}">▶</button><span class="pl-bars" aria-hidden="true"></span><span>${esc(t('lg_ph_aud'))}</span></div>`;
    if (x.type === 'film') return x.file
      ? `<div class="pl-media vid"><video controls preload="none" src="${esc(x.file)}" aria-label="${esc(pk(x, 'title'))}"></video></div>`
      : `<div class="pl-media vid" aria-hidden="true"><span class="pl-tri"></span></div>`;
    return x.file ? `<div class="pl-media img"><img src="${esc(x.file)}" alt="${esc(pk(x, 'title'))}" loading="lazy" decoding="async"></div>`
      : `<div class="pl-media img" role="img" aria-label="${esc(t('lg_ph_img'))}">${X}<span aria-hidden="true">${esc(t('lg_ph_img'))}</span></div>`;
  }
  function piece(x, sample) {
    const k = t(KEY[x.type]);
    const v = (key, ph) => sample ? t(ph) : pk(x, key) || '';
    return `<li class="pl-vt" data-type="${x.type}"${filter !== 'all' && filter !== x.type ? ' hidden' : ''}><div class="pl-vt-top"><span class="pl-vt-type">${esc(k)}</span>${sample ? `<span class="pl-vt-stamp">${esc(t('lg_sample'))}</span>` : ''}</div>${media(sample ? {type: x.type} : x)}
      <dl><div><dt>${esc(t('lg_f_title'))}</dt><dd>${esc(sample ? t('lg_p_title') : pk(x, 'title'))}</dd></div>
      <div><dt>${esc(t('lg_f_maker'))}</dt><dd>${esc(sample ? t('lg_p_maker') : pk(x, 'maker') + ' · ' + x.year)}</dd></div>
      <div class="pl-vt-own"><dt>${esc(t('lg_f_own'))}</dt><dd>${esc(sample ? t('lg_p_own') : '“' + pk(x, 'own') + '”')}<small>${esc(t('lg_f_src'))}: ${esc(sample ? t('lg_p_src') : x.src)}</small></dd></div>
      <div class="pl-vt-hist"><dt>${esc(t('lg_f_hist'))}</dt><dd>${esc(v('note', 'lg_p_hist'))}</dd></div>
      <div><dt>${esc(t('lg_f_credit'))}</dt><dd>${esc(sample ? t('lg_p_credit') : x.credit)}</dd></div></dl><div class="pl-vt-base" aria-hidden="true"></div></li>`;
  }
  function empty(x) {
    const k = t(KEY[x.type]);
    return `<li class="pl-vt empty" data-type="${x.type}"${filter !== 'all' && filter !== x.type ? ' hidden' : ''}>${x.type === 'film' ? '<div class="pl-media vid" aria-hidden="true"><span class="pl-tri"></span></div>' : `<div class="pl-media img" aria-hidden="true">${X}</div>`}
      <p class="pl-em-h">${esc(t('lg_empty', {k}))}</p><p class="pl-em-p">${esc(t('lg_empty_p', {k}))}</p></li>`;
  }
  function render() {
    const real = LEGENDS.map(x => piece(x, false)), samples = LEGENDS.length ? [] : SLOTS.filter(x => x.sample).map(x => piece(x, true));
    $('#lg-list').innerHTML = real.concat(samples, SLOTS.filter(x => x.empty).map(empty)).join('');
  }
  const $ = s => document.querySelector(s);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-flt]'); if (!b) return;
    filter = b.dataset.flt; document.querySelectorAll('[data-flt]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); render();
  });
  window.LG = {render};
})();
