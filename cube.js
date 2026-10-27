/* cube.js — CirclesCube.mount(host, opts): a draggable, auto-spinning CSS 3D cube with six punk-architecture faces.
   Needs cube.css. No other dependency. Respects prefers-reduced-motion (auto-spin starts OFF; dragging and the arrow keys still work).
   opts: {lang:'th'|'en'|'lo', size:px, auto:bool (default: true unless reduced motion), hint:bool (default true), controls:bool (default true)}
   Returns {destroy(), setAuto(bool), reset(), rotation()}. */
(function () {
  'use strict';
  var STR = {
    th: {label: 'ลูกบาศก์ 3 มิติ ลากเพื่อหมุน', res: 'ซึ้ง', no: 'ห้ามเดินผ่านเฉยๆ', spin: 'หมุนเอง', on: 'เปิด', off: 'ปิด', reset: 'รีเซ็ต', hint: 'ลากด้วยนิ้วหรือเมาส์เพื่อหมุน · ลูกศรบนคีย์บอร์ดก็ได้'},
    en: {label: '3D cube, drag to rotate', res: 'RESONATE', no: 'DON’T JUST WALK PAST', spin: 'Auto-spin', on: 'on', off: 'off', reset: 'Reset', hint: 'Drag with a finger or mouse to rotate · arrow keys work too'},
    lo: {label: 'ກ້ອນ 3 ມິຕິ ລາກເພື່ອໝຸນ', res: 'ຊຶ້ງ', no: 'ຫ້າມຍ່າງຜ່ານເຊີຍໆ', spin: 'ໝຸນເອງ', on: 'ເປີດ', off: 'ປິດ', reset: 'ຣີເຊັດ', hint: 'ລາກດ້ວຍນິ້ວ ຫຼື ເມົ້າເພື່ອໝຸນ'}   // DRAFT lo: needs native review
  };
  var START = {x: -24, y: 32};
  function mount(host, opts) {
    opts = opts || {};
    var L = STR[opts.lang] || STR.th, reduced = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    var auto = opts.auto == null ? !reduced : !!opts.auto, rx = START.x, ry = START.y, drag = false, lx = 0, ly = 0, raf = 0, dead = false;
    host.classList.add('cc');
    if (opts.size) host.style.setProperty('--cc-size', opts.size + 'px');
    host.innerHTML =
      '<div class="cc-stage" tabindex="0" role="img" aria-label="' + L.label + '"><div class="cc-cube">' +
      '<div class="cc-f cc-front"><b>' + L.res.split(' ')[0] + '<i>' + (opts.lang === 'en' ? '' : 'RESONATE') + '</i></b></div>' +
      '<div class="cc-f cc-right"><b>' + L.no + '</b></div>' +
      '<div class="cc-f cc-back"><svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#0d0d0d" stroke-width="5"><rect x="10" y="40" width="22" height="50"/><rect x="38" y="15" width="24" height="75" fill="#ffcf1f"/><rect x="68" y="55" width="22" height="35"/><path d="M4 90H96"/></g></svg></div>' +
      '<div class="cc-f cc-left"><b>ART<br>NOT<br>SORRY</b></div><div class="cc-f cc-top"></div><div class="cc-f cc-bottom"></div></div></div>' +
      '<div class="cc-shadow" aria-hidden="true"></div>' +
      (opts.controls === false ? '' : '<div class="cc-row"><button type="button" class="cc-btn" data-cc-spin aria-pressed="' + auto + '"></button><button type="button" class="cc-btn" data-cc-reset>' + L.reset + '</button></div>') +
      (opts.hint === false ? '' : '<p class="cc-hint">' + L.hint + '</p>');
    if (opts.lang === 'en') host.querySelector('.cc-front b').innerHTML = 'RESONATE';
    var stage = host.querySelector('.cc-stage'), cube = host.querySelector('.cc-cube'), spin = host.querySelector('[data-cc-spin]'), rst = host.querySelector('[data-cc-reset]');
    var apply = function () { cube.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; };
    var label = function () { if (spin) { spin.textContent = L.spin + ': ' + (auto ? L.on : L.off); spin.setAttribute('aria-pressed', String(auto)); } };
    var setAuto = function (v) { auto = !!v; label(); };
    stage.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; try { stage.setPointerCapture(e.pointerId); } catch (x) {} });
    stage.addEventListener('pointermove', function (e) { if (!drag) return; ry += (e.clientX - lx) * 0.6; rx = Math.max(-89, Math.min(89, rx - (e.clientY - ly) * 0.6)); lx = e.clientX; ly = e.clientY; apply(); });
    ['pointerup', 'pointercancel'].forEach(function (t) { stage.addEventListener(t, function () { drag = false; }); });
    stage.addEventListener('keydown', function (e) {
      var k = e.key, d = k === 'ArrowLeft' ? [0, -12] : k === 'ArrowRight' ? [0, 12] : k === 'ArrowUp' ? [-12, 0] : k === 'ArrowDown' ? [12, 0] : null;
      if (!d) return; e.preventDefault(); rx = Math.max(-89, Math.min(89, rx + d[0])); ry += d[1]; apply();
    });
    if (spin) spin.onclick = function () { setAuto(!auto); };
    var reset = function () { rx = START.x; ry = START.y; apply(); };
    if (rst) rst.onclick = reset;
    (function tick() { if (dead) return; if (auto && !drag && !document.hidden) { ry += 0.35; apply(); } raf = requestAnimationFrame(tick); })();
    label(); apply();
    return {destroy: function () { dead = true; cancelAnimationFrame(raf); host.innerHTML = ''; host.classList.remove('cc'); }, setAuto: setAuto, reset: reset, rotation: function () { return {x: rx, y: ry}; }};
  }
  window.CirclesCube = {mount: mount};
})();
