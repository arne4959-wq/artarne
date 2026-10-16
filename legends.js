/* legends.js — legends.html, the Legends district. PAINTINGS ONLY: no film, no music, no samples, no empty rooms.
   Every room holds one painting by one painter who has passed away, with the painter's OWN words (the "concept") and where they come from.
   No donate button anywhere in this district; one link leads to the living artists.
   To add a painter: put a new entry in LEGENDS (fields below) and put the image in legends/. Rules for an entry:
     - image: public domain / CC0 from a museum's open-access archive (check the museum's own record: Met isPublicDomain, AIC is_public_domain), credit + record link
     - own: the painter's real words, with src (letter number / date / place). If there are no verifiable words, leave own out and the room says so; never invent a quote.
     - note: history in circles' words, labelled as such on the page. Not the painter's words.
   LEGENDS entry: {file, w, h, title, titleEn, titleLo, maker, makerEn, makerLo, year, sign (+En/Lo: one-word identity), own (+En/Lo), src (+En/Lo), srcUrl,
                   note (+En/Lo), credit (+En/Lo), creditUrl}
   Lao (…Lo) lines are DRAFT: need native review. Needs from circles.js: t, esc, pk, onLang. */
(function () {
  'use strict';
  const LEGENDS = [
    {file: 'legends/monet-stacks-of-wheat.jpg', w: 843, h: 498, year: '1890–91',
      title: 'ฟ่อนข้าวสาลี (ปลายฤดูร้อน)', titleEn: 'Stacks of Wheat (End of Summer)', titleLo: 'ກອງເຂົ້າສາລີ (ທ້າຍລະດູຮ້ອນ)',
      maker: 'Claude Monet', makerEn: 'Claude Monet', makerLo: 'Claude Monet',
      sign: 'แสง', signEn: 'LIGHT', signLo: 'ແສງ',
      own: '“เพราะมันเปลี่ยนไปเรื่อย ๆ ฉันจึงได้แต่ตามธรรมชาติไป โดยไม่อาจจับเธอไว้ได้”',
      ownEn: '“…by dint of changes I am following Nature without being able to grasp her…”',
      ownLo: '“ເພາະມັນປ່ຽນໄປເລື້ອຍໆ ຂ້ອຍຈຶ່ງໄດ້ແຕ່ຕາມທຳມະຊາດໄປ ໂດຍບໍ່ສາມາດຈັບນາງໄວ້ໄດ້”',
      src: 'จดหมายถึง Gustave Geffroy, Fresselines, 24 เมษายน 1889 (ฉบับแปลอังกฤษที่ arthistoryproject.com รวบรวมไว้ ภาษาไทยแปลโดย circles)',
      srcEn: 'Letter to Gustave Geffroy, Fresselines, 24 April 1889 (English translation as collected by arthistoryproject.com)',
      srcLo: 'ຈົດໝາຍເຖິງ Gustave Geffroy, Fresselines, 24 ເມສາ 1889 (ສະບັບແປອັງກິດທີ່ arthistoryproject.com ລວບລວມໄວ້ ພາສາລາວແປໂດຍ circles)',
      srcUrl: 'https://arthistoryproject.com/artists/claude-monet/the-despair-of-painting-nature-letters-to-gustave-geffroy',
      note: 'โมเนต์วาดกองฟ่อนข้าวใกล้บ้านที่ Giverny เป็นชุดราว 25 ภาพช่วงปี 1890–91 โดยเลือกกองเดิมซ้ำ ๆ แล้วปล่อยให้แสงและเวลาเปลี่ยนภาพไปทีละผืน ภาพนี้คือบ่ายที่แสงเริ่มอ่อนลงปลายฤดูร้อน จดหมายข้างบนเขียนก่อนหน้านั้นหนึ่งปีและไม่ได้พูดถึงภาพนี้โดยตรง',
      noteEn: 'Monet painted the stacks near his home at Giverny as a series of about 25 canvases in 1890–91, returning to the same stacks and letting light and time change each picture. This one is a late-summer afternoon as the light softens. The letter above was written a year earlier and does not mention this painting.',
      noteLo: 'ໂມເນ໌ແຕ້ມກອງເຂົ້າສາລີໃກ້ເຮືອນຢູ່ Giverny ເປັນຊຸດປະມານ 25 ຮູບໃນປີ 1890–91 ເລືອກກອງເດີມຊ້ຳໆ ແລ້ວປ່ອຍໃຫ້ແສງແລະເວລາປ່ຽນຮູບໄປທີລະຜືນ ຮູບນີ້ແມ່ນຕອນບ່າຍທີ່ແສງເລີ່ມອ່ອນລົງທ້າຍລະດູຮ້ອນ ຈົດໝາຍຂ້າງເທິງຂຽນກ່ອນໜ້ານັ້ນໜຶ່ງປີ ແລະບໍ່ໄດ້ເວົ້າເຖິງຮູບນີ້ໂດຍກົງ',
      credit: 'Art Institute of Chicago · Gift of Arthur M. Wood, Sr. in memory of Pauline Palmer Wood (1985.1103) · ภาพสาธารณสมบัติ CC0 จากคลังเปิดของพิพิธภัณฑ์',
      creditEn: 'Art Institute of Chicago · Gift of Arthur M. Wood, Sr. in memory of Pauline Palmer Wood (1985.1103) · public domain, CC0, from the museum’s open-access archive',
      creditLo: 'Art Institute of Chicago · Gift of Arthur M. Wood, Sr. in memory of Pauline Palmer Wood (1985.1103) · ສາທາລະນະສົມບັດ CC0 ຈາກຄັງເປີດຂອງພິພິທະພັນ',
      creditUrl: 'https://www.artic.edu/artworks/64818'},
    {file: 'legends/vangogh-wheat-field-cypresses.jpg', w: 1000, h: 796, year: '1889',
      title: 'ทุ่งข้าวสาลีกับต้นไซเปรส', titleEn: 'Wheat Field with Cypresses', titleLo: 'ທົ່ງເຂົ້າສາລີກັບຕົ້ນໄຊເປຣສ',
      maker: 'Vincent van Gogh', makerEn: 'Vincent van Gogh', makerLo: 'Vincent van Gogh',
      sign: 'เส้นและสี', signEn: 'LINE + COLOUR', signLo: 'ເສັ້ນແລະສີ',
      own: '“ต้นไซเปรสยังตามหลอกหลอนความคิดฉัน … มันงามด้วยเส้นและสัดส่วน เหมือนเสาโอเบลิสก์ของอียิปต์”',
      ownEn: '“The cypresses still preoccupy me … It’s beautiful as regards lines and proportions, like an Egyptian obelisk.”',
      ownLo: '“ຕົ້ນໄຊເປຣສຍັງຄົງຢູ່ໃນຄວາມຄິດຂອງຂ້ອຍ … ມັນງາມດ້ວຍເສັ້ນແລະສັດສ່ວນ ຄືເສົາໂອເບລິສກ໌ຂອງອີຍິບ”',
      src: 'จดหมายฉบับที่ 783 ถึง Theo van Gogh, Saint-Rémy-de-Provence, 25 มิถุนายน 1889 (ฉบับแปลอังกฤษของ vangoghletters.org ภาษาไทยแปลโดย circles)',
      srcEn: 'Letter 783 to Theo van Gogh, Saint-Rémy-de-Provence, 25 June 1889 (English translation by vangoghletters.org)',
      srcLo: 'ຈົດໝາຍສະບັບທີ 783 ເຖິງ Theo van Gogh, Saint-Rémy-de-Provence, 25 ມິຖຸນາ 1889 (ສະບັບແປອັງກິດຂອງ vangoghletters.org ພາສາລາວແປໂດຍ circles)',
      srcUrl: 'https://vangoghletters.org/vg/letters/let783/letter.html',
      note: 'ฟานก็อกฮ์วาดภาพนี้ในปี 1889 ช่วงที่พักรักษาตัวอยู่ที่โรงพยาบาลในแซ็ง-เรมี-เดอ-โพรว็องส์ ทางใต้ของฝรั่งเศส เขาเขียนถึงต้นไซเปรสและทุ่งข้าวสาลีในจดหมายช่วงฤดูร้อนเดียวกัน แต่จดหมายไม่ได้ระบุว่าหมายถึงผืนนี้',
      noteEn: 'Van Gogh painted this in 1889 while he was a patient at the asylum in Saint-Rémy-de-Provence in the south of France. He wrote about cypresses and a wheat field in a letter from the same summer, but the letter does not say it means this canvas.',
      noteLo: 'ວານກ໊ອກຮ໌ແຕ້ມຮູບນີ້ໃນປີ 1889 ຕອນທີ່ພັກປິ່ນປົວຢູ່ໂຮງໝໍໃນແຊງ-ເຣມີ-ເດ-ໂປຣວອງສ໌ ທາງໃຕ້ຂອງຝຣັ່ງ ເຂົາຂຽນເຖິງຕົ້ນໄຊເປຣສແລະທົ່ງເຂົ້າສາລີໃນຈົດໝາຍຍາມລະດູຮ້ອນດຽວກັນ ແຕ່ຈົດໝາຍບໍ່ໄດ້ບອກວ່າໝາຍເຖິງຜືນນີ້',
      credit: 'The Metropolitan Museum of Art · Purchase, The Annenberg Foundation Gift, 1993 (1993.132) · ภาพสาธารณสมบัติ CC0 จาก Met Open Access',
      creditEn: 'The Metropolitan Museum of Art · Purchase, The Annenberg Foundation Gift, 1993 (1993.132) · public domain, CC0, from Met Open Access',
      creditLo: 'The Metropolitan Museum of Art · Purchase, The Annenberg Foundation Gift, 1993 (1993.132) · ສາທາລະນະສົມບັດ CC0 ຈາກ Met Open Access',
      creditUrl: 'https://www.metmuseum.org/art/collection/search/436535'}
  ];
  const $ = s => document.querySelector(s);
  const link = (url, txt) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(txt)}</a>`;

  function piece(x) {
    const fr = x.w / x.h;
    return `<li class="pl-vt pl-lg" data-type="img"><div class="pl-vt-top"><span class="pl-vt-type">${esc(t('lg_img'))}</span><span class="pl-vt-sign">${esc(pk(x, 'sign'))}</span></div>
      <figure class="pl-media img pl-lg-fig" style="aspect-ratio:${fr.toFixed(3)}"><img src="${esc(x.file)}" width="${x.w}" height="${x.h}" alt="${esc(pk(x, 'title') + ' — ' + pk(x, 'maker'))}" loading="lazy" decoding="async"></figure>
      <dl><div><dt>${esc(t('lg_f_title'))}</dt><dd>${esc(pk(x, 'title'))}</dd></div>
      <div><dt>${esc(t('lg_f_maker'))}</dt><dd>${esc(pk(x, 'maker') + ' · ' + x.year)}</dd></div>
      <div class="pl-vt-own"><dt>${esc(t('lg_f_own'))}</dt><dd><q>${esc(pk(x, 'own')).replace(/^“|”$/g, '')}</q><small>${esc(t('lg_f_src'))}: ${link(x.srcUrl, pk(x, 'src'))}</small></dd></div>
      <div class="pl-vt-hist"><dt>${esc(t('lg_f_hist'))}</dt><dd>${esc(pk(x, 'note'))}</dd></div>
      <div><dt>${esc(t('lg_f_credit'))}</dt><dd>${link(x.creditUrl, pk(x, 'credit'))}</dd></div></dl><a class="pl-btn" href="legend.html?id=${esc(x.file.split('/').pop().split('-')[0])}">${esc(t('lg_open'))}</a><div class="pl-vt-base" aria-hidden="true"></div></li>`;
  }
  function render() {
    $('#lg-count').textContent = t('lg_count', {n: LEGENDS.length});
    $('#lg-list').innerHTML = LEGENDS.map(piece).join('');
  }
  window.LG = {render, LEGENDS};
})();
