/* manageStrings.js — the words of manage.html (login + artist dashboard). Only this page uses them, so they live here and not in STR of circles.js.
   th and en are complete. lo is a DRAFT (needs native review) and covers the login door and the main buttons; any key missing in lo falls back to Thai, like the rest of the site. */
import {useLang} from './i18n.jsx';

export const MS = {
  th: {
    tab_donations: 'การสนับสนุน',
    dn_h: 'แจ้งโอนจากผู้สนับสนุน',
    dn_none: 'ยังไม่มีใครแจ้งว่าสนับสนุน',
    dn_note: 'ตรวจยอดในแอปธนาคารก่อนกด "ยืนยัน" การสนับสนุนไม่เกี่ยวกับสถานะของงานใด ๆ เพราะที่นี่ไม่มีการขาย',
    dn_donor: 'ผู้สนับสนุน',
    dn_msg: 'ข้อความ',
    dn_for: 'เพื่อผลงาน “{t}”',
    dn_confirm: 'ยืนยัน ได้รับเงินแล้ว',
    dn_reject: 'ไม่ได้รับเงิน',
    dn_reject_sure: 'ยืนยัน? กดอีกครั้ง',
    dn_slip: 'ดูสลิป',
    dn_pending: 'รอตรวจ',
    dn_confirmed: 'ได้รับเงินแล้ว',
    dn_rejected: 'ปฏิเสธ',
    dn_slip_fail: 'เปิดสลิปไม่สำเร็จ',
    skip: 'ข้ามไปที่เนื้อหา',
    lg_kick: 'ประตูเหล็ก · เฉพาะศิลปิน', lg_title: 'เข้าตึก', lg_aria: 'เข้าตึก',
    lg_sub: 'ตึกนี้ไม่มีปุ่มสมัคร ศิลปินที่ได้รับเชิญเท่านั้น ใส่อีเมลที่เราเชิญไว้ แล้วเราจะส่งกุญแจ (ลิงก์) ไปให้',
    lg_email: 'อีเมล', lg_btn: 'ส่งกุญแจมา →', lg_sending: 'กำลังส่ง…', lg_stamp: 'ห้ามสมัครเอง',
    lg_sent_h: 'ส่งกุญแจแล้ว', lg_sent_p: 'เปิดอีเมลแล้วกดลิงก์ในนั้น ถ้าไม่เจอให้ดูในสแปม ลิงก์ใช้ได้ครั้งเดียว ถ้าอีเมลนี้ไม่ได้รับเชิญ จะไม่มีอะไรส่งไป',
    lg_again: 'ใช้อีเมลอื่น', lg_wait: 'ขอลิงก์บ่อยเกินไป รอสักครู่แล้วลองใหม่', lg_bad: 'อีเมลนี้ดูไม่ถูกต้อง', lg_net: 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง', lg_mail: 'ระบบส่งอีเมลของเว็บยังตั้งค่าไม่เสร็จ จึงส่งลิงก์เข้าให้คุณไม่ได้ แจ้งผู้ดูแลเว็บ',
    lg_nokey: 'ยังไม่ได้รับเชิญ?', lg_join: 'ขอมีตึก →', lg_setup: 'ระบบยังไม่ตั้งค่า: ยังไม่ได้ใส่ที่อยู่ฐานข้อมูล', lg_checking: 'กำลังตรวจกุญแจ…',
    lg_link_bad: 'กุญแจนี้ใช้ไม่ได้หรือหมดอายุแล้ว ขอกุญแจใหม่ด้านล่าง',
    
    
    
    
    
    
    
    
    
    sp_cta: 'เข้าไปในตึกของ{a} →',
    out: 'ออกจากระบบ', see_me: 'ดูตึกของฉันบนเว็บ', dash_hi: 'ตึกของ {a}', dash_kick: 'ห้องควบคุม',
    nb_h: 'ยังไม่มีตึกผูกกับอีเมลนี้', nb_p: 'คุณเข้าสู่ระบบได้แล้ว แต่เจ้าของเว็บยังไม่ได้ผูกตึกให้อีเมล {e} ติดต่อเจ้าของเว็บ แล้วกลับมาใหม่',
    hidden: 'ตึกของคุณยังไม่เปิดให้คนทั่วไปเห็น รอเจ้าของเว็บอนุมัติ', demo: 'ตึกตัวอย่าง',
    tab_profile: 'โปรไฟล์', tab_works: 'งานของฉัน', tab_pay: 'รับเงิน', save: 'บันทึก', saving: 'กำลังบันทึก…', saved: 'บันทึกแล้ว (ขึ้นบนเว็บภายในประมาณ 30 นาที)', retry: 'บันทึกไม่สำเร็จ ลองใหม่',
    loading: 'กำลังโหลด…', load_fail: 'โหลดข้อมูลไม่สำเร็จ', reload: 'ลองใหม่',
    f_name: 'ชื่อ (ไทย)', f_name_en: 'ชื่อ (อังกฤษ)', f_name_lo: 'ชื่อ (ลาว)', f_disc: 'แนวงาน', f_city: 'เมือง', f_since: 'วาดมาตั้งแต่ปี',
    f_tagline: 'ประโยคเดียวบอกตัวตน', f_tagline_en: 'ประโยคเดียว (อังกฤษ)', f_concept: 'คอนเซ็ปต์', f_concept_en: 'คอนเซ็ปต์ (อังกฤษ)',
    f_bio: 'ประวัติ', f_bio_en: 'ประวัติ (อังกฤษ)', f_bio_lo: 'ประวัติ (ลาว)', f_instagram: 'ลิงก์ Instagram', 
    h_photo: 'รูปโปรไฟล์', photo_pick: 'เลือกรูปโปรไฟล์', photo_remove: 'เอารูปออก',
    h_look: 'หน้าตาตึกของคุณ', look_note: 'ตึกของคุณในเมืองจะเปลี่ยนตามที่เลือกนี้ หลังเว็บถูกสร้างใหม่',
    f_kind: 'ทรงตึก', f_scale: 'ขนาดตึก', f_colors: 'สี 3 สีของตึก', f_color: 'สีที่',
    kind_arch: 'โค้ง', kind_lens: 'เลนส์', kind_tower: 'หอคอย', kind_vase: 'แจกัน', kind_shell: 'เปลือกหอย', kind_collage: 'คอลลาจ', kind_dome: 'โดม', kind_pixel: 'พิกเซล', kind_spore: 'สปอร์', kind_stack: 'ซ้อนชั้น',
    h_timeline: 'ไทม์ไลน์ของคุณ', tl_note: 'เหตุการณ์สำคัญในเส้นทางศิลปะของคุณ ใส่ได้ไม่เกิน 12 แถว เว้นว่างได้', f_tl_t: 'เกิดอะไรขึ้น (ไทย)', f_tl_en: 'เกิดอะไรขึ้น (อังกฤษ)', tl_add: '+ เพิ่มแถว', tl_del: 'ลบแถวนี้',
    er_scale: 'ขนาดต้องอยู่ระหว่าง 0.6 ถึง 1.5', er_too_many: 'มีได้ไม่เกิน 12 แถว',
    h_names: 'ชื่อ', h_about: 'เกี่ยวกับคุณ', h_links: 'ลิงก์',
    w_add: '+ เพิ่มงาน', w_none: 'ยังไม่มีงาน เพิ่มชิ้นแรกเลย (ตึกของคุณจะขึ้นบนเว็บเมื่อมีงานที่มีรูปอย่างน้อย 1 ชิ้น)', w_edit: 'แก้', w_del: 'ลบ', w_del_sure: 'ลบจริงไหม? กดอีกครั้ง', w_cancel: 'ยกเลิก', w_new: 'งานใหม่', w_editing: 'แก้งาน',
    w_limit: 'มีงานครบ 40 ชิ้นแล้ว',
    rules_note: 'อัปโหลดได้เฉพาะงานที่คุณสร้างเอง หรือที่ได้รับอนุญาตแล้ว ห้ามใช้ภาพของคนอื่น ภาพที่มีคนอื่นอยู่ในภาพโดยไม่ยินยอม หรือเนื้อหาที่ล่วงละเมิดผู้อื่น หากได้รับคำร้องเรียน ผู้ดูแลอาจซ่อนงานชิ้นนั้นก่อนตรวจสอบ',
    own_check: 'ฉันยืนยันว่านี่คืองานของฉันเอง หรือฉันได้รับอนุญาตให้เผยแพร่', er_own: 'ต้องติ๊กก่อนบันทึก', w_hidden: 'ถูกซ่อนโดยผู้ดูแล (คนทั่วไปมองไม่เห็น) ติดต่อผู้ดูแลเพื่อตรวจสอบ',
    f_title: 'ชื่องาน (ไทย)', f_title_en: 'ชื่องาน (อังกฤษ)', f_title_lo: 'ชื่องาน (ลาว)', f_year: 'ปี', f_medium: 'วัสดุ', f_medium_en: 'วัสดุ (อังกฤษ)', f_medium_lo: 'วัสดุ (ลาว)',
    f_size: 'ขนาด', f_size_lo: 'ขนาด (ลาว)', f_ar: 'สัดส่วนภาพ เช่น 4/5', 
    f_quote: 'ประโยคสั้นๆ ของงาน', f_quote_en: 'ประโยคสั้นๆ (อังกฤษ)', f_quote_lo: 'ประโยคสั้นๆ (ลาว)',
    f_story: 'เรื่องเบื้องหลัง', f_story_en: 'เรื่องเบื้องหลัง (อังกฤษ)', f_story_lo: 'เรื่องเบื้องหลัง (ลาว)', h_wbasic: 'ข้อมูลหลัก', h_wtext: 'ข้อความ (ใส่หรือไม่ก็ได้)',
    h_wtell: 'ศิลปินเล่าเอง', tell_note: 'เขียนเป็นเสียงของคุณเอง (บุคคลที่หนึ่ง) circles จะแสดงตามที่เขียน ไม่แก้ไขและไม่ตีความแทน ประโยคแรกจะขึ้นใต้ภาพ ส่วนที่เหลืออยู่ในหน้าต่างผลงาน',
    f_say: 'งานนี้อยากบอกอะไร (ประโยคเดียว)', f_say_en: 'งานนี้อยากบอกอะไร (อังกฤษ)', f_say_lo: 'งานนี้อยากบอกอะไร (ลาว)', f_why: 'ที่มาของงาน', f_why_en: 'ที่มาของงาน (อังกฤษ)', f_why_lo: 'ที่มาของงาน (ลาว)', f_look: 'อยากให้ดูตรงไหน', f_look_en: 'อยากให้ดูตรงไหน (อังกฤษ)', f_look_lo: 'อยากให้ดูตรงไหน (ลาว)',
    h_wprocess: 'ที่มาของงาน (ไม่บังคับ)', process_note: 'ใส่ไอเดีย สเก็ตช์ และร่างของงานชิ้นนี้ เพื่อให้คนดูเห็นว่างานค่อย ๆ เกิดขึ้นอย่างไร ขั้นไหนไม่มี ปล่อยว่างได้ หน้าเว็บจะแสดงเป็นช่องว่างให้เอง', f_idea: 'ไอเดียตอนเริ่ม', f_idea_en: 'ไอเดียตอนเริ่ม (อังกฤษ)', f_idea_lo: 'ไอเดียตอนเริ่ม (ลาว)', f_sketch: 'เลือกรูปสเก็ตช์', f_draft: 'เลือกรูปร่าง', stage_remove: 'เอารูปนี้ออก', f_idea_on: 'วันที่ของไอเดีย (เช่น 2026-03)', f_sketch_on: 'วันที่ของสเก็ตช์', f_draft_on: 'วันที่ของร่าง', f_final_on: 'วันที่งานเสร็จ', er_stage_date: 'ใช้รูปแบบ ปี หรือ ปี-เดือน หรือ ปี-เดือน-วัน เช่น 2026-03',
    img_pick: 'เลือกรูป', img_change: 'เปลี่ยนรูป', img_up: 'กำลังอัปโหลด…', img_none: 'ยังไม่มีรูป', img_note: 'รูปจะถูกย่อให้พอดีเว็บก่อนส่งอัตโนมัติ (JPG, PNG, WebP)',
    p_h: 'รับเงินผ่าน LAO QR', p_note: 'circles ไม่ถือเงินของใคร ลูกค้าโอนเข้าบัญชีของคุณโดยตรง ใส่รูป QR ที่ export จากแอปธนาคารของคุณเอง',
    p_warn: 'ก่อนเปิดขาย: ตรวจกับธนาคารว่าบัญชีของคุณเปิดรับ LAO QR แล้ว และเช็กเรื่องการจดทะเบียนธุรกิจหรือภาษีสำหรับการขายงานศิลปะกับหน่วยงานในลาว เว็บนี้ไม่ใช่คำปรึกษาทางกฎหมายหรือภาษี',
    p_bank: 'ธนาคาร', p_acc_name: 'ชื่อบัญชี', p_acc_no: 'เลขบัญชี', p_qr: 'รูป LAO QR', p_qr_none: 'ยังไม่มี QR', p_qr_help: 'ใช้รูป QR “รับเงิน” จากแอปธนาคารของคุณ (เช่น BCEL One หรือแอป LDB) ถ่ายหน้าจอหรือบันทึกรูป QR แล้วอัปโหลดตรงนี้ คนที่อยากสนับสนุนจะสแกนแล้วโอนเข้าบัญชีคุณโดยตรง หลังสแกนให้ตรวจว่าชื่อบัญชีที่ขึ้นเป็นของคุณ', p_email: 'อีเมลรับข้อความจากลูกค้า',
    p_email_note: 'อีเมลนี้ไม่แสดงต่อสาธารณะ', p_public: 'ชื่อบัญชี เลขบัญชี และ QR จะแสดงบนหน้าซื้อให้ลูกค้าเห็น',
    er_required: 'ต้องกรอก', er_year: 'ใส่ปี ค.ศ. 4 หลัก เช่น 2024', er_https: 'ต้องเป็นลิงก์ https:// ที่ใช้ได้จริง', er_ratio: 'ใส่เช่น 4/5 หรือ 1/1',
    er_account: 'ใส่ตัวเลขเท่านั้น (เว้นวรรคหรือขีดได้)', er_email: 'อีเมลนี้ดูไม่ถูกต้อง', er_fix: 'มีช่องที่ต้องแก้ ดูตัวอักษรสีแดง',
    er_bad_type: 'ใช้ไฟล์ JPG, PNG หรือ WebP เท่านั้น', er_too_big: 'ไฟล์ใหญ่เกินไป', er_bad_image: 'เปิดรูปนี้ไม่ได้', er_upload: 'อัปโหลดไม่สำเร็จ ลองใหม่',
  },
  en: {
    tab_donations: 'Donations',
    dn_h: 'Donation notices from supporters',
    dn_none: 'No one has told you they donated yet',
    dn_note: 'Check the amount in your bank app before you press “Confirm”. Donations have nothing to do with any work: nothing is sold here.',
    dn_donor: 'Donor',
    dn_msg: 'Message',
    dn_for: 'for the work “{t}”',
    dn_confirm: 'Confirm: money received',
    dn_reject: 'Not received',
    dn_reject_sure: 'Sure? Press again',
    dn_slip: 'See slip',
    dn_pending: 'To check',
    dn_confirmed: 'Received',
    dn_rejected: 'Rejected',
    dn_slip_fail: 'Could not open the slip',
    skip: 'Skip to content',
    lg_kick: 'STEEL DOOR · ARTISTS ONLY', lg_title: 'LET ME IN', lg_aria: 'Let me in',
    lg_sub: 'There is no sign-up button. Invited artists only. Type the e-mail we invited and we will send you a key (a link).',
    lg_email: 'E-mail', lg_btn: 'SEND THE KEY →', lg_sending: 'SENDING…', lg_stamp: 'NO SELF SIGN-UP',
    lg_sent_h: 'Key sent', lg_sent_p: 'Open your e-mail and press the link. Check spam. The link works once. If this address was not invited, nothing is sent.',
    lg_again: 'Use another e-mail', lg_wait: 'Too many tries. Wait a minute and try again.', lg_bad: 'That e-mail does not look right.', lg_net: 'Could not send. Try again.', lg_mail: 'The site’s e-mail sender is not set up yet, so the sign-in link could not be sent. Please tell the site owner.',
    lg_nokey: 'Not invited yet?', lg_join: 'Ask for a building →', lg_setup: 'Not set up: the database address is missing.', lg_checking: 'Checking the key…',
    lg_link_bad: 'This key is broken or expired. Ask for a new one below.',
    
    
    
    
    
    
    
    
    
    sp_cta: "Enter {a}'s building →",
    out: 'Sign out', see_me: 'See my building', dash_hi: "{a}'s building", dash_kick: 'CONTROL ROOM',
    nb_h: 'No building is linked to this e-mail', nb_p: 'You are signed in, but the site owner has not linked a building to {e} yet. Contact the owner, then come back.',
    hidden: 'Your building is hidden from visitors until the site owner approves it.', demo: 'Sample building',
    tab_profile: 'Profile', tab_works: 'My works', tab_pay: 'Get paid', save: 'Save', saving: 'Saving…', saved: 'Saved (shows on the site within about 30 minutes)', retry: 'Could not save. Try again.',
    loading: 'Loading…', load_fail: 'Could not load your data', reload: 'Try again',
    f_name: 'Name (Thai)', f_name_en: 'Name (English)', f_name_lo: 'Name (Lao)', f_disc: 'Discipline', f_city: 'City', f_since: 'Making art since',
    f_tagline: 'One line about you', f_tagline_en: 'One line (English)', f_concept: 'Concept', f_concept_en: 'Concept (English)',
    f_bio: 'Bio', f_bio_en: 'Bio (English)', f_bio_lo: 'Bio (Lao)', f_instagram: 'Instagram link', 
    h_photo: 'Profile photo', photo_pick: 'Choose a profile photo', photo_remove: 'Remove photo',
    h_look: 'How your building looks', look_note: 'Your building in the city follows these choices after the site is rebuilt.',
    f_kind: 'Building shape', f_scale: 'Building size', f_colors: 'The building\'s 3 colours', f_color: 'Colour',
    kind_arch: 'Arch', kind_lens: 'Lens', kind_tower: 'Tower', kind_vase: 'Vase', kind_shell: 'Shell', kind_collage: 'Collage', kind_dome: 'Dome', kind_pixel: 'Pixel', kind_spore: 'Spore', kind_stack: 'Stack',
    h_timeline: 'Your timeline', tl_note: 'The milestones of your art path. Up to 12 rows; you may leave it empty.', f_tl_t: 'What happened (Thai)', f_tl_en: 'What happened (English)', tl_add: '+ Add a row', tl_del: 'Delete this row',
    er_scale: 'Size must be between 0.6 and 1.5', er_too_many: 'At most 12 rows',
    h_names: 'Names', h_about: 'About you', h_links: 'Links',
    w_add: '+ Add a work', w_none: 'No works yet. Add the first one. (Your building shows on the site once it has at least one work with a picture.)', w_edit: 'Edit', w_del: 'Delete', w_del_sure: 'Really delete? Press again', w_cancel: 'Cancel', w_new: 'New work', w_editing: 'Edit work',
    w_limit: 'You already have 40 works',
    rules_note: 'Upload only work you made yourself or have permission to show. No one else’s pictures, no photos of people who did not agree, nothing that attacks others. If someone complains, an admin may hide the work while it is checked.',
    own_check: 'I confirm this is my own work, or I have permission to publish it', er_own: 'Tick this before saving', w_hidden: 'Hidden by an admin (visitors cannot see it). Contact the admin to have it checked.',
    f_title: 'Title (Thai)', f_title_en: 'Title (English)', f_title_lo: 'Title (Lao)', f_year: 'Year', f_medium: 'Medium', f_medium_en: 'Medium (English)', f_medium_lo: 'Medium (Lao)',
    f_size: 'Size', f_size_lo: 'Size (Lao)', f_ar: 'Picture ratio, e.g. 4/5', 
    f_quote: 'A short line about the work', f_quote_en: 'Short line (English)', f_quote_lo: 'Short line (Lao)',
    f_story: 'The story behind it', f_story_en: 'Story (English)', f_story_lo: 'Story (Lao)', h_wbasic: 'The basics', h_wtext: 'Words (optional)',
    h_wtell: 'In your own words', tell_note: 'Write in your own voice (first person). circles shows it exactly as written and never edits or interprets it. The first sentence appears under the picture; the rest is in the work window.',
    f_say: 'What this work says (one sentence)', f_say_en: 'What this work says (English)', f_say_lo: 'What this work says (Lao)', f_why: 'Where it came from', f_why_en: 'Where it came from (English)', f_why_lo: 'Where it came from (Lao)', f_look: 'Where to look', f_look_en: 'Where to look (English)', f_look_lo: 'Where to look (Lao)',
    h_wprocess: 'How it was made (optional)', process_note: 'Add the idea, sketch and draft of this work so visitors can see how it grew. Leave a stage empty if you have nothing for it: the site shows an empty window for it.', f_idea: 'The idea, at the start', f_idea_en: 'The idea (English)', f_idea_lo: 'The idea (Lao)', f_sketch: 'Choose a sketch picture', f_draft: 'Choose a draft picture', stage_remove: 'Remove this picture', f_idea_on: 'When the idea came (e.g. 2026-03)', f_sketch_on: 'When the sketch was made', f_draft_on: 'When the draft was made', f_final_on: 'When the work was finished', er_stage_date: 'Use a year, year-month or year-month-day, like 2026-03',
    img_pick: 'Choose a picture', img_change: 'Change picture', img_up: 'Uploading…', img_none: 'No picture yet', img_note: 'The picture is shrunk to fit the site before it is sent (JPG, PNG, WebP)',
    p_h: 'Get paid with LAO QR', p_note: 'circles never holds anyone’s money. Buyers pay straight into your account. Add the QR picture you export from your own bank app.',
    p_warn: 'Before you sell: check with your bank that your account accepts LAO QR, and check business registration and tax rules for selling art with the authorities in Laos. This site is not legal or tax advice.',
    p_bank: 'Bank', p_acc_name: 'Account name', p_acc_no: 'Account number', p_qr: 'LAO QR picture', p_qr_none: 'No QR yet', p_qr_help: 'Use the “receive money” QR from your bank app (for example BCEL One or the LDB app). Take a screenshot or save the QR image and upload it here. Supporters scan it and pay straight into your account. After scanning, check that the account name shown is yours.', p_email: 'E-mail for messages from buyers',
    p_email_note: 'This e-mail is never shown publicly', p_public: 'Account name, account number and QR are shown to buyers on the buy page.',
    er_required: 'Required', er_year: 'A 4-digit year, e.g. 2024', er_https: 'Must be a working https:// link', er_ratio: 'Like 4/5 or 1/1',
    er_account: 'Digits only (spaces or dashes are fine)', er_email: 'That e-mail does not look right', er_fix: 'Some fields need fixing, see the red text',
    er_bad_type: 'Use a JPG, PNG or WebP file', er_too_big: 'The file is too big', er_bad_image: 'Could not open this picture', er_upload: 'Upload failed. Try again.',
  },
  lo: {   // DRAFT lo: needs native review. Anything missing here shows in Thai.
    h_wtell: 'ສິລະປິນເລົ່າເອງ', tell_note: 'ຂຽນເປັນສຽງຂອງທ່ານເອງ (ບຸກຄົນທີໜຶ່ງ) circles ຈະສະແດງຕາມທີ່ຂຽນ ບໍ່ແກ້ໄຂ ແລະ ບໍ່ຕີຄວາມແທນ ປະໂຫຍກທຳອິດຈະຢູ່ໃຕ້ຮູບ ສ່ວນທີ່ເຫຼືອຢູ່ໃນໜ້າຕ່າງຜົນງານ',
    f_say: 'ຜົນງານນີ້ຢາກບອກຫຍັງ (ປະໂຫຍກດຽວ)', f_say_en: 'ຜົນງານນີ້ຢາກບອກຫຍັງ (ອັງກິດ)', f_say_lo: 'ຜົນງານນີ້ຢາກບອກຫຍັງ (ລາວ)', f_why: 'ທີ່ມາຂອງຜົນງານ', f_why_en: 'ທີ່ມາຂອງຜົນງານ (ອັງກິດ)', f_why_lo: 'ທີ່ມາຂອງຜົນງານ (ລາວ)', f_look: 'ຢາກໃຫ້ເບິ່ງຕົງໃດ', f_look_en: 'ຢາກໃຫ້ເບິ່ງຕົງໃດ (ອັງກິດ)', f_look_lo: 'ຢາກໃຫ້ເບິ່ງຕົງໃດ (ລາວ)',
    h_wprocess: 'ທີ່ມາຂອງຜົນງານ (ບໍ່ບັງຄັບ)', process_note: 'ໃສ່ແນວຄິດ ສະເກັດ ແລະ ຮ່າງຂອງຜົນງານຊິ້ນນີ້ ເພື່ອໃຫ້ຄົນເບິ່ງເຫັນວ່າຜົນງານຄ່ອຍໆເກີດຂຶ້ນແນວໃດ ຂັ້ນໃດບໍ່ມີກໍປ່ອຍຫວ່າງໄດ້', f_idea: 'ແນວຄິດຕອນເລີ່ມ', f_idea_en: 'ແນວຄິດ (ອັງກິດ)', f_idea_lo: 'ແນວຄິດ (ລາວ)', f_sketch: 'ເລືອກຮູບສະເກັດ', f_draft: 'ເລືອກຮູບຮ່າງ', stage_remove: 'ເອົາຮູບນີ້ອອກ', f_idea_on: 'ວັນທີຂອງແນວຄິດ (ເຊັ່ນ 2026-03)', f_sketch_on: 'ວັນທີຂອງສະເກັດ', f_draft_on: 'ວັນທີຂອງຮ່າງ', f_final_on: 'ວັນທີຜົນງານສຳເລັດ', er_stage_date: 'ໃຊ້ ປີ ຫຼື ປີ-ເດືອນ ຫຼື ປີ-ເດືອນ-ວັນ ເຊັ່ນ 2026-03',   // DRAFT lo: needs native review
    lg_kick: 'ປະຕູເຫຼັກ · ສະເພາະສິລະປິນ', lg_title: 'ເຂົ້າຕຶກ', lg_aria: 'ເຂົ້າຕຶກ',
    lg_sub: 'ບໍ່ມີປຸ່ມສະໝັກ ສະເພາະສິລະປິນທີ່ໄດ້ຮັບເຊີນ ໃສ່ອີເມວທີ່ພວກເຮົາເຊີນໄວ້ ແລ້ວພວກເຮົາຈະສົ່ງກະແຈ (ລິ້ງ) ໄປໃຫ້',
    lg_email: 'ອີເມວ', lg_btn: 'ສົ່ງກະແຈມາ →', lg_sending: 'ກຳລັງສົ່ງ…', lg_stamp: 'ຫ້າມສະໝັກເອງ',
    lg_sent_h: 'ສົ່ງກະແຈແລ້ວ', lg_again: 'ໃຊ້ອີເມວອື່ນ', lg_nokey: 'ຍັງບໍ່ໄດ້ຮັບເຊີນ?', lg_join: 'ຂໍມີຕຶກ →',
    
    p_qr_help: 'ໃຊ້ຮູບ QR “ຮັບເງິນ” ຈາກແອັບທະນາຄານຂອງທ່ານ (ເຊັ່ນ BCEL One ຫຼືແອັບ LDB) ຖ່າຍໜ້າຈໍ ຫຼືບັນທຶກຮູບ QR ແລ້ວອັບໂຫຼດບ່ອນນີ້ ຜູ້ທີ່ຢາກສະໜັບສະໜູນຈະສະແກນ ແລ້ວໂອນເຂົ້າບັນຊີຂອງທ່ານໂດຍກົງ ຫຼັງສະແກນໃຫ້ກວດວ່າຊື່ບັນຊີທີ່ຂຶ້ນເປັນຂອງທ່ານ',   // DRAFT lo: needs native review
    sp_cta: 'ເຂົ້າໄປໃນຕຶກຂອງ{a} →',
    out: 'ອອກຈາກລະບົບ', save: 'ບັນທຶກ', saved: 'ບັນທຶກແລ້ວ',
  },
};

/* mt('key', {a: 'x'}) in the current language: lo falls back to Thai, an unknown key shows itself */
export function useMt() {
  const {lang} = useLang();
  return (k, v) => {
    let s = (MS[lang] && MS[lang][k]) ?? MS.th[k] ?? k;
    if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  };
}
