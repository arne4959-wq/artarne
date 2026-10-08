/* museum.js — the "private museum" scene for a studio page (cutaway.html / studio-<id>.html).
   Replaces the cut-open tower with a hall seen from its middle: dark-blue concrete walls, a vaulted ceiling with arched ribs and
   round skylights, the artist's real pictures hung frameless on both walls and at the far end. One picture is under the spot,
   the rest are dimmed. "Walk on" / "Previous" (and the arrow keys) slide the camera to the next picture. It is a few CSS 3D planes
   moved with one transform, not a 3D engine. Rules live in museum.css (every class starts with .mus-).
   The detail dialog, the concept block and the buy / ask flow are the page's own: this file only calls openWork() and openInquiry().
   Needs (from circles.js and the page): t, esc, pk, usd, nameL, fmtSize, workStatus, payLink, statusChip, openInquiry, openWork. */
(function () {
  'use strict';
  const W = 760, H = 560, PERSP = 800, VW = 1100, VH = 680;   // hall width / height, camera distance, design size of the viewport
  const FIRST = 800, GAP = 900, RIB = 460, SIDE_H = 430, HERO_H = 440, NEAR = 380, END_NEAR = 260;
  const TX = {L: -130, R: -50, E: 40};
  const CX = {L: 230, R: -230, E: 0};                      // the camera stands across the hall from the picture it is looking at, so the picture is not seen edge-on                     // where on the screen (design px from the centre) the lit picture should sit: left of centre, near the wall label
  let A = null, cur = 0, ro = null, wired = false;
  let G = null;                                            // geometry of the current artist's hall

  const on = a => !!a && a.pieces && a.pieces.length > 0 && !new URLSearchParams(location.search).has('floors');   // ?floors shows the old tower

  /* ---------------- pixel visitors: the site's palette, drawn once from text grids ---------------- */
  const C = {k: '#0E0D0C', w: '#F4F1E8', p: '#FF2E88', g: '#E8B730', r: '#A3182C', o: '#6B6B3A', b: '#7A4A40', c: '#8F8C85', n: '#1E1C1B', u: '#4A6080'};
  const HEAD = ['................', '................', '................', '.....FFFFF......', '....FFFFFFF.....', '....FFFFFEF.....', '....FFFFFFF.....', '.....FFFFFF.....', '......FFF.......'];
  const TORSO = ['....JJJJJJJ.....', '...JJDJJJDJJ....', '...JJJTTTJJJ....', '...JJJTTTJJJ....', '...JJJTTTJJJ....', '...NJJJJJJJN....', '....JJJJJJJ.....'];
  const LEGS = {
    stand: ['....PPPPPPP.....', '....PPPPPPP.....', '....PPP.PPP.....', '....PPP.PPP.....', '....PPP.PPP.....', '....BBB.BBB.....', '....BBBBBBBB....'],
    sit:   ['....PPPPPPPPPP..', '....PPPPPPPPPP..', '....PPP....PP...', '....PPP....PP...', '....BBB....BBB..', '....BBBB...BBBB.', '................'],
  };
  const HAIR = {
    mohawk: ['......H.H.......', '.....HHHHH......', '.....HHHHH......', '......HHH.......'],
    spikes: ['....H..H..H.....', '....HH.HH.HH....', '.....HHHHHH.....', '.....HHHHHH.....', '....H...........'],
    bob:    ['................', '................', '.....HHHHH......', '....HHHHHHH.....', '...HHHHHHHH.....', '...HHFFFFEF.....', '...HHFFFFFF.....', '...HH.FFFFF.....'],
  };
  const LOOKS = {
    stand: {F: '#C68E63', hair: 'spikes', H: 'p', J: 'n', T: 'w', P: 'c'},
    sitA:  {F: '#D9A47E', hair: 'mohawk', H: 'g', J: 'tartan', T: 'w', P: 'u'},
    sitB:  {F: '#E8B996', hair: 'bob', H: 'k', J: 'p', T: 'k', P: 'n'},
  };
  const colour = (f, x, y) => f === 'tartan' ? ((x % 4 === 1 || y % 4 === 1) ? ((x % 4 === 1 && y % 4 === 1) ? C.g : C.k) : C.r) : (C[f] || f);
  const sprites = {};
  function sprite(id, legs) {
    if (sprites[id]) return sprites[id];
    const L = LOOKS[id], ov = HAIR[L.hair];
    const rows = [...HEAD, ...TORSO, ...LEGS[legs], '................'].map((r, y) => [...r].map((ch, x) => { const o = ov[y] && ov[y][x]; return o && o !== '.' ? o : ch; }).join(''));
    const cv = document.createElement('canvas'); cv.width = 20; cv.height = 28;
    const g = cv.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = ch === 'F' || ch === 'N' ? L.F : ch === 'E' || ch === 'B' ? C.k : ch === 'D' ? C.g : ch === 'H' ? colour(L.H, x, y) : ch === 'J' ? colour(L.J, x, y) : ch === 'T' ? colour(L.T, x, y) : ch === 'P' ? colour(L.P, x, y) : C.k;
      g.fillRect(x + 2, y + 2, 1, 1);
    }));
    const d = g.getImageData(0, 0, 20, 28).data, has = (x, y) => x >= 0 && y >= 0 && x < 20 && y < 28 && d[(y * 20 + x) * 4 + 3] > 0;
    g.fillStyle = C.k;
    for (let y = 0; y < 28; y++) for (let x = 0; x < 20; x++) if (!has(x, y) && (has(x - 1, y) || has(x + 1, y) || has(x, y - 1) || has(x, y + 1))) g.fillRect(x, y, 1, 1);   // black outline
    return (sprites[id] = cv.toDataURL());
  }

  /* ---------------- geometry: where every picture hangs, where the camera stops ---------------- */
  function geometry(a) {
    const n = a.pieces.length, side = Math.max(0, n - 1);
    const L = Math.max(1500, (side ? FIRST + (side - 1) * GAP : 0) + 1300);
    const spots = a.pieces.map((p, k) => {
      const [aw, ah] = p.ar.split('/').map(Number), hero = k === n - 1, h = hero ? HERO_H : SIDE_H;
      const w = Math.min(Math.round(h * aw / ah), hero ? 640 : 460), hh = Math.round(w * ah / aw);
      return hero ? {k, side: 'E', d: L, w, h: hh, cam: L - END_NEAR} : {k, side: k % 2 ? 'R' : 'L', d: FIRST + k * GAP, w, h: hh, cam: Math.max(0, FIRST + k * GAP - NEAR)};
    });
    return {n, L, spots};
  }

  /* the camera turns (about the eye) a little so the lit picture lands where TX says: big, whole, and near the label */
  function yawFor(s) {
    const wx = (s.side === 'L' ? -W / 2 : s.side === 'R' ? W / 2 : 0) - CX[s.side], z = -(PERSP + (s.d - s.cam)), want = TX[s.side];
    let best = 0, err = 1e9;
    for (let a = -40; a <= 40; a += .5) {
      const r = a * Math.PI / 180, x = wx * Math.cos(r) + z * Math.sin(r), zz = -wx * Math.sin(r) + z * Math.cos(r);
      if (zz > -50) continue;
      const e = Math.abs(PERSP * x / -zz - want); if (e < err) { err = e; best = a; }
    }
    return best;
  }
  const camT = s => `translate3d(0,0,${PERSP}px) rotateY(${yawFor(s)}deg) translate3d(${-CX[s.side]}px,0,${s.cam - PERSP}px)`;

  /* ---------------- markup ---------------- */
  const px = v => Math.round(v * 10) / 10 + 'px';
  const ribSvg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path fill-rule="evenodd" d="M0 0H${W}V${H}H0Z M0 ${H}V160A${W / 2} 130 0 0 1 ${W} 160V${H}Z"/><path class="mus-rib-lit" fill="none" d="M0 160A${W / 2} 130 0 0 1 ${W} 160"/></svg>`;
  function art(s, p, k) {
    const top = (H - s.h) / 2 - 40;
    const left = s.side === 'L' ? s.d - s.w / 2 : s.side === 'R' ? G.L - s.d - s.w / 2 : (W - s.w) / 2;
    return `<button type="button" class="mus-art" data-k="${k}" style="left:${px(left)};top:${px(top)};width:${px(s.w)};height:${px(s.h)}" aria-label="${esc(pk(p, 't') + ' · ' + usd(p.p))}">`
      + `<i class="mus-wash"></i><i class="mus-lamp"></i><img src="${esc(p.img)}" alt="${esc(pk(p, 't'))}" width="${s.w}" height="${s.h}" decoding="async" draggable="false"><i class="mus-dim"></i></button>`;
  }
  const person = (id, legs, x, d, flip, bob) => `<div class="mus-ppl${legs === 'sit' ? ' sit' : ''}" data-d="${d}" style="transform:translate3d(${x - 90}px,${H / 2 - 252}px,${-d}px)"><span style="${flip ? 'transform:scaleX(-1)' : ''}"><img class="${bob ? 'mus-bob' : ''}" style="animation-delay:${(bob * -0.7).toFixed(1)}s" src="${sprite(id, legs)}" alt="" width="180" height="252" draggable="false"></span></div>`;

  function mapSvg() {
    const mx = 28, mw = 70, my = 8, mh = 96, y = d => my + mh - d / G.L * mh;
    const marks = G.spots.map(s => {
      const cy = y(s.d);
      return s.side === 'E' ? `<rect class="mus-m" data-k="${s.k}" x="${mx + 22}" y="${my - 1}" width="26" height="4"/>`
        : `<rect class="mus-m" data-k="${s.k}" x="${s.side === 'L' ? mx - 2 : mx + mw - 2}" y="${cy - 8}" width="4" height="16"/>`;
    }).join('');
    return `<svg viewBox="0 0 126 114" aria-hidden="true"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" class="mus-hall"/><path d="M${mx + 24} ${my + mh}h22v6h-22z" class="mus-door"/>${marks}<path id="mus-you" class="mus-you" d="M0 -6 L5 4 L-5 4Z"/></svg>`;
  }

  function build() {
    const s = G.spots, lw = s.filter(x => x.side === 'L'), rw = s.filter(x => x.side === 'R'), ew = s.filter(x => x.side === 'E');
    const ribs = [], sky = [], pools = [];
    for (let d = 300; d < G.L - 120; d += RIB) ribs.push(`<div class="mus-rib" style="left:${-W / 2}px;top:${-H / 2}px;width:${W}px;height:${H}px;transform:translate3d(0,0,${-d}px)" data-d="${d}">${ribSvg}</div>`);
    for (let d = 300 + RIB / 2, i = 0; d < G.L - 200; d += RIB * 2, i++) {
      sky.push(`<i class="mus-sky" style="left:${(W - 180) / 2}px;top:${px(d - 90)}"></i>`);
      pools.push(`<i class="mus-pool" style="left:${(W - 300) / 2}px;top:${px(G.L - d - 90)}"></i>`);
    }
    const rs = s.find(x => x.side === 'R'), bx = -W / 2 + 45;           // the bench stands flush against the left wall, facing the room
    let bd = rs ? rs.d : Math.max(600, G.L - 700);                     // opposite the right-wall picture (or near the far end when there is none)
    s.filter(x => x.side === 'L').forEach(x => { if (Math.abs(x.d - bd) < 480) bd = x.d + 560; });   // never in front of a left-wall picture
    bd = Math.min(bd, G.L - 500);
    return `<section class="mus" id="mus" aria-label="${esc(t('mus_aria', {a: nameL(A)}))}">
      <div class="mus-stage" id="mus-stage">
        <div class="mus-vp" id="mus-vp"><div class="mus-world" id="mus-world" style="transform:${camT(s[cur])}">
          <div class="mus-pl mus-ceil" style="transform:translate3d(0,${-H / 2}px,${-G.L / 2}px) rotateX(-90deg);width:${W}px;height:${G.L}px;margin:${-G.L / 2}px 0 0 ${-W / 2}px">${sky.join('')}</div>
          <div class="mus-pl mus-floor" style="transform:translate3d(0,${H / 2}px,${-G.L / 2}px) rotateX(90deg);width:${W}px;height:${G.L}px;margin:${-G.L / 2}px 0 0 ${-W / 2}px">${pools.join('')}</div>
          <div class="mus-pl mus-wl mus-left" style="transform:translate3d(${-W / 2}px,0,${-G.L / 2}px) rotateY(90deg);width:${G.L}px;height:${H}px;margin:${-H / 2}px 0 0 ${-G.L / 2}px">${lw.map(x => art(x, A.pieces[x.k], x.k)).join('')}</div>
          <div class="mus-pl mus-wl mus-right" style="transform:translate3d(${W / 2}px,0,${-G.L / 2}px) rotateY(-90deg);width:${G.L}px;height:${H}px;margin:${-H / 2}px 0 0 ${-G.L / 2}px">${rw.map(x => art(x, A.pieces[x.k], x.k)).join('')}</div>
          <div class="mus-pl mus-end" style="width:${W}px;height:${H}px;margin:${-H / 2}px 0 0 ${-W / 2}px;transform:translate3d(0,0,${-G.L}px)">${ew.map(x => art(x, A.pieces[x.k], x.k)).join('')}</div>
          ${ribs.join('')}
          <div class="mus-bench" data-d="${bd}" style="transform:translate3d(${bx - 160}px,${H / 2 - 90}px,${-bd}px) rotateY(90deg)"><i></i><b></b><b></b></div>
          ${person('sitA', 'sit', bx + 30, bd - 20, false, 1)}${person('sitB', 'sit', bx + 30, bd + 90, false, 2)}
          ${person('stand', 'stand', -W / 2 + 60, FIRST + 430, true, 3)}${person('stand', 'stand', -W / 2 + 50, G.L - 100, false, 4).replace('data-d=', `data-min="${G.L - 900}" data-d=`)}
        </div></div>
        <div class="mus-plate"><small>CIRCLES · MUSEUM</small><b>${esc(t('mus_name', {a: nameL(A)}))}</b><a class="mus-prof" href="profile-${esc(A.id)}.html">${esc(t('mus_prof'))}</a></div>
        <div class="mus-map" aria-hidden="true"><small>${esc(t('mus_map'))}</small>${mapSvg()}</div>
        <div class="mus-ctl"><button type="button" class="btn mus-prev" id="mus-prev">${esc(t('mus_prev'))}</button><span class="mus-cnt" id="mus-cnt"></span><button type="button" class="btn pk mus-next" id="mus-next">${esc(t('mus_next'))}</button></div>
      </div>
      <aside class="mus-label" id="mus-label" aria-live="polite"></aside>
    </section>`;
  }

  /* ---------------- state ---------------- */
  function labelHtml(k) {
    const p = A.pieces[k], sta = workStatus(p), pay = sta ? '' : payLink(p);
    const buy = sta === 'sold' ? t('b_sold', {a: nameL(A)}) : sta === 'reserved' ? t('b_res') : pay ? t('b_ask', {a: nameL(A)}) : t('buy', {a: nameL(A)});
    return `<i class="mus-tape"></i><small>${p.y} · ${esc(fmtSize(p))}</small><b>${esc(pk(p, 't'))}</b>${p.q ? `<i class="mus-q">“${esc(pk(p, 'q'))}”</i>` : ''}`
      + `<span class="mus-prow"><span class="mus-pr${sta ? ' strike' : ''}">${usd(p.p)}</span>${statusChip(p)}</span>`
      + `<span class="mus-acts">${pay ? `<a class="btn pk" href="${esc(pay)}" target="_blank" rel="noopener">${esc(t('b_pay'))}</a>` : ''}<button type="button" class="btn ${pay ? 'ghost' : 'pk'}" data-mus="buy">${esc(buy)}</button><button type="button" class="mus-more" data-mus="more">${esc(t('mus_more'))}</button></span>`;
  }
  function update() {
    const w = document.getElementById('mus-world'); if (!w) return;
    const s = G.spots[cur];
    w.style.transform = camT(s);
    document.querySelectorAll('#mus [data-d]').forEach(e => e.classList.toggle('mus-gone', +e.dataset.d < s.cam + 100 || (e.dataset.min && s.cam < +e.dataset.min)));   // behind the camera: fade out, never loom
    document.querySelectorAll('#mus [data-k]').forEach(e => e.classList.toggle('is-on', +e.dataset.k === cur));
    document.getElementById('mus-label').innerHTML = labelHtml(cur);
    document.getElementById('mus-cnt').textContent = `${cur + 1} / ${G.n}`;
    document.getElementById('mus-prev').disabled = cur === 0;
    document.getElementById('mus-next').disabled = cur === G.n - 1;
    const you = document.getElementById('mus-you');
    if (you) { const mh = 96, y = 8 + mh - s.cam / G.L * mh; you.setAttribute('transform', `translate(63 ${y.toFixed(1)})`); }
  }
  function go(k) { if (!G || k < 0 || k >= G.n || k === cur) return; cur = k; update(); }
  function fit() {
    const st = document.getElementById('mus-stage'), vp = document.getElementById('mus-vp'); if (!st || !vp) return;
    let sc = Math.max(st.clientWidth / VW, st.clientHeight / VH);         // cover: the hall always fills the stage
    const narrow = st.clientWidth / sc < 640;                            // a phone: show at least 640 design px across so the end picture fits, and make the stage as tall as the hall is
    if (narrow) sc = st.clientWidth / 640;
    st.style.height = narrow ? Math.round(VH * sc) + 'px' : '';
    vp.style.transform = `translate(-50%,-50%) scale(${sc.toFixed(4)})`;
  }

  function mount(main, a) {
    A = a; G = geometry(a); if (cur >= G.n) cur = 0;
    const wrap = main.querySelector('.tower-wrap'), tower = main.querySelector('#tower');
    if (!wrap || !tower) return;
    tower.outerHTML = build();
    wrap.classList.add('mus-on');
    const hint = main.querySelector('.hint'); if (hint) hint.textContent = t('mus_hint');
    update(); fit();
    if (ro) ro.disconnect();
    if ('ResizeObserver' in window) { ro = new ResizeObserver(fit); ro.observe(document.getElementById('mus-stage')); }
    if (wired) return; wired = true;
    window.addEventListener('resize', fit);
    main.addEventListener('click', e => {
      if (e.target.closest('#mus-prev')) return go(cur - 1);
      if (e.target.closest('#mus-next')) return go(cur + 1);
      const act = e.target.closest('[data-mus]');
      if (act) {
        if (act.dataset.mus === 'more') return openWork(cur);
        const s = workStatus(A.pieces[cur]); return openInquiry(A.id, cur, s === 'sold' ? 'id_pre_sold' : s === 'reserved' ? 'id_pre_res' : '');
      }
      const ar = e.target.closest('.mus-art');
      if (ar) { const k = +ar.dataset.k; if (k === cur) openWork(k); else go(k); }
    });
    document.addEventListener('keydown', e => {
      if (!document.getElementById('mus') || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (document.querySelector('dialog[open]') || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return;
      if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); }
    });
    /* when the detail window moves to another work, the hall follows it */
    const ow = window.openWork;
    if (typeof ow === 'function') window.openWork = function (k) { go(k); return ow.apply(this, arguments); };
  }

  window.MUS = {on, mount};
})();
