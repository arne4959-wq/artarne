/* times.js — CirclesTimes: the newspaper pieces. Needs times.css. No other dependency. REAL DATA ONLY: nothing here invents an artist, a count or a date.
     CirclesTimes.front(host, works, opts)     weekly highlights as a front page. Ranking = "resonated" taps only (then views, then newest). Donation amounts are never read.
     CirclesTimes.ticker(host, works, opts)    the "ข่าวด่วน" strip: at most 3 newest artworks, each a link to the work. Nothing about donations.
     CirclesTimes.notices(host, list, opts)    up to 3 wall notices from window.CIRCLES_NOTICES (notices.js) or the list you pass.
   works = [{aid, artist, title, img, href, say, res, views, added}]      res/views: numbers (missing = 0), added: 'YYYY-MM-DD' or ISO date (optional), say: the artist's own words (optional)
   opts = {lang:'th'|'en'|'lo', date: Date (for tests)} */
(function () {
  'use strict';
  var S = {
    th: {issue: 'ฉบับที่ {n} · {d}', tag: 'เมืองหนึ่งวง · ไม่มีวันจบ', price: 'ราคา: ความใจดี', paper: 'THE <em>CIRCLES</em> TIMES', flash: 'งานที่คนซึ้งที่สุดประจำสัปดาห์', lead: '“{t}” ทำคนกดซึ้ง <mark>{n} ครั้ง</mark>', quiet: 'เมืองเพิ่งเปิด <mark>ยังไม่มีใครกดซึ้ง</mark>', quietFlash: 'งานล่าสุดในเมือง', byA: 'ผลงานของ {a}', own: 'คำของ{a}เอง', from: 'จากงาน “{t}”',
      rankH: 'ติดอันดับซึ้ง', rankNone: 'ยังไม่มีงานที่ถูกกดซึ้ง', newH: 'งานล่าสุด', foot: 'จัดอันดับจากการกด “ซึ้ง” เท่านั้น ไม่เกี่ยวกับยอดเงินโดเนท · นี่คือไฮไลต์ ไม่ใช่การแข่งขัน', empty: 'ยังไม่มีงานให้ขึ้นหน้าหนึ่ง', res: '{n} ซึ้ง', tick: 'ข่าวด่วน', tickItem: '{a} ลงงานใหม่ “{t}”', tickAria: 'ข่าวด่วน: งานใหม่ล่าสุด', open: 'เปิดดู'},
    en: {issue: 'Issue {n} · {d}', tag: 'One city, no last page', price: 'Price: kindness', paper: 'THE <em>CIRCLES</em> TIMES', flash: 'Most resonated work of the week', lead: '“{t}” was resonated <mark>{n} times</mark>', quiet: 'The city just opened. <mark>Nobody has resonated yet</mark>', quietFlash: 'Latest work in the city', byA: 'A work by {a}', own: '{a}’s own words', from: 'from “{t}”',
      rankH: 'Resonance ranking', rankNone: 'No work has been resonated yet', newH: 'Latest work', foot: 'Ranked by “resonated” taps only, never by donation amount · these are highlights, not a contest', empty: 'No work to put on the front page yet', res: '{n} resonated', tick: 'BREAKING', tickItem: '{a} posted a new work “{t}”', tickAria: 'Breaking: newest works', open: 'View'},
    lo: {issue: 'ສະບັບທີ {n} · {d}', tag: 'ເມືອງໜຶ່ງວົງ · ບໍ່ມີວັນຈົບ', price: 'ລາຄາ: ຄວາມໃຈດີ', paper: 'THE <em>CIRCLES</em> TIMES', flash: 'ງານທີ່ຄົນຊຶ້ງທີ່ສຸດປະຈຳອາທິດ', lead: '“{t}” ຄົນກົດຊຶ້ງ <mark>{n} ເທື່ອ</mark>', quiet: 'ເມືອງຫາກໍ່ເປີດ <mark>ຍັງບໍ່ມີໃຜກົດຊຶ້ງ</mark>', quietFlash: 'ງານລ່າສຸດໃນເມືອງ', byA: 'ຜົນງານຂອງ {a}', own: 'ຄຳຂອງ{a}ເອງ', from: 'ຈາກງານ “{t}”',
      rankH: 'ຕິດອັນດັບຊຶ້ງ', rankNone: 'ຍັງບໍ່ມີງານທີ່ຖືກກົດຊຶ້ງ', newH: 'ງານລ່າສຸດ', foot: 'ຈັດອັນດັບຈາກການກົດ “ຊຶ້ງ” ເທົ່ານັ້ນ ບໍ່ກ່ຽວກັບຍອດເງິນໂດເນດ', empty: 'ຍັງບໍ່ມີງານຂຶ້ນໜ້າໜຶ່ງ', res: '{n} ຊຶ້ງ', tick: 'ຂ່າວດ່ວນ', tickItem: '{a} ລົງງານໃໝ່ “{t}”', tickAria: 'ຂ່າວດ່ວນ: ງານໃໝ່ລ່າສຸດ', open: 'ເບິ່ງ'}   // DRAFT lo: needs native review
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var fmt = function (s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : m; }); };
  var safeHref = function (u) { u = String(u || ''); return /^(https:\/\/|[A-Za-z0-9_\-\.\/]+\.html(\?[\w=&%\-]*)?(#[\w\-]*)?$|#[\w\-]*$)/.test(u) ? u : '#'; };
  var safeImg = function (u) { u = String(u || ''); return /^(https:\/\/|art\/|legends\/)[\w\-\.\/%]+$/i.test(u) ? u : ''; };
  var num = function (n) { n = +n; return isFinite(n) && n > 0 ? Math.floor(n) : 0; };
  var ts = function (s) { var t = Date.parse(s || ''); return isFinite(t) ? t : 0; };
  var loc = function (l) { return l === 'lo' ? 'lo-LA' : l === 'en' ? 'en-GB' : 'th-TH'; };
  function isoWeek(d) { var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7); }
  var L = function (o) { return S[o && o.lang] || S.th; };

  /* ranking: resonated taps desc, views desc, newest first, then the order given. Donation fields are not part of the model. */
  function rank(works) {
    return (works || []).map(function (w, i) { return {w: w, i: i, res: num(w.res), views: num(w.views), at: ts(w.added)}; })
      .sort(function (a, b) { return b.res - a.res || b.views - a.views || b.at - a.at || a.i - b.i; }).map(function (x) { return x.w; });
  }
  function front(host, works, opts) {
    opts = opts || {}; var l = L(opts), d = opts.date || new Date(), r = rank(works), top = r[0], ranked = r.filter(function (w) { return num(w.res) > 0; }).slice(0, 3);
    var date = new Intl.DateTimeFormat(loc(opts.lang) + '-u-ca-gregory', {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
    host.classList.add('ct-front'); host.setAttribute('aria-label', 'THE CIRCLES TIMES');
    if (!top) { host.innerHTML = '<div class="ct-mast"><span>' + esc(fmt(l.issue, {n: isoWeek(d), d: date})) + '</span></div><div class="ct-paper">' + l.paper + '</div><div class="ct-haz"></div><p class="ct-cap" data-ct-empty>' + esc(l.empty) + '</p>'; return; }
    var hot = num(top.res) > 0, img = safeImg(top.img);
    var newest = r.slice().sort(function (a, b) { return ts(b.added) - ts(a.added); })[0];
    host.innerHTML = '<div class="ct-mast"><span>' + esc(fmt(l.issue, {n: isoWeek(d), d: date})) + '</span><span>' + esc(l.tag) + '</span><span>' + esc(l.price) + '</span></div>' +
      '<div class="ct-paper">' + l.paper + '</div><div class="ct-haz"></div><div class="ct-grid"><div class="ct-lead"><span class="ct-flash">' + esc(hot ? l.flash : l.quietFlash) + '</span>' +
      '<h2>' + (hot ? fmt(l.lead, {t: esc(top.title), n: esc(num(top.res))}) : l.quiet) + '</h2>' +
      (img ? '<a class="ct-pic" href="' + esc(safeHref(top.href)) + '"><img src="' + esc(img) + '" alt="' + esc(top.title) + '"><span>' + esc(top.artist) + '</span></a>' : '') +
      '<p class="ct-cap">' + esc(fmt(l.byA, {a: top.artist})) + '</p>' +
      (top.say ? '<p class="ct-voice">' + esc('“' + top.say + '”') + '</p><p class="ct-by">' + esc(fmt(l.own, {a: top.artist}) + ' · ' + fmt(l.from, {t: top.title})) + '</p>' : '') + '</div>' +
      '<aside class="ct-side"><div><h3>' + esc(l.rankH) + '</h3>' + (ranked.length ? ranked.map(function (w, i) { return '<div class="ct-rank"><b>' + (i + 1) + '</b><a href="' + esc(safeHref(w.href)) + '">' + esc(w.title) + '</a><u>' + esc(fmt(l.res, {n: num(w.res)})) + '</u></div>'; }).join('') : '<p>' + esc(l.rankNone) + '</p>') + '</div>' +
      (newest && !hot ? '' : newest && newest !== top && ts(newest.added) ? '<div><h3>' + esc(l.newH) + '</h3><p><a href="' + esc(safeHref(newest.href)) + '">' + esc(newest.title) + '</a> · ' + esc(newest.artist) + '</p></div>' : '') +
      '</aside></div><div class="ct-foot">' + esc(l.foot) + '</div>';
  }
  function ticker(host, works, opts) {
    var l = L(opts), list = (works || []).map(function (w, i) { return {w: w, i: i, at: ts(w.added)}; }).sort(function (a, b) { return b.at - a.at || b.i - a.i; }).slice(0, 3).map(function (x) { return x.w; });
    host.classList.add('ct-ticker'); host.setAttribute('role', 'region'); host.setAttribute('aria-label', l.tickAria);
    if (!list.length) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    var items = list.map(function (w) { return '<a href="' + esc(safeHref(w.href)) + '"><i>★</i>' + esc(fmt(l.tickItem, {a: w.artist, t: w.title})) + '</a>'; }).join('');
    host.innerHTML = '<b>' + esc(l.tick) + '</b><div class="ct-rail"><div class="ct-run">' + items + '<span aria-hidden="true" style="display:contents">' + items.replace(/<a /g, '<a tabindex="-1" ') + '</span></div></div>';
  }
  function notices(host, list, opts) {
    var l = (opts && opts.lang) || 'th', src = list || window.CIRCLES_NOTICES || [];
    var rows = src.filter(function (n) { return n && n.date && (n.th || n.en); }).sort(function (a, b) { return ts(b.date) - ts(a.date); }).slice(0, 3);
    host.classList.add('ct-notes'); host.hidden = !rows.length;
    host.innerHTML = rows.map(function (n) {
      var t = n[l] || n.en || n.th, dt = new Intl.DateTimeFormat(loc(l) + '-u-ca-gregory', {day: 'numeric', month: 'short'}).format(new Date(n.date + 'T00:00:00'));
      return '<article class="ct-note' + (n.old ? ' old' : '') + '"><span class="tape" aria-hidden="true"></span><time datetime="' + esc(n.date) + '">' + esc(dt) + '</time><h4>' + esc(t.h) + '</h4><p>' + esc(t.p) + '</p></article>';
    }).join('');
  }
  window.CirclesTimes = {front: front, ticker: ticker, notices: notices, rank: rank};
})();
