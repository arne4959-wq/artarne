/* manageStrings.js — the words of manage.html (login + artist dashboard). Only this page uses them, so they live here and not in STR of circles.js.
   th and en are complete. lo is a DRAFT (needs native review) and covers the login door and the main buttons; any key missing in lo falls back to Thai, like the rest of the site. */
import {useLang} from './i18n.jsx';

export const MS = {
  th: {
    skip: 'ข้ามไปที่เนื้อหา',
    lg_kick: 'ประตูเหล็ก · เฉพาะศิลปิน', lg_title: 'เข้าตึก', lg_aria: 'เข้าตึก',
    lg_sub: 'ตึกนี้ไม่มีปุ่มสมัคร ศิลปินที่ได้รับเชิญเท่านั้น ใส่อีเมลที่เราเชิญไว้ แล้วเราจะส่งกุญแจ (ลิงก์) ไปให้',
    lg_email: 'อีเมล', lg_btn: 'ส่งกุญแจมา →', lg_sending: 'กำลังส่ง…', lg_stamp: 'ห้ามสมัครเอง',
    lg_sent_h: 'ส่งกุญแจแล้ว', lg_sent_p: 'เปิดอีเมลแล้วกดลิงก์ในนั้น ถ้าไม่เจอให้ดูในสแปม ลิงก์ใช้ได้ครั้งเดียว ถ้าอีเมลนี้ไม่ได้รับเชิญ จะไม่มีอะไรส่งไป',
    lg_again: 'ใช้อีเมลอื่น', lg_wait: 'ขอลิงก์บ่อยเกินไป รอสักครู่แล้วลองใหม่', lg_bad: 'อีเมลนี้ดูไม่ถูกต้อง', lg_net: 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง',
    lg_nokey: 'ยังไม่ได้รับเชิญ?', lg_join: 'ขอมีตึก →', lg_setup: 'ระบบยังไม่ตั้งค่า: ยังไม่ได้ใส่ที่อยู่ฐานข้อมูล', lg_checking: 'กำลังตรวจกุญแจ…',
    lg_link_bad: 'กุญแจนี้ใช้ไม่ได้หรือหมดอายุแล้ว ขอกุญแจใหม่ด้านล่าง',
    out: 'ออกจากระบบ', dash_hi: 'ตึกของ {a}', dash_kick: 'ห้องควบคุม',
    nb_h: 'ยังไม่มีตึกผูกกับอีเมลนี้', nb_p: 'คุณเข้าสู่ระบบได้แล้ว แต่เจ้าของเว็บยังไม่ได้ผูกตึกให้อีเมล {e} ติดต่อเจ้าของเว็บ แล้วกลับมาใหม่',
    hidden: 'ตึกของคุณยังไม่เปิดให้คนทั่วไปเห็น รอเจ้าของเว็บอนุมัติ', demo: 'ตึกตัวอย่าง',
    tab_profile: 'โปรไฟล์', tab_works: 'งานของฉัน', tab_pay: 'รับเงิน', save: 'บันทึก', saving: 'กำลังบันทึก…', saved: 'บันทึกแล้ว', retry: 'บันทึกไม่สำเร็จ ลองใหม่',
    loading: 'กำลังโหลด…', load_fail: 'โหลดข้อมูลไม่สำเร็จ', reload: 'ลองใหม่',
    f_name: 'ชื่อ (ไทย)', f_name_en: 'ชื่อ (อังกฤษ)', f_name_lo: 'ชื่อ (ลาว)', f_disc: 'แนวงาน', f_city: 'เมือง', f_since: 'วาดมาตั้งแต่ปี',
    f_tagline: 'ประโยคเดียวบอกตัวตน', f_tagline_en: 'ประโยคเดียว (อังกฤษ)', f_concept: 'คอนเซ็ปต์', f_concept_en: 'คอนเซ็ปต์ (อังกฤษ)',
    f_bio: 'ประวัติ', f_bio_en: 'ประวัติ (อังกฤษ)', f_bio_lo: 'ประวัติ (ลาว)', f_instagram: 'ลิงก์ Instagram', f_commission: 'รับงานสั่งทำ',
    f_until: 'ว่างเมื่อไหร่', f_until_en: 'ว่างเมื่อไหร่ (อังกฤษ)', h_names: 'ชื่อ', h_about: 'เกี่ยวกับคุณ', h_links: 'ลิงก์และงานสั่งทำ',
    w_add: '+ เพิ่มงาน', w_none: 'ยังไม่มีงาน เพิ่มชิ้นแรกเลย', w_edit: 'แก้', w_del: 'ลบ', w_del_sure: 'ลบจริงไหม? กดอีกครั้ง', w_cancel: 'ยกเลิก', w_new: 'งานใหม่', w_editing: 'แก้งาน',
    w_on: 'ขายอยู่', w_res: 'จองแล้ว', w_sold: 'ขายแล้ว', w_one: 'ชิ้นเดียว', w_ed: 'edition {n}', w_limit: 'มีงานครบ 40 ชิ้นแล้ว',
    f_title: 'ชื่องาน (ไทย)', f_title_en: 'ชื่องาน (อังกฤษ)', f_title_lo: 'ชื่องาน (ลาว)', f_year: 'ปี', f_medium: 'วัสดุ', f_medium_en: 'วัสดุ (อังกฤษ)', f_medium_lo: 'วัสดุ (ลาว)',
    f_size: 'ขนาด', f_size_lo: 'ขนาด (ลาว)', f_usd: 'ราคา (USD)', f_lak: 'ราคา (กีบ) — เว้นว่างได้', f_ar: 'สัดส่วนภาพ เช่น 4/5', f_status: 'สถานะ',
    f_edition: 'จำนวน edition (เว้นว่าง = ชิ้นเดียว)', f_pay: 'ลิงก์จ่ายเงินของคุณเอง (ถ้ามี)', f_quote: 'ประโยคสั้นๆ ของงาน', f_quote_en: 'ประโยคสั้นๆ (อังกฤษ)', f_quote_lo: 'ประโยคสั้นๆ (ลาว)',
    f_story: 'เรื่องเบื้องหลัง', f_story_en: 'เรื่องเบื้องหลัง (อังกฤษ)', f_story_lo: 'เรื่องเบื้องหลัง (ลาว)', h_wbasic: 'ข้อมูลหลัก', h_wsell: 'ราคาและการขาย', h_wtext: 'ข้อความ (ใส่หรือไม่ก็ได้)',
    img_pick: 'เลือกรูป', img_change: 'เปลี่ยนรูป', img_up: 'กำลังอัปโหลด…', img_none: 'ยังไม่มีรูป', img_note: 'รูปจะถูกย่อให้พอดีเว็บก่อนส่งอัตโนมัติ (JPG, PNG, WebP)',
    p_h: 'รับเงินผ่าน LAO QR', p_note: 'circles ไม่ถือเงินของใคร ลูกค้าโอนเข้าบัญชีของคุณโดยตรง ใส่รูป QR ที่ export จากแอปธนาคารของคุณเอง',
    p_warn: 'ก่อนเปิดขาย: ตรวจกับธนาคารว่าบัญชีของคุณเปิดรับ LAO QR แล้ว และเช็กเรื่องการจดทะเบียนธุรกิจหรือภาษีสำหรับการขายงานศิลปะกับหน่วยงานในลาว เว็บนี้ไม่ใช่คำปรึกษาทางกฎหมายหรือภาษี',
    p_bank: 'ธนาคาร', p_acc_name: 'ชื่อบัญชี', p_acc_no: 'เลขบัญชี', p_qr: 'รูป LAO QR', p_qr_none: 'ยังไม่มี QR', p_email: 'อีเมลรับข้อความจากลูกค้า',
    p_email_note: 'อีเมลนี้ไม่แสดงต่อสาธารณะ', p_public: 'ชื่อบัญชี เลขบัญชี และ QR จะแสดงบนหน้าซื้อให้ลูกค้าเห็น',
    er_required: 'ต้องกรอก', er_year: 'ใส่ปี ค.ศ. 4 หลัก เช่น 2024', er_https: 'ต้องเป็นลิงก์ https:// ที่ใช้ได้จริง', er_price: 'ใส่ตัวเลขที่ไม่ติดลบ', er_ratio: 'ใส่เช่น 4/5 หรือ 1/1',
    er_edition: 'ต้องเป็นจำนวนเต็มมากกว่า 1', er_account: 'ใส่ตัวเลขเท่านั้น (เว้นวรรคหรือขีดได้)', er_email: 'อีเมลนี้ดูไม่ถูกต้อง', er_fix: 'มีช่องที่ต้องแก้ ดูตัวอักษรสีแดง',
    er_bad_type: 'ใช้ไฟล์ JPG, PNG หรือ WebP เท่านั้น', er_too_big: 'ไฟล์ใหญ่เกินไป', er_bad_image: 'เปิดรูปนี้ไม่ได้', er_upload: 'อัปโหลดไม่สำเร็จ ลองใหม่',
  },
  en: {
    skip: 'Skip to content',
    lg_kick: 'STEEL DOOR · ARTISTS ONLY', lg_title: 'LET ME IN', lg_aria: 'Let me in',
    lg_sub: 'There is no sign-up button. Invited artists only. Type the e-mail we invited and we will send you a key (a link).',
    lg_email: 'E-mail', lg_btn: 'SEND THE KEY →', lg_sending: 'SENDING…', lg_stamp: 'NO SELF SIGN-UP',
    lg_sent_h: 'Key sent', lg_sent_p: 'Open your e-mail and press the link. Check spam. The link works once. If this address was not invited, nothing is sent.',
    lg_again: 'Use another e-mail', lg_wait: 'Too many tries. Wait a minute and try again.', lg_bad: 'That e-mail does not look right.', lg_net: 'Could not send. Try again.',
    lg_nokey: 'Not invited yet?', lg_join: 'Ask for a building →', lg_setup: 'Not set up: the database address is missing.', lg_checking: 'Checking the key…',
    lg_link_bad: 'This key is broken or expired. Ask for a new one below.',
    out: 'Sign out', dash_hi: "{a}'s building", dash_kick: 'CONTROL ROOM',
    nb_h: 'No building is linked to this e-mail', nb_p: 'You are signed in, but the site owner has not linked a building to {e} yet. Contact the owner, then come back.',
    hidden: 'Your building is hidden from visitors until the site owner approves it.', demo: 'Sample building',
    tab_profile: 'Profile', tab_works: 'My works', tab_pay: 'Get paid', save: 'Save', saving: 'Saving…', saved: 'Saved', retry: 'Could not save. Try again.',
    loading: 'Loading…', load_fail: 'Could not load your data', reload: 'Try again',
    f_name: 'Name (Thai)', f_name_en: 'Name (English)', f_name_lo: 'Name (Lao)', f_disc: 'Discipline', f_city: 'City', f_since: 'Making art since',
    f_tagline: 'One line about you', f_tagline_en: 'One line (English)', f_concept: 'Concept', f_concept_en: 'Concept (English)',
    f_bio: 'Bio', f_bio_en: 'Bio (English)', f_bio_lo: 'Bio (Lao)', f_instagram: 'Instagram link', f_commission: 'Taking commissions',
    f_until: 'Open from', f_until_en: 'Open from (English)', h_names: 'Names', h_about: 'About you', h_links: 'Links and commissions',
    w_add: '+ Add a work', w_none: 'No works yet. Add the first one.', w_edit: 'Edit', w_del: 'Delete', w_del_sure: 'Really delete? Press again', w_cancel: 'Cancel', w_new: 'New work', w_editing: 'Edit work',
    w_on: 'For sale', w_res: 'On hold', w_sold: 'Sold', w_one: 'One of a kind', w_ed: 'edition of {n}', w_limit: 'You already have 40 works',
    f_title: 'Title (Thai)', f_title_en: 'Title (English)', f_title_lo: 'Title (Lao)', f_year: 'Year', f_medium: 'Medium', f_medium_en: 'Medium (English)', f_medium_lo: 'Medium (Lao)',
    f_size: 'Size', f_size_lo: 'Size (Lao)', f_usd: 'Price (USD)', f_lak: 'Price (kip), optional', f_ar: 'Picture ratio, e.g. 4/5', f_status: 'Status',
    f_edition: 'Edition size (empty = one of a kind)', f_pay: 'Your own payment link (optional)', f_quote: 'A short line about the work', f_quote_en: 'Short line (English)', f_quote_lo: 'Short line (Lao)',
    f_story: 'The story behind it', f_story_en: 'Story (English)', f_story_lo: 'Story (Lao)', h_wbasic: 'The basics', h_wsell: 'Price and selling', h_wtext: 'Words (optional)',
    img_pick: 'Choose a picture', img_change: 'Change picture', img_up: 'Uploading…', img_none: 'No picture yet', img_note: 'The picture is shrunk to fit the site before it is sent (JPG, PNG, WebP)',
    p_h: 'Get paid with LAO QR', p_note: 'circles never holds anyone’s money. Buyers pay straight into your account. Add the QR picture you export from your own bank app.',
    p_warn: 'Before you sell: check with your bank that your account accepts LAO QR, and check business registration and tax rules for selling art with the authorities in Laos. This site is not legal or tax advice.',
    p_bank: 'Bank', p_acc_name: 'Account name', p_acc_no: 'Account number', p_qr: 'LAO QR picture', p_qr_none: 'No QR yet', p_email: 'E-mail for messages from buyers',
    p_email_note: 'This e-mail is never shown publicly', p_public: 'Account name, account number and QR are shown to buyers on the buy page.',
    er_required: 'Required', er_year: 'A 4-digit year, e.g. 2024', er_https: 'Must be a working https:// link', er_price: 'A number, not negative', er_ratio: 'Like 4/5 or 1/1',
    er_edition: 'A whole number above 1', er_account: 'Digits only (spaces or dashes are fine)', er_email: 'That e-mail does not look right', er_fix: 'Some fields need fixing, see the red text',
    er_bad_type: 'Use a JPG, PNG or WebP file', er_too_big: 'The file is too big', er_bad_image: 'Could not open this picture', er_upload: 'Upload failed. Try again.',
  },
  lo: {   // DRAFT lo: needs native review. Anything missing here shows in Thai.
    lg_kick: 'ປະຕູເຫຼັກ · ສະເພາະສິລະປິນ', lg_title: 'ເຂົ້າຕຶກ', lg_aria: 'ເຂົ້າຕຶກ',
    lg_sub: 'ບໍ່ມີປຸ່ມສະໝັກ ສະເພາະສິລະປິນທີ່ໄດ້ຮັບເຊີນ ໃສ່ອີເມວທີ່ພວກເຮົາເຊີນໄວ້ ແລ້ວພວກເຮົາຈະສົ່ງກະແຈ (ລິ້ງ) ໄປໃຫ້',
    lg_email: 'ອີເມວ', lg_btn: 'ສົ່ງກະແຈມາ →', lg_sending: 'ກຳລັງສົ່ງ…', lg_stamp: 'ຫ້າມສະໝັກເອງ',
    lg_sent_h: 'ສົ່ງກະແຈແລ້ວ', lg_again: 'ໃຊ້ອີເມວອື່ນ', lg_nokey: 'ຍັງບໍ່ໄດ້ຮັບເຊີນ?', lg_join: 'ຂໍມີຕຶກ →',
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
