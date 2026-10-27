/* notices.js — the wall notices on the about page (CirclesTimes.notices reads window.CIRCLES_NOTICES). EDIT THIS FILE to change them.
   At most 3 are shown, newest date first. date = 'YYYY-MM-DD'. old:true makes a card look faded (a notice that is no longer fresh).
   th / en are required, lo is optional (falls back to en). Write only things that are true today; never write about who donated or how much. */
window.CIRCLES_NOTICES = [
  {date: '2026-10-18', th: {h: 'เปิดเมืองแล้ว', p: 'ตอนนี้มีงานของ arne ให้ดูก่อน ศิลปินคนอื่นกำลังตามมา'}, en: {h: 'The city is open', p: 'For now there is arne’s work to see. Other artists are on their way.'}},
  {date: '2026-10-18', th: {h: 'โดเนทถึงศิลปินเต็มจำนวน', p: 'เงินเข้าบัญชีศิลปินโดยตรง circles ไม่หักสักบาท ถ้าอยากช่วยค่าดูแลเว็บ มีช่องแยกให้ต่างหาก'}, en: {h: 'Donations reach the artist in full', p: 'Money goes straight to the artist’s account and circles keeps nothing. Helping run the site is a separate, optional box.'}},
  {date: '2026-10-18', old: true, th: {h: 'ย่านตำนานเปิดแล้ว', p: 'รวมผลงานของปรมาจารย์ที่ลิขสิทธิ์หมดอายุ ดูได้อย่างเดียว ไม่มีปุ่มโดเนท'}, en: {h: 'The Legends quarter is open', p: 'Works by masters whose copyright has expired. Look only, no donate button.'}}
];
