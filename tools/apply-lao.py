#!/usr/bin/env python3
"""tools/apply-lao.py - writes the Lao (lo) strings into circles.js (STR.lo) and the review table into HOWTO.md.
Idempotent: both blocks sit between markers (lo:begin / lo:end) and are replaced, so running it twice changes nothing.
Every Lao line is a DRAFT: it needs a native speaker's review. A key that is not in STR.lo falls back to Thai (t() already does that);
the keys in TODO below are left out on purpose (not sure of the wording / legal text) and are listed in the table as TODO.
To change a Lao sentence: edit it here, run `python3 tools/apply-lao.py`, then `node tools/build.mjs`."""
import ast, json, re, sys

LO = {
 # --- nav, menu, language ---
 'nav_city': 'ເມືອງ', 'nav_about': 'ກ່ຽວກັບ', 'nav_map': 'ແຜນທີ່', 'menu_aria': 'ເມນູ', 'lang_aria': 'ປ່ຽນພາສາ',
 'foot_manifesto': 'Manifesto', 'foot_how': 'ວິທີໃຊ້ງານ', 'foot_feat': 'ຜົນງານເດັ່ນ', 'foot_map': 'ແຜນທີ່ເມືອງ', 'foot_join': 'ຂໍມີຕຶກ',
 # --- buttons, small texts ---
 'close': 'ປິດ', 'copy_msg': 'ສຳເນົາຂໍ້ຄວາມ', 'copied': 'ສຳເນົາແລ້ວ', 'copy_fail': 'ສຳເນົາບໍ່ໄດ້ ລອງເລືອກຂໍ້ຄວາມແລ້ວສຳເນົາເອງ',
 'news_fail': 'ສົ່ງບໍ່ສຳເລັດ ລອງໃໝ່ອີກຄັ້ງ', 'captcha_wait': 'ລໍຖ້າການກວດສອບສຳເລັດກ່ອນສົ່ງ', 'cw_back': '← ກັບໄປຍ່າງເບິ່ງເມືອງ',
 'buy': 'ຊື້ກົງຈາກ{a} →', 'b_pay': 'ຈ່າຍເລີຍ →', 'b_ask': 'ມີຄຳຖາມ? ທັກ{a}ກ່ອນ', 'b_sold': 'ຖາມ{a}ກ່ຽວກັບຜົນງານແບບນີ້ →', 'b_res': 'ຂໍຕໍ່ຄິວຊິ້ນນີ້ →',
 'w_prev': '← ຊິ້ນກ່ອນ', 'w_next': 'ຊິ້ນຕໍ່ໄປ →', 'st_sold': 'ຂາຍແລ້ວ', 'st_res': 'ຈອງແລ້ວ', 'cw_view': 'ເບິ່ງລາຍລະອຽດ {t}',
 # --- museum ---
 'mus_name': 'ພິພິທະພັນຂອງ{a}', 'mus_aria': 'ຫ້ອງສະແດງພາບຂອງ{a}', 'mus_prev': '← ພາບກ່ອນ', 'mus_next': 'ຍ່າງຕໍ່ →', 'mus_more': 'ລາຍລະອຽດ ແລະ ແນວຄິດ',
 'mus_map': 'ແຜນຜັງຕຶກ', 'mus_prof': 'ເບິ່ງໂປຣໄຟລ໌ສິລະປິນ', 'pf_walk': 'ຍ່າງເຂົ້າພິພິທະພັນ →', 'pf_ask': 'ຖາມສິລະປິນ',
 'mus_hint': '▼ ຍ່າງເບິ່ງພາບເທື່ອລະຊິ້ນ ໃຊ້ລູກສອນ ← → ເທິງຄີບອດໄດ້ ກົດທີ່ພາບທີ່ສະຫວ່າງເພື່ອເບິ່ງລາຍລະອຽດເຕັມ',
 # --- work dialog ---
 'lb_artist': 'ສິລະປິນ', 'lb_year': 'ປີ', 'lb_medium': 'ວັດສະດຸ', 'lb_size': 'ຂະໜາດ', 'd_sold': 'ຊິ້ນນີ້ມີເຈົ້າຂອງແລ້ວ',
 'd_res': 'ມີຄົນຈອງໄວ້ແລ້ວ ຖ້າຫຼຸດຈອງ ສິລະປິນຈະແຈ້ງຄົນທີ່ຕໍ່ຄິວ', 'd_note': 'ລາຄາທີ່ສິລະປິນຕັ້ງເອງ ບໍ່ມີຄ່ານາຍໜ້າ', 'd_story': 'ທີ່ມາຂອງຜົນງານຊິ້ນນີ້',
 'd_by': 'ໂດຍ <b>{a}</b> · {d} · {c}', 'cc_h': 'ແນວຄິດຂອງຜົນງານ', 'cc_origin': 'ທີ່ມາ', 'cc_mat': 'ວັດສະດຸ', 'cc_steps': 'ຂັ້ນຕອນການເຮັດ', 'cc_step': 'ຂັ້ນທີ {n}',
 'd_how1': 'ສົ່ງຂໍ້ຄວາມຫາສິລະປິນ', 'd_how2': 'ລົມກັນເລື່ອງລາຄາ ແລະ ການຈັດສົ່ງ', 'd_how3': 'ຈ່າຍເງິນໃຫ້ສິລະປິນໂດຍກົງ',
 'p_how1': 'ກົດຈ່າຍຜ່ານລິ້ງຂອງສິລະປິນ', 'p_how2': 'ສິລະປິນຕິດຕໍ່ກັບເລື່ອງການຈັດສົ່ງ', 'p_how3': 'ເງິນເຂົ້າບັນຊີສິລະປິນໂດຍກົງ',
 'd_paynote': 'ລິ້ງຈ່າຍເງິນເປັນຂອງສິລະປິນເອງ circles ບໍ່ໄດ້ຮັບເງິນແທນ', 'nf_h': 'ຕຶກນີ້ຍັງບໍ່ໄດ້ສ້າງ', 'nf_p': 'ບໍ່ມີສິລະປິນຄົນນີ້ໃນເມືອງ ກັບໄປຍ່າງເບິ່ງຕຶກທີ່ມີຢູ່',
 # --- inquiry popup / forms ---
 'id_title': 'ລົມກັບ<em>{a}</em>ໂດຍກົງ', 'id_intro': 'ຂໍ້ຄວາມນີ້ໄປຫາສິລະປິນໂດຍກົງ ບໍ່ຜ່ານຄົນກາງ', 'id_name': 'ຊື່ຂອງທ່ານ', 'id_email': 'ອີເມວຂອງທ່ານ', 'id_msg': 'ຂໍ້ຄວາມ',
 'id_send': 'ສົ່ງຫາສິລະປິນ →', 'id_prefill': 'ສະບາຍດີ ສົນໃຈຜົນງານ “{t}” ({p}) ຢາກສອບຖາມເລື່ອງລາຄາ ແລະ ການຈັດສົ່ງ ຂອບໃຈ',
 'id_pre_sold': 'ສະບາຍດີ ເຫັນຜົນງານ “{t}” ທີ່ຂາຍໄປແລ້ວ ມັກຫຼາຍ ມີຜົນງານແບບນີ້ອີກບໍ ຫຼື ຮັບເຮັດວຽກໃໝ່ບໍ ຂອບໃຈ',
 'id_pre_res': 'ສະບາຍດີ ສົນໃຈຜົນງານ “{t}” ({p}) ຖ້າຄົນທີ່ຈອງໄວ້ບໍ່ຊື້ ຂໍຕໍ່ຄິວດ້ວຍ ຂອບໃຈ', 'id_subject': 'ສົນໃຈຜົນງານ “{t}” — circles',
 'done_sent': 'ສົ່ງສຳເລັດແລ້ວ', 'done_sent_p': 'ຂອບໃຈ ຂໍ້ຄວາມເຖິງປາຍທາງແລ້ວ', 'done_mail': 'ກຳລັງເປີດແອັບອີເມວຂອງທ່ານ',
 'done_mail_p': 'ກົດສົ່ງໃນແອັບອີເມວເພື່ອໃຫ້ຂໍ້ຄວາມເຖິງປາຍທາງ ຖ້າບໍ່ມີຫຍັງເປີດຂຶ້ນ ໃຫ້ສຳເນົາຂໍ້ຄວາມດ້ານລຸ່ມແລ້ວສົ່ງເອງ',
 'note_mailto': 'ຕອນນີ້ຟອມນີ້ເຮັດວຽກຜ່ານແອັບອີເມວຂອງທ່ານ', 'jd_cancel': 'ຍົກເລີກ', 'jd_send': 'ສົ່ງຄຳຂໍ →',
 # --- buy page ---
 'by_back': '← ກັບໄປພິພິທະພັນຂອງ{a}', 'by_marq': 'ART NOT SORRY ★ ບໍ່ມີຄົນກາງ ★ ຊື້ກົງຈາກສິລະປິນ ★ CIRCLES NEVER END ★ ', 'by_one': 'ຊິ້ນດຽວໃນໂລກ', 'by_free': 'ຍັງວ່າງ',
 'by_reply': 'ຕອບໄວສຸດພາຍໃນ {d} ວັນ', 'by_lak': 'ກີບ', 'by_thb': 'ບາດ', 'by_detail': 'ລາຍລະອຽດຂອງຜົນງານ', 'by_cert': 'ໃບຢັ້ງຢືນ', 'by_how': 'ຊື້ແນວໃດ', 'by_ship': 'ການສົ່ງເຄື່ອງ',
 'by_to': 'ສົ່ງໄດ້ທີ່', 'by_fee': 'ຄ່າສົ່ງ', 'by_days': 'ຮອດມືພາຍໃນ', 'by_dayu': '{d} ວັນ', 'by_break': 'ຖ້າແຕກລະຫວ່າງທາງ', 'by_ret': 'ສົ່ງຄືນໄດ້ {d} ວັນ', 'by_safe': 'ປອດໄພບໍ?',
 'by_safe_p': 'ເງິນໄປຫາສິລະປິນໂດຍກົງ circles ບໍ່ໄດ້ຮັບເງິນແທນ ຖ້າມີບັນຫາ ຕິດຕໍ່', 'by_since': 'ເຮັດວຽກສິລະປະມາແຕ່ {y}', 'by_soldn': 'ຂາຍໄປແລ້ວ {n} ຊິ້ນ',
 'by_ask_h': 'ທັກ{a} (ບໍ່ຕ້ອງອອກຈາກໜ້ານີ້)', 'by_country': 'ສົ່ງໄປບ່ອນໃດ (ປະເທດ / ເມືອງ)', 'by_after': 'ເມື່ອສົ່ງແລ້ວຈະເຫັນຂໍ້ຄວາມ:', 'by_after_p': '“ສົ່ງຫາ{a}ແລ້ວ ຈະຕອບໄປທີ່ອີເມວຂອງທ່ານພາຍໃນ {d} ວັນ”',
 'by_again': 'ສົ່ງຂໍ້ຄວາມອີກ', 'title_by': '{t} ໂດຍ{a} — circles', 'desc_by': 'ຊື້ “{t}” ຜົນງານ{d}ຂອງ{a} ລາຄາ {p} ຊື້ກົງຈາກສິລະປິນ ບໍ່ມີຄົນກາງ',
}
# left out on purpose (they fall back to Thai): why
TODO = {
 'consent_form': 'legal / privacy wording: needs a proper translation, not a guess',
 'jd_title': 'join form: the word play on "ตึก" (building) needs a native ear', 'jd_intro': 'join form intro: tone matters, ask a native speaker',
 'jd_name': 'join form label', 'jd_email': 'join form label', 'jd_disc': 'join form label (art discipline)', 'jd_other': 'join form option', 'jd_link': 'join form label', 'jd_msg': 'join form label',
}

def run():
    js = open('circles.js', encoding='utf-8').read()
    thblock = js[js.index('const STR = {'):js.index('\nen: {')]                 # the Thai strings, for the review table
    def thval(k):
        m = re.search(r'[ ,{]' + re.escape(k) + r':\s*(\'(?:[^\'\\]|\\.)*\'|"(?:[^"\\]|\\.)*")', thblock)
        if not m: return ''
        try: return ast.literal_eval(m.group(1))
        except Exception: return m.group(1)[1:-1]
    th = {k: thval(k) for k in list(LO) + list(TODO)}
    body = '\n'.join(f"  {k}: {json.dumps(v, ensure_ascii=False)},   // DRAFT lo: needs native review" for k, v in LO.items())
    todo = '\n'.join(f"  // TODO lo: {k} (falls back to Thai) - {w}" for k, w in TODO.items())
    block = ("/* lo:begin */\n// DRAFT lo: every line below needs native review (written by Claude, not a native speaker). Keys not listed fall back to Thai.\n"
             "lo: {\n" + body + "\n" + todo + "\n},\n/* lo:end */\n")
    if '/* lo:begin */' in js:
        js = re.sub(r'/\* lo:begin \*/.*?/\* lo:end \*/\n', lambda m: block, js, flags=re.S)
    else:
        anchor = "},\n};\n\n/* ---------- language ---------- */"
        assert anchor in js, 'STR end not found'
        js = js.replace(anchor, "},\n" + block + "};\n\n/* ---------- language ---------- */", 1)
    open('circles.js', 'w', encoding='utf-8').write(js)
    # --- HOWTO.md table
    rows = ['| key | ไทย (Thai) | ລາວ (Lao, DRAFT) |', '|---|---|---|']
    esc = lambda s: s.replace('|', '\\|').replace('\n', ' ')
    for k, v in LO.items(): rows.append(f"| `{k}` | {esc(th.get(k, ''))} | {esc(v)} |")
    for k, w in TODO.items(): rows.append(f"| `{k}` | {esc(th.get(k, ''))} | **TODO** (uses Thai for now) - {w} |")
    sec = ("<!-- lo:begin -->\n## 12. ภาษาลาว (ຕ້ອງໃຫ້ຄົນລາວກວດ)\n\n"
           "ภาษาลาว (`lo`) เป็นภาษาที่ 3 ต่อจาก TH และ EN ตัวสลับภาษาในแถบเมนูวนรอบ TH → EN → ລາວ ข้อความลาวทั้งหมดด้านล่างเป็น **ฉบับร่าง (DRAFT)** ที่ยังไม่มีเจ้าของภาษาตรวจ "
           "คีย์ที่ไม่มีในตารางจะแสดงเป็นภาษาไทยอัตโนมัติ ชื่อศิลปิน ชื่องาน และสาขายังเป็นภาษาไทย (ยังไม่มีข้อมูลลาว)\n\n"
           "วิธีแก้: แก้คำลาวในไฟล์ `tools/apply-lao.py` (ตัวแปร `LO`) แล้วรัน `python3 tools/apply-lao.py` ตามด้วย `node tools/build.mjs` "
           "(สคริปต์เขียนทับเฉพาะบล็อก `lo:begin … lo:end` ใน `circles.js` และตารางนี้)\n\n"
           + '\n'.join(rows) + "\n<!-- lo:end -->\n")
    how = open('HOWTO.md', encoding='utf-8').read()
    if '<!-- lo:begin -->' in how:
        how = re.sub(r'<!-- lo:begin -->.*?<!-- lo:end -->\n', lambda m: sec, how, flags=re.S)
    else:
        how = how.rstrip('\n') + '\n\n---\n\n' + sec
    open('HOWTO.md', 'w', encoding='utf-8').write(how)
    print('lo keys:', len(LO), '| TODO keys:', len(TODO))
run()
