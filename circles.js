/* circles.js — shared by index.html and cutaway.html: language (TH/EN), toast, ransom type, forms, mobile menu.
   Needs artists.js first. */

/* ---------- CONFIG: change these lines to go live ----------
   endpoint : a form-backend URL (Formspree, Getform, your own API). It receives JSON via POST.
              While it is empty, forms fall back to opening the visitor's email app (mailto:) and the newsletter is kept in this browser only.
   donate   : the https:// link of your support page (Ko-fi, Stripe Payment Link, ...). While it is empty the Support button on the home page shows "Coming soon" instead of a link.
   contact  : where "join" requests go. Artists' own addresses are in artists.js (they use the reserved .example domain until you replace them). */
const CONFIG = { endpoint: 'https://formspree.io/f/maeqeaqn', donate: '', contact: 'hello@circles.example', turnstileSiteKey: '0x4AAAAAAFRit2gggdNBXNji' };   // turnstileSiteKey: optional Cloudflare Turnstile key (free CAPTCHA). Only used together with `endpoint`; the endpoint must verify the token it receives as `captcha`.
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
  nav_city:'เมือง', nav_about:'เกี่ยวกับ', nav_map:'แผนที่', nav_join:'Join', menu_aria:'เมนู', lang_aria:'เปลี่ยนภาษา',
  wave:'คลื่นลูกใหม่', f_wave:'★ คลื่นลูกใหม่', fnote_wave:'ไฮไลต์ {n} ตึกคลื่นลูกใหม่ในแถบเมืองแล้ว',
  ld_top:'circles · เมืองของศิลปิน', ld_text:'กำลังสร้างเมือง…',
  legal_privacy:'นโยบายความเป็นส่วนตัว', legal_terms:'เงื่อนไขการใช้งาน',
  consent_form:'ส่งข้อความนี้แสดงว่าคุณรับทราบ<a href="privacy.html">นโยบายความเป็นส่วนตัว</a> ข้อมูลของคุณจะถูกส่งถึงผู้รับที่ระบุเท่านั้น',
  news_consent:'สมัครแล้วถือว่ารับ<a href="privacy.html">นโยบายความเป็นส่วนตัว</a> ยกเลิกได้ทุกเมื่อ',
  hero_hl1:'เมืองของศิลปิน', hero_hl2:'พื้นที่สำหรับงานศิลปะ', hero_hl3:'ที่ไม่ยอมเงียบ',
  hero_lead:'ตึกคอนกรีตหนึ่งหลัง ศิลปินหนึ่งคน ไม่มีหอศิลป์ ไม่มีคนกลาง เดินเข้าไป ดูงาน แล้วซื้อตรงจาก\u2060คน\u2060ทำ', hero_cta:'เข้าชมเมือง →',
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
  all_btn:'ดูทั้งหมด {n} ชิ้น', less_btn:'ดูเฉพาะชิ้นเด่น', feat_count:'แสดง {n} ชิ้น', card_aria:'{t} โดย{a} {p}',
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
  jd_subject:'ขอมีตึกใน circles — {n}', id_title:'คุยกับ<em>{a}</em>ตรง ๆ', id_intro:'ข้อความนี้ไปถึงศิลปินโดยตรง ไม่ผ่านใครคนกลาง', id_name:'ชื่อของคุณ', id_email:'อีเมลของคุณ', id_msg:'ข้อความ', id_send:'ส่งถึงศิลปิน →',
  id_prefill:'สวัสดี สนใจผลงาน “{t}” ({p}) อยากคุยเรื่องราคาและการจัดส่ง ขอบคุณ', id_subject:'สนใจผลงาน “{t}” — circles',
  done_mail:'เปิดแอปอีเมลของคุณแล้ว', done_mail_p:'กดส่งในแอปอีเมลเพื่อให้ข้อความถึงปลายทาง ถ้าไม่มีอะไรเปิดขึ้น ให้คัดลอกข้อความด้านล่างแล้วส่งเอง', done_sent:'ส่งเรียบร้อย', done_sent_p:'ขอบคุณ ข้อความถึงปลายทางแล้ว',
  copy_msg:'คัดลอกข้อความ', copied:'คัดลอกแล้ว', copy_fail:'คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง', to_label:'ถึง',
  news_saved:'บันทึกอีเมลไว้ในเครื่องนี้แล้ว (ยังไม่ได้เชื่อมระบบส่งจดหมาย)', news_sent:'สมัครรับข่าวเรียบร้อย', news_fail:'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง',
  captcha_wait:'รอให้การตรวจสอบเสร็จก่อนส่ง', note_mailto:'ตอนนี้ฟอร์มนี้ทำงานผ่านแอปอีเมลของคุณ', demo_note:'ข้อมูลศิลปินและอีเมลในเว็บนี้เป็นข้อมูลตัวอย่าง',
  /* cutaway */
  cw_est:'ก่อตั้ง {y}', cw_back:'← กลับไปเดินเมือง', cw_hint:'▼ ภาพตัดตึกทีละชั้น กดที่ผลงานเพื่อดูรายละเอียดเต็ม', cw_section:'SECTION A–A · ไม่มีลิฟต์ ใช้บันไดเท่านั้น',
  mus_name:'พิพิธภัณฑ์ของ{a}', mus_aria:'โถงแสดงภาพของ{a}', mus_prev:'← ภาพก่อน', mus_next:'เดินต่อ →', mus_more:'รายละเอียดและแนวคิด', mus_map:'ผังตึก', mus_hint:'▼ เดินดูภาพทีละชิ้น ใช้ลูกศร ← → บนคีย์บอร์ดได้ กดที่ภาพที่สว่างเพื่อดูรายละเอียดเต็ม',
  pf_h:'โปรไฟล์ของ{a}', pf_open:'รับงานสั่งทำ', pf_until:'· คิวว่างเดือน {m}', pf_cn:'แนวคิดของงาน{a}', pf_nw:'ผลงานในพิพิธภัณฑ์', pf_ns:'ขายแล้ว', pf_ny:'เริ่มทำงานศิลปะ', pf_tl:'เส้นทางที่ผ่านมา',
  pf_wh:'ผลงานในพิพิธภัณฑ์', pf_hover:'ชี้ที่ภาพเพื่อดูราคา', pf_all:'เดินเข้าไปดูทั้งหมด →', pf_sup1:'ชอบงานของ{a}?', pf_sup2:'ช่วยให้สร้างงานต่อ', pf_supn:'ทุกการสนับสนุนไปถึงศิลปินโดยตรง ช่วงเริ่มต้นนี้ Circles ยังไม่หักค่าธรรมเนียมจากศิลปิน', pf_supb:'สนับสนุน{a}', pf_soon:'เร็วๆ นี้',
  pf_walk:'เดินเข้าพิพิธภัณฑ์ →', pf_ask:'ถามศิลปิน', pf_ig:'Instagram', pf_share:'แชร์โปรไฟล์ ↗', pf_copy:'คัดลอกลิงก์', pf_copied:'คัดลอกลิงก์แล้ว', pf_marq:'ART NOT SORRY ★ วงกลมไม่มีวันจบ ★ CIRCLES ★ เดินเข้าพิพิธภัณฑ์ ★ ',
  mus_prof:'ดูโปรไฟล์ศิลปิน', title_pf:'โปรไฟล์ของ{a} — circles', desc_pf:'รู้จัก{a} ศิลปินสาขา{d} แนวคิดของงาน ผลงานที่ขายอยู่ และช่องทางสนับสนุนหรือสั่งทำงาน',
  fold_spot:'อ่านบทสัมภาษณ์ 3 ข้อ', fold_foot:'เมนู โซเชียล และจดหมายข่าว',
  by_back:'← กลับพิพิธภัณฑ์ของ{a}', by_marq:'ART NOT SORRY ★ ไม่มีคนกลาง ★ ซื้อตรงจากศิลปิน ★ CIRCLES NEVER END ★ ', by_one:'ชิ้นเดียวในโลก', by_free:'ยังว่าง', by_reply:'ตอบเร็วสุดภายใน {d} วัน', by_lak:'กีบ', by_thb:'บาท',
  by_detail:'รายละเอียดงาน', by_cert:'ใบรับรอง', by_how:'ซื้อยังไง', by_ship:'การส่งของ', by_to:'ส่งได้ที่', by_fee:'ค่าส่ง', by_days:'ถึงมือภายใน', by_dayu:'{d} วัน', by_break:'ถ้าแตกระหว่างทาง', by_ret:'คืนได้ {d} วัน',
  by_safe:'ปลอดภัยไหม?', by_safe_p:'เงินไปที่ศิลปินโดยตรง circles ไม่ได้รับเงินแทน ถ้ามีปัญหา ติดต่อ', by_since:'ทำงานศิลปะตั้งแต่ {y}', by_soldn:'ขายไปแล้ว {n} ชิ้น',
  by_ask_h:'ทัก{a} (ไม่ต้องออกจากหน้านี้)', by_country:'ส่งไปที่ไหน (ประเทศ / เมือง)', by_after:'ส่งแล้วจะเห็นข้อความ:', by_after_p:'“ส่งถึง{a}แล้ว จะตอบไปที่อีเมลของคุณภายใน {d} วัน”', by_after_p0:'“ส่งถึง{a}แล้ว คำตอบจะส่งไปที่อีเมลของคุณ”', by_ship_ask:'เรื่องการส่ง ถามศิลปินได้เลยในข้อความด้านล่าง', by_again:'ส่งอีกข้อความ',
  title_by:'{t} โดย{a} — circles', desc_by:'ซื้อ “{t}” ผลงาน{d}ของ{a} ราคา {p} ซื้อตรงจากศิลปิน ไม่มีคนกลาง',
  cw_meta:'{d} · ตั้งแต่ {y} · {c}', cw_view:'ดูรายละเอียด {t}', cw_prev:'← ตึกก่อนหน้า', cw_next:'ตึกถัดไป →', cw_roof:'{n} · STUDIO',
  lb_artist:'ศิลปิน', lb_year:'ปี', lb_medium:'วัสดุ', lb_size:'ขนาด', buy:'ซื้อตรงจาก{a} →', w_prev:'← ชิ้นก่อน', w_next:'ชิ้นถัดไป →', st_sold:"ขายแล้ว", st_res:"จองแล้ว", cw_look_sold:"ดูรายละเอียด →", d_sold:"ชิ้นนี้มีเจ้าของแล้ว", d_res:"มีคนจองไว้แล้ว ถ้าหลุดจอง ศิลปินจะแจ้งคนที่ต่อคิว", b_sold:"ถาม{a}เรื่องงานแบบนี้ →", b_res:"ขอต่อคิวชิ้นนี้ →", b_pay:"จ่ายเลย →", b_ask:"มีคำถาม? ทัก{a}ก่อน", p_how1:"กดจ่ายผ่านลิงก์ของศิลปิน", p_how2:"ศิลปินทักกลับเรื่องการจัดส่ง", p_how3:"เงินเข้าบัญชีศิลปินโดยตรง", d_paynote:"ลิงก์จ่ายเงินเป็นของศิลปินเอง circles ไม่ได้รับเงินแทน", id_pre_sold:"สวัสดี เห็นผลงาน “{t}” ที่ขายไปแล้ว ชอบมาก มีงานแบบนี้อีกไหม หรือรับทำงานใหม่ไหม ขอบคุณ", id_pre_res:"สวัสดี สนใจผลงาน “{t}” ({p}) ถ้าคนที่จองไว้ไม่ซื้อ ขอต่อคิวด้วย ขอบคุณ", v_city:"ดูแบบตึก", v_map:"ดูแบบแผนที่", v_aria:"เลือกมุมมองเมือง", cw_look:'ดูรายละเอียด · ซื้อ →', d_by:'โดย <b>{a}</b> · {d} · {c}', d_note:'ราคาที่ศิลปินตั้งเอง ไม่มีค่าคอมมิชชัน', d_story:'ที่มาของงานชิ้นนี้', cc_h:'แนวคิดของงาน', cc_origin:'ที่มา', cc_mat:'วัสดุ', cc_steps:'ขั้นตอนการทำ', cc_step:'ขั้นที่ {n}',
  cy_h:'วงกลมไม่มีปลายทาง ศิลปะก็เหมือนกัน', cy_p:'ชื่อ Circles มาจากความเชื่อว่างานศิลปะไม่มีวันจบ ศิลปินทำชิ้นหนึ่งเสร็จ ก็มีชิ้นต่อไปรออยู่เสมอ งานที่ถูกซื้อไปไม่ใช่จุดสิ้นสุด แต่เป็นแรงให้ทำต่อ และเมืองนี้ก็วนไปแบบนั้นเรื่อย ๆ', cy_1:'วาด', cy_2:'โชว์ในตึก', cy_3:'มีคนซื้อ', cy_4:'วาดต่อ', cy_aria:'วงจร 4 ขั้น: วาด โชว์ในตึก มีคนซื้อ แล้ววนกลับไปวาดต่อ',
  sup_h:'สนับสนุน Circles', sup_p:'ตอนนี้ศิลปินรับเงินเต็ม ไม่มีค่าธรรมเนียม เว็บอยู่ได้ด้วยเงินสนับสนุน ถ้ามีค่าธรรมเนียมในอนาคต เราจะบอกล่วงหน้า', sup_where:'เงินสนับสนุนไปไหน', sup_r1:'ค่าเซิร์ฟเวอร์และโดเมน', sup_r2:'การดูแลและพัฒนาเว็บ', sup_r3:'กิจกรรมและพื้นที่ใหม่สำหรับศิลปิน', sup_note:'ตัวอย่าง: หมวดและสัดส่วนยังไม่ตกลง [__]% คือตัวเลขที่ยังไม่รู้ จะใส่เมื่อมีข้อมูลจริง', don_btn:'สนับสนุน →', don_soon:'เร็วๆ นี้', d_how1:'ส่งข้อความถึงศิลปิน', d_how2:'คุยเรื่องราคาและการจัดส่ง', d_how3:'จ่ายเงินให้ศิลปินโดยตรง',
  title_idx:'circles — เมืองของศิลปิน ซื้อตรงจากคนทำ', title_cw:'ตึกของ{a} — circles',
  desc_idx:'circles เมืองของศิลปิน ตึกคอนกรีตหนึ่งหลังคือศิลปินหนึ่งคน ไม่มีหอศิลป์ ไม่มีคนกลาง เดินเข้าไปดูงานแล้วซื้อตรงจาก\u2060คน\u2060ทำ',
  desc_cw:'เดินเข้าไปในตึกของ{a} ศิลปินสาขา{d} ดูผลงานทีละชั้น แล้วซื้อตรงจากศิลปิน',
  nf_h:'ตึกนี้ยังไม่ได้สร้าง', nf_p:'ไม่มีศิลปินคนนี้ในเมือง กลับไปเดินดูตึกที่มีอยู่',
  mq:['ศิลปินไม่มีกฎ','BUY ART','ซื้อตรงจากคนทำ','NO MIDDLEMAN','เมืองของศิลปิน','ART NOT SORRY'],
},
en: {
  nav_city:'City', nav_about:'About', nav_map:'Map', nav_join:'Join', menu_aria:'Menu', lang_aria:'Switch language',
  wave:'NEW WAVE', f_wave:'★ New wave', fnote_wave:'Highlighted {n} new-wave building(s) in the strip',
  ld_top:'circles · a city of artists', ld_text:'Building the city…',
  legal_privacy:'Privacy policy', legal_terms:'Terms of use',
  consent_form:'By sending this you accept the <a href="privacy.html">privacy policy</a>. Your details go only to the recipient named above.',
  news_consent:'By subscribing you accept the <a href="privacy.html">privacy policy</a>. Unsubscribe any time.',
  hero_hl1:'A city of artists', hero_hl2:'Room for art', hero_hl3:"that won't shut up",
  hero_lead:'One concrete building, one artist. No gallery, no middleman. Walk in, look at the work, then buy straight from the person who made it.', hero_cta:'Enter the city →',
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
  all_btn:'Show all {n} works', less_btn:'Featured only', feat_count:'Showing {n} works', card_aria:'{t} by {a}, {p}',
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
  jd_subject:'Building request for circles — {n}', id_title:'Talk to <em>{a}</em> directly', id_intro:'This message goes straight to the artist. Nobody in between.', id_name:'Your name', id_email:'Your email', id_msg:'Message', id_send:'Send to the artist →',
  id_prefill:"Hi, I'm interested in “{t}” ({p}). Could we talk about price and shipping? Thanks.", id_subject:'Interested in “{t}” — circles',
  done_mail:'Your email app is opening', done_mail_p:"Press send in your email app so the message reaches its destination. If nothing opened, copy the text below and send it yourself.", done_sent:'Sent', done_sent_p:'Thank you. The message has been delivered.',
  copy_msg:'Copy message', copied:'Copied', copy_fail:"Couldn't copy. Select the text and copy it yourself.", to_label:'To',
  news_saved:'Email saved in this browser only (no mailing system is connected yet)', news_sent:"You're subscribed", news_fail:"Couldn't send. Please try again.",
  captcha_wait:'Please wait for the verification to finish', note_mailto:'For now this form works through your email app', demo_note:'Artist details and emails on this site are sample data',
  cw_est:'Est. {y}', cw_back:'← Back to the city', cw_hint:'▼ The building cut open, floor by floor. Click a work for full details', cw_section:'SECTION A–A · NO LIFT, STAIRS ONLY',
  mus_name:"{a}'s museum", mus_aria:"{a}'s picture hall", mus_prev:'← Previous', mus_next:'Walk on →', mus_more:'Details & concept', mus_map:'Floor plan', mus_hint:'▼ Walk the hall one work at a time. Use the ← → keys. Click the lit work for full details',
  pf_h:"{a}'s profile", pf_open:'Taking commissions', pf_until:'· slot open in {m}', pf_cn:"{a}'s concept", pf_nw:'works in the museum', pf_ns:'sold', pf_ny:'making art since', pf_tl:'The road so far',
  pf_wh:'Works in the museum', pf_hover:'Point at a picture for the price', pf_all:'Walk in and see them all →', pf_sup1:"Like {a}'s work?", pf_sup2:'Help keep it going', pf_supn:'Every bit of support goes straight to the artist. For now Circles takes no fee from artists.', pf_supb:'Support {a}', pf_soon:'Coming soon',
  pf_walk:'Walk into the museum →', pf_ask:'Ask the artist', pf_ig:'Instagram', pf_share:'Share profile ↗', pf_copy:'Copy link', pf_copied:'Link copied', pf_marq:'ART NOT SORRY ★ CIRCLES NEVER END ★ CIRCLES ★ WALK INTO THE MUSEUM ★ ',
  mus_prof:'View artist profile', title_pf:"{a}'s profile — circles", desc_pf:"Meet {a}, {d} artist: the ideas behind the work, the pieces on sale, and ways to support or commission.",
  fold_spot:'Read the 3-question interview', fold_foot:'Menu, social & newsletter',
  by_back:"← Back to {a}'s museum", by_marq:'ART NOT SORRY ★ NO MIDDLEMAN ★ BUY DIRECT FROM THE ARTIST ★ CIRCLES NEVER END ★ ', by_one:'ONE OF A KIND', by_free:'Available', by_reply:'Usually replies within {d} days', by_lak:'LAK', by_thb:'THB',
  by_detail:'Details', by_cert:'Certificate', by_how:'How to buy', by_ship:'Shipping', by_to:'Ships to', by_fee:'Shipping fee', by_days:'Arrives within', by_dayu:'{d} days', by_break:'If it breaks in transit', by_ret:'returnable within {d} days',
  by_safe:'Is it safe?', by_safe_p:'The money goes straight to the artist; circles never holds it. If something goes wrong, contact', by_since:'Making art since {y}', by_soldn:'{n} sold',
  by_ask_h:'Message {a} (without leaving this page)', by_country:'Ship to (country / city)', by_after:'Once you send, you will see:', by_after_p:'“Sent to {a}. A reply will reach your email within {d} days.”', by_after_p0:'“Sent to {a}. The reply will come to your email.”', by_ship_ask:'Ask the artist about shipping in the message below.', by_again:'Send another message',
  title_by:'{t} by {a} — circles', desc_by:'Buy “{t}”, a {d} work by {a}, {p}. Direct from the artist, no middleman.',
  cw_meta:'{d} · since {y} · {c}', cw_view:'View details of {t}', cw_prev:'← Previous building', cw_next:'Next building →', cw_roof:'{n} · STUDIO',
  lb_artist:'Artist', lb_year:'Year', lb_medium:'Medium', lb_size:'Size', buy:'Buy direct from {a} →', w_prev:'← Previous work', w_next:'Next work →', st_sold:"SOLD", st_res:"ON HOLD", cw_look_sold:"View details →", d_sold:"This one has found a home.", d_res:"Someone has reserved it. If that falls through, the artist will tell whoever is next in line.", b_sold:"Ask {a} about similar work →", b_res:"Join the queue →", b_pay:"Pay now →", b_ask:"Questions? Message {a} first", p_how1:"Pay through the artist's own link", p_how2:"The artist gets in touch about delivery", p_how3:"The money goes straight to the artist", d_paynote:"The payment link belongs to the artist. circles never holds the money.", id_pre_sold:"Hi, I saw “{t}” has sold and I love it. Do you have similar work, or take commissions? Thanks.", id_pre_res:"Hi, I'm interested in “{t}” ({p}). If the reservation falls through, could I be next in line? Thanks.", v_city:"Buildings", v_map:"Map", v_aria:"Choose how to see the city", cw_look:'View & buy →', d_by:'by <b>{a}</b> · {d} · {c}', d_note:'Price set by the artist. No commission.', d_story:'The story behind it', cc_h:'Concept of the work', cc_origin:'Origin', cc_mat:'Materials', cc_steps:'How it was made', cc_step:'Step {n}',
  cy_h:'A circle has no end. Neither does art.', cy_p:'The name Circles comes from the belief that art is never finished. When an artist completes one piece, the next is already waiting. A sale is not an ending. It is what lets the artist keep going, and the city keeps turning that way.', cy_1:'Draw', cy_2:'Show in the building', cy_3:'Someone buys', cy_4:'Draw again', cy_aria:'A loop of 4 steps: draw, show in the building, someone buys, then back to drawing again',
  sup_h:'Support Circles', sup_p:'Right now artists keep the full amount, with no fees. The site runs on support. If we ever add a fee, we will tell you in advance.', sup_where:'Where the support goes', sup_r1:'Servers and domain', sup_r2:'Running and improving the site', sup_r3:'Events and new space for artists', sup_note:'Sample: the categories and shares are not final. [__]% marks a number we do not know yet and will fill in once we have real data.', don_btn:'Support →', don_soon:'Coming soon', d_how1:'Message the artist', d_how2:'Agree on price and shipping', d_how3:'Pay the artist directly',
  title_idx:'circles — a city of artists. Buy straight from the maker', title_cw:"{a}'s building — circles",
  desc_idx:'circles is a city of artists. One concrete building is one artist. No gallery, no middleman. Walk in, look at the work, buy straight from the maker.',
  desc_cw:"Walk into {a}'s building. {d} artist. See the work floor by floor, then buy direct from the artist.",
  nf_h:"This building doesn't exist yet", nf_p:'No artist by that name lives here. Go back and walk the buildings that do.',
  mq:['NO RULES FOR ARTISTS','BUY ART','BUY FROM THE MAKER','NO MIDDLEMAN','CITY OF ARTISTS','ART NOT SORRY'],
},
};

/* ---------- language ---------- */
let LANG = (() => {
  try {
    const q = new URLSearchParams(location.search).get('lang'); if (q === 'th' || q === 'en') return q;
    const s = localStorage.getItem('circles-lang'); if (s === 'th' || s === 'en') return s;
  } catch (e) {}
  return String((navigator.languages && navigator.languages[0]) || navigator.language || 'th').toLowerCase().startsWith('th') ? 'th' : 'en';
})();
const t = (k, v) => {
  let s = STR[LANG][k]; if (s === undefined) s = STR.th[k]; if (s === undefined) return k;
  if (v && typeof s === 'string') for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
};
const pk = (o, k) => (LANG === 'en' && o[k + 'En'] != null) ? o[k + 'En'] : o[k];
const nameL = a => pk(a, 'name'), discL = a => LANG === 'en' ? (DISC_EN[a.disc] || a.disc) : a.disc, cityL = a => LANG === 'en' ? (CITY_EN[a.city] || a.city) : a.city;
const fmtSize = p => LANG === 'en' ? p.s.replace('ซม.', 'cm').replace('สูง', 'H') : p.s;
const langHooks = [];
const onLang = fn => { langHooks.push(fn); };
function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-html]').forEach(el => { el.innerHTML = t(el.dataset.tHtml); });
  document.querySelectorAll('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
  document.querySelectorAll('[data-t-ph]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.tPh)); });
  const lb = $('#lang'); if (lb) { lb.textContent = LANG === 'th' ? 'EN' : 'TH'; lb.setAttribute('aria-label', lb.textContent + ' — ' + (LANG === 'th' ? 'English' : 'ภาษาไทย')); lb.setAttribute('lang', LANG === 'th' ? 'en' : 'th'); }
  const mb = $('#menu-btn'); if (mb) mb.setAttribute('aria-label', t('menu_aria'));
  langHooks.forEach(fn => fn());
}
function setLang(l) {
  LANG = l; try { localStorage.setItem('circles-lang', l); } catch (e) {}
  applyLang();
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

function mountDialog(id) {
  let d = document.getElementById(id);
  if (!d) { d = document.createElement('dialog'); d.id = id; d.className = 'cdlg'; document.body.appendChild(d); d.addEventListener('click', e => { if (e.target === d) d.close(); }); }
  return d;
}
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
      <p class="note">${t('consent_form')}</p>
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
      <p class="note">${t('consent_form')}</p>
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
  const a = document.createElement('a');
  a.id = el.id; a.className = 'btn pk';
  a.href = CONFIG.donate; a.target = '_blank'; a.rel = 'noopener'; a.dataset.t = 'don_btn';
  el.replaceWith(a);
}

function wireNav() {
  wireDonate();
  const lb = $('#lang'); if (lb) lb.addEventListener('click', () => setLang(LANG === 'th' ? 'en' : 'th'));
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
