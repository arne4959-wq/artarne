/* donate-flow.js — CirclesDonateFlow.open(opts): the 3-step donate window ("variant A", poster on a brick wall).
   Needs donate-flow.css (and cube.css + cube.js for the cube beside the thank-you poster; without them the cube is simply left out).
   1) pick a brick ($2/$5/$10/$25) + optional supporter name + optional message  2) scan the ARTIST's own QR + bank rows, "no fee" box, "I have paid"
   3) thank-you poster: "ขอบคุณ <name>", the artist's own words about the work, a brick wall where the brick drops in, and a SEPARATE box for supporting circles itself.
   Nothing here sends money or data anywhere. "I have paid" only turns the page; opts.onPaid(info) lets the host record it if it ever can.
   opts = {
     lang:'th'|'en'|'lo',
     artist:{id, name, support:{bank, name, no, qr, sample}},        // support.qr is the artist's own QR image; sample:true shows the SAMPLE warning
     work:{title, voice},                                            // voice = the artist's own words (artwork's say / concept.quote), optional
     amounts:[2,5,10,25], money(n) → the amount as text (optional, default '$n'; the host passes its own so Lao pages show kip),
     circles:{qr, bank, name, sample},                               // circles' own account, shown only in its own box on step 3
     amount (preselected brick, optional), onSupportCircles(), canDeliverMessage:false, onPaid(info), onClose()
   }
   Returns {el, close()}. */
(function () {
  'use strict';
  var S = {
    th: {title: 'โดเนทให้', artist: 'ศิลปิน', direct: 'เงินเข้าบัญชีศิลปินโดยตรง · circles ไม่หักค่าธรรมเนียม', pick: 'เลือกอิฐที่จะวาง', name: 'ชื่อที่จะสลักบนอิฐ (ไม่ใส่ก็ได้)', nameph: 'เช่น ลุงอ้วน หรือ ไม่ระบุชื่อ', msg: 'ฝากข้อความถึง {a} (ไม่ใส่ก็ได้)', msgph: 'งานชิ้นนี้ทำให้ฉันนึกถึง...',
      msgYes: 'ศิลปินจะเห็นข้อความนี้', go2: 'ไปสแกนจ่าย →', sample: 'ตัวอย่าง (SAMPLE) · ยังไม่มีเงินเคลื่อนไหวจริง ห้ามโอน', qrOf: 'QR ของ {a}', qrAlt: 'QR รับเงินของ {a}', amount: 'ยอดที่จะส่ง', bank: 'ธนาคาร', accName: 'ชื่อบัญชี', accNo: 'เลขบัญชี',
      nofee: '100% ถึงมือ {a} · circles ไม่หักสักบาท', how: 'สแกนด้วยแอปธนาคาร (เช่น BCEL One) โอนเสร็จแล้วกดปุ่มด้านล่าง ถ้าใช้มือถือเครื่องเดียวกัน ให้เซฟรูป QR แล้วสแกนจากแกลเลอรีในแอปธนาคาร', paid: 'ฉันโอนแล้ว', back: '← กลับ', none: 'ศิลปินยังไม่ได้ใส่ข้อมูลบัญชี จึงยังโดเนทตรงไม่ได้', thx: 'ขอบคุณ', tape: 'ขอบคุณ · THANK YOU', brick: 'เงินที่โอนไปถึงศิลปินโดยตรง อิฐก้อนนี้อยู่แค่ในหน้านี้ circles ยังไม่ได้ส่งชื่อหรือข้อความของคุณไปให้ศิลปิน', own: 'คำของ{a}เอง', from: 'จากงาน “{t}”', anon: 'ผู้ไม่ประสงค์ออกนาม',
      cH: 'อยากให้เมืองนี้ไปต่อไหม', cP: 'เงินที่โอนเมื่อกี้ไปถึง {a} เต็มจำนวน ถ้าอยากช่วยค่าดูแลเว็บ มีช่องแยกให้ ช่วยหรือไม่ช่วยก็ได้ ไม่มีผลกับอะไรทั้งนั้น', cBtn: 'ช่วย CIRCLES (แยกจากศิลปิน)', cQr: 'QR ของ circles เอง', cSoon: 'ช่องรับเงินของ circles ยังไม่เปิด', again: 'กลับไปดูงาน', close: 'ปิด', lbl: 'ขั้นที่ {n} จาก 3', bricks: {2: 'กาแฟแก้วนึง', 5: 'สีหนึ่งหลอด', 10: 'ผ้าใบผืนเล็ก', 25: 'วันทำงานหนึ่งวัน'}},
    en: {title: 'Donate to', artist: 'Artist', direct: 'Money goes straight to the artist · circles takes no fee', pick: 'Pick the brick to lay', name: 'Name to carve on the brick (optional)', nameph: 'e.g. Uncle Big, or Anonymous', msg: 'Leave a note for {a} (optional)', msgph: 'This work reminded me of...',
      msgYes: 'The artist will see this note', go2: 'Go to scan →', sample: 'SAMPLE · no real money moves. Do not transfer.', qrOf: '{a}’s QR', qrAlt: 'Payment QR of {a}', amount: 'Amount', bank: 'Bank', accName: 'Account name', accNo: 'Account number',
      nofee: '100% reaches {a} · circles takes nothing', how: 'Scan with your bank app (for example BCEL One), transfer, then press the button below. On one phone: save the QR image, then scan it from the gallery inside your bank app.', paid: 'I have paid', back: '← Back', none: 'This artist has not added payment details yet, so direct donations are not possible', thx: 'Thank you,', tape: 'THANK YOU', brick: 'Your money went straight to the artist. This brick lives on this page only: circles does not pass your name or note on to them yet.', own: '{a}’s own words', from: 'from “{t}”', anon: 'Anonymous',
      cH: 'Want this city to keep going?', cP: 'What you just sent reached {a} in full. If you also want to help run the site, there is a separate box. Help or don’t, it changes nothing.', cBtn: 'Support CIRCLES (separate from the artist)', cQr: 'circles’ own QR', cSoon: 'circles’ own donation box is not open yet', again: 'Back to the work', close: 'Close', lbl: 'Step {n} of 3', bricks: {2: 'a coffee', 5: 'a tube of paint', 10: 'a small canvas', 25: 'a day of work'}},
    lo: {title: 'ໂດເນດໃຫ້', artist: 'ສິລະປິນ', direct: 'ເງິນເຂົ້າບັນຊີສິລະປິນໂດຍກົງ · circles ບໍ່ຫັກຄ່າທຳນຽມ', pick: 'ເລືອກອິດທີ່ຈະວາງ', name: 'ຊື່ທີ່ຈະສະຫຼັກໃສ່ອິດ (ບໍ່ໃສ່ກໍໄດ້)', nameph: 'ເຊັ່ນ ລຸງອ້ວນ ຫຼື ບໍ່ລະບຸຊື່', msg: 'ຝາກຂໍ້ຄວາມຫາ {a} (ບໍ່ໃສ່ກໍໄດ້)', msgph: 'ງານຊິ້ນນີ້ເຮັດໃຫ້ຂ້ອຍຄິດເຖິງ...',
      msgYes: 'ສິລະປິນຈະເຫັນຂໍ້ຄວາມນີ້', go2: 'ໄປສະແກນຈ່າຍ →', sample: 'ຕົວຢ່າງ (SAMPLE) · ບໍ່ມີເງິນເຄື່ອນໄຫວຈິງ ຫ້າມໂອນ', qrOf: 'QR ຂອງ {a}', qrAlt: 'QR ຮັບເງິນຂອງ {a}', amount: 'ຍອດທີ່ຈະສົ່ງ', bank: 'ທະນາຄານ', accName: 'ຊື່ບັນຊີ', accNo: 'ເລກບັນຊີ',
      nofee: '100% ຖືກມື {a} · circles ບໍ່ຫັກ', how: 'ສະແກນດ້ວຍແອັບທະນາຄານ (ເຊັ່ນ BCEL One) ໂອນແລ້ວກົດປຸ່ມລຸ່ມນີ້', paid: 'ຂ້ອຍໂອນແລ້ວ', back: '← ກັບ', none: 'ສິລະປິນຍັງບໍ່ໄດ້ໃສ່ຂໍ້ມູນບັນຊີ', thx: 'ຂອບໃຈ', tape: 'ຂອບໃຈ · THANK YOU', brick: 'ເງິນທີ່ໂອນຮອດສິລະປິນໂດຍກົງ ອິດກ້ອນນີ້ຢູ່ແຕ່ໃນໜ້ານີ້ circles ຍັງບໍ່ໄດ້ສົ່ງຊື່ ຫຼື ຂໍ້ຄວາມຂອງເຈົ້າໄປຫາສິລະປິນ', own: 'ຄຳຂອງ{a}ເອງ', from: 'ຈາກງານ “{t}”', anon: 'ບໍ່ປະສົງອອກນາມ',
      cH: 'ຢາກໃຫ້ເມືອງນີ້ໄປຕໍ່ບໍ', cP: 'ເງິນທີ່ໂອນເມື່ອກີ້ຮອດ {a} ເຕັມຈຳນວນ ຖ້າຢາກຊ່ວຍຄ່າດູແລເວັບ ມີຊ່ອງແຍກໃຫ້', cBtn: 'ຊ່ວຍ CIRCLES (ແຍກຈາກສິລະປິນ)', cQr: 'QR ຂອງ circles ເອງ', cSoon: 'ຊ່ອງຮັບເງິນຂອງ circles ຍັງບໍ່ເປີດ', again: 'ກັບໄປເບິ່ງງານ', close: 'ປິດ', lbl: 'ຂັ້ນທີ {n} ຈາກ 3', bricks: {2: 'ກາເຟແກ້ວໜຶ່ງ', 5: 'ສີໜຶ່ງຫຼອດ', 10: 'ຜ້າໃບຜືນນ້ອຍ', 25: 'ມື້ເຮັດວຽກໜຶ່ງມື້'}}   // DRAFT lo: needs native review
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var fmt = function (s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : m; }); };
  var safeSrc = function (u) { u = String(u || ''); return /^(https:\/\/|art\/|\.\/|[A-Za-z0-9_\-\/]+\.(png|jpe?g|webp|svg)$)/i.test(u) && !/^\s*javascript:/i.test(u) ? u : ''; };

  function open(o) {
    o = o || {};
    var L = S[o.lang] || S.th, A = o.artist || {}, sup = A.support || {}, work = o.work || {}, amounts = (o.amounts && o.amounts.length ? o.amounts : [2, 5, 10, 25]).slice(0, 4), amt = amounts.indexOf(o.amount) >= 0 ? o.amount : amounts[1] != null ? amounts[1] : amounts[0], supporter = '';
    var cash = o.money || function (n) { return '$' + n; };
    var brickCash = function (n) { var c = cash(n).split(' ≈ '); return esc(c[0]) + (c[1] ? '<small class="df-usd">≈ ' + esc(c[1]) + '</small>' : ''); };   // "110,000 ₭ ≈ $5": the kip big, the dollars small
    var who = String(A.name || ''), qrSrc = safeSrc(sup.qr), hasPay = !!(qrSrc || sup.no);
    var d = document.createElement('dialog'); d.className = 'df'; d.setAttribute('aria-labelledby', 'df-t'); var cubeApi = null;
    var dots = function (n) { return '<div class="df-floors" role="img" aria-label="' + esc(fmt(L.lbl, {n: n})) + '"><i class="' + (n >= 1 ? 'on' : '') + '"></i><i class="' + (n >= 2 ? 'on' : '') + '"></i><i class="' + (n >= 3 ? 'on' : '') + '"></i></div>'; };
    d.innerHTML = '<header class="df-hd"><h2 id="df-t"><span>' + esc(L.title) + '</span>' + esc(who) + '</h2><span data-df-dots></span><button type="button" class="df-x" data-df-close aria-label="' + esc(L.close) + '">' + esc(L.close) + '</button></header><div class="df-body" data-df-body></div>';
    var body = d.querySelector('[data-df-body]'), dotsEl = d.querySelector('[data-df-dots]');
    var close = function () { if (cubeApi) { cubeApi.destroy(); cubeApi = null; } if (d.open) d.close(); d.remove(); if (o.onClose) o.onClose(); };
    d.querySelector('[data-df-close]').onclick = close;
    d.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    var stepNo = function (n) { dotsEl.innerHTML = dots(n); d.scrollTop = 0; };

    function step1() {
      stepNo(1);
      body.innerHTML = '<section class="df-step on" data-step="1"><div class="df-artist"><div class="df-stamp" aria-hidden="true">' + esc(Array.from(who)[0] || '') + '</div><div><small>' + esc(L.artist) + '</small><strong>' + esc(who) + '</strong><small>' + esc(L.direct) + '</small></div></div>' +
        '<div><div class="df-lbl" id="df-pick">' + esc(L.pick) + '</div><div class="df-bricks" role="group" aria-labelledby="df-pick">' + amounts.map(function (n) { return '<button type="button" class="df-brick" data-v="' + n + '" aria-pressed="' + (n === amt) + '">' + brickCash(n) + '<small>' + esc(L.bricks[n] || '') + '</small></button>'; }).join('') + '</div></div>' +
        '<div class="df-field"><label for="df-nm">' + esc(L.name) + '</label><input id="df-nm" maxlength="30" autocomplete="off" placeholder="' + esc(L.nameph) + '" value="' + esc(supporter) + '"></div>' +
        (o.canDeliverMessage ? '<div class="df-field"><label for="df-msg">' + esc(fmt(L.msg, {a: who})) + '</label><textarea id="df-msg" rows="2" maxlength="300" placeholder="' + esc(L.msgph) + '"></textarea><span class="df-hint">' + esc(L.msgYes) + '</span></div>' : '') +   // no way to deliver a note yet = no note box
        '<div class="df-row"><button type="button" class="df-btn" data-go2>' + esc(L.go2) + '</button></div></section>';
      body.querySelectorAll('.df-brick').forEach(function (b) { b.onclick = function () { amt = +b.dataset.v; body.querySelectorAll('.df-brick').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }; });
      body.querySelector('[data-go2]').onclick = function () { supporter = body.querySelector('#df-nm').value.trim(); msgText = body.querySelector('#df-msg') ? body.querySelector('#df-msg').value.trim() : ''; step2(); };
      body.querySelector('.df-brick[aria-pressed=true]') && body.querySelector('.df-brick[aria-pressed=true]').focus();
    }
    var msgText = '';
    function step2() {
      stepNo(2);
      var row = function (k, v) { return v ? '<div><dt>' + esc(L[k]) + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
      body.innerHTML = '<section class="df-step on" data-step="2">' + (sup.sample ? '<p class="df-sample" role="note">' + esc(L.sample) + '</p>' : '') +
        (hasPay ? '<div class="df-scan"><div class="df-frame"><span class="df-tape">' + esc(fmt(L.qrOf, {a: who})) + '</span>' + (qrSrc ? '<img data-df-qr src="' + esc(qrSrc) + '" alt="' + esc(fmt(L.qrAlt, {a: who})) + '">' : '') + '</div>' +
          '<div style="min-width:0;display:grid;gap:12px;width:100%"><div><div class="df-lbl">' + esc(L.amount) + '</div><p class="df-amt" data-df-amt>' + brickCash(amt) + '</p></div><dl class="df-tbl">' + row('bank', sup.bank) + row('accName', sup.name) + row('accNo', sup.no) + '</dl>' +
          '<div class="df-nofee"><p>' + esc(fmt(L.nofee, {a: who})) + '</p></div></div></div><p class="df-hint">' + esc(L.how) + '</p>' : '<p class="df-err" role="status" data-df-none>' + esc(L.none) + '</p>') +
        '<div class="df-row"><button type="button" class="df-btn"' + (hasPay ? '' : ' disabled') + ' data-go3>' + esc(L.paid) + '</button><button type="button" class="df-btn alt sm" data-back>' + esc(L.back) + '</button></div></section>';
      body.querySelector('[data-back]').onclick = step1;
      body.querySelector('[data-go3]').onclick = function () { if (o.onPaid) { try { o.onPaid({artistId: A.id, usd: amt, name: supporter, message: msgText}); } catch (e) {} } step3(); };
      (body.querySelector('[data-go3]:not([disabled])') || body.querySelector('[data-back]')).focus();
    }
    function step3() {
      stepNo(3);
      var n = supporter || L.anon, wall = '';
      for (var i = 0; i < 7; i++) wall += '<span></span>';
      var you = '<span class="you">' + esc(Array.from(n.toUpperCase()).slice(0, 14).join('') + ' · ' + cash(amt)) + '</span>';
      wall = wall.replace(/(<span><\/span>){3}/, function (m) { return m + you; });   // function form: a name like "$&" must not be read as a replacement pattern
      var voice = work.voice ? '<blockquote class="df-voice" style="margin-inline:0">' + esc('“' + work.voice + '”') + '</blockquote><p class="df-by">' + esc(fmt(L.own, {a: who})) + (work.title ? ' · ' + esc(fmt(L.from, {t: work.title})) : '') + '</p>' : '';
      var C = o.circles || {}, cQr = safeSrc(C.qr), cOk = !!(cQr || o.onSupportCircles);
      body.innerHTML = '<section class="df-step on" data-step="3"><div class="df-wallshot"><div class="df-poster"><span class="df-tape">' + esc(L.tape) + '</span>' +
        '<p class="df-big">' + esc(L.thx) + '<br><em data-df-who' + (Array.from(n).length > 10 ? ' class="long"' : '') + '>' + esc(n) + '</em></p><p style="margin:12px 0 0;font-weight:600">' + esc(L.brick) + '</p>' + voice + '<div class="df-wall" data-df-wall>' + wall + '</div></div><div data-df-cube></div></div>' +
        '<div class="df-circles" data-df-circles><h3>' + esc(L.cH) + '</h3><p>' + esc(fmt(L.cP, {a: who})) + '</p><div class="df-row">' +
        '<button type="button" class="df-btn sm"' + (cOk ? '' : ' disabled') + ' data-df-sc>' + esc(L.cBtn) + '</button><button type="button" class="df-btn alt sm" data-again>' + esc(L.again) + '</button></div>' +
        (cOk ? '' : '<p class="df-hint">' + esc(L.cSoon) + '</p>') + '<div data-df-cbox hidden></div></div></section>';
      body.querySelector('[data-again]').onclick = close;
      var sc = body.querySelector('[data-df-sc]');
      sc.onclick = function () {
        if (o.onSupportCircles && !cQr) { o.onSupportCircles(); return; }
        var box = body.querySelector('[data-df-cbox]'); box.hidden = !box.hidden; sc.setAttribute('aria-expanded', String(!box.hidden));
        if (!box.hidden) box.innerHTML = (C.sample ? '<p class="df-sample" role="note">' + esc(L.sample) + '</p>' : '') + '<div class="df-frame"><span class="df-tape">' + esc(L.cQr) + '</span><img data-df-cqr src="' + esc(cQr) + '" alt="' + esc(L.cQr) + '"></div>' + (C.bank ? '<dl class="df-tbl"><div><dt>' + esc(L.bank) + '</dt><dd>' + esc(C.bank) + '</dd></div></dl>' : '');
      };
      var host = body.querySelector('[data-df-cube]');
      if (window.CirclesCube) cubeApi = CirclesCube.mount(host, {lang: o.lang, size: 170, hint: false, controls: true}); else host.remove();
      body.querySelector('[data-again]').focus();
    }
    document.body.appendChild(d); step1();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    return {el: d, close: close};
  }
  window.CirclesDonateFlow = {open: open};
})();
