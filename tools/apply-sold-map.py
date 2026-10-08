#!/usr/bin/env python3
"""1) Sale status + the artist's own payment link, per work (artists.js):
       status:'sold'      -> stamp "SOLD", price crossed out, button becomes "ask about similar work"
       status:'reserved'  -> stamp "ON HOLD", button becomes "join the queue"
       pay:'https://...'  -> a "Pay now" button that opens the artist's own payment page
   Shown on the studio pages (floors + detail window) and on the home page cards. Sold works go to the end of the list.
2) Home page: the city map no longer has its own section far down the page. It sits inside the City section,
   with a "Buildings / Map" switch and the discipline filters right above the street. Tapping a district enters that building.
Run from the site folder:  python3 tools/apply-sold-map.py      (safe to run again; needs apply-studio-v2.py first)"""
import os, re, glob, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE) if os.path.basename(HERE) == 'tools' else os.getcwd()
P = lambda f: os.path.join(ROOT, f)
changed = []


def sub(s, old, new, what, f, done=None):
    if (done or new) in s: return s
    if s.count(old) != 1: sys.exit(f'!! {os.path.basename(f)}: could not find {what} (found {s.count(old)}x). Stopped; files written so far: {changed}')
    return s.replace(old, new)


def edit(f, fn):
    s0 = open(f, encoding='utf-8').read(); s = fn(s0, f)
    if s != s0: open(f, 'w', encoding='utf-8').write(s); changed.append(os.path.basename(f)); print('  updated', os.path.basename(f))
    else: print('  ok', os.path.basename(f))


# ---------------------------------------------------------------- artists.js: explain the new fields, mark a few demo works
DOC = '''   Fields ending in "En" are the English versions. `img` can be swapped for a real photo (any path). */'''
DOC_NEW = '''   Fields ending in "En" are the English versions. `img` can be swapped for a real photo (any path).
   Selling, per work (all optional):
     status:'sold'       the work is sold: a SOLD stamp, the price crossed out, moved to the end of lists
     status:'reserved'   someone is holding it: an ON HOLD stamp, buyers can ask to be next in line
     pay:'https://...'   the artist's OWN payment page (PayPal.me, Stripe Payment Link, ...). Adds a "Pay now" button.
                         Must start with https:// or it is ignored. Remove it once the work is sold. */'''
DEMO = {'art/napha-1.svg': "status:'sold'", 'art/kwan-1.svg': "status:'sold'", 'art/thara-2.svg': "status:'reserved'"}


def f_artists(s, f):
    s = sub(s, DOC, DOC_NEW, 'header comment', f)
    for img, add in DEMO.items():
        at = "img:'" + img + "'"
        if at + ',status:' in s: continue
        if s.count(at) != 1: sys.exit(f'!! artists.js: {img} not found')
        s = s.replace(at, at + ',' + add)
    return s


# ---------------------------------------------------------------- circles.js: helpers, words, inquiry text
HELP_AT = "const artImg = (a, k) =>"
HELP = r'''/* sale status of a work: '' (for sale), 'sold' or 'reserved'; and the artist's own payment link (https only) */
const workStatus = p => (p && (p.status === 'sold' || p.status === 'reserved')) ? p.status : '';
const payLink = p => (p && typeof p.pay === 'string' && /^https:\/\/\S+$/.test(p.pay)) ? p.pay : '';
const stampHtml = p => { const s = workStatus(p); return s ? `<i class="stamp ${s}">${esc(t(s === 'sold' ? 'st_sold' : 'st_res'))}</i>` : ''; };
const statusChip = p => { const s = workStatus(p); return s ? `<span class="chip ${s}">${esc(t(s === 'sold' ? 'st_sold' : 'st_res'))}</span>` : ''; };
'''
WORDS = {
  'th': dict(st_sold='ขายแล้ว', st_res='จองแล้ว', cw_look_sold='ดูรายละเอียด →', d_sold='ชิ้นนี้มีเจ้าของแล้ว',
             d_res='มีคนจองไว้แล้ว ถ้าหลุดจอง ศิลปินจะแจ้งคนที่ต่อคิว', b_sold='ถาม{a}เรื่องงานแบบนี้ →', b_res='ขอต่อคิวชิ้นนี้ →',
             b_pay='จ่ายเลย →', b_ask='มีคำถาม? ทัก{a}ก่อน', p_how1='กดจ่ายผ่านลิงก์ของศิลปิน', p_how2='ศิลปินทักกลับเรื่องการจัดส่ง',
             p_how3='เงินเข้าบัญชีศิลปินโดยตรง', d_paynote='ลิงก์จ่ายเงินเป็นของศิลปินเอง circles ไม่ได้รับเงินแทน',
             id_pre_sold='สวัสดี เห็นผลงาน “{t}” ที่ขายไปแล้ว ชอบมาก มีงานแบบนี้อีกไหม หรือรับทำงานใหม่ไหม ขอบคุณ',
             id_pre_res='สวัสดี สนใจผลงาน “{t}” ({p}) ถ้าคนที่จองไว้ไม่ซื้อ ขอต่อคิวด้วย ขอบคุณ',
             v_city='ดูแบบตึก', v_map='ดูแบบแผนที่', v_aria='เลือกมุมมองเมือง'),
  'en': dict(st_sold='SOLD', st_res='ON HOLD', cw_look_sold='View details →', d_sold='This one has found a home.',
             d_res='Someone has reserved it. If that falls through, the artist will tell whoever is next in line.', b_sold='Ask {a} about similar work →',
             b_res='Join the queue →', b_pay='Pay now →', b_ask='Questions? Message {a} first', p_how1="Pay through the artist's own link",
             p_how2='The artist gets in touch about delivery', p_how3='The money goes straight to the artist',
             d_paynote='The payment link belongs to the artist. circles never holds the money.',
             id_pre_sold='Hi, I saw “{t}” has sold and I love it. Do you have similar work, or take commissions? Thanks.',
             id_pre_res="Hi, I'm interested in “{t}” ({p}). If the reservation falls through, could I be next in line? Thanks.",
             v_city='Buildings', v_map='Map', v_aria='Choose how to see the city'),
}
words = lambda lang: ''.join(f' {k}:{json.dumps(v, ensure_ascii=False)},' for k, v in WORDS[lang].items())


def f_circles(s, f):
    s = sub(s, HELP_AT, HELP + HELP_AT, 'artImg helper', f, done='const workStatus =')
    if 'st_sold:' not in s:
        s = sub(s, "w_next:'ชิ้นถัดไป →',", "w_next:'ชิ้นถัดไป →'," + words('th'), 'Thai words', f)
        s = sub(s, "w_next:'Next work →',", "w_next:'Next work →'," + words('en'), 'English words', f)
    s = sub(s, 'function openInquiry(id, k) {', 'function openInquiry(id, k, pre) {', 'openInquiry', f)
    s = sub(s, "${esc(t('id_prefill', {t: pk(p, 't'), p: usd(p.p)}))}", "${esc(t(pre || 'id_prefill', {t: pk(p, 't'), p: usd(p.p)}))}", 'inquiry text', f)
    return s


SHARED_CSS = '''
/* ===== sale status (stamp on the picture, chip next to the price) ===== */
.stamp{position:absolute;left:50%;top:50%;z-index:3;transform:translate(-50%,-50%) rotate(-12deg);font:400 clamp(.85rem,2.2vw,1.4rem)/1 "Anton","Chonburi",Impact,sans-serif;font-style:normal;letter-spacing:.14em;text-transform:uppercase;padding:.35em .75em .3em;border:4px double currentColor;background:rgba(244,241,232,.9);pointer-events:none;white-space:nowrap;box-shadow:3px 3px 0 rgba(14,13,12,.35);}
.stamp.sold{color:#A3182C;}
.stamp.reserved{color:#0E0D0C;background:rgba(232,183,48,.94);}
.chip{display:inline-block;font:400 .72rem/1.2 "Anton","Chonburi",Impact,sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:.2rem .45rem;border:2px solid #0E0D0C;vertical-align:middle;margin-left:.45rem;}
.chip.sold{background:#A3182C;color:#F4F1E8;}
.chip.reserved{background:#E8B730;color:#0E0D0C;}
.strike{text-decoration:line-through;text-decoration-thickness:3px;opacity:.55;}
html[lang=th] .stamp,html[lang=th] .chip{letter-spacing:.03em;font-family:"Chonburi","IBM Plex Sans Thai",sans-serif;}
'''


def f_css(s, f):
    return s if 'sale status (stamp' in s else s.rstrip('\n') + '\n' + SHARED_CSS


# ---------------------------------------------------------------- studio pages (cutaway.html + studio-*.html)
CUT_CSS_MARK = '/* ===== sold + pay ===== */'
CUT_CSS = CUT_CSS_MARK + '''
.lbl .prow{display:flex;align-items:center;flex-wrap:wrap;gap:.4rem;margin-top:.15rem;}
.lbl .prow .pr{margin-top:0;}.lbl .prow .chip{margin-left:0;}
.work.is-sold .art img,.work.is-sold .art{filter:saturate(.55);}
.dlg-stt{font:600 .92rem/1.5 var(--thai);}
.dlg-deal a.btn{text-align:center;}
.dlg-deal .btn.ghost{background:var(--paper);color:var(--black);font-size:.95rem;padding:.6rem 1rem;box-shadow:4px 4px 0 var(--black);}
.dlg-paynote{font:400 .74rem/1.5 var(--thai);color:#5a5650;}
.dlg-deal [hidden]{display:none!important;}
'''
OLD_ART = "${artImg(A, k)}</span></span>\n            <span class=\"lbl\">"
NEW_ART = "${artImg(A, k)}${stampHtml(A.pieces[k])}</span></span>\n            <span class=\"lbl\">"
OLD_PR = "<span class=\"pr\">${usd(A.pieces[k].p)}</span><span class=\"go\">${esc(t('cw_look'))}</span>"
NEW_PR = ("<span class=\"prow\"><span class=\"pr${workStatus(A.pieces[k]) ? ' strike' : ''}\">${usd(A.pieces[k].p)}</span>${statusChip(A.pieces[k])}</span>"
          "<span class=\"go\">${esc(t(workStatus(A.pieces[k]) === 'sold' ? 'cw_look_sold' : 'cw_look'))}</span>")
OLD_WORKBTN = '<button type="button" class="work" data-k="${k}"'
NEW_WORKBTN = '<button type="button" class="work${workStatus(A.pieces[k]) === \'sold\' ? \' is-sold\' : \'\'}" data-k="${k}"'
OLD_DEAL = '''        <div class="dlg-pr"><div class="dlg-price" id="dlg-price"></div><small id="dlg-pnote"></small></div>
        <button type="button" class="btn pk" id="dlg-buy"></button>
        <ol class="dlg-how" id="dlg-how"></ol>'''
NEW_DEAL = '''        <div class="dlg-pr"><div class="dlg-price" id="dlg-price"></div><small id="dlg-pnote"></small></div>
        <p class="dlg-stt" id="dlg-stt" hidden></p>
        <a class="btn pk" id="dlg-pay" target="_blank" rel="noopener" hidden></a>
        <button type="button" class="btn pk" id="dlg-buy"></button>
        <ol class="dlg-how" id="dlg-how"></ol>
        <small class="dlg-paynote" id="dlg-paynote" hidden></small>'''
OLD_FR = "fr.innerHTML = artImg(A, k);"
NEW_FR = "fr.innerHTML = artImg(A, k) + stampHtml(p);"
OLD_FILL = '''  $('#dlg-price').textContent = usd(p.p);
  $('#dlg-pnote').textContent = t('d_note');
  $('#dlg-buy').textContent = t('buy', {a: nameL(A)});
  $('#dlg-how').innerHTML = ['d_how1', 'd_how2', 'd_how3'].map(x => `<li>${esc(t(x))}</li>`).join('');'''
NEW_FILL = '''  const sta = workStatus(p), pay = sta ? '' : payLink(p);       // sold / reserved works never show a pay button
  $('#dlg-price').textContent = usd(p.p); $('#dlg-price').classList.toggle('strike', !!sta);
  $('#dlg-pnote').textContent = t('d_note'); $('#dlg-pnote').hidden = !!sta;
  const stt = $('#dlg-stt'); stt.hidden = !sta; stt.textContent = sta ? t(sta === 'sold' ? 'd_sold' : 'd_res') : '';
  const payA = $('#dlg-pay'); payA.hidden = !pay; if (pay) { payA.href = pay; payA.textContent = t('b_pay'); } else payA.removeAttribute('href');
  const buy = $('#dlg-buy');
  buy.textContent = sta === 'sold' ? t('b_sold', {a: nameL(A)}) : sta === 'reserved' ? t('b_res') : pay ? t('b_ask', {a: nameL(A)}) : t('buy', {a: nameL(A)});
  buy.classList.toggle('ghost', !!pay);                          // with a pay link, paying is the main button and asking is the second one
  $('#dlg-how').hidden = !!sta;
  $('#dlg-how').innerHTML = (pay ? ['p_how1', 'p_how2', 'p_how3'] : ['d_how1', 'd_how2', 'd_how3']).map(x => `<li>${esc(t(x))}</li>`).join('');
  $('#dlg-paynote').hidden = !pay; $('#dlg-paynote').textContent = pay ? t('d_paynote') : '';'''
OLD_BUY = "$('#dlg-buy').addEventListener('click', () => { const k = openK; closeWork(); openInquiry(A.id, k); });"
NEW_BUY = "$('#dlg-buy').addEventListener('click', () => { const k = openK, s = workStatus(A.pieces[k]); closeWork(); openInquiry(A.id, k, s === 'sold' ? 'id_pre_sold' : s === 'reserved' ? 'id_pre_res' : ''); });"


def f_cut(s, f):
    if 'studio v2' not in s: sys.exit(f'!! {os.path.basename(f)}: run tools/apply-studio-v2.py first')
    if CUT_CSS_MARK not in s: s = sub(s, '</style>', CUT_CSS + '</style>', 'end of <style>', f)
    s = sub(s, OLD_ART, NEW_ART, 'floor picture', f)
    s = sub(s, OLD_PR, NEW_PR, 'floor price', f)
    s = sub(s, OLD_WORKBTN, NEW_WORKBTN, 'floor button', f)
    s = sub(s, OLD_DEAL, NEW_DEAL, 'buy box', f)
    s = sub(s, OLD_FR, NEW_FR, 'dialog picture', f)
    s = sub(s, OLD_FILL, NEW_FILL, 'dialog fill', f)
    s = sub(s, OLD_BUY, NEW_BUY, 'buy button', f)
    return s


# ---------------------------------------------------------------- home page: cards + city/map in one place
OLD_CARD_ART = '<span class="art" style="--ar:${p.ar};--art:${artBg(a.works, k)}">${artImg(a, k)}</span>'
NEW_CARD_ART = '<span class="art" style="--ar:${p.ar};--art:${artBg(a.works, k)}">${artImg(a, k)}${stampHtml(p)}</span>'
OLD_CARD_PP = '<span class="pp">${usd(p.p)}</span>'
NEW_CARD_PP = '<span class="pp${workStatus(p) ? \' strike\' : \'\'}">${usd(p.p)}</span>${statusChip(p)}'
OLD_RET = "  return l;\n}\n/* mode:"
NEW_RET = "  return [...l.filter(x => workStatus(x.p) !== 'sold'), ...l.filter(x => workStatus(x.p) === 'sold')];   // sold works go last\n}\n/* mode:"
OLD_DIST = 'data-d="${esc(a.disc)}" data-w="${a.wave ? 1 : 0}" data-cur="FILTER" aria-pressed="false">'
NEW_DIST = 'data-id="${a.id}" data-d="${esc(a.disc)}" data-w="${a.wave ? 1 : 0}" data-cur="ENTER">'
OLD_DIST_SYNC = "el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); });"
NEW_DIST_SYNC = "el.classList.toggle('on', on); });"
OLD_MAPCLICK = "$('#map-grid').addEventListener('click', e => { const b = e.target.closest('.dist'); if (b) setFilter(b.dataset.d === curD ? '' : b.dataset.d); });"
NEW_MAPCLICK = "$('#map-grid').addEventListener('click', e => { const b = e.target.closest('.dist'); if (b) openStudio(b.dataset.id); });   // a district on the map = that artist's building"
VIEW_JS_MARK = '/* ===== city: buildings or map, in the same place ===== */'
VIEW_JS = VIEW_JS_MARK + '''
function setView(v) {
  const map = v === 'map';
  $('#map').hidden = !map; $('#strip').hidden = map; $('#progress').hidden = map;
  const pager = document.querySelector('.city .pager'); if (pager) pager.hidden = map;
  document.querySelectorAll('#vtog .vt').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
$('#vtog').addEventListener('click', e => { const b = e.target.closest('.vt'); if (b) setView(b.dataset.v); });
/* old links to "#map" (menu, footer, other pages) open the map view inside the City section */
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="#map"]'); if (a) setView('map'); }, true);
function mapFromHash() {
  if (location.hash !== '#map') return;
  setView('map');
  const go = () => { const el = document.querySelector('.city-tools'); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - 96); };
  go(); addEventListener('load', () => setTimeout(go, 50), {once: true});
}
addEventListener('hashchange', mapFromHash); mapFromHash();
'''
IDX_CSS_MARK = '/* ===== city: view switch + filters above the street, map in the same place ===== */'
IDX_CSS = IDX_CSS_MARK + '''
.city-tools{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;padding:0 3rem 1.8rem;}
.city-tools .filters{margin:0;gap:.6rem;}
.vtog{display:inline-flex;flex:none;border:var(--line) solid var(--black);box-shadow:4px 4px 0 var(--black);background:var(--paper);}
.vt{font:400 .95rem var(--anton);letter-spacing:.1em;text-transform:uppercase;padding:.55rem 1.05rem;border:0;background:none;cursor:pointer;color:var(--black);min-height:44px;}
.vt + .vt{border-left:var(--line) solid var(--black);}
.vt.on{background:var(--black);color:var(--paper);}
html[lang=th] .vt,html[lang=th] .fbtn{letter-spacing:.02em;}
.map-view{padding:0 3rem 1rem;}
.city [hidden]{display:none!important;}
.city .fnote{display:none!important;}
@media(max-width:860px){
  .city-tools{padding:0 1.2rem 1.3rem;gap:.9rem;}
  .city-tools .filters{flex-wrap:nowrap;overflow-x:auto;width:100%;padding:2px 8px 10px 2px;scrollbar-width:none;}
  .city-tools .filters::-webkit-scrollbar{display:none;}
  .city-tools .fbtn{flex:none;}
  .map-view{padding:0 1.2rem 1rem;}
}
'''


def f_index(s, f):
    if 'id="vtog"' in s:
        return s if IDX_CSS_MARK in s else sub(s, '</style>', IDX_CSS + '</style>', 'end of <style>', f)
    a = s.find('<section class="sec map-sec" id="map">')
    if a < 0: sys.exit('!! index.html: map section not found')
    b = s.index('</section>', a) + len('</section>')
    blk = s[a:b]
    filt = re.search(r'<div class="filters reveal" id="filters"[\s\S]*?<!--/pre:filters--></div>', blk).group(0).replace('class="filters reveal"', 'class="filters"')
    note = re.search(r'<div class="fnote off" id="fnote"[\s\S]*?</div>', blk).group(0)
    grid = re.search(r'<div class="map reveal" id="map-grid">[\s\S]*?<!--/pre:map--></div>', blk).group(0).replace('class="map reveal"', 'class="map"')
    tail = '\n\n<div class="tape-wrap" aria-hidden="true"><div class="tape-bar"></div></div>'
    if not s[b:].startswith(tail): sys.exit('!! index.html: unexpected layout after the map section')
    s = s[:a] + s[b + len(tail):].lstrip('\n')          # the map section and the tape strip after it go
    tools = ('  <div class="city-tools reveal">\n'
             '    <div class="vtog" id="vtog" role="group" data-t-aria="v_aria" aria-label="เลือกมุมมองเมือง">'
             '<button type="button" class="vt on" data-v="city" aria-pressed="true" data-t="v_city">ดูแบบตึก</button>'
             '<button type="button" class="vt" data-v="map" aria-pressed="false" data-t="v_map">ดูแบบแผนที่</button></div>\n'
             f'    {filt}\n    {note}\n  </div>\n')
    s = sub(s, '  <div class="strip" id="strip"', tools + '  <div class="strip" id="strip"', 'city street', f)
    prog = '  <div class="progress" id="progress" aria-hidden="true"><i id="progress-i"></i></div>\n'
    s = sub(s, prog, prog + f'  <div class="map-view" id="map" hidden>{grid}</div>\n', 'city progress bar', f)
    return sub(s, '</style>', IDX_CSS + '</style>', 'end of <style>', f)


def f_site(s, f):
    s = sub(s, OLD_CARD_ART, NEW_CARD_ART, 'card picture', f)
    s = sub(s, OLD_CARD_PP, NEW_CARD_PP, 'card price', f)
    s = sub(s, OLD_RET, NEW_RET, 'works order', f)
    s = sub(s, OLD_DIST, NEW_DIST, 'map district', f)
    s = sub(s, OLD_DIST_SYNC, NEW_DIST_SYNC, 'map highlight', f)
    s = sub(s, OLD_MAPCLICK, NEW_MAPCLICK, 'map click', f)
    return s if VIEW_JS_MARK in s else s.rstrip('\n') + '\n\n' + VIEW_JS


edit(P('artists.js'), f_artists)
edit(P('circles.js'), f_circles)
edit(P('circles.css'), f_css)
for f in [P('cutaway.html')] + sorted(glob.glob(P('studio-*.html'))): edit(f, f_cut)
edit(P('site.js'), f_site)
edit(P('index.html'), f_index)
print('done. Later, run  node tools/build.mjs  so the pre-rendered pages pick up the changes too.')
