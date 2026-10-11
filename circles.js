/* circles.js — shared by index.html and cutaway.html: language (TH/EN), toast, ransom type, forms, mobile menu.
   Needs artists.js first. */

/* ---------- CONFIG: change these lines to go live ----------
   endpoint : a form-backend URL (Formspree, Getform, your own API). It receives JSON via POST.
              While it is empty, forms fall back to opening the visitor's email app (mailto:) and the newsletter is kept in this browser only.
   donate   : the https:// link of your support page (Ko-fi, Stripe Payment Link, ...). While it is empty the Support button on the home page shows "Coming soon" instead of a link.
   shop     : false = a gallery of creators and their words (no prices, no buy or message-to-buy buttons, no price filters, no buy pages). true brings the selling parts back; the code is kept.
   demo     : true shows a "sample data" notice above the consent line of every message form. Set it to false when real artists are in.
   contact  : where "join" requests go. Artists' own addresses are in artists.js (they use the reserved .example domain until you replace them). */
const CONFIG = { endpoint: 'https://formspree.io/f/maeqeaqn', donate: '', contact: 'hello@circles.example', demo: true, shop: false, turnstileSiteKey: '0x4AAAAAAFRit2gggdNBXNji' };   // turnstileSiteKey: optional Cloudflare Turnstile key (free CAPTCHA). Only used together with `endpoint`; the endpoint must verify the token it receives as `captcha`.

/* ---------- data guard: values from artists.js that are printed into markup or CSS must have the expected shape ----------
   An id or colour such as  x" onmouseover="…  would reach the page unescaped in several templates. Bad values are repaired (a bad id skips the artist) once, here,
   instead of at every place that prints them. tools/build.mjs applies the same rules and fails the build, so a typo is caught before it is published. */
const DATA_RE = {id: /^[a-z0-9][a-z0-9-]*$/, color: /^#[0-9a-f]{3,8}$/i, ar: /^\d{1,3}\/\d{1,3}$/};
(function cleanArtists() {
  for (let i = ARTISTS.length - 1; i >= 0; i--) {
    const a = ARTISTS[i];
    if (!DATA_RE.id.test(String(a.id))) { console.warn('artists.js: skipped an artist with a bad id', a.id); ARTISTS.splice(i, 1); continue; }
    a.works = (a.works || []).map(c => DATA_RE.color.test(c) ? c : '#8F8C85');
    a.scale = Number(a.scale) || 1;
    for (const p of a.pieces || []) { p.y = Number(p.y) || 0; p.p = Number(p.p) || 0; if (!DATA_RE.ar.test(String(p.ar))) p.ar = '4/3'; }
  }
})();
/* ---------- buy page data (buy.js): fill these in. While one is empty, your own computer shows a yellow [__] there and the live site leaves that line out; nothing is invented ----------
   SHIPPING.regions     where pieces ship to            SHIPPING.fee          shipping fee
   SHIPPING.days        days until it arrives           SHIPPING.returnDays   days to send back a piece that broke in transit
   SHIPPING.replyDays   how fast artists reply          SHIPPING.certificate  what comes with a piece (certificate, signature ...)
   RATES.lak / RATES.thb  how many LAK / THB one US dollar is worth. 0 = not set, and the "≈ LAK / THB" line stays hidden. */
const SHIPPING = {regions: '', fee: '', days: '', returnDays: '', replyDays: '', certificate: ''};
const RATES = {lak: 0, thb: 0};
/* Support section on the home page: share of the support money per row, in %. 0 = not decided yet (the box stays hidden on the live site). */
const SUPPORT = {servers: 0, site: 0, events: 0};
/* draft marks ([__]) show on your own computer (localhost, file://) or with ?draft in the address; ?live shows the live-site look anywhere */
function isDraft() {
  try { const q = new URLSearchParams(location.search); if (q.has('live')) return false; return q.has('draft') || location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname); }
  catch (e) { return false; }
}
const shopOn = () => CONFIG.shop === true;
if (shopOn()) document.documentElement.classList.add('shop-on');   // .shop-only parts show only then
if (isDraft()) document.documentElement.classList.add('is-draft');   // shows .draft-only parts (unfinished boxes) on the owner's computer only

const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
/* ===== lite:decide ===== phones, very weak devices (2 cores or 2 GB) and data-saver get fewer moving things. ?lite or ?full in the address forces it. */
const LITE = (() => { try {
  const q = new URLSearchParams(location.search);
  if (q.has('full')) return false;
  if (q.has('lite')) return true;
  const phone = matchMedia('(pointer:coarse)').matches && innerWidth < 900;
  const weak = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
  const save = !!(navigator.connection && navigator.connection.saveData);
  return phone || weak || save;
} catch (e) { return false; } })();
if (LITE) document.documentElement.classList.add('lite');
const $ = q => document.querySelector(q);
const NF = new Intl.NumberFormat('en-US');          // built once: constructing Intl objects per call is slow
const usd = n => '$' + NF.format(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/* ---------- strings ---------- */
const STR = {
th: {
  skip:'ข้ามไปที่เนื้อหา', nav_city:'เมือง', nav_works:'ผลงาน', nav_artists:'ศิลปิน', nav_about:'เกี่ยวกับ', nav_map:'แผนที่', nav_join:'Join', bn_city:'เมือง', bn_art:'ผลงาน', bn_artists:'ศิลปิน', bn_lang:'ภาษา', bn_aria:'เมนูด้านล่าง', menu_aria:'เมนู', lang_aria:'เปลี่ยนภาษา',
  wave:'คลื่นลูกใหม่', f_wave:'★ คลื่นลูกใหม่', fnote_wave:'ไฮไลต์ {n} ตึกคลื่นลูกใหม่ในแถบเมืองแล้ว',
  ld_top:'circles · เมืองของศิลปิน', ld_text:'กำลังสร้างเมือง…',
  legal_privacy:'นโยบายความเป็นส่วนตัว', legal_terms:'เงื่อนไขการใช้งาน',
  consent_form:'ส่งข้อความนี้แสดงว่าคุณรับทราบ<a href="privacy.html">นโยบายความเป็นส่วนตัว</a> ข้อความจะถึงทีม circles ก่อน แล้วเราส่งต่อให้ผู้รับที่ระบุ (ผ่านผู้ให้บริการรับฟอร์ม)',
  news_consent:'สมัครแล้วถือว่ารับ<a href="privacy.html">นโยบายความเป็นส่วนตัว</a> ยกเลิกได้ทุกเมื่อ',
  hero_hl1:'เมืองของศิลปิน', hero_hl2:'พื้นที่สำหรับงานศิลปะ', hero_hl3:'ที่ไม่ยอมเงียบ',
  hero_lead:'ตึกคอนกรีตหนึ่งหลัง ศิลปินหนึ่งคน ไม่มีหอศิลป์ ไม่มีคนกลาง เดินเข้าไป ดูงาน แล้วซื้อตรงจาก\u2060คน\u2060ทำ', hero_cta:'เข้าชมเมือง →', hero_alt:'ดูผลงาน ↓',
  city_h:'เมือง', city_p:'ลากหรือเลื่อนไปทางขวาเพื่อเดินผ่านเมือง ตึกแต่ละหลังคือสตูดิโอของศิลปินหนึ่งคน ภาพที่ฝังอยู่ในคอนกรีตคือผลงานจริง',
  pager_l:'เลื่อนซ้าย', pager_r:'เลื่อนขวา', strip_aria:'เมืองของศิลปิน เลื่อนซ้ายขวา', bd_aria:'เข้าตึกของ{a} {d}', works_n:'{n} WORKS',
  mani_k:'Manifesto', mani1:'ไม่มี\u200bหอศิลป์', mani2:'ไม่มี\u200bคนกลาง', mani3:'ไม่มี\u200bค่าหัวคิว', mani4:'มีแค่คนทำ กับคนซื้อ',
  mani_aria:'ไม่มีหอศิลป์ ไม่มีคนกลาง ไม่มีค่าหัวคิว มีแค่คนทำกับคนซื้อ',
  mani_note:'ที่นี่ศิลปินตั้งราคาเอง รับเงินเอง และคุยกับคนซื้อเอง ไม่มีใครมานั่งขวางระหว่างเรากับงาน เพราะงานศิลปะควรเดินจากมือคนทำไปถึงมือคนรัก ไม่ใช่แวะจ่ายค่าผ่านทางก่อน',
  how_i:'3 steps', how_h:'วิธีใช้งาน',
  s1_h:'เลือกตึก', s1_p:'ลากเดินผ่านเมือง ตึกหนึ่งหลังคือศิลปินหนึ่งคน เห็นรูปทรงแล้วถูกใจหลังไหน ก็ชี้หลังนั้น ไม่ต้องมีใครแนะนำ',
  s2_h:'เดินเข้าไปดูงาน', s2_p:'เปิดประตูตึก ไล่ดูทีละชั้น ทีละห้อง ผลงานแขวนอยู่บนผนังคอนกรีตจริง ๆ จับไม่ได้ แต่ดูได้นานเท่าที่อยากดู',
  s3_h:'ซื้อตรงจากศิลปิน', s3_p:'เจอชิ้นที่ตามไปถึงในฝัน ก็คุยกับคนทำโดยตรง จ่ายตามราคาที่เขาตั้ง เงินทุกบาทเข้ากระเป๋าคนวาด ไม่มีใครหักก่อน',
  feat_i:'Featured', feat_h:'ผลงานเด่นสัปดาห์นี้', feat_h_all:'ผลงานทั้งหมดในเมือง',
  sort_label:'เรียงตาม', sort_cur:'คัดมาให้', sort_low:'ราคาต่ำ → สูง', sort_high:'ราคาสูง → ต่ำ', sort_new:'ใหม่ล่าสุด',
  all_btn:'ดูทั้งหมด {n} ชิ้น', less_btn:'ดูเฉพาะชิ้นเด่น', feat_count:'แสดง {n} ชิ้น', q_ph:'ค้นหาชื่องาน ชื่อศิลปิน (ไทย · English · ລາວ)', q_aria:'ค้นหาผลงานตามชื่องานหรือชื่อศิลปิน', q_none:'ไม่พบผลงานที่ตรงกับ “{q}” ลองคำอื่น หรือล้างตัวกรอง', sf_group:'ตัวกรองด่วน', sf_status:'สถานะ', sf_all:'ทั้งหมด', sf_avail:'ยังว่างอยู่', sf_price:'ราคา', sf_p1:'ต่ำกว่า $300', sf_p2:'$300–600', sf_p3:'$600+', sf_reset:'ล้างตัวกรอง', sf_none:'ไม่มีผลงานในช่วงนี้ ลองตัวกรองอื่น', sf_count:'แสดง {n} จาก {t} ชิ้น', z_open:'ขยายดูภาพ', z_in:'ขยาย', z_out:'ย่อ', z_fit:'พอดีจอ', z_hint:'เลื่อนลูกกลิ้ง ดับเบิลคลิก หรือกด + − เพื่อซูม ลากเพื่อเลื่อนภาพ กด Esc เพื่อปิด', z_hint_t:'แตะสองครั้งหรือใช้สองนิ้วเพื่อซูม ลากเพื่อเลื่อนภาพ', qv_free:'พร้อมขาย', qv_ask:'ทักศิลปิน', qv_walk:'เดินชมตึกของศิลปิน →', qv_prev:'ชิ้นก่อนหน้า', qv_next:'ชิ้นถัดไป', qv_thb:'ประมาณ', card_aria:'{t} โดย{a} {p}', card_aria_np:'{t} โดย{a}',
  map_i:'The', map_h:'แผนที่เมือง', map_p:'มองจากข้างบน เมืองแบ่งเป็นย่านตามสาขา กดย่านหรือปุ่มกรอง แล้วตึกในแถบเมืองด้านบนจะสว่างขึ้นให้',
  filters_aria:'กรองตามสาขา', f_all:'ทั้งหมด', district:'ย่าน', plaza:'PLAZA · จัตุรัสกลางเมือง',
  fnote:'ไฮไลต์ {n} ตึกสาขา{d}ในแถบเมืองแล้ว', fnote_go:'ดูตึกในแถบเมือง ↑', fnote_in:'เข้าไปในตึก →', fnote_x:'ล้างตัวกรอง ✕',
  spot_i:'Artist of the week', spot_h:'นภา',
  q1:'ทำไมถึงเลิกส่งงานเข้าหอศิลป์?', a1:'ส่งไปสิบสองรอบ ได้คำตอบว่า "น่าสนใจ แต่ยังไม่ใช่ตอนนี้" ครบสิบสองรอบ สุดท้ายก็เข้าใจว่า "ตอนนี้" ของพวกเขาไม่เคยมาถึง เลยเลิกรอ',
  q2:'ทำไมต้องห้องว่างกับหมอก?', a2:'เพราะที่ว่างคือที่เดียวที่ไม่มีใครมาบอกว่าต้องรู้สึกยังไง ห้องว่างหนึ่งห้อง คนดูร้อยคน ได้ร้อยเรื่อง ไม่ต้องมีคิวเรเตอร์แปลให้',
  q3:'ถ้าคนเดินเข้ามาแล้วไม่ซื้อล่ะ?', a3:'ก็ไม่เป็นไร เดินดูฟรี นั่งเถียงกับภาพได้ ถ้าวันไหนงานตามไปหลอนถึงบ้าน ค่อยกลับมาคุยราคากับคนวาดตรง ๆ ไม่มีใครเก็บค่าแนะนำ',
  spot_cta:'เข้าไปในตึกนภา →', spot_meta:'NO.01 · {d} · ตั้งแต่ {y} · {c}',
  stats_aria:'ตัวเลขของเมือง', st1:'ศิลปินในเมือง', st2:'ผลงานในตึก', st3:'สาขาศิลปะ', st4:'เงินที่ถึงมือศิลปิน',
  join_k:'Get a building', join_i:'Your', join_h:'อยากมีตึกของตัวเอง?',
  p1_h:'ตึกเป็นของคุณ', p1_p:'จัดห้อง วางงาน เปลี่ยนชั้นได้ตามใจ ตึกหนึ่งหลังคือศิลปินหนึ่งคน ไม่มีใครมาแชร์ผนังด้วย',
  p2_h:'เงินเข้าคุณ 100%', p2_p:'ตั้งราคาเอง รับเงินเอง ไม่มีค่าคอมมิชชัน ไม่มีค่าฝากขาย ไม่มีใครหักก่อนถึงมือ',
  p3_h:'ไม่มีใครคัดงาน', p3_p:'ไม่มีคณะกรรมการ ไม่มีธีมประจำปี ไม่ถามว่าจบจากไหน ทำมาแล้วอยากให้คนเห็น ก็สร้างตึกได้เลย',
  join_btn:'Join — ขอมีตึก →', jn_kick:'สำหรับศิลปิน', jn_cta:'เล่าให้เราฟังสั้น ๆ ว่าคุณทำงานแบบไหน แนบลิงก์ผลงาน แล้วเราจะติดต่อกลับทางอีเมล', jb_p:'ตั้งราคาเอง รับเงินเอง ไม่มีใครคัดงาน', jb_btn:'ดูรายละเอียด →', skip_main:'ข้ามไปที่เนื้อหา',
  foot_h:'ศิลปะ<em>ไม่รอ</em>ใคร', foot_p:'อยากมีตึกในเมืองนี้ ส่งงานมาได้เลย เราไม่ถามว่าคุณเป็นใคร เราดูแค่ว่างานคุณเป็นยังไง', foot_btn:'ขอเข้าร่วม →',
  foot_menu:'เมนู', foot_social:'โซเชียล', foot_manifesto:'Manifesto', foot_how:'วิธีใช้งาน', foot_feat:'ผลงานเด่น', foot_map:'แผนที่เมือง', foot_join:'ขอมีตึก',
  news_label:'ข่าวจากเมือง ตึกใหม่ งานใหม่ ส่งตรงถึงกล่องอีเมล ไม่สแปม ไม่ขายต่อ', news_btn:'สมัคร →', foot_copy:'© 2026 CIRCLES · ต้นแบบ · ศิลปินและผลงานในเว็บนี้เป็นตัวอย่าง · NO GALLERY. NO MIDDLEMAN.',
  social_soon:'ลิงก์โซเชียลจะเปิดตอนเว็บขึ้นออนไลน์',
  /* dialogs + feedback */
  close:'ปิด', jd_title:'ขอมี<em>ตึก</em>ในเมืองนี้', jd_intro:'เล่าให้ฟังสั้น ๆ ว่าคุณทำอะไร ไม่ต้องมีประวัติยาว ไม่ต้องมีใครรับรอง เราดูที่งาน',
  jd_name:'ชื่อ / นามปากกา', jd_email:'อีเมล', jd_disc:'สาขา', jd_other:'อื่น ๆ', jd_link:'ลิงก์ผลงาน (เว็บ / Instagram / Drive)', jd_msg:'เล่าเกี่ยวกับงานของคุณ', jd_send:'ส่งคำขอ →', jd_cancel:'ยกเลิก',
  jd_subject:'ขอมีตึกใน circles — {n}', id_title:'คุยกับ<em>{a}</em>ตรง ๆ', id_intro:'ข้อความนี้ถึงทีม circles แล้วเราส่งต่อให้ศิลปิน ส่วนการตกลงราคาและการจ่ายเงินคุณทำกับศิลปินโดยตรง', id_name:'ชื่อของคุณ', id_email:'อีเมลของคุณ', id_msg:'ข้อความ', id_send:'ส่งข้อความ →',
  id_prefill:'สวัสดี สนใจผลงาน “{t}” ({p}) อยากคุยเรื่องราคาและการจัดส่ง ขอบคุณ', id_subject:'สนใจผลงาน “{t}” — circles',
  done_mail:'เปิดแอปอีเมลของคุณแล้ว', done_mail_p:'กดส่งในแอปอีเมลเพื่อให้ข้อความถึงปลายทาง ถ้าไม่มีอะไรเปิดขึ้น ให้คัดลอกข้อความด้านล่างแล้วส่งเอง', done_sent:'ส่งเรียบร้อย', done_sent_p:'ขอบคุณ ข้อความถึงทีม circles แล้ว เราจะส่งต่อให้ศิลปิน และคำตอบจะส่งไปที่อีเมลของคุณ',
  copy_msg:'คัดลอกข้อความ', copied:'คัดลอกแล้ว', copy_fail:'คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง', to_label:'ถึง',
  news_saved:'บันทึกอีเมลไว้ในเครื่องนี้แล้ว (ยังไม่ได้เชื่อมระบบส่งจดหมาย)', news_sent:'สมัครรับข่าวเรียบร้อย', news_fail:'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง',
  captcha_wait:'รอให้การตรวจสอบเสร็จก่อนส่ง', note_mailto:'ตอนนี้ฟอร์มนี้ทำงานผ่านแอปอีเมลของคุณ', demo_note:'เว็บนี้เป็นรุ่นทดลอง ศิลปิน ผลงาน และอีเมลเป็นข้อมูลตัวอย่าง ยังไม่มีงานขายจริง',
  /* cutaway */
  cw_est:'ก่อตั้ง {y}', cw_back:'← กลับไปเดินเมือง', cw_hint:'▼ ภาพตัดตึกทีละชั้น กดที่ผลงานเพื่อดูรายละเอียดเต็ม', cw_section:'SECTION A–A · ไม่มีลิฟต์ ใช้บันไดเท่านั้น',
  mus_name:'พิพิธภัณฑ์ของ{a}', mus_aria:'โถงแสดงภาพของ{a}', mus_prev:'← ภาพก่อน', mus_next:'เดินต่อ →', mus_more:'รายละเอียดและแนวคิด', mus_map:'ผังตึก', mus_hint:'▼ เดินดูภาพทีละชิ้น ใช้ลูกศร ← → บนคีย์บอร์ดได้ กดที่ภาพที่สว่างเพื่อดูรายละเอียดเต็ม', mus_hint_touch:'▼ ปัดซ้าย-ขวาเพื่อเดินดูภาพทีละชิ้น แตะภาพที่สว่างเพื่อดูรายละเอียดเต็ม',
  pf_h:'โปรไฟล์ของ{a}', pf_open:'รับงานสั่งทำ', pf_until:'· คิวว่างเดือน {m}', pf_cn:'แนวคิดของงาน{a}', pf_nw:'ผลงานในพิพิธภัณฑ์', pf_ns:'ขายแล้ว', pf_ny:'เริ่มทำงานศิลปะ', pf_tl:'เส้นทางที่ผ่านมา',
  pf_wh:'ผลงานในพิพิธภัณฑ์', pf_hover:'ชี้ที่ภาพเพื่อดูราคา', pf_all:'เดินเข้าไปดูทั้งหมด →', pf_sup1:'ชอบงานของ{a}?', pf_sup2:'ช่วยให้สร้างงานต่อ', pf_supn:'ทุกการสนับสนุนไปถึงศิลปินโดยตรง ช่วงเริ่มต้นนี้ Circles ยังไม่หักค่าธรรมเนียมจากศิลปิน', pf_supb:'สนับสนุน{a}', pf_soon:'เร็วๆ นี้',
  pf_walk:'เดินเข้าพิพิธภัณฑ์ →', pf_ask:'ถามศิลปิน', pf_ig:'Instagram', pf_share:'แชร์โปรไฟล์ ↗', pf_copy:'คัดลอกลิงก์', pf_copied:'คัดลอกลิงก์แล้ว', pf_marq:'ART NOT SORRY ★ วงกลมไม่มีวันจบ ★ CIRCLES ★ เดินเข้าพิพิธภัณฑ์ ★ ',
  mus_prof:'ดูโปรไฟล์ศิลปิน', title_pf:'โปรไฟล์ของ{a} — circles', desc_pf:'รู้จัก{a} ศิลปินสาขา{d} แนวคิดของงาน ผลงานที่ขายอยู่ และช่องทางสนับสนุนหรือสั่งทำงาน',
  fold_spot:'อ่านบทสัมภาษณ์ 3 ข้อ', fold_foot:'เมนู โซเชียล และจดหมายข่าว',
  by_back:'← กลับพิพิธภัณฑ์ของ{a}', by_marq:'ART NOT SORRY ★ ไม่มีคนกลาง ★ ซื้อตรงจากศิลปิน ★ CIRCLES NEVER END ★ ', by_one:'ชิ้นเดียวในโลก', by_free:'ยังว่าง', by_reply:'ตอบเร็วสุดภายใน {d} วัน', by_lak:'กีบ', by_thb:'บาท',
  by_detail:'รายละเอียดงาน', by_cert:'ใบรับรอง', by_how:'ซื้อยังไง', by_ship:'การส่งของ', by_to:'ส่งได้ที่', by_fee:'ค่าส่ง', by_days:'ถึงมือภายใน', by_dayu:'{d} วัน', by_break:'ถ้าแตกระหว่างทาง', by_ret:'คืนได้ {d} วัน',
  by_safe:'ปลอดภัยไหม?', by_safe_p:'เงินไปที่ศิลปินโดยตรง circles ไม่ได้รับเงินแทน ถ้ามีปัญหา ติดต่อ', by_since:'ทำงานศิลปะตั้งแต่ {y}', by_soldn:'ขายไปแล้ว {n} ชิ้น',
  by_ask_h:'ทัก{a} (ไม่ต้องออกจากหน้านี้)', by_country:'ส่งไปที่ไหน (ประเทศ / เมือง)', by_after:'ส่งแล้วจะเห็นข้อความ:', by_after_p:'“ส่งถึง{a}แล้ว จะตอบไปที่อีเมลของคุณภายใน {d} วัน”', by_after_p0:'“ส่งถึงทีม circles แล้ว เราจะส่งต่อให้{a} คำตอบจะส่งไปที่อีเมลของคุณ”', by_ship_ask:'เรื่องการส่ง ถามศิลปินได้เลยในข้อความด้านล่าง', by_again:'ส่งอีกข้อความ', by_err:'ส่งไม่สำเร็จ ข้อความของคุณยังอยู่ในช่อง ลองกดส่งอีกครั้ง หรือส่งทางอีเมลเอง', by_err_mail:'ส่งทางอีเมลแทน',
  title_by:'{t} โดย{a} — circles', desc_by:'ซื้อ “{t}” ผลงาน{d}ของ{a} ราคา {p} ซื้อตรงจากศิลปิน ไม่มีคนกลาง',
  cw_meta:'{d} · ตั้งแต่ {y} · {c}', cw_view:'ดูรายละเอียด {t}', cw_prev:'← ตึกก่อนหน้า', cw_next:'ตึกถัดไป →', cw_roof:'{n} · STUDIO',
  lb_artist:'ศิลปิน', lb_year:'ปี', lb_medium:'วัสดุ', lb_size:'ขนาด', buy:'ส่งข้อความขอซื้อ →', by_more_h:'ผลงานอื่นของ{a}ที่ยังว่าง', by_nopay:'ยังไม่ต้องจ่ายเงินตอนนี้ ส่งข้อความก่อน แล้วตกลงราคา การส่ง และวิธีจ่ายกับศิลปิน', w_prev:'← ชิ้นก่อน', w_next:'ชิ้นถัดไป →', st_sold:"ขายแล้ว", st_res:"จองแล้ว", cw_look_sold:"ดูรายละเอียด →", d_sold:"ชิ้นนี้มีเจ้าของแล้ว", d_res:"มีคนจองไว้แล้ว ถ้าหลุดจอง ศิลปินจะแจ้งคนที่ต่อคิว", b_sold:"ถาม{a}เรื่องงานแบบนี้ →", b_res:"ขอต่อคิวชิ้นนี้ →", b_pay:"จ่ายเลย →", b_ask:"มีคำถาม? ทัก{a}ก่อน", p_how1:"กดจ่ายผ่านลิงก์ของศิลปิน", p_how2:"ศิลปินทักกลับเรื่องการจัดส่ง", p_how3:"เงินเข้าบัญชีศิลปินโดยตรง", d_paynote:"ลิงก์จ่ายเงินเป็นของศิลปินเอง circles ไม่ได้รับเงินแทน", id_pre_sold:"สวัสดี เห็นผลงาน “{t}” ที่ขายไปแล้ว ชอบมาก มีงานแบบนี้อีกไหม หรือรับทำงานใหม่ไหม ขอบคุณ", id_pre_res:"สวัสดี สนใจผลงาน “{t}” ({p}) ถ้าคนที่จองไว้ไม่ซื้อ ขอต่อคิวด้วย ขอบคุณ", v_city:"ดูแบบตึก", v_map:"ดูแบบแผนที่", v_aria:"เลือกมุมมองเมือง", cw_look:'ดูรายละเอียด · ซื้อ →', d_by:'โดย <b>{a}</b> · {d} · {c}', d_note:'ราคาที่ศิลปินตั้งเอง ไม่มีค่าคอมมิชชัน', d_story:'ที่มาของงานชิ้นนี้', cc_h:'แนวคิดของงาน', cc_origin:'ที่มา', cc_mat:'วัสดุ', cc_steps:'ขั้นตอนการทำ', cc_step:'ขั้นที่ {n}',
  cy_h:'วงกลมไม่มีปลายทาง ศิลปะก็เหมือนกัน', cy_p:'ชื่อ Circles มาจากความเชื่อว่างานศิลปะไม่มีวันจบ ศิลปินทำชิ้นหนึ่งเสร็จ ก็มีชิ้นต่อไปรออยู่เสมอ งานที่ถูกซื้อไปไม่ใช่จุดสิ้นสุด แต่เป็นแรงให้ทำต่อ และเมืองนี้ก็วนไปแบบนั้นเรื่อย ๆ', cy_1:'วาด', cy_2:'โชว์ในตึก', cy_3:'มีคนซื้อ', cy_4:'วาดต่อ', cy_aria:'วงจร 4 ขั้น: วาด โชว์ในตึก มีคนซื้อ แล้ววนกลับไปวาดต่อ',
  sup_h:'สนับสนุน Circles', sup_p:'ตอนนี้ศิลปินรับเงินเต็ม ไม่มีค่าธรรมเนียม เว็บอยู่ได้ด้วยเงินสนับสนุน ถ้ามีค่าธรรมเนียมในอนาคต เราจะบอกล่วงหน้า', sup_where:'เงินสนับสนุนไปไหน', sup_r1:'ค่าเซิร์ฟเวอร์และโดเมน', sup_r2:'การดูแลและพัฒนาเว็บ', sup_r3:'กิจกรรมและพื้นที่ใหม่สำหรับศิลปิน', sup_note:'ตัวอย่าง: หมวดและสัดส่วนยังไม่ตกลง [__]% คือตัวเลขที่ยังไม่รู้ จะใส่เมื่อมีข้อมูลจริง', don_btn:'สนับสนุน →', don_soon:'เร็วๆ นี้', d_how1:'ส่งข้อความถึงศิลปิน', d_how2:'คุยเรื่องราคาและการจัดส่ง', d_how3:'จ่ายเงินให้ศิลปินโดยตรง',
  title_idx:'circles — เมืองของศิลปิน ซื้อตรงจากคนทำ', title_cw:'ตึกของ{a} — circles',
  desc_idx:'circles เมืองของศิลปิน ตึกคอนกรีตหนึ่งหลังคือศิลปินหนึ่งคน ไม่มีหอศิลป์ ไม่มีคนกลาง เดินเข้าไปดูงานแล้วซื้อตรงจาก\u2060คน\u2060ทำ',
  desc_cw:'เดินเข้าไปในตึกของ{a} ศิลปินสาขา{d} ดูผลงานทีละชั้น แล้วซื้อตรงจากศิลปิน',
  nf_h:'ตึกนี้ยังไม่ได้สร้าง', nf_p:'ไม่มีศิลปินคนนี้ในเมือง กลับไปเดินดูตึกที่มีอยู่',
  mq:['ศิลปินไม่มีกฎ','BUY ART','ซื้อตรงจากคนทำ','NO MIDDLEMAN','เมืองของศิลปิน','ART NOT SORRY'],
},
en: {
  skip:'Skip to content', nav_city:'City', nav_works:'Works', nav_artists:'Artists', nav_about:'About', nav_map:'Map', nav_join:'Join', bn_city:'City', bn_art:'Works', bn_artists:'Artists', bn_lang:'Language', bn_aria:'Bottom navigation', menu_aria:'Menu', lang_aria:'Switch language',
  wave:'NEW WAVE', f_wave:'★ New wave', fnote_wave:'Highlighted {n} new-wave building(s) in the strip',
  ld_top:'circles · a city of artists', ld_text:'Building the city…',
  legal_privacy:'Privacy policy', legal_terms:'Terms of use',
  consent_form:'By sending this you accept the <a href="privacy.html">privacy policy</a>. Your message reaches the circles team first, who pass it on to the recipient named above (through a form service).',
  news_consent:'By subscribing you accept the <a href="privacy.html">privacy policy</a>. Unsubscribe any time.',
  hero_hl1:'A city of artists', hero_hl2:'Room for art', hero_hl3:"that won't shut up",
  hero_lead:'One concrete building, one artist. No gallery, no middleman. Walk in, look at the work, then buy straight from the person who made it.', hero_cta:'Enter the city →', hero_alt:'See the works ↓',
  city_h:'City', city_p:"Drag or scroll right to walk through the city. Each building is one artist's studio, and the pictures set into the concrete are real works.",
  pager_l:'Scroll left', pager_r:'Scroll right', strip_aria:'City of artists, scroll left and right', bd_aria:"Enter {a}'s building, {d}", works_n:'{n} WORKS',
  mani_k:'Manifesto', mani1:'NO GALLERY', mani2:'NO MIDDLEMAN', mani3:'NO CUT TAKEN', mani4:'JUST MAKER + BUYER',
  mani_aria:'No gallery. No middleman. No cut taken. Just the maker and the buyer.',
  mani_note:"Here artists set their own prices, get paid directly and talk to buyers themselves. Nobody sits between us and the work, because art should travel from the maker's hand to the lover's hand, not stop to pay a toll first.",
  how_i:'3 steps', how_h:'How to use it',
  s1_h:'Pick a building', s1_p:"Drag through the city. One building is one artist. See a shape you like, point at it. Nobody needs to recommend anything.",
  s2_h:'Walk in and look', s2_p:"Open the door and go floor by floor, room by room. The work hangs on real concrete walls. You can't touch it, but you can look as long as you like.",
  s3_h:'Buy direct from the artist', s3_p:'Found the piece that follows you home? Talk to the maker directly and pay the price they set. Every cent goes to the artist, nobody skims first.',
  feat_i:'Featured', feat_h:"This week's picks", feat_h_all:'Every work in the city',
  sort_label:'Sort by', sort_cur:'Curated', sort_low:'Price: low → high', sort_high:'Price: high → low', sort_new:'Newest',
  all_btn:'Show all {n} works', less_btn:'Featured only', feat_count:'Showing {n} works', q_ph:'Search a title or an artist (Thai · English · ລາວ)', q_aria:'Search works by title or artist', q_none:'No works match “{q}”. Try another word, or clear the filters.', sf_group:'Quick filters', sf_status:'Status', sf_all:'All', sf_avail:'Available', sf_price:'Price', sf_p1:'Under $300', sf_p2:'$300–600', sf_p3:'$600+', sf_reset:'Clear filters', sf_none:'No works in this range. Try another filter.', sf_count:'Showing {n} of {t} works', z_open:'Zoom into the picture', z_in:'Zoom in', z_out:'Zoom out', z_fit:'Fit to screen', z_hint:'Scroll, double-click or press + − to zoom. Drag to move. Esc closes.', z_hint_t:'Double-tap or pinch to zoom. Drag to move.', qv_free:'Available', qv_ask:'Message the artist', qv_walk:'Walk through the artist\'s building →', qv_prev:'Previous work', qv_next:'Next work', qv_thb:'about', card_aria:'{t} by {a}, {p}', card_aria_np:'{t} by {a}',
  map_i:'The', map_h:'City map', map_p:'From above, the city splits into districts by discipline. Tap a district or a filter and the matching buildings light up in the strip above.',
  filters_aria:'Filter by discipline', f_all:'All', district:'DISTRICT', plaza:'PLAZA · CITY SQUARE',
  fnote:'Highlighted {n} building(s) in the {d} district', fnote_go:'See buildings in the strip ↑', fnote_in:'Enter building →', fnote_x:'Clear filter ✕',
  spot_i:'Artist of the week', spot_h:'Napha',
  q1:'Why did you stop sending work to galleries?', a1:"Twelve submissions, and twelve times the answer was 'interesting, but not right now'. In the end I understood their 'now' never arrives, so I stopped waiting.",
  q2:'Why empty rooms and fog?', a2:'Because empty space is the only place nobody tells you how to feel. One empty room, a hundred viewers, a hundred stories. No curator needed to translate.',
  q3:"What if people walk in and don't buy?", a3:"That's fine. Looking is free, argue with the painting as long as you like. If a piece haunts you all the way home, come back and talk price with the painter directly. Nobody charges a finder's fee.",
  spot_cta:"Enter Napha's building →", spot_meta:'NO.01 · {d} · since {y} · {c}',
  stats_aria:'The city in numbers', st1:'Artists in the city', st2:'Works inside the buildings', st3:'Art forms', st4:'Of the money reaches the artist',
  join_k:'Get a building', join_i:'Your', join_h:'Want a building of your own?',
  p1_h:'The building is yours', p1_p:"Arrange rooms, hang work, change floors however you like. One building, one artist. Nobody shares your walls.",
  p2_h:'You keep 100%', p2_p:'Set your own price and get paid directly. No commission, no consignment fee, nobody skims before it reaches you.',
  p3_h:'No one judges the work', p3_p:"No committee, no yearly theme, nobody asks where you graduated. Made something you want people to see? You can build.",
  join_btn:'Join — get a building →', jn_kick:'For artists', jn_cta:'Tell us briefly what you make and add a link to your work. We will get back to you by email.', jb_p:'Set your own prices, get paid directly, no jury.', jb_btn:'See how it works →', skip_main:'Skip to content',
  foot_h:'Art <em>waits</em> for no one', foot_p:"Want a building in this city? Send us your work. We won't ask who you are, only what your work is like.", foot_btn:'Request to join →',
  foot_menu:'Menu', foot_social:'Social', foot_manifesto:'Manifesto', foot_how:'How it works', foot_feat:'Featured', foot_map:'City map', foot_join:'Get a building',
  news_label:'News from the city: new buildings, new work, straight to your inbox. No spam, never resold.', news_btn:'Subscribe →', foot_copy:'© 2026 CIRCLES · prototype · artists and works shown are examples · NO GALLERY. NO MIDDLEMAN.',
  social_soon:'Social links open when the site goes live',
  close:'Close', jd_title:'Request a <em>building</em> in this city', jd_intro:"Tell us briefly what you make. No long CV, no references. We look at the work.",
  jd_name:'Name / pen name', jd_email:'Email', jd_disc:'Discipline', jd_other:'Other', jd_link:'Link to your work (site / Instagram / Drive)', jd_msg:'Tell us about your work', jd_send:'Send request →', jd_cancel:'Cancel',
  jd_subject:'Building request for circles — {n}', id_title:'Talk to <em>{a}</em> directly', id_intro:'This message reaches the circles team, who pass it on to the artist. Price and payment you agree with the artist directly.', id_name:'Your name', id_email:'Your email', id_msg:'Message', id_send:'Send message →',
  id_prefill:"Hi, I'm interested in “{t}” ({p}). Could we talk about price and shipping? Thanks.", id_subject:'Interested in “{t}” — circles',
  done_mail:'Your email app is opening', done_mail_p:"Press send in your email app so the message reaches its destination. If nothing opened, copy the text below and send it yourself.", done_sent:'Sent', done_sent_p:'Thank you. Your message reached the circles team, who will pass it on to the artist. The reply will come to your email.',
  copy_msg:'Copy message', copied:'Copied', copy_fail:"Couldn't copy. Select the text and copy it yourself.", to_label:'To',
  news_saved:'Email saved in this browser only (no mailing system is connected yet)', news_sent:"You're subscribed", news_fail:"Couldn't send. Please try again.",
  captcha_wait:'Please wait for the verification to finish', note_mailto:'For now this form works through your email app', demo_note:'This site is a trial version. Artists, works and emails are sample data, and nothing is for sale yet.',
  cw_est:'Est. {y}', cw_back:'← Back to the city', cw_hint:'▼ The building cut open, floor by floor. Click a work for full details', cw_section:'SECTION A–A · NO LIFT, STAIRS ONLY',
  mus_name:"{a}'s museum", mus_aria:"{a}'s picture hall", mus_prev:'← Previous', mus_next:'Walk on →', mus_more:'Details & concept', mus_map:'Floor plan', mus_hint:'▼ Walk the hall one work at a time. Use the ← → keys. Click the lit work for full details', mus_hint_touch:'▼ Swipe left or right to walk the hall one work at a time. Tap the lit work for full details',
  pf_h:"{a}'s profile", pf_open:'Taking commissions', pf_until:'· slot open in {m}', pf_cn:"{a}'s concept", pf_nw:'works in the museum', pf_ns:'sold', pf_ny:'making art since', pf_tl:'The road so far',
  pf_wh:'Works in the museum', pf_hover:'Point at a picture for the price', pf_all:'Walk in and see them all →', pf_sup1:"Like {a}'s work?", pf_sup2:'Help keep it going', pf_supn:'Every bit of support goes straight to the artist. For now Circles takes no fee from artists.', pf_supb:'Support {a}', pf_soon:'Coming soon',
  pf_walk:'Walk into the museum →', pf_ask:'Ask the artist', pf_ig:'Instagram', pf_share:'Share profile ↗', pf_copy:'Copy link', pf_copied:'Link copied', pf_marq:'ART NOT SORRY ★ CIRCLES NEVER END ★ CIRCLES ★ WALK INTO THE MUSEUM ★ ',
  mus_prof:'View artist profile', title_pf:"{a}'s profile — circles", desc_pf:"Meet {a}, {d} artist: the ideas behind the work, the pieces on sale, and ways to support or commission.",
  fold_spot:'Read the 3-question interview', fold_foot:'Menu, social & newsletter',
  by_back:"← Back to {a}'s museum", by_marq:'ART NOT SORRY ★ NO MIDDLEMAN ★ BUY DIRECT FROM THE ARTIST ★ CIRCLES NEVER END ★ ', by_one:'ONE OF A KIND', by_free:'Available', by_reply:'Usually replies within {d} days', by_lak:'LAK', by_thb:'THB',
  by_detail:'Details', by_cert:'Certificate', by_how:'How to buy', by_ship:'Shipping', by_to:'Ships to', by_fee:'Shipping fee', by_days:'Arrives within', by_dayu:'{d} days', by_break:'If it breaks in transit', by_ret:'returnable within {d} days',
  by_safe:'Is it safe?', by_safe_p:'The money goes straight to the artist; circles never holds it. If something goes wrong, contact', by_since:'Making art since {y}', by_soldn:'{n} sold',
  by_ask_h:'Message {a} (without leaving this page)', by_country:'Ship to (country / city)', by_after:'Once you send, you will see:', by_after_p:'“Sent to {a}. A reply will reach your email within {d} days.”', by_after_p0:'“Sent to the circles team, who will pass it on to {a}. The reply will come to your email.”', by_ship_ask:'Ask the artist about shipping in the message below.', by_again:'Send another message', by_err:'Could not send. Your message is still in the box. Try again, or send it by email yourself.', by_err_mail:'Send by email instead',
  title_by:'{t} by {a} — circles', desc_by:'Buy “{t}”, a {d} work by {a}, {p}. Direct from the artist, no middleman.',
  cw_meta:'{d} · since {y} · {c}', cw_view:'View details of {t}', cw_prev:'← Previous building', cw_next:'Next building →', cw_roof:'{n} · STUDIO',
  lb_artist:'Artist', lb_year:'Year', lb_medium:'Medium', lb_size:'Size', buy:'Message {a} to buy →', by_more_h:'More from {a}, still available', by_nopay:'No payment yet. Send a message first, then agree on price, shipping and payment with the artist.', w_prev:'← Previous work', w_next:'Next work →', st_sold:"SOLD", st_res:"ON HOLD", cw_look_sold:"View details →", d_sold:"This one has found a home.", d_res:"Someone has reserved it. If that falls through, the artist will tell whoever is next in line.", b_sold:"Ask {a} about similar work →", b_res:"Join the queue →", b_pay:"Pay now →", b_ask:"Questions? Message {a} first", p_how1:"Pay through the artist's own link", p_how2:"The artist gets in touch about delivery", p_how3:"The money goes straight to the artist", d_paynote:"The payment link belongs to the artist. circles never holds the money.", id_pre_sold:"Hi, I saw “{t}” has sold and I love it. Do you have similar work, or take commissions? Thanks.", id_pre_res:"Hi, I'm interested in “{t}” ({p}). If the reservation falls through, could I be next in line? Thanks.", v_city:"Buildings", v_map:"Map", v_aria:"Choose how to see the city", cw_look:'View & buy →', d_by:'by <b>{a}</b> · {d} · {c}', d_note:'Price set by the artist. No commission.', d_story:'The story behind it', cc_h:'Concept of the work', cc_origin:'Origin', cc_mat:'Materials', cc_steps:'How it was made', cc_step:'Step {n}',
  cy_h:'A circle has no end. Neither does art.', cy_p:'The name Circles comes from the belief that art is never finished. When an artist completes one piece, the next is already waiting. A sale is not an ending. It is what lets the artist keep going, and the city keeps turning that way.', cy_1:'Draw', cy_2:'Show in the building', cy_3:'Someone buys', cy_4:'Draw again', cy_aria:'A loop of 4 steps: draw, show in the building, someone buys, then back to drawing again',
  sup_h:'Support Circles', sup_p:'Right now artists keep the full amount, with no fees. The site runs on support. If we ever add a fee, we will tell you in advance.', sup_where:'Where the support goes', sup_r1:'Servers and domain', sup_r2:'Running and improving the site', sup_r3:'Events and new space for artists', sup_note:'Sample: the categories and shares are not final. [__]% marks a number we do not know yet and will fill in once we have real data.', don_btn:'Support →', don_soon:'Coming soon', d_how1:'Message the artist', d_how2:'Agree on price and shipping', d_how3:'Pay the artist directly',
  title_idx:'circles — a city of artists. Buy straight from the maker', title_cw:"{a}'s building — circles",
  desc_idx:'circles is a city of artists. One concrete building is one artist. No gallery, no middleman. Walk in, look at the work, buy straight from the maker.',
  desc_cw:"Walk into {a}'s building. {d} artist. See the work floor by floor, then buy direct from the artist.",
  nf_h:"This building doesn't exist yet", nf_p:'No artist by that name lives here. Go back and walk the buildings that do.',
  mq:['NO RULES FOR ARTISTS','BUY ART','BUY FROM THE MAKER','NO MIDDLEMAN','CITY OF ARTISTS','ART NOT SORRY'],
},
};
/* Lao (ລາວ): only what is written in Lao so far. Every other string, and all artist data, falls back to English (see t()).
   To translate more, add keys here with the same names as in STR.th / STR.en. */
STR.lo = {bn_city:'ເມືອງ', bn_art:'ຜົນງານ', bn_artists:'ສິລະປິນ', bn_lang:'ພາສາ', bn_aria:'ເມນູດ້ານລຸ່ມ'};

/* ---------- language ---------- */
/* LOCALE = what the visitor picked (th / en / lo). LANG = the language of the content and of <html lang> (th / en): Lao reads English until more of STR.lo is written. */
const LOCALES = ['th', 'en', 'lo'], LOCALE_NAME = {th: 'ไทย', en: 'English', lo: 'ລາວ'};
let LOCALE = (() => {
  try {
    const q = new URLSearchParams(location.search).get('lang'); if (LOCALES.includes(q)) return q;
    const s = localStorage.getItem('circles-lang'); if (LOCALES.includes(s)) return s;
  } catch (e) {}
  return String((navigator.languages && navigator.languages[0]) || navigator.language || 'th').toLowerCase().startsWith('th') ? 'th' : 'en';
})();
let LANG = LOCALE === 'lo' ? 'en' : LOCALE;
const nextLocale = () => LOCALES[(LOCALES.indexOf(LOCALE) + 1) % LOCALES.length];
const t = (k, v) => {
  let s = LOCALE === 'lo' ? STR.lo[k] : undefined; if (s === undefined) s = STR[LANG][k]; if (s === undefined) s = STR.th[k]; if (s === undefined) return k;
  if (v && typeof s === 'string') for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
};
const pk = (o, k) => (LANG === 'en' && o[k + 'En'] != null) ? o[k + 'En'] : o[k];
const nameL = a => pk(a, 'name'), discL = a => LANG === 'en' ? (DISC_EN[a.disc] || a.disc) : a.disc, cityL = a => LANG === 'en' ? (CITY_EN[a.city] || a.city) : a.city;
const fmtSize = p => LANG === 'en' ? p.s.replace('ซม.', 'cm').replace('สูง', 'H') : p.s;
const langHooks = [];
const onLang = fn => { langHooks.push(fn); };
function applyLang() {
  document.documentElement.lang = LANG; document.documentElement.dataset.locale = LOCALE;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-html]').forEach(el => { el.innerHTML = t(el.dataset.tHtml); });
  document.querySelectorAll('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
  document.querySelectorAll('[data-t-ph]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.tPh)); });
  const lb = $('#lang'); if (lb) { const nx = nextLocale(); lb.textContent = nx.toUpperCase(); lb.setAttribute('aria-label', nx.toUpperCase() + ' — ' + LOCALE_NAME[nx]); lb.setAttribute('lang', nx); }
  const mb = $('#menu-btn'); if (mb) mb.setAttribute('aria-label', t('menu_aria'));
  langHooks.forEach(fn => fn());
}
function mountSkip() {
  if (document.querySelector('.skip')) return;
  const m = document.getElementById('main') || document.querySelector('main') || document.getElementById('hero'); if (!m) return;
  if (!m.id) m.id = 'main'; m.tabIndex = -1;
  const a = document.createElement('a'); a.className = 'skip'; a.href = '#' + m.id; a.dataset.t = 'skip'; a.textContent = t('skip');
  a.addEventListener('click', e => { e.preventDefault(); m.focus(); m.scrollIntoView({block: 'start'}); });
  document.body.prepend(a);
}
function setLang(l) {
  if (!LOCALES.includes(l)) return;
  const was = LOCALE;
  LOCALE = l; LANG = l === 'lo' ? 'en' : l; try { localStorage.setItem('circles-lang', l); } catch (e) {}
  applyLang();
  if (l === 'lo' && was !== 'lo') toast('ພາສາລາວ: ແປແລ້ວບາງສ່ວນ · Lao is partly translated, the rest is in English');   // be honest: only the menu is in Lao so far
}
function setMeta(title, desc) {
  document.title = title;
  const set = (sel, v) => { const m = document.querySelector(sel); if (m) m.setAttribute('content', v); };
  set('meta[name="description"]', desc); set('meta[property="og:title"]', title); set('meta[property="og:description"]', desc);
  set('meta[name="twitter:title"]', title); set('meta[name="twitter:description"]', desc);
}

/* ---------- ransom-note type: 4 colourways, small tilt ---------- */
const RS = [
  {bg:'#0E0D0C',fg:'#F4F1E8',ff:'Anton'}, {bg:'#FF2E88',fg:'#0E0D0C',ff:'Anton'},
  {bg:'#F4F1E8',fg:'#0E0D0C',ff:'"Special Elite"'}, {bg:'#E8B730',fg:'#0E0D0C',ff:'Chonburi',w:400},
];
const ROT = [-3, 2, -1.5, 3.5, -2.5, 1.5, -3.5, 2.5], YOFF = [0, -2, 1, -1, 2, 0, -2, 1];
const SEG = window.Intl && Intl.Segmenter ? new Intl.Segmenter('th', {granularity: 'grapheme'}) : null;
function graphemes(s) { return SEG ? Array.from(SEG.segment(s), x => x.segment) : Array.from(s); }
function ransom(el, text, seed = 0, wrap = false) {
  const chip = (c, i) => {
    const st = RS[(i + seed) % RS.length], k = (i * 3 + seed) % ROT.length;
    return `<span${/^\s+$/.test(c) ? ' class="sp"' : ''} style="--r:${ROT[k]}deg;--y:${YOFF[k]}px;--k:${i};background:${st.bg};color:${st.fg};font-family:${st.ff};font-weight:${st.w || 400}">${esc(c)}</span>`;
  };
  if (!wrap) { el.innerHTML = graphemes(text).map(chip).join(''); return; }
  /* wrap mode: every WORD is one unbreakable unit (.rw is nowrap), so a line may only break between words.
     Words are separated by a space (the space stays a blank chip) or by U+200B, an invisible "you may break here" that
     Thai text needs because Thai has no spaces. */
  let i = 0;
  el.innerHTML = text.split(/(\s+|\u200b)/).filter(Boolean).map(tok => {
    if (tok === '\u200b') return '';
    const chips = graphemes(tok).map(c => chip(c, i++)).join('');
    return /^\s+$/.test(tok) ? chips : `<span class="rw">${chips}</span>`;
  }).join('');
}

/* abstract placeholder built from an artist's own colours — sits behind each artwork <img> in case it fails to load */
function artBg(c, k) {
  const A = c[0], B = c[1 % c.length], C = c[2 % c.length], g = 'repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0 1px,transparent 1px 7px)';
  return [
    `${g},linear-gradient(180deg,${A} 0 40%,${B} 40% 66%,${C} 66%)`,
    `${g},radial-gradient(circle at 34% 40%,${A} 0 22%,transparent 22.5%),radial-gradient(circle at 68% 64%,${B} 0 30%,transparent 30.5%),${C}`,
    `${g},radial-gradient(circle at 50% 50%,${C} 0 18%,transparent 18.5%),linear-gradient(135deg,${A} 0 50%,${B} 50%)`,
    `${g},repeating-linear-gradient(90deg,${A} 0 16%,${B} 16% 30%,${C} 30% 40%)`,
  ][k % 4];
}
/* artwork markup: real/generated image over the colour placeholder */
/* sale status of a work: '' (for sale), 'sold' or 'reserved'; and the artist's own payment link (https only) */
const workStatus = p => (p && (p.status === 'sold' || p.status === 'reserved')) ? p.status : '';
const payLink = p => (p && typeof p.pay === 'string' && /^https:\/\/\S+$/.test(p.pay)) ? p.pay : '';
const stampHtml = p => { const s = workStatus(p); return s ? `<i class="stamp ${s}">${esc(t(s === 'sold' ? 'st_sold' : 'st_res'))}</i>` : ''; };
const statusChip = p => { const s = workStatus(p); return s ? `<span class="chip ${s}">${esc(t(s === 'sold' ? 'st_sold' : 'st_res'))}</span>` : ''; };
const artImg = (a, k) => { const p = a.pieces[k]; return p.img ? `<img src="${esc(p.img)}" alt="${esc(pk(p, 't'))}" loading="lazy" decoding="async" draggable="false">` : ''; };
const artistById = id => ARTISTS.find(a => a.id === id);

/* ---------- toast ---------- */
function toast(m) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = m; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- delivery: endpoint if configured, otherwise the visitor's email app ---------- */
async function deliver(kind, to, subject, fields) {
  const body = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
  if (CONFIG.endpoint) {
    try {
      const r = await fetch(CONFIG.endpoint, {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({kind, to, subject, ...fields})});
      if (r.ok) return {mode: 'sent', body};
    } catch (e) {}
    return {mode: 'fail', body};
  }
  location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return {mode: 'mailto', body, to, subject};
}

/* the browser's Back button (and the Android back gesture) closes the open dialog instead of leaving the page: each dialog opened through mountDialog adds one history entry */
const dlgStack = []; let dlgIgnorePop = 0;
function trackDialog(d) {
  const open = d.showModal.bind(d);
  d.showModal = () => { if (d.open) return; open(); dlgStack.push(d); try { history.pushState({dlg: dlgStack.length}, ''); } catch (e) {} };
  d.addEventListener('close', () => {
    const i = dlgStack.lastIndexOf(d); if (i < 0) return;      // already closed by Back
    dlgStack.splice(i, 1); dlgIgnorePop++;
    try { history.back(); } catch (e) { dlgIgnorePop--; }     // remove the entry this dialog added
  });
}
addEventListener('popstate', () => {
  if (dlgIgnorePop) { dlgIgnorePop--; return; }
  const d = dlgStack.pop(); if (d && d.open) d.close();
});
function mountDialog(id) {
  let d = document.getElementById(id);
  if (!d) { d = document.createElement('dialog'); d.id = id; d.className = 'cdlg'; document.body.appendChild(d); d.addEventListener('click', e => { if (e.target === d) d.close(); }); trackDialog(d); }
  return d;
}
/* ---------- picture zoom (buy page, work details): wheel, double-click / double-tap, two-finger pinch, drag to move, + − 0 and arrow keys, Esc closes.
   An element with data-zoomable gets it: a click on its <img>, or on the zoomBtn() inside it, opens that picture full screen. ---------- */
const zoomBtn = () => `<button type="button" class="z-open" data-zoom data-t-aria="z_open" aria-label="${esc(t('z_open'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6M10 7v6M7 10h6"/></svg></button>`;
function openZoom(img) {
  if (!img) return;
  const d = mountDialog('zoom'); d.classList.add('zdlg'); d.setAttribute('data-lenis-prevent', ''); d.setAttribute('aria-label', img.alt || t('z_open'));
  d.innerHTML = `<div class="z-stage"><img src="${esc(img.currentSrc || img.src)}" alt="${esc(img.alt)}" draggable="false"></div>
<div class="z-bar"><button type="button" class="z-b" data-z="out" aria-label="${esc(t('z_out'))}">−</button><button type="button" class="z-b" data-z="fit" aria-label="${esc(t('z_fit'))}">1×</button><button type="button" class="z-b" data-z="in" aria-label="${esc(t('z_in'))}">+</button><button type="button" class="cdlg-x" data-close aria-label="${esc(t('close'))}">✕</button></div>
<p class="z-hint">${esc(t(matchMedia('(hover:none)').matches ? 'z_hint_t' : 'z_hint'))}</p>`;
  const stage = d.querySelector('.z-stage'), pic = stage.querySelector('img'), MAX = 6;
  let s = 1, x = 0, y = 0, w0 = 0, h0 = 0, animT = 0;
  const size = () => {      // the picture at scale 1 = as large as fits the screen
    const ar = (pic.naturalWidth / pic.naturalHeight) || (img.naturalWidth / img.naturalHeight) || 1, W = stage.clientWidth, H = stage.clientHeight;
    w0 = Math.min(W, H * ar); h0 = w0 / ar; pic.style.width = w0 + 'px'; pic.style.height = h0 + 'px';
  };
  const draw = () => {      // keep the picture covering the screen once it is larger than it
    const mx = Math.max(0, (w0 * s - stage.clientWidth) / 2), my = Math.max(0, (h0 * s - stage.clientHeight) / 2);
    x = Math.min(mx, Math.max(-mx, x)); y = Math.min(my, Math.max(-my, y));
    pic.style.transform = `translate(${x}px,${y}px) scale(${s})`; stage.classList.toggle('zoomed', s > 1.01);
  };
  const zoomAt = (n, px = 0, py = 0) => { n = Math.min(MAX, Math.max(1, n)); x = px - (px - x) * n / s; y = py - (py - y) * n / s; s = n; draw(); };   // (px, py) from the stage centre stays put
  const ease = () => { stage.classList.add('anim'); clearTimeout(animT); animT = setTimeout(() => stage.classList.remove('anim'), 280); };
  const rel = (cx, cy) => { const r = stage.getBoundingClientRect(); return [cx - r.left - r.width / 2, cy - r.top - r.height / 2]; };
  stage.addEventListener('wheel', e => { e.preventDefault(); zoomAt(s * Math.exp(-e.deltaY * .0018), ...rel(e.clientX, e.clientY)); }, {passive: false});
  const pts = new Map(); let pinch = null, lastTap = null;
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: e.timeStamp});
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s}; }
  });
  stage.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; zoomAt(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, ...rel((a.x + b.x) / 2, (a.y + b.y) / 2)); }
    else if (pts.size === 1 && s > 1) { x += dx; y += dy; draw(); }
  });
  const up = (e, cancel) => {
    const p = pts.get(e.pointerId); if (!p) return;
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (cancel || pts.size || Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 10 || e.timeStamp - p.t > 300) return;
    if (lastTap && e.timeStamp - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {   // double tap / double click: fit ↔ 2.5×
      lastTap = null; ease(); zoomAt(s > 1.01 ? 1 : 2.5, ...rel(e.clientX, e.clientY));
    } else lastTap = {x: e.clientX, y: e.clientY, t: e.timeStamp};
  };
  stage.addEventListener('pointerup', e => up(e, false));
  stage.addEventListener('pointercancel', e => up(e, true));
  d.querySelector('.z-bar').addEventListener('click', e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    ease(); zoomAt(b.dataset.z === 'in' ? s * 1.6 : b.dataset.z === 'out' ? s / 1.6 : 1);
  });
  d.querySelector('[data-close]').addEventListener('click', () => d.close());
  d.onkeydown = e => {
    const k = e.key, step = 80;
    if (k === '+' || k === '=') { ease(); zoomAt(s * 1.6); }
    else if (k === '-' || k === '_') { ease(); zoomAt(s / 1.6); }
    else if (k === '0') { ease(); zoomAt(1); }
    else if (/^Arrow/.test(k)) { if (s > 1) { ease(); x += k === 'ArrowLeft' ? step : k === 'ArrowRight' ? -step : 0; y += k === 'ArrowUp' ? step : k === 'ArrowDown' ? -step : 0; draw(); } }
    else return;
    e.preventDefault(); e.stopPropagation();
  };
  const onResize = () => { size(); draw(); };
  addEventListener('resize', onResize);
  d.addEventListener('close', () => removeEventListener('resize', onResize), {once: true});
  d.showModal();
  if (pic.complete && pic.naturalWidth) onResize(); else { onResize(); pic.addEventListener('load', onResize, {once: true}); }
}
document.addEventListener('click', e => {
  const host = e.target.closest('[data-zoomable]'); if (!host || e.button) return;
  if (!e.target.closest('[data-zoom]') && e.target.tagName !== 'IMG') return;
  e.preventDefault(); openZoom(host.querySelector('img'));
});

/* ---------- artwork quick view (lightbox): a picture opens full screen with its details, price in USD and THB, status and the buy / message buttons.
   openQuick(artistId, workIndex, list) — list = [[artistId, workIndex], ...] is what the arrows and ← → walk through (default: that artist's works).
   Closes with the X, Esc, or a click on the empty space around the picture; a click on the picture itself zooms it (openZoom). ---------- */
const thbOf = usdN => RATES.thb > 0 ? '฿' + NF.format(Math.round(usdN * RATES.thb)) : '';
let quickRedraw = null;
function openQuick(id, k, list) {
  const first = artistById(id); if (!first || !first.pieces[k]) return;
  const seq = (list && list.length ? list : first.pieces.map((_, i) => [id, i])).filter(([i, n]) => { const a = artistById(i); return a && a.pieces[n]; });
  let pos = Math.max(0, seq.findIndex(([i, n]) => i === id && n === k));
  const d = mountDialog('quick'); d.classList.add('qv'); d.setAttribute('data-lenis-prevent', ''); d.setAttribute('aria-labelledby', 'qv-t');
  let phaseT = 0;
  const phase = (ph, ms) => { d.dataset.phase = ph; clearTimeout(phaseT); if (ms) phaseT = setTimeout(() => { d.dataset.phase = 'idle'; }, ms); };   // in = the opening slam, step = a jolt between works
  const draw = () => {
    const [cid, ck] = seq[pos], a = artistById(cid), p = a.pieces[ck], sta = workStatus(p), pay = sta ? '' : payLink(p), nm = nameL(a);
    const [rw, rh] = String(p.ar || '1/1').split('/').map(Number), arn = rw > 0 && rh > 0 ? rw / rh : 1;
    const buyTxt = sta === 'sold' ? t('b_sold', {a: nm}) : sta === 'reserved' ? t('b_res') : t('buy', {a: nm});
    const thb = thbOf(p.p);
    const nav = (dir, on) => seq.length > 1 ? `<button type="button" class="qv-nav qv-${dir}" data-qv-go="${dir === 'prev' ? -1 : 1}" aria-label="${esc(t(dir === 'prev' ? 'qv_prev' : 'qv_next'))}"${on ? '' : ' disabled'}>${dir === 'prev' ? '←' : '→'}</button>` : '';
    d.innerHTML = `<div class="qv-stage" data-qv-stage>${nav('prev', pos > 0)}
  <div class="qv-frame" data-zoomable style="--ar:${esc(p.ar || '1/1')};--arn:${arn};--art:${artBg(a.works, ck)}">${artImg(a, ck)}${shopOn() ? stampHtml(p) : ''}${p.img ? zoomBtn() : ''}</div>${nav('next', pos < seq.length - 1)}</div>
<aside class="qv-info">
  <div class="qv-meta">${shopOn() ? `<span class="qv-st ${sta || 'free'}">${esc(sta === 'sold' ? t('st_sold') : sta === 'reserved' ? t('st_res') : t('qv_free'))}</span>` : '<span></span>'}${seq.length > 1 ? `<span class="qv-cnt" aria-hidden="true">${pos + 1} / ${seq.length}</span>` : ''}</div>
  <h2 class="qv-t" id="qv-t">${esc(pk(p, 't'))}</h2>
  <p class="qv-by">${t('d_by', {a: `<a href="profile-${esc(a.id)}.html">${esc(nm)}</a>`, d: esc(discL(a)), c: esc(cityL(a))})}</p>
  ${p.q ? `<p class="qv-q">“${esc(pk(p, 'q'))}”</p>` : ''}
  <dl class="qv-dl"><div><dt>${esc(t('lb_medium'))}</dt><dd>${esc(pk(p, 'm'))}</dd></div><div><dt>${esc(t('lb_size'))}</dt><dd>${esc(fmtSize(p))}</dd></div><div><dt>${esc(t('lb_year'))}</dt><dd>${esc(p.y)}</dd></div></dl>
  ${!shopOn() ? '' : `<div class="qv-price"><b class="${sta === 'sold' ? 'qv-strike' : ''}">${esc(usd(p.p))}</b>${thb ? `<span class="qv-thb">≈ ${esc(thb)}</span>` : isDraft() ? '<span class="qv-thb">≈ ฿<i class="qv-todo">[__]</i></span>' : ''}</div>`}
  ${!shopOn() ? `<div class="qv-cta"><a class="qv-btn pk" href="studio-${esc(a.id)}.html?work=${ck}">${esc(t('qv_walk'))}</a></div>` : `<div class="qv-cta"><b class="qv-sp${sta === 'sold' ? ' qv-strike' : ''}">${esc(usd(p.p))}</b>${pay ? `<a class="qv-btn pk" href="${esc(pay)}" target="_blank" rel="noopener">${esc(t('b_pay'))}</a>` : ''}<a class="qv-btn ${pay ? '' : 'pk'}" href="buy-${esc(a.id)}-${ck}.html">${esc(buyTxt)}</a><button type="button" class="qv-btn" data-qv-ask>${esc(t('qv_ask'))}</button></div>`}
  ${!shopOn() ? '' : `<a class="qv-walk" href="studio-${esc(a.id)}.html?work=${ck}">${esc(t('qv_walk'))}</a>`}
</aside>
<button type="button" class="qv-x" data-close aria-label="${esc(t('close'))}">✕</button>`;
  };
  const go = dir => {
    const to = pos + dir; if (to < 0 || to >= seq.length) return;
    pos = to; phase('step', 500); draw();
    (d.querySelector(`.qv-${dir < 0 ? 'prev' : 'next'}:not([disabled])`) || d.querySelector('.qv-x')).focus();
  };
  d.onclick = e => {
    if (e.target.closest('[data-close]') || e.target === d || e.target.matches('[data-qv-stage]')) { d.close(); return; }   // X, or the empty space around the picture
    const g = e.target.closest('[data-qv-go]'); if (g) return go(+g.dataset.qvGo);
    if (e.target.closest('[data-qv-ask]')) { const [cid, ck] = seq[pos], sta = workStatus(artistById(cid).pieces[ck]); openInquiry(cid, ck, sta === 'sold' ? 'id_pre_sold' : sta === 'reserved' ? 'id_pre_res' : ''); }
  };
  d.onkeydown = e => {
    if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  };
  quickRedraw = () => { if (d.open) draw(); };
  phase('in', 1300); draw();
  d.showModal();
  d.querySelector('.qv-x').focus();
}
onLang(() => { if (quickRedraw) quickRedraw(); });

function dlgShell(title, inner) {
  return `<div class="cdlg-h"><h2>${title}</h2><button type="button" class="cdlg-x" data-close aria-label="${esc(t('close'))}">✕</button></div>${inner}`;
}
function showDone(d, res, to) {
  const ok = res.mode === 'sent', fail = res.mode === 'fail';
  d.innerHTML = dlgShell(esc(t(ok ? 'done_sent' : fail ? 'news_fail' : 'done_mail')),
    `<div class="cdlg-done" role="status"><p class="intro">${esc(t(ok ? 'done_sent_p' : fail ? 'news_fail' : 'done_mail_p'))}</p>` +
    (ok ? '' : `<p class="note">${esc(t('to_label'))}: ${esc(to)}</p><pre id="done-pre">${esc(res.body)}</pre>`) +
    `<div class="act">${ok ? '' : `<button type="button" class="btn" data-copy>${esc(t('copy_msg'))}</button>`}<button type="button" class="btn ghost" data-close>${esc(t('close'))}</button></div></div>`);
  const pre = d.querySelector('#done-pre');
  d.querySelector('[data-copy]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(pre.textContent); toast(t('copied')); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(t('copy_fail')); }
  });
  d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => d.close()));
}
function wireForm(d, onSubmit) {
  d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => d.close()));
  const form = d.querySelector('form');
  if (CONFIG.endpoint && CONFIG.turnstileSiteKey) mountTurnstile(form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.querySelector('.hp input')?.value) return;          // honeypot
    if (CONFIG.endpoint && CONFIG.turnstileSiteKey && !new FormData(form).get('cf-turnstile-response')) { toast(t('captcha_wait')); return; }
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try { await onSubmit(Object.fromEntries(new FormData(form))); } finally { btn.disabled = false; }
  });
}

/* optional CAPTCHA (Cloudflare Turnstile): loaded only when a site key is configured */
function mountTurnstile(form) {
  const holder = document.createElement('div'); holder.className = 'cf-holder'; form.querySelector('.act').before(holder);
  const draw = () => window.turnstile && window.turnstile.render(holder, {sitekey: CONFIG.turnstileSiteKey});
  if (window.turnstile) { draw(); return; }
  if (!document.getElementById('cf-ts')) { const s = document.createElement('script'); s.id = 'cf-ts'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = draw; document.head.appendChild(s); }
  else document.getElementById('cf-ts').addEventListener('load', draw);
}

const demoNote = cls => CONFIG.demo ? `<p class="${cls} demo-note">${esc(t('demo_note'))}</p>` : '';

/* "ขอมีตึก" — join request */
function openJoin() {
  const d = mountDialog('dlg-join');
  const opts = [...new Set(ARTISTS.map(a => a.disc))].map(x => `<option value="${esc(x)}">${esc(LANG === 'en' ? (DISC_EN[x] || x) : x)}</option>`).join('') + `<option value="other">${esc(t('jd_other'))}</option>`;
  d.innerHTML = dlgShell(t('jd_title'),
    `<form><p class="intro">${esc(t('jd_intro'))}</p>
      <div class="row"><label>${esc(t('jd_name'))}<input name="name" required maxlength="80" autocomplete="name"></label><label>${esc(t('jd_email'))}<input name="email" type="email" required maxlength="120" autocomplete="email"></label></div>
      <label>${esc(t('jd_disc'))}<select name="discipline">${opts}</select></label>
      <label>${esc(t('jd_link'))}<input name="link" type="url" placeholder="https://" maxlength="200"></label>
      <label>${esc(t('jd_msg'))}<textarea name="message" required maxlength="1500"></textarea></label>
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      ${demoNote('note')}<p class="note">${t('consent_form')}</p>
      <div class="act"><button class="btn" type="submit">${esc(t('jd_send'))}</button><button class="btn ghost" type="button" data-close>${esc(t('jd_cancel'))}</button></div>
      ${CONFIG.endpoint ? '' : `<p class="note">${esc(t('note_mailto'))}</p>`}</form>`);
  wireForm(d, async f => {
    const res = await deliver('join', CONFIG.contact, t('jd_subject', {n: f.name}), {name: f.name, email: f.email, discipline: d.querySelector('select').selectedOptions[0].textContent, link: f.link, message: f.message, captcha: f['cf-turnstile-response']});
    showDone(d, res, CONFIG.contact);
  });
  if (!d.open) d.showModal();
}

/* "ซื้อตรงจากศิลปิน" — inquiry about one piece */
function openInquiry(id, k, pre) {
  const a = artistById(id); if (!a) return;
  const p = a.pieces[k], d = mountDialog('dlg-inquiry');
  d.innerHTML = dlgShell(t('id_title', {a: esc(nameL(a))}),
    `<form><p class="intro">${esc(t('id_intro'))}</p>
      <div class="row"><label>${esc(t('id_name'))}<input name="name" required maxlength="80" autocomplete="name"></label><label>${esc(t('id_email'))}<input name="email" type="email" required maxlength="120" autocomplete="email"></label></div>
      <label>${esc(t('id_msg'))}<textarea name="message" required maxlength="1500">${esc(t(pre || 'id_prefill', {t: pk(p, 't'), p: usd(p.p)}))}</textarea></label>
      <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      ${demoNote('note')}<p class="note">${t('consent_form')}</p>
      <div class="act"><button class="btn pk" type="submit">${esc(t('id_send'))}</button><button class="btn ghost" type="button" data-close>${esc(t('jd_cancel'))}</button></div>
      ${CONFIG.endpoint ? '' : `<p class="note">${esc(t('note_mailto'))}</p>`}</form>`);
  wireForm(d, async f => {
    const res = await deliver('inquiry', a.email, t('id_subject', {t: pk(p, 't')}), {artist: nameL(a), work: pk(p, 't'), price: usd(p.p), name: f.name, email: f.email, message: f.message, captcha: f['cf-turnstile-response']});
    showDone(d, res, a.email);
  });
  if (!d.open) d.showModal();
}

/* newsletter */
async function subscribeNews(form) {
  if (form.querySelector('.hp-n')?.value) return;          // honeypot: bots fill every field
  const email = form.querySelector('input[type=email]').value.trim(); if (!email) return;
  if (CONFIG.endpoint) {
    const res = await deliver('newsletter', CONFIG.contact, 'newsletter', {email});
    toast(t(res.mode === 'sent' ? 'news_sent' : 'news_fail')); if (res.mode === 'sent') form.reset(); return;
  }
  try { const list = JSON.parse(localStorage.getItem('circles-news') || '[]'); if (!list.includes(email)) list.push(email); localStorage.setItem('circles-news', JSON.stringify(list)); } catch (e) {}
  toast(t('news_saved')); form.reset();
}

/* ---------- nav wiring: language + mobile menu ---------- */
/* Support button: a real link only when CONFIG.donate is an https:// URL, otherwise a disabled "Coming soon" button (never a dead link) */
function wireDonate() {
  const el = $('#donate-btn'); if (!el) return;
  let ok = false; try { ok = new URL(CONFIG.donate).protocol === 'https:'; } catch (e) {}
  if (!ok) return;
  $('#support')?.classList.remove('draft-only');
  const a = document.createElement('a');
  a.id = el.id; a.className = 'btn pk';
  a.href = CONFIG.donate; a.target = '_blank'; a.rel = 'noopener'; a.dataset.t = 'don_btn';
  el.replaceWith(a);
}

/* ---------- bottom navigation (phones, narrower than 768px): City · Art · Artists · Language ----------
   Injected by wireNav() on every page that loads this file; shown by the media query in circles.css (.bn-). On the home page the links are
   plain #city / #featured / #map anchors (the page's own smooth scroll and map-view code handle them); on other pages they go to index.html#… */
const BN_ICON = {
  city: '<path d="M2 21h20M4 21V10h5v11M9 21V3h7v18M16 21v-8h4v8M12 7h1.5M12 11h1.5M12 15h1.5"/>',
  art: '<path d="M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6"/><circle cx="16.5" cy="8.5" r="1.4"/>',
  artists: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 21c0-4.6 3.4-7 7.5-7s7.5 2.4 7.5 7z"/>',
  lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.4 3.2 3.4 14.8 0 18M12 3c-3.4 3.2-3.4 14.8 0 18"/>',
};
function mountBnav() {
  if (document.getElementById('bnav')) return;
  const home = /(^|\/)(index\.html)?$/.test(location.pathname), at = h => (home ? '' : 'index.html') + h;
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${BN_ICON[k]}</svg>`;
  const nav = document.createElement('div'); nav.id = 'bnav'; nav.className = 'bnav'; nav.setAttribute('role', 'navigation');   // not a <nav>: every page styles a bare nav{} as its top menu
  nav.innerHTML = [['city', '#city'], ['art', '#featured'], ['artists', '#map']].map(([k, h]) => `<a class="bn" data-bn="${k}" href="${at(h)}">${svg(k)}<b class="bn-l"></b></a>`).join('')
    + `<button type="button" class="bn bn-lang" id="bn-lang">${svg('lang')}<span class="bn-codes" aria-hidden="true">${LOCALES.map(l => `<i data-l="${l}">${l.toUpperCase()}</i>`).join('')}</span></button>`;
  document.body.appendChild(nav); document.documentElement.classList.add('has-bnav');
  const refresh = () => {
    nav.setAttribute('aria-label', t('bn_aria'));
    nav.querySelectorAll('.bn[data-bn]').forEach(a => { const l = a.querySelector('.bn-l'); l.textContent = t('bn_' + a.dataset.bn); l.lang = LOCALE; });
    const lb = nav.querySelector('#bn-lang');
    lb.setAttribute('aria-label', `${t('bn_lang')}: ${LOCALE_NAME[LOCALE]} → ${LOCALE_NAME[nextLocale()]}`);
    lb.querySelectorAll('i').forEach(i => i.classList.toggle('on', i.dataset.l === LOCALE));
  };
  onLang(refresh); refresh();
  nav.querySelector('#bn-lang').addEventListener('click', () => setLang(nextLocale()));
  /* which button is lit: on the home page it follows the section on screen, on the other pages it follows the kind of page */
  const lit = k => nav.querySelectorAll('.bn[data-bn]').forEach(a => { if (a.dataset.bn === k) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  if (home) {
    let q = 0;
    const spy = () => {
      q = 0; const vh = innerHeight, on = id => { const el = document.getElementById(id); if (!el) return false; const r = el.getBoundingClientRect(); return r.top < vh * .55 && r.bottom > vh * .45; };
      const mapOn = (document.getElementById('map') || {hidden: true}).hidden === false;
      lit(on('city') ? (mapOn ? 'artists' : 'city') : on('featured') ? 'art' : '');
    };
    const soon = () => { if (!q) q = requestAnimationFrame(spy); };
    addEventListener('scroll', soon, {passive: true}); addEventListener('resize', soon); addEventListener('hashchange', soon);
    document.addEventListener('click', () => setTimeout(soon, 80)); spy();
  } else {
    const f = location.pathname.split('/').pop();
    lit(/^(studio|profile)-/.test(f) || f === 'cutaway.html' || f === 'profile.html' ? 'artists' : /^buy/.test(f) ? 'art' : '');
  }
  /* an on-screen keyboard would push the bar over the form: hide it while a text field has focus */
  const typing = e => e.target && e.target.matches && e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,select');
  addEventListener('focusin', e => { if (typing(e)) document.documentElement.classList.add('bn-kbd'); });
  addEventListener('focusout', () => document.documentElement.classList.remove('bn-kbd'));
}

function wireNav() {
  wireDonate();
  mountSkip();
  mountBnav();
  const lb = $('#lang'); if (lb) lb.addEventListener('click', () => setLang(nextLocale()));
  const mb = $('#menu-btn'), mn = $('#mnav'); if (!mb || !mn) return;
  const set = open => { mb.setAttribute('aria-expanded', open); mn.classList.toggle('open', open); mn.toggleAttribute('inert', !open); };
  set(false);
  mb.addEventListener('click', e => { e.stopPropagation(); set(mb.getAttribute('aria-expanded') !== 'true'); });
  mn.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  addEventListener('click', e => { if (!e.target.closest('#mnav')) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

/* ===== spin:begin ===== */
/* ================= 3D spinning logo (a thick coin, like a LEGO-game loading brick) =================
   The logo <svg>s already in the pages are swapped for a coin at load time, so no page markup changes:
   · nav logo        hover or tap: one spin with a bounce · it also flips when the language changes
   · home loader     hop, spin in the air, squash on landing (loops while the page loads)
   · home hero arch  floats; tap or click it: fast spin that slows, wobbles and settles
   · page changes    a black curtain with a spinning coin covers the jump between pages
   Everything stays still for visitors who ask for reduced motion. */
function coin3d(host, {front = '#orb', back = '#orb-s', depth = 7, n = 13, mode = ''} = {}) {
  const edges = Array.from({length: n}, (_, i) =>
    `<i class="c3-edge${i === 0 || i === n - 1 ? ' hi' : ''}" style="transform:translateZ(${(-depth + 2 * depth * i / (n - 1)).toFixed(2)}px)"></i>`).join('');
  host.classList.add('c3');
  if (mode) host.classList.add('c3-m' + mode);
  host.innerHTML = `<span class="c3-lift"><span class="c3-coin">${edges}` +
    `<span class="c3-face" style="transform:translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${front}"/></svg></span>` +
    `<span class="c3-face" style="transform:rotateY(180deg) translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${back}"/></svg></span></span></span>`;
  return host;
}
function coinPlay(host, cls) {
  if (reduce || !host) return;
  const c = host.querySelector('.c3-coin'); if (!c) return;
  c.classList.remove('c3-once', 'c3-settle'); void c.offsetWidth; c.classList.add(cls);
  c.addEventListener('animationend', () => c.classList.remove(cls), {once: true});
}
function coinSwap(svg, opts) {
  if (!svg || !document.getElementById('orb')) return null;
  const span = document.createElement('span');
  const cls = svg.getAttribute('class'); if (cls) span.className = cls;
  if (svg.id) span.id = svg.id;
  span.setAttribute('aria-hidden', 'true');
  svg.replaceWith(span);
  return coin3d(span, opts);
}
(function initCoins() {
  if (!document.getElementById('orb')) return;
  const navCoins = [];
  document.querySelectorAll('.brand > svg').forEach(svg => {
    const brand = svg.parentElement, c = coinSwap(svg, {front: '#orb-s', back: '#orb-s', depth: 2, n: 5});
    navCoins.push(c);
    brand.addEventListener('pointerenter', () => coinPlay(c, 'c3-once'));
    brand.addEventListener('click', () => coinPlay(c, 'c3-once'));
  });
  let first = true;
  onLang(() => { if (first) { first = false; return; } navCoins.forEach(c => coinPlay(c, 'c3-once')); });
  coinSwap(document.querySelector('svg.loader-orb'), {mode: 'hop'});
  coinSwap(document.querySelector('#curtain > svg'), {mode: 'spin', depth: 5, n: 9});
  const hero = coinSwap(document.querySelector('#arch-par > svg'), {mode: 'float', depth: 9, n: 15});
  if (hero) {
    hero.setAttribute('aria-hidden', 'false'); hero.setAttribute('role', 'button'); hero.tabIndex = 0;
    hero.setAttribute('aria-label', LANG === 'en' ? 'Spin the circles badge' : 'หมุนโลโก้ circles');
    const go = () => coinPlay(hero, 'c3-settle');
    hero.addEventListener('click', go);
    hero.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    setTimeout(go, 2600);                       // one spin by itself after the page has settled, so people learn it moves
  }
})();

/* page change curtain: covers the jump between pages with a spinning coin */
(function pageCurtain() {
  const html = document.documentElement, KEY = 'circles-pgc';
  const make = () => {
    const el = document.createElement('div'); el.className = 'pgc'; el.setAttribute('aria-hidden', 'true');
    el.appendChild(document.createElement('span'));
    document.body.appendChild(el);
    if (document.getElementById('orb')) coin3d(el.firstChild, {mode: 'spin', depth: 5, n: 9});
    return el;
  };
  // arriving: the page was opened through the curtain, so lift it off
  let arrived = false;
  try { arrived = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
  if (arrived && !reduce) {
    const el = make(); el.classList.add('on', 'still');
    html.classList.remove('pgc-in');
    void el.offsetWidth; el.classList.remove('still');
    setTimeout(() => { el.classList.add('up'); setTimeout(() => el.remove(), 450); }, 260);
  } else html.classList.remove('pgc-in');
  if (reduce) return;
  // leaving: catch plain clicks on links to other pages of this site
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page (anchors)
    e.preventDefault();
    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    const el = make(); void el.offsetWidth; el.classList.add('on');
    setTimeout(() => { location.href = url.href; }, 430);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.pgc').forEach(el => el.remove()); });
})();
/* ===== spin:end ===== */
/* ===== lite:start ===== */
/* pause the hero and the city while they are off screen: nothing animates where nobody looks */
(function pauseOffscreen() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('zz-off', !en.isIntersecting)), {rootMargin: '120px 0px'});
  const go = () => document.querySelectorAll('#hero, #city').forEach(el => io.observe(el));
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
})();
/* ===== lite:end ===== */
