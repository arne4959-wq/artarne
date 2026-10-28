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
  const ALL = [
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
    ,{file: 'legends/hokusai-great-wave.jpg', w: 1200, h: 819, year: '1830–32',
      title: 'คลื่นใหญ่นอกคานางาวะ', titleEn: 'Under the Wave off Kanagawa (The Great Wave)', titleLo: 'ຄື້ນໃຫຍ່ນອກຄານາງາວະ',
      maker: 'Katsushika Hokusai', makerEn: 'Katsushika Hokusai', makerLo: 'Katsushika Hokusai',
      sign: 'คลื่น', signEn: 'WAVE', signLo: 'ຄື້ນ',
      own: '“ขอให้ผู้ที่มีชีวิตยืนยาวพอ เป็นพยานว่าถ้อยคำของข้าพเจ้านี้ไม่เท็จ”',
      ownEn: '“Those of you who live long enough, bear witness that these words of mine prove not false.”',
      ownLo: '“ຂໍໃຫ້ຜູ້ທີ່ມີຊີວິດຍືນຍາວພໍ ເປັນພະຍານວ່າຖ້ອຍຄຳຂອງຂ້ານ້ອຍນີ້ບໍ່ແມ່ນເລື່ອງຕົວະ”',
      src: 'บทส่งท้ายของ Hokusai ใน “หนึ่งร้อยทัศนียภาพของภูเขาไฟฟูจิ” ปี 1834 (ฉบับแปลอังกฤษตามที่ Wikipedia อ้างไว้ ไม่ระบุผู้แปล ภาษาไทยแปลโดย circles)',
      srcEn: 'Hokusai’s postscript to One Hundred Views of Mount Fuji, 1834 (English as quoted on Wikipedia, translator not named)',
      srcLo: 'ບົດສົ່ງທ້າຍຂອງ Hokusai ໃນ “ໜຶ່ງຮ້ອຍທັດສະນີຍະພາບຂອງພູເຂົາໄຟຟູຈິ” ປີ 1834 (ສະບັບແປອັງກິດຕາມທີ່ Wikipedia ອ້າງໄວ້ ບໍ່ລະບຸຜູ້ແປ ພາສາລາວແປໂດຍ circles)',
      srcUrl: 'https://en.wikipedia.org/wiki/One_Hundred_Views_of_Mount_Fuji',
      note: 'ภาพนี้อยู่ในชุด “สามสิบหกทัศนียภาพของภูเขาไฟฟูจิ” ที่โฮคุไซทำเมื่ออายุใกล้เจ็ดสิบปี คลื่นยักษ์ยกตัวเหนือเรือสามลำ ขณะที่ภูเขาไฟฟูจิเล็ก ๆ อยู่ไกลออกไป ข้อความข้างบนเป็นบทส่งท้ายที่เขาเพิ่มในหนังสืออีกเล่มเมื่อปี 1834 ไม่ได้พูดถึงภาพนี้โดยตรง',
      noteEn: 'This print belongs to the series Thirty-six Views of Mount Fuji, made when Hokusai was close to seventy. A huge wave rises over three boats while a small Mount Fuji sits far away. The words above are a postscript he added to a different book in 1834 and do not speak of this print.',
      noteLo: 'ຮູບນີ້ຢູ່ໃນຊຸດ “ສາມສິບຫົກທັດສະນີຍະພາບຂອງພູເຂົາໄຟຟູຈິ” ທີ່ໂຮກຸໄຊເຮັດຕອນອາຍຸໃກ້ເຈັດສິບປີ ຄື້ນຍັກຍົກຕົວເໜືອເຮືອສາມລຳ ໃນຂະນະທີ່ພູເຂົາໄຟຟູຈິນ້ອຍໆຢູ່ໄກອອກໄປ ຂໍ້ຄວາມຂ້າງເທິງເປັນບົດສົ່ງທ້າຍທີ່ເຂົາເພີ່ມໃນປຶ້ມອີກເຫຼັ້ມປີ 1834 ບໍ່ໄດ້ເວົ້າເຖິງຮູບນີ້ໂດຍກົງ',
      credit: 'The Metropolitan Museum of Art · H. O. Havemeyer Collection, Bequest of Mrs. H. O. Havemeyer, 1929 (JP1847) · ภาพสาธารณสมบัติ CC0 จาก Met Open Access',
      creditEn: 'The Metropolitan Museum of Art · H. O. Havemeyer Collection, Bequest of Mrs. H. O. Havemeyer, 1929 (JP1847) · public domain, CC0, from Met Open Access',
      creditLo: 'The Metropolitan Museum of Art · H. O. Havemeyer Collection, Bequest of Mrs. H. O. Havemeyer, 1929 (JP1847) · ສາທາລະນະສົມບັດ CC0 ຈາກ Met Open Access',
      creditUrl: 'https://www.metmuseum.org/art/collection/search/45434'}
    ,{file: 'legends/seurat-la-grande-jatte.jpg', w: 1600, h: 1065, year: '1884–86',
      title: 'บ่ายวันอาทิตย์บนเกาะลา กรองด์ ฌาตต์', titleEn: 'A Sunday on La Grande Jatte — 1884', titleLo: 'ບ່າຍວັນອາທິດເທິງເກາະລາ ກຣອງ ຊາດ',
      maker: 'Georges Seurat', makerEn: 'Georges Seurat', makerLo: 'Georges Seurat',
      sign: 'จุด', signEn: 'DOT', signLo: 'ຈຸດ',
      own: '“ศิลปะคือความกลมกลืน ความกลมกลืนคือการเทียบกันของสิ่งที่ตรงข้ามและสิ่งที่คล้ายกัน ในน้ำหนัก สี และเส้น …”',
      ownEn: '“Art is harmony. Harmony is the analogy of contrary elements and the analogy of similar elements of tone, color and line …”',
      ownLo: '“ສິລະປະຄືຄວາມກົມກຽວ ຄວາມກົມກຽວຄືການທຽບກັນຂອງສິ່ງທີ່ກົງກັນຂ້າມ ແລະສິ່ງທີ່ຄ້າຍກັນ ໃນນ້ຳໜັກ ສີ ແລະເສັ້ນ …”',
      src: 'ข้อเขียนของ Seurat ปี 1890 (ฉบับแปลอังกฤษตามที่ arthistoryproject.com รวบรวมไว้ ไม่ระบุผู้แปล ภาษาไทยแปลโดย circles)',
      srcEn: 'Seurat’s statement of 1890 (English as collected by arthistoryproject.com, translator not named)',
      srcLo: 'ຂໍ້ຂຽນຂອງ Seurat ປີ 1890 (ສະບັບແປອັງກິດຕາມທີ່ arthistoryproject.com ລວບລວມໄວ້ ບໍ່ລະບຸຜູ້ແປ ພາສາລາວແປໂດຍ circles)',
      srcUrl: 'https://arthistoryproject.com/artists/georges-seurat/the-aesthetics-of-tone-color-and-line/',
      note: 'เซอราต์ใช้เวลาราวสองปี (1884–86) กับภาพนี้ ทำภาพร่างและภาพศึกษามากมาย แล้ววางจุดสีบริสุทธิ์เคียงกันให้ตาของคนดูผสมสีเอง ภาพถูกแสดงที่นิทรรศการอิมเพรสชันนิสต์ครั้งสุดท้ายในปี 1886 ข้อความข้างบนเขียนในปี 1890 ไม่ได้พูดถึงภาพนี้โดยตรง',
      noteEn: 'Seurat spent about two years (1884–86) on this canvas, making many sketches and studies, then set pure dabs of colour side by side so the viewer’s eye does the mixing. It was shown at the last Impressionist exhibition in 1886. The words above date from 1890 and do not speak of this painting.',
      noteLo: 'ເຊອຣາດໃຊ້ເວລາປະມານສອງປີ (1884–86) ກັບຮູບນີ້ ເຮັດຮູບຮ່າງແລະຮູບສຶກສາຫຼາຍ ແລ້ວວາງຈຸດສີບໍລິສຸດຄຽງກັນໃຫ້ຕາຂອງຜູ້ເບິ່ງປະສົມສີເອງ ຮູບຖືກສະແດງທີ່ງານວາງສະແດງອິມເພຣສຊັນນິສຄັ້ງສຸດທ້າຍປີ 1886 ຂໍ້ຄວາມຂ້າງເທິງຂຽນໃນປີ 1890 ບໍ່ໄດ້ເວົ້າເຖິງຮູບນີ້ໂດຍກົງ',
      credit: 'Art Institute of Chicago · Helen Birch Bartlett Memorial Collection (1926.224) · ภาพสาธารณสมบัติ CC0 จากคลังเปิดของพิพิธภัณฑ์',
      creditEn: 'Art Institute of Chicago · Helen Birch Bartlett Memorial Collection (1926.224) · public domain, CC0, from the museum’s open-access archive',
      creditLo: 'Art Institute of Chicago · Helen Birch Bartlett Memorial Collection (1926.224) · ສາທາລະນະສົມບັດ CC0 ຈາກຄັງເປີດຂອງພິພິທະພັນ',
      creditUrl: 'https://www.artic.edu/artworks/27992'}
    ,{file: 'legends/cezanne-basket-of-apples.jpg', w: 1200, h: 958, year: 'c. 1893',
      title: 'ตะกร้าแอปเปิล', titleEn: 'The Basket of Apples', titleLo: 'ກະຕ່າໝາກແອັບເປິນ',
      maker: 'Paul Cézanne', makerEn: 'Paul Cézanne', makerLo: 'Paul Cézanne',
      sign: 'ทรงเรขาคณิต', signEn: 'FORM', signLo: 'ຮູບຊົງ',
      own: '“…จัดการกับธรรมชาติด้วยทรงกระบอก ทรงกลม และทรงกรวย…”',
      ownEn: '“…deal with nature by means of the cylinder, the sphere and the cone…”',
      ownLo: '“…ຈັດການກັບທຳມະຊາດດ້ວຍຮູບຊົງກະບອກ ຮູບຊົງກົມ ແລະຮູບຊົງກວຍ…”',
      src: 'จดหมายถึง Émile Bernard, Aix-en-Provence, 15 เมษายน 1904 (ฉบับแปลอังกฤษตามที่ arthistoryproject.com รวบรวมไว้ ไม่ระบุผู้แปล ภาษาไทยแปลโดย circles)',
      srcEn: 'Letter to Émile Bernard, Aix-en-Provence, 15 April 1904 (English as collected by arthistoryproject.com, translator not named)',
      srcLo: 'ຈົດໝາຍເຖິງ Émile Bernard, Aix-en-Provence, 15 ເມສາ 1904 (ສະບັບແປອັງກິດຕາມທີ່ arthistoryproject.com ລວບລວມໄວ້ ບໍ່ລະບຸຜູ້ແປ ພາສາລາວແປໂດຍ circles)',
      srcUrl: 'https://arthistoryproject.com/artists/paul-cezanne/letters-from-paul-cezanne-to-emile-bernard/',
      note: 'ภาพนิ่งปี 1893 ที่ตะกร้า ขวดไวน์ ขนมปัง และแอปเปิลวางบนโต๊ะที่เอียงเล็กน้อย เซซานน์ไม่ยอมให้ทุกอย่างมองจากมุมเดียว ขอบโต๊ะสองฝั่งจึงไม่ต่อกัน จดหมายข้างบนเขียนหลังจากนั้นกว่าสิบปีและไม่ได้พูดถึงภาพนี้โดยตรง',
      noteEn: 'A still life of about 1893: a basket, a wine bottle, biscuits and apples on a table that tilts a little. Cézanne would not let everything be seen from one point, so the two sides of the table edge do not line up. The letter above was written more than ten years later and does not speak of this painting.',
      noteLo: 'ຮູບນິ່ງປະມານປີ 1893 ທີ່ກະຕ່າ ແກ້ວເຫຼົ້າ ເຂົ້າຈີ່ ແລະໝາກແອັບເປິນວາງເທິງໂຕະທີ່ຝຽງເລັກນ້ອຍ ເຊຊານບໍ່ຍອມໃຫ້ທຸກຢ່າງເບິ່ງຈາກມຸມດຽວ ຂອບໂຕະສອງຝັ່ງຈຶ່ງບໍ່ຕໍ່ກັນ ຈົດໝາຍຂ້າງເທິງຂຽນຫຼັງຈາກນັ້ນຫຼາຍກວ່າສິບປີ ແລະບໍ່ໄດ້ເວົ້າເຖິງຮູບນີ້ໂດຍກົງ',
      credit: 'Art Institute of Chicago · Helen Birch Bartlett Memorial Collection (1926.252) · ภาพสาธารณสมบัติ CC0 จากคลังเปิดของพิพิธภัณฑ์',
      creditEn: 'Art Institute of Chicago · Helen Birch Bartlett Memorial Collection (1926.252) · public domain, CC0, from the museum’s open-access archive',
      creditLo: 'Art Institute of Chicago · Helen Birch Bartlett Memorial Collection (1926.252) · ສາທາລະນະສົມບັດ CC0 ຈາກຄັງເປີດຂອງພິພິທະພັນ',
      creditUrl: 'https://www.artic.edu/artworks/111436'}
  ];

  /* The first two pictures are always in the folder. Every later legend appears only once its picture file is really there
     (and takes its real width/height), so a legend whose image has not been added yet never shows a broken frame. */
  const LEGENDS = ALL.slice(0, 2);
  const probe = x => new Promise(r => { const i = new Image(); i.onload = () => { x.w = i.naturalWidth; x.h = i.naturalHeight; r(x); }; i.onerror = () => r(null); i.src = x.file; });
  const ready = Promise.all(ALL.slice(2).map(probe)).then(a => { a.forEach(x => x && LEGENDS.push(x)); });
  const idOf = x => x.file.split('/').pop().split('-')[0];

  /* More pictures per legend. Each appears in the gallery on the legend page only when its file is really in legends/
     (run  npm run pictures  to download them from the museums' open-access archives). Titles/years/places: museum records. */
  const MORE = [
    {id:'vangogh', file:'legends/vangogh-irises.jpg', year:'1890', title:'ดอกไอริส', titleEn:'Irises', place:'The Metropolitan Museum of Art', note:"วาดในสวนของสถานพักฟื้นที่ Saint-Rémy ปี 1890 เส้นขอบหนาและสีจัดแบบภาพพิมพ์ญี่ปุ่นที่เขาสะสม ดอกไม้ธรรมดาถูกวาดด้วยแรงของคนที่ต้องการให้สีพูดแทนความรู้สึก", noteEn:"Painted in the asylum garden at Saint-Rémy in 1890: thick outlines and flat saturated colour from the Japanese prints he collected. An ordinary flower, drawn with the force of someone who wants colour to speak for feeling."},
    {id:'vangogh', file:'legends/vangogh-self-portrait-1887.jpg', year:'1887', title:'ภาพเหมือนตนเอง', titleEn:'Self-Portrait', place:'Art Institute of Chicago', note:"ปี 1887 ที่ปารีส เขายังไม่ได้ย้ายไปทางใต้ แต่เริ่มวาดตัวเองด้วยฝีแปรงสั้น ๆ เป็นเส้นสีเรียงกัน หลังจากได้เห็นงานของจิตรกรอิมเพรสชันนิสต์และนีโออิมเพรสชันนิสต์ในเมือง", noteEn:"Paris, 1887, before he moved south: he paints himself in short, ordered strokes of colour after seeing the Impressionists and Neo-Impressionists in the city."},
    {id:'vangogh', file:'legends/vangogh-bedroom-in-arles.jpg', year:'1889', title:'ห้องนอนที่อาร์ล', titleEn:'The Bedroom', place:'Art Institute of Chicago', note:"เขาวาดห้องนอนตัวเองที่อาร์ลไว้สามเวอร์ชัน ภาพนี้เป็นเวอร์ชันปี 1889 สีเรียบแบน เส้นขอบชัด และมุมมองเอียงตามแบบของเขา ไม่ใช่ห้องที่ตรงเป๊ะ แต่เป็นห้องที่รู้สึกว่าได้พัก", noteEn:"He painted his own bedroom in Arles three times; this is the 1889 version. Flat colour, firm outlines, a tilted view: not a perfectly correct room, but a room that feels like rest."},
    {id:'monet', file:'legends/monet-water-lilies.jpg', year:'1906', title:'ดอกบัวในสระ', titleEn:'Water Lilies', place:'Art Institute of Chicago', note:"ในสวนน้ำที่ Giverny เขาหันมาวาดผิวสระกับเงาสะท้อนเป็นตัวเอก แทนที่จะวาดฉากทั้งฉาก แสงบนน้ำเปลี่ยนไปทุกชั่วโมง เขาจึงวาดซ้ำเป็นชุดยาวหลายสิบปี", noteEn:"In his water garden at Giverny he made the surface and reflections the subject rather than a whole scene. The light on water changes by the hour, so he kept repainting it for decades."},
    {id:'monet', file:'legends/monet-gare-saint-lazare.jpg', year:'1877', title:'รถไฟจากนอร์มังดีเข้าสถานีแซ็ง-ลาซาร์', titleEn:'Arrival of the Normandy Train, Gare Saint-Lazare', place:'Art Institute of Chicago', note:"ปี 1877 เขาขออนุญาตวาดในสถานีรถไฟแซ็ง-ลาซาร์ที่ปารีส และวาดไอน้ำกับแสงใต้หลังคาเหล็กเป็นชุดหลายภาพ ไม่ใช่ทุ่งหญ้าหรือสระน้ำ แต่เป็นความเร็วและควันของเมืองสมัยใหม่", noteEn:"In 1877 he got permission to paint inside the Gare Saint-Lazare in Paris and made a run of pictures of steam and light under the iron roof: not meadows or ponds, but the speed and smoke of the modern city."},
    {id:'monet', file:'legends/monet-bridge-water-lilies.jpg', year:'1899', title:'สะพานข้ามสระดอกบัว', titleEn:'Bridge over a Pond of Water Lilies', place:'The Metropolitan Museum of Art', note:"สะพานญี่ปุ่นในสวนน้ำของเขาเอง ปี 1899 เขาวาดสะพานนี้เป็นชุดเดียวกันหลายภาพ ทุกภาพคือสถานที่เดิมในแสงต่างกัน", noteEn:"The Japanese footbridge in his own water garden, 1899. He painted it as a series: the same place, each time in different light."},
    {id:'cezanne', file:'legends/cezanne-bay-of-marseille.jpg', year:'c. 1885', title:'อ่าวมาร์เซยจากแลสตาก', titleEn:'The Bay of Marseille, Seen from L’Estaque', place:'Art Institute of Chicago', note:"ทะเลเป็นแถบสีน้ำเงินที่เรียบ หลังหลังคาสีส้มและต้นสนของหมู่บ้านริมอ่าว เขาลดทิวทัศน์เหลือเป็นระนาบสีที่วางซ้อนกัน", noteEn:"The sea is a flat band of blue behind the orange roofs and pines of a fishing village. He reduces the view to planes of colour laid one over another."},
    {id:'cezanne', file:'legends/cezanne-madame-cezanne-yellow-chair.jpg', year:'1888–90', title:'มาดามเซซานน์บนเก้าอี้สีเหลือง', titleEn:'Madame Cézanne in a Yellow Chair', place:'Art Institute of Chicago', note:"ภาพภรรยาของเขานั่งนิ่งในชุดสีน้ำเงิน เขาให้คนนั่งอยู่นานมากในการวาดแต่ละภาพ ใบหน้ากับเก้าอี้ถูกวางเป็นรูปทรงเรียบง่ายเหมือนวัตถุอื่นในภาพ", noteEn:"His wife sits still in a blue dress. He kept sitters posing for very long sessions, and the face and chair are built as simple forms like any other object in the picture."},
    {id:'hokusai', file:'legends/hokusai-fine-wind-clear-morning.jpg', year:'c.1830–32', title:'ลมใต้ ฟ้าใส (ฟูจิแดง)', titleEn:'South Wind, Clear Sky (Red Fuji)', place:'The Metropolitan Museum of Art', note:"ฟูจิสีแดงในแสงเช้า อยู่ในชุดเดียวกับคลื่นใหญ่ คือชุดสามสิบหกทัศนียภาพภูเขาฟูจิ ใช้สีน้อย รูปทรงเรียบ เส้นคม ภูเขาเดียวกันแต่ให้ความรู้สึกต่างจากคลื่นโดยสิ้นเชิง", noteEn:"Fuji in red morning light, from the same series as the Great Wave: Thirty-six Views of Mount Fuji. Few colours, simple shapes, sharp lines; the same mountain, a completely different feeling from the wave."},
    {id:'seurat', file:'legends/seurat-circus-sideshow.jpg', year:'1887–88', title:'ละครสัตว์หน้าโรง', titleEn:'Circus Sideshow (Parade de cirque)', place:'The Metropolitan Museum of Art', note:"เขาวาดความสว่างของไฟแก๊สตอนกลางคืนหน้าโรงละครสัตว์ด้วยจุดสีเล็ก ๆ คนยืนนิ่งเป็นรูปทรงเรขาคณิต ทุกอย่างถูกคิดและจัดวางไว้ ไม่ใช่วาดตามอารมณ์", noteEn:"Gaslight at night outside a circus, built from small dots of colour. The figures stand still like geometric shapes: everything planned and placed, not painted on impulse."},
  ];
  const more = id => Promise.all(MORE.filter(m => m.id === id).map(probe)).then(a => a.filter(Boolean));

  /* Each painter's own trick, on his picture. CSS only; all motion is off when the visitor asks for reduced motion.
     monet: the light moves through a day | vangogh: the paint swirls under the pointer | hokusai: the wave rolls in | seurat: the dots grow into the picture | cezanne: the picture opens plane by plane */
  (function gimmicks() {
    const st = document.createElement('style');
    st.textContent = `@property --gm-dot{syntax:'<percentage>';inherits:false;initial-value:100%}
@media (prefers-reduced-motion:no-preference){
.gm-monet{animation:gm-light 14s ease-in-out infinite alternate}
@keyframes gm-light{0%{filter:brightness(.84) saturate(.85) sepia(.3) hue-rotate(-10deg)}45%{filter:brightness(1.05) saturate(1.1)}100%{filter:brightness(.9) saturate(1.2) sepia(.28) hue-rotate(12deg)}}
.gm-vangogh:hover,.gm-vangogh:focus{filter:url(#gm-swirl)}
.gm-hokusai{animation:gm-wave 2.2s cubic-bezier(.2,.7,.2,1) both}
@keyframes gm-wave{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.gm-seurat{--gm-dot:100%;-webkit-mask:radial-gradient(circle,#000 var(--gm-dot),transparent calc(var(--gm-dot) + 1%)) 0 0/6px 6px;mask:radial-gradient(circle,#000 var(--gm-dot),transparent calc(var(--gm-dot) + 1%)) 0 0/6px 6px;animation:gm-dots 2.6s ease-out both}
@keyframes gm-dots{from{--gm-dot:22%}to{--gm-dot:100%}}
.gm-cezanne{animation:gm-planes 1.8s cubic-bezier(.3,.7,.2,1) both}
@keyframes gm-planes{from{clip-path:polygon(50% 0,50% 0,50% 100%,50% 100%)}40%{clip-path:polygon(20% 0,80% 6%,80% 94%,20% 100%)}to{clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}}
}`;
    document.head.appendChild(st);
    const d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0"><filter id="gm-swirl"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="2" seed="3" result="n"><animate attributeName="baseFrequency" dur="6s" values=".012 .02;.02 .012;.012 .02" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="14"/></filter></svg>';
    document.body.appendChild(d);
  })();
  const $ = s => document.querySelector(s);
  const link = (url, txt) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(txt)}</a>`;


  function piece(x) {
    const fr = x.w / x.h;
    return `<li class="pl-vt pl-lg" data-type="img"><div class="pl-vt-top"><span class="pl-vt-type">${esc(t('lg_img'))}</span><span class="pl-vt-sign">${esc(pk(x, 'sign'))}</span></div>
      <figure class="pl-media img pl-lg-fig" style="aspect-ratio:${fr.toFixed(3)}"><img class="gm-${idOf(x)}" src="${esc(x.file)}" width="${x.w}" height="${x.h}" alt="${esc(pk(x, 'title') + ' — ' + pk(x, 'maker'))}" loading="lazy" decoding="async"></figure>
      <dl><div><dt>${esc(t('lg_f_title'))}</dt><dd>${esc(pk(x, 'title'))}</dd></div>
      <div><dt>${esc(t('lg_f_maker'))}</dt><dd>${esc(pk(x, 'maker') + ' · ' + x.year)}</dd></div>
      <div class="pl-vt-own"><dt>${esc(t('lg_f_own'))}</dt><dd><q>${esc(pk(x, 'own')).replace(/^“|”$/g, '')}</q><small>${esc(t('lg_f_src'))}: ${link(x.srcUrl, pk(x, 'src'))}</small></dd></div>
      <div class="pl-vt-hist"><dt>${esc(t('lg_f_hist'))}</dt><dd>${esc(pk(x, 'note'))}</dd></div>
      <div><dt>${esc(t('lg_f_credit'))}</dt><dd>${link(x.creditUrl, pk(x, 'credit'))}</dd></div></dl><a class="pl-btn" href="legend.html?id=${esc(idOf(x))}">${esc(t('lg_open'))}</a><div class="pl-vt-base" aria-hidden="true"></div></li>`;
  }
  function render() {
    ready.then(() => {
      $('#lg-count').textContent = t('lg_count', {n: LEGENDS.length});
      $('#lg-list').innerHTML = LEGENDS.map(piece).join('');
    });
  }
  window.LG = {render, LEGENDS, ready, more};
})();
