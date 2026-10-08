#!/usr/bin/env python3
"""Studio pages v2: easier to read, easier to buy, more like a gallery.
 · each floor: the work under a spotlight + a museum wall label (title, year/size, price, "view & buy")
 · detail window: the work hangs on a dark lit wall; artist line; compact specs; a buy box with
   "how buying works" in 3 steps; thumbnails of every work in the building
 · every work gets its story: a one-line meaning on the wall label, and where it came from in the detail window
 · Thai text no longer gets the wide letter-spacing meant for English capitals
Patches cutaway.html, every studio-*.html (same template) adds the new words to circles.js and the stories to artists.js.
Run from the site folder:  python3 tools/apply-studio-v2.py      (safe to run again)"""
import os, glob, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE) if os.path.basename(HERE) == 'tools' else os.getcwd()
MARK = '/* ===== studio v2 ===== */'

CSS = MARK + r'''
/* floor: spotlight + wall label, the whole thing is one button */
.tower .room{height:auto;min-height:330px;padding:3.2rem 1.4rem 2.6rem;background:repeating-conic-gradient(rgba(244,241,232,.2) 0 25%,transparent 0 50%) 0 100%/28px 28px repeat-x,radial-gradient(ellipse at 50% 0,rgba(244,241,232,.06),transparent 70%),#141211;}
.work{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.1rem 1.6rem;margin-top:0;transition:none;}
.work::before{display:none;}
.work:hover,.work:focus-visible{transform:none;}
.work:focus-visible{outline-offset:10px;}
.work .aw{position:relative;isolation:isolate;display:block;transition:transform .5s var(--ease);}
.work .aw::after{content:"";position:absolute;inset:-10px;background:var(--gold);transform:translate(8px,8px);z-index:-1;transition:transform .5s var(--ease);}
.work .beam{position:absolute;left:50%;bottom:-60px;width:calc(100% + 190px);height:720px;transform:translateX(-50%);z-index:-2;pointer-events:none;
  clip-path:polygon(43% 0,57% 0,100% 100%,0 100%);background:linear-gradient(180deg,rgba(244,241,232,.24),rgba(244,241,232,.07) 75%,rgba(244,241,232,.02));opacity:.6;transition:opacity .6s var(--ease);}
.work:hover .aw,.work:focus-visible .aw{transform:translateY(-7px);}
.work:hover .aw::after,.work:focus-visible .aw::after{transform:translate(13px,14px);}
.work:hover .beam,.work:focus-visible .beam{opacity:1;}
.lbl{position:relative;display:grid;gap:.35rem;justify-items:start;text-align:left;width:212px;background:var(--paper);color:var(--black);border:2px solid var(--black);box-shadow:0 0 0 3px var(--paper),0 0 0 4px var(--gold);padding:.85rem .9rem .8rem;}
.lbl .tape{position:absolute;top:-11px;left:-14px;width:54px;height:20px;margin:0;background:var(--pink);border:2px solid var(--black);transform:rotate(-14deg);}
.lbl small{font:400 .72rem var(--type);letter-spacing:.06em;color:var(--tartan-red);}
.lbl b{font:400 1.05rem/1.35 "Chonburi",var(--thai);}
.lbl .q{font:400 .8rem/1.5 var(--thai);color:#4a4642;text-wrap:balance;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
html[lang=en] .lbl .q{font:italic 400 .86rem/1.4 "Playfair Display",Georgia,serif;}
.lbl .pr{font:400 1.25rem/1 var(--anton);letter-spacing:.04em;background:var(--pink);border:2px solid var(--black);padding:.12rem .45rem .08rem;margin-top:.15rem;}
.lbl .go{font:600 .82rem var(--thai);border-bottom:3px solid var(--pink);padding:.05rem 0;margin-top:.2rem;transition:background .3s var(--ease),padding .3s var(--ease);}
.work:hover .go,.work:focus-visible .go{background:var(--black);color:var(--paper);border-color:var(--black);padding:.05rem .4rem;}
.plaque{bottom:auto;top:46px;}

/* detail window */
dialog.work-dlg{width:min(980px,94vw);}
.dlg-art{position:relative;overflow:hidden;isolation:isolate;background:radial-gradient(ellipse 58% 16% at 50% 94%,rgba(244,241,232,.13),transparent 70%),repeating-linear-gradient(90deg,rgba(244,241,232,.035) 0 1px,transparent 1px 40px),#141211;padding:3rem 2rem;min-height:440px;}
.dlg-art::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:120%;transform:translateX(-50%);z-index:-1;clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);background:linear-gradient(180deg,rgba(244,241,232,.26),rgba(244,241,232,.05));}
.dlg-art::after{content:"";position:absolute;left:50%;top:0;width:46px;height:12px;margin-left:-23px;background:var(--gold);border:2px solid var(--black);border-top:0;border-radius:0 0 8px 8px;}
.dlg-art .frame{max-width:400px;max-height:66vh;}
.dlg-body{padding:2rem 1.8rem 1.6rem;gap:.9rem;}
.dlg-body h2{font-size:clamp(1.8rem,3.6vw,2.4rem);padding-right:3rem;}
.dlg-by{font:400 .98rem/1.6 var(--thai);color:#3a3733;}
.dlg-by b{font-weight:600;color:var(--black);}
.dlg-story{display:grid;gap:.4rem;padding:.1rem 0 .1rem 1rem;border-left:4px solid var(--pink);}
.dlg-story[hidden]{display:none;}
.dlg-story small{font:400 .72rem var(--type);letter-spacing:.14em;text-transform:uppercase;color:var(--tartan-red);}
html[lang=th] .dlg-story small{font:600 .8rem var(--thai);letter-spacing:.01em;}
.dlg-story blockquote{font:400 1.08rem/1.5 "Chonburi",var(--thai);text-wrap:balance;}
html[lang=en] .dlg-story blockquote{font:italic 500 1.2rem/1.35 "Playfair Display",Georgia,serif;}
.dlg-story p{font:400 .9rem/1.7 var(--thai);color:#3a3733;}
.dlg-body dl{grid-template-columns:max-content max-content 1fr;column-gap:1.6rem;gap:0 1.6rem;border-top:2px solid var(--black);}
.dlg-body dl > div{padding:.55rem .2rem;border-bottom:1px dashed rgba(14,13,12,.3);}
.dlg-body dl > div{padding:.5rem 0;}
.dlg-body dd{font:400 .98rem/1.5 var(--thai);}
.dlg-deal{display:grid;gap:.85rem;background:#fff;border:var(--line) solid var(--black);box-shadow:6px 6px 0 var(--black);padding:1rem 1rem 1.1rem;margin-top:.3rem;}
.dlg-pr{display:flex;align-items:center;gap:.9rem;flex-wrap:wrap;}
.dlg-pr small{font:400 .8rem/1.45 var(--thai);color:#4a4642;max-width:15em;}
.dlg-deal .btn{display:block;width:100%;text-align:center;}
.dlg-how{list-style:none;counter-reset:s;display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;}
.dlg-how li{counter-increment:s;text-wrap:balance;display:grid;gap:.25rem;justify-items:start;font:400 .76rem/1.4 var(--thai);color:#3a3733;}
.dlg-how li::before{content:counter(s);display:grid;place-items:center;width:1.45rem;height:1.45rem;border-radius:50%;background:var(--black);color:var(--gold);font:400 .78rem var(--anton);}
.dlg-nav{display:flex;align-items:center;gap:.55rem;padding-top:.4rem;}
.dlg-nav > button{width:38px;height:38px;flex:none;border:2px solid var(--black);background:var(--paper);font:400 1rem var(--anton);cursor:pointer;color:var(--black);}
.dlg-nav > button:hover:not(:disabled){background:var(--gold);}
.dlg-nav > button:disabled{opacity:.25;cursor:default;}
.dlg-th{display:flex;gap:.45rem;overflow-x:auto;padding:4px;}
.dlg-th .th{position:relative;flex:none;width:46px;height:46px;overflow:hidden;border:2px solid var(--black);background:var(--art);cursor:pointer;padding:0;opacity:.6;transition:opacity .3s var(--ease);}
.dlg-th .th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.dlg-th .th:hover,.dlg-th .th.on{opacity:1;}
.dlg-th .th.on{outline:3px solid var(--pink);outline-offset:1px;}
.dlg-cnt{margin-left:auto;font:400 .8rem var(--type);letter-spacing:.08em;white-space:nowrap;}

/* Thai has no capitals: the wide tracking meant for English caps pulls Thai words apart */
html[lang=th] .btn,html[lang=th] .dlg-body dt,html[lang=th] .hint,html[lang=th] .back{letter-spacing:.01em;}
html[lang=th] .roof b{letter-spacing:.1em;}
html[lang=th] .dlg-deal .btn{font-size:1.15rem;}

@media(max-width:860px){
  .tower .room{min-height:0;padding:3rem .8rem 2.4rem;}
  .work{gap:1rem;}
  .lbl{width:min(100%,230px);}
  .plaque{top:42px;}
  .dlg-art{min-height:280px;padding:2.4rem 1.2rem 1.8rem;}
  .dlg-art .frame{max-width:250px;max-height:44vh;}
  .dlg-body{padding:1.4rem 1.1rem 1.2rem;}
  .dlg-how{grid-template-columns:1fr;gap:.35rem;}
  .dlg-body dl{grid-template-columns:1fr 1fr;}.dlg-body dl > div.w{grid-column:1 / -1;}
  .dlg-how li{grid-template-columns:auto 1fr;align-items:center;gap:.5rem;}
}
@media(hover:none){.work:hover:not(:focus-visible) .aw{transform:none;}.work:hover:not(:focus-visible) .aw::after{transform:translate(8px,8px);}.work:hover:not(:focus-visible) .go{background:none;color:inherit;border-color:var(--pink);padding:.05rem 0;}}
@media(prefers-reduced-motion:reduce){.work .aw,.work .beam{transition:none;}}
'''

# the story behind every work: q = one line (what it means), st = where it came from (2-3 sentences)
STORIES = {
  'art/napha-1.svg': dict(
    q='หมอกที่บังภูเขา ทำให้เราอยากมองหาภูเขามากกว่าเดิม', qEn='Fog hides the mountain, so you look harder for it.',
    st='วาดจากระเบียงบ้านที่เชียงใหม่ตอนหกโมงเช้าทุกวันตลอดหน้าหนาวหนึ่ง นภาทาสีบาง ๆ ทับกันกว่าสามสิบชั้นจนภูเขาเกือบหายไป ให้คนดูรู้สึกเหมือนตอนรอหมอกจาง ว่าสิ่งที่มองไม่เห็นก็ยังอยู่ตรงนั้น',
    stEn="Painted from Napha's balcony in Chiang Mai at six every morning for one winter. More than thirty thin layers bury the mountain almost completely, so the painting feels like waiting for fog to lift: what you can't see is still there."),
  'art/napha-2.svg': dict(
    q='ร่มเงาที่ทุกคนเคยมี', qEn='The shade everyone once had.',
    st='ต้นจามจุรีหน้าบ้านยายถูกตัดตอนขยายถนน นภาเลยวาดแค่เงาของมัน ไม่วาดต้นไม้ ถ่านที่ใช้ก็เผาจากกิ่งของต้นนั้นเอง ภาพนี้จึงเป็นทั้งร่มเงาและอนุสรณ์ในคราวเดียว',
    stEn="The rain tree outside grandma's house was cut down when the road was widened, so Napha painted only its shadow, never the tree. The charcoal was burned from its own branches, which makes the piece both a patch of shade and a memorial."),
  'art/napha-3.svg': dict(
    q='ห้องที่เคยเต็มไปด้วยเสียงคน', qEn='A room that used to be full of voices.',
    st='ห้องเช่าห้องแรกของนภา วาดในวันที่ขนของออกหมด เหลือแค่รอยสีจาง ๆ บนผนังตรงที่เคยแขวนรูป และวาดลงบนแผ่นไม้ที่เคยเป็นบานประตูห้องนั้น',
    stEn="Napha's first rented room, painted on moving-out day, when only the pale outlines of old picture frames were left on the walls. It is painted on that room's own door."),

  'art/thara-1.svg': dict(
    q='ฝนทำให้ถนนกลายเป็นกระจก', qEn='Rain turns the street into a mirror.',
    st='ถ่ายที่เยาวราชตอนห้าทุ่ม หลังฝนตกหนักจนร้านปิดเกือบหมด ไฟป้ายที่เหลือสะท้อนบนถนนจนเมืองดูเหมือนกลับหัว ธาราอัดภาพนี้ในห้องมืดสิบสี่รอบกว่าจะได้สีดำที่ต้องการ',
    stEn='Shot in Yaowarat at 11 p.m., after a downpour had closed almost every shop. The last neon signs reflect off the road until the city looks upside down. Thara printed it fourteen times in the darkroom to get the black right.'),
  'art/thara-2.svg': dict(
    q='ทุกคนในเมืองกำลังรออะไรสักอย่าง', qEn='Everyone in the city is waiting for something.',
    st='ชายคนหนึ่งยืนรอรถเมล์ใต้ร่มขาด ๆ อยู่เกือบชั่วโมง ธาราถ่ายไว้ทั้งม้วน แต่เลือกเฟรมเดียวที่เขาไม่ได้มองถนนแล้ว เพราะนั่นคือวินาทีที่เขาเลิกหวังว่ารถจะมา',
    stEn="A man waited almost an hour for the bus under a broken umbrella. Thara shot the whole roll but chose the one frame where he has stopped looking up the road: the second he gave up on the bus."),
  'art/thara-3.svg': dict(
    q='จากข้างบน ร่มทุกคันดูเหมือนกันหมด', qEn='From above, every umbrella looks the same.',
    st='ถ่ายจากสะพานลอยย่านสีลมตอนเลิกงาน ร่มหลายร้อยคันไหลไปทางเดียวกันเหมือนแม่น้ำ ธาราอยากให้เห็นว่าคนแปลกหน้าในเมืองใหญ่เดินไปด้วยกันอยู่แล้ว แม้ไม่มีใครรู้ตัว',
    stEn='Taken from a footbridge in Silom at rush hour, as hundreds of umbrellas flowed one way like a river. Strangers in a big city are already walking together, Thara says, even if none of them notice.'),
  'art/thara-4.svg': dict(
    q='สิบนาทีที่ทั้งเมืองกลายเป็นสีส้ม', qEn='The ten minutes when the whole city turns orange.',
    st='ฟิล์มสไลด์ม้วนสุดท้ายที่หมดอายุมาห้าปี ถ่ายตอนฝนเพิ่งหยุดและแดดเย็นลอดเมฆลงมา สีที่เพี้ยนไปเพราะฟิล์มเก่า ธาราตั้งใจเก็บไว้แบบนั้น ไม่ได้แก้',
    stEn='The last roll of slide film, five years past its date, shot just as the rain stopped and low sun broke through the clouds. The strange colours come from the old film, and Thara kept them on purpose.'),

  'art/kwan-1.svg': dict(
    q='เด็กที่มีลมเป็นเพื่อนสนิท', qEn='A child whose best friend is the wind.',
    st='เด็กคนนี้เกิดในสมุดวาดตอนขวัญอายุเก้าขวบ ตอนที่ไม่มีผู้ใหญ่คนไหนฟังจนจบประโยค ขวัญเลยวาดให้ลมเป็นคนฟังแทน ภาพนี้คือครั้งแรกที่ขวัญกลับมาวาดเธออีกครั้งในฐานะผู้ใหญ่',
    stEn="This girl was born in Kwan's sketchbook at age nine, when no grown-up listened to the end of a sentence, so Kwan drew the wind to listen instead. This is the first time Kwan has drawn her again as a grown-up."),
  'art/kwan-2.svg': dict(
    q='โลกทั้งใบที่อยู่หลังรั้วบ้าน', qEn='A whole world behind the back fence.',
    st='สวนหลังบ้านเก่าของแม่ มีมะละกอ พริก และไก่สามตัวที่ไม่มีใครตั้งชื่อ ขวัญวาดจากความจำในสัปดาห์ที่บ้านหลังนั้นถูกขาย ใส่ทุกอย่างที่อยากให้ยังอยู่ลงไปในกระดาษแผ่นเดียว',
    stEn="Mum's old back garden: papaya, chillies and three chickens nobody ever named. Kwan drew it from memory the week the house was sold, fitting everything worth keeping onto a single sheet."),
  'art/kwan-3.svg': dict(
    q='รถไฟที่ไม่มีสถานีปลายทาง', qEn='A train with no last stop.',
    st='รถไฟสายอีสานที่ขวัญนั่งกลับบ้านทุกสงกรานต์ วาดให้ลอยข้ามทุ่งนาขึ้นไปบนฟ้า ผู้โดยสารทุกคนคือคนที่ขวัญเคยเจอบนรถไฟจริง ๆ ใช้เวลาวาดสี่เดือน จนข้อมือขอลาพัก',
    stEn='The northeastern line Kwan rides home every Songkran, drawn floating over the rice fields into the sky. Every passenger is someone Kwan really met on that train. Four months of drawing, until the wrist asked for leave.'),

  'art/phum-1.svg': dict(
    q='รอยร้าวคือลายเซ็นของไฟ', qEn="The crack is the fire's signature.",
    st='เผาในเตาฟืนสามวันสามคืน ตอนเปิดเตาเจอรอยร้าวพาดกลางใบ ภูมิไม่ทิ้ง แต่ลงรักปิดทองตามรอยร้าว เพราะของที่เคยแตกแล้วซ่อมได้ แข็งแรงกว่าของที่ไม่เคยแตกเลย',
    stEn='Fired for three days and nights in the wood kiln, it came out with a crack straight down the middle. Phum kept it and traced the crack in lacquer and gold leaf, because something broken and mended is stronger than something that never broke.'),
  'art/phum-2.svg': dict(
    q='ถ้วยที่จับแล้วรู้ว่ามีคนปั้น', qEn='A cup that tells you someone made it.',
    st='ปั้นให้พอดีมือพ่อที่ดื่มชาทุกเช้าตอนตีห้า เคลือบด้วยขี้เถ้าจากฟืนในเตาเดียวกัน แต่ละใบจึงมีสีไม่ซ้ำกัน และมีรอยนิ้วโป้งของภูมิอยู่ตรงที่จับ',
    stEn="Shaped to fit the hand of Phum's father, who drinks tea every morning at five. The glaze is ash from the kiln's own firewood, so no two cups share a colour, and each keeps Phum's thumbprint where you hold it."),

  'art/irene-1.svg': dict(
    q='เสื้อเก่าสิบตัว กลายเป็นผ้าผืนเดียว', qEn='Ten old shirts, one new cloth.',
    st='ด้ายมาจากเสื้อยืดเก่าที่เพื่อนบ้านเอามาให้ ไอรีนแกะออกทีละเส้น ย้อมคราม แล้วทอด้วยกี่ของยาย ลายบนผ้าคือแผนที่ว่าเส้นไหนมาจากเสื้อของใคร',
    stEn="The thread comes from old T-shirts the neighbours brought over. Irene unpicked them strand by strand, dyed them indigo and wove them on grandma's loom. The pattern is a map of whose shirt each line came from."),
  'art/irene-2.svg': dict(
    q='ด้ายที่หลุดคือส่วนที่ซื่อสัตย์ที่สุด', qEn='The loose ends are the honest part.',
    st='ผ้าแขวนยาวสองเมตรที่ไอรีนทอไปแค่ครึ่งเดียว แล้วปล่อยให้ด้ายที่เหลือห้อยลงมาถึงพื้น เหมือนเรื่องที่ยังเล่าไม่จบ ปลายด้านล่างจะตกไม่เหมือนเดิมทุกครั้งที่แขวน',
    stEn='A two-metre hanging Irene wove only halfway, letting the rest of the thread fall to the floor like a story that is not finished yet. The bottom edge falls differently every time it goes on a wall.'),
  'art/irene-3.svg': dict(
    q='ผ้าที่ทอไว้ให้ใครสักคนอุ่น', qEn='Woven to keep someone warm.',
    st='ลายนี้ยายเคยทอให้แม่ในวันแต่งงาน ไอรีนทอซ้ำจากความจำโดยไม่มีผืนต้นแบบ ใช้เวลาเจ็ดเดือน ด้านหนึ่งเป็นไหม อีกด้านเป็นฝ้าย เพราะชีวิตมีทั้งวันพิเศษและวันธรรมดา',
    stEn="Grandma once wove this pattern for Irene's mother's wedding. Irene rewove it from memory, with no original to copy, over seven months. One side is silk and the other cotton: for the special days and the ordinary ones."),

  'art/dao-1.svg': dict(
    q='ข่าวเมื่อวานที่ไม่มีใครอ่านจบ', qEn="Yesterday's news nobody finished reading.",
    st='หนังสือพิมพ์ปี 2535 กองหนึ่งจากตลาดนัด ดาวตัดเฉพาะข่าวเล็ก ๆ ตรงมุมล่างที่ไม่เคยได้ขึ้นหน้าหนึ่ง แล้วแปะให้มันกลายเป็นพาดหัวที่ใหญ่ที่สุดในภาพ',
    stEn='A pile of 1992 newspapers from the flea market. Dao cut out only the tiny stories from the bottom corners that never made the front page, and pasted them up into the biggest headline in the picture.'),
  'art/dao-2.svg': dict(
    q='ภูเก็ตที่ไม่มีอยู่ในโปสการ์ด', qEn="The Phuket that isn't on the postcards.",
    st='ตึกทุกหลังตัดมาจากใบปลิวขายคอนโด แต่คนทุกคนในภาพตัดมาจากรูปชาวบ้านในหนังสือพิมพ์ท้องถิ่น ดาวอยากให้เมืองที่กำลังถูกขายให้นักท่องเที่ยว มีคนที่อยู่จริงกลับเข้าไปอยู่ในนั้นบ้าง',
    stEn='Every building is cut from condo sales flyers, but every person is cut from local newspaper photos of people who actually live there. Dao wanted the residents back inside a city that is being sold to tourists.'),
  'art/dao-3.svg': dict(
    q='จดหมายที่ไม่เคยถูกส่ง', qEn='Letters that were never sent.',
    st='จดหมายรักเก่ามัดหนึ่งที่ดาวเจอในลิ้นชักโต๊ะมือสอง ไม่มีซองไหนติดแสตมป์เลย ดาวตัดเฉพาะคำลงท้ายของทุกฉบับมาเรียงกัน คนเขียนไม่กล้าส่ง ดาวเลยเอามาแขวนให้คนอื่นได้อ่านแทน',
    stEn='A bundle of old love letters Dao found in a second-hand desk drawer, not one envelope stamped. Dao cut out only the sign-offs and laid them side by side. The writer never dared to send them, so now they hang where people can read them.'),

  'art/mali-1.svg': dict(
    q='สามสีที่ไม่เคยตรงกันพอดี', qEn='Three colours that never quite line up.',
    st='พิมพ์ทีละสี ชมพู เหลือง ฟ้า ด้วยเครื่องริโซที่ช่วยออกมาจากโรงเรียนที่ปิดตัว ทุกแผ่นเหลื่อมไม่เท่ากัน มะลิเลยนับว่าแต่ละแผ่นเป็นงานต้นฉบับ ไม่ใช่สำเนา',
    stEn='Printed one colour at a time (pink, yellow, blue) on the risograph rescued from a school that closed. Every sheet slips out of register in its own way, so Mali counts each one as an original, not a copy.'),
  'art/mali-2.svg': dict(
    q='หนังสือเล่มเล็กที่สุด ที่พูดเรื่องใหญ่', qEn='The smallest book about a big thing.',
    st='กระดาษแผ่นเดียวพับเป็นแปดหน้า เล่าเรื่องห้องสมุดโรงเรียนที่ถูกปิด กับเครื่องพิมพ์ที่รอดออกมาได้ มะลิแจกฟรีที่ตลาดนัดไปแล้วสามร้อยเล่ม ชุดนี้คือเล่มที่เหลือพร้อมลายเซ็น',
    stEn='One sheet folded into eight pages, telling the story of a school library that closed and the printer that made it out. Mali has handed out three hundred free at the market; these are the last signed copies.'),
  'art/mali-3.svg': dict(
    q='ตลาดเช้าเชียงรายในหมึกสี่สี', qEn="Chiang Rai's morning market in four inks.",
    st='มะลิไปตลาดเช้าทุกวันอาทิตย์อยู่หนึ่งปี จดสีของผัก ผ้า และร่มแม่ค้า แล้วตัดให้เหลือแค่หมึกสี่สีที่เครื่องมี ภาพนี้คือตลาดเดิม ในแบบที่เครื่องพิมพ์เก่าเห็น',
    stEn="Mali went to the morning market every Sunday for a year, noting the colours of the vegetables, fabrics and vendors' umbrellas, then cut them down to the four inks the machine has. It is the same market, as an old printer sees it."),

  'art/phop-1.svg': dict(
    q='ลมที่มองไม่เห็น ถูกวาดด้วยสมการ', qEn='Invisible wind, drawn with an equation.',
    st='ภพเอาข้อมูลลมจริงของกรุงเทพฯ ในวันที่ฝุ่นหนักที่สุดของปีมาแปลงเป็นเส้นหมึกกว่าหมื่นเส้น ตรงไหนที่เส้นอัดกันแน่น คือตรงที่ลมหยุดและฝุ่นค้างอยู่',
    stEn="Phop turned real wind data from Bangkok's worst smog day of the year into more than ten thousand ink lines. Where the lines crowd together is where the wind stalled and the dust stayed."),
  'art/phop-2.svg': dict(
    q='ทุกอย่างวนกลับมา แต่ไม่เคยตรงที่เดิม', qEn='Everything comes round again, never to the same spot.',
    st='วงกลม 365 วง หนึ่งวงต่อหนึ่งวันในปีที่ภพลาออกจากงานประจำ แต่ละวงเหลื่อมไปนิดเดียวตามจำนวนชั่วโมงที่ได้นอนในคืนนั้น พิมพ์ทั้งหมด 12 แผ่น',
    stEn='365 circles, one for each day of the year Phop left an office job. Each one shifts slightly by the hours of sleep that night. An edition of 12.'),
  'art/phop-3.svg': dict(
    q='ทะเลสงบ ที่ทำจากเส้นตรงล้วน ๆ', qEn='A calm sea made of nothing but straight lines.',
    st='ตารางเส้นตรงที่ถูกดัดทีละนิดด้วยข้อมูลความสูงคลื่นทะเลอันดามันตลอดหนึ่งปี ปากกาทั้งสามด้ามหมึกหมดกลางทางคนละจังหวะ ภาพนี้จึงทำซ้ำไม่ได้อีก',
    stEn='A grid of straight lines bent, little by little, by a year of Andaman Sea wave-height data. All three pens ran dry at different moments mid-drawing, so this one can never be made again.'),

  'art/phrae-1.svg': dict(
    q='ภาพสุดท้ายก่อนวิดีโอคอลค้าง', qEn='The last frame before the video call froze.',
    st='แพรแคปหน้าจอไว้ตอนวิดีโอคอลกับเพื่อนที่ย้ายไปอยู่ต่างประเทศแล้วเน็ตหลุด ภาพแตกเป็นเหลี่ยมพอดีตอนเพื่อนกำลังหัวเราะ แพรไม่ได้ซ่อมไฟล์ แต่ขยายจนเห็นทุกพิกเซล',
    stEn='Phrae took a screenshot the moment a video call with a friend who had moved abroad dropped out. The picture broke into blocks just as the friend was laughing. Instead of repairing the file, Phrae enlarged it until every pixel shows.'),
  'art/phrae-2.svg': dict(
    q='จัดระเบียบจนจำไม่ได้', qEn="Sorted so neatly it's unrecognisable.",
    st='รูปทุ่งทานตะวันที่ลพบุรีถูกเรียงพิกเซลใหม่ทั้งหมดจากมืดไปสว่าง สีทุกเม็ดยังอยู่ครบ แค่ไม่อยู่ที่เดิม เหมือนความทรงจำที่นึกออกแต่เรียงลำดับไม่ถูก',
    stEn="A photo of a sunflower field in Lop Buri, every pixel re-sorted from dark to light. All the colour is still there, just not where it was, like a memory you can recall but can't put back in order."),
  'art/phrae-3.svg': dict(
    q='ไฟล์ที่เปิดไม่ได้ แต่ยังสวย', qEn="A file that won't open, but is still beautiful.",
    st='รูปครอบครัวจากฮาร์ดดิสก์เก่าที่พัง เปิดได้แค่ครึ่งบน ที่เหลือกลายเป็นแถบสี แพรพิมพ์ลงอะคริลิกใสให้แสงลอดผ่าน เพราะสิ่งที่หายไปแล้วก็ยังให้แสงผ่านได้',
    stEn='A family photo from a dead hard drive: only the top half still opens, and the rest has turned into bands of colour. Phrae printed it on clear acrylic so light passes through, because what is lost can still let light in.'),

  'art/pan-1.svg': dict(
    q='ใต้ดินมีอินเทอร์เน็ตของต้นไม้', qEn="There's an internet for trees underground.",
    st='ป่านเพาะเส้นใยเห็ดบนแผ่นไม้ไผ่นานหกสัปดาห์ ปล่อยให้มันหาทางเชื่อมจุดอาหารเองจนเป็นเส้นทางคล้ายแผนที่รถไฟ แล้วหยุดการเติบโตไว้ในวันที่เส้นสวยที่สุด',
    stEn='Pan grew mycelium on bamboo board for six weeks, letting it find its own way between food points until it looked like a rail map, then stopped it growing on the day the lines looked best.'),
  'art/pan-2.svg': dict(
    q='ลายนิ้วมือของเห็ดหนึ่งดอก', qEn='The fingerprint of a single mushroom.',
    st='วางดอกเห็ดคว่ำบนกระดาษสาทิ้งไว้สิบแปดชั่วโมง สปอร์ที่ร่วงลงมาวาดเส้นรัศมีที่ไม่มีมือใครทำได้ เห็ดแต่ละดอกให้ลายไม่เหมือนกัน ป่านแค่เลือกคืนที่อากาศชื้นพอ',
    stEn="A mushroom cap left face-down on mulberry paper for eighteen hours. The falling spores draw radiating lines no hand could make, and every mushroom leaves a different one. Pan's only job was choosing a humid enough night."),
  'art/pan-3.svg': dict(
    q='งานศิลปะที่ยังมีชีวิต และยังโตต่อได้', qEn="Art that's still alive, and still growing.",
    st='แผ่นเส้นใยเห็ดที่ยังมีชีวิต ผิวจะค่อย ๆ เปลี่ยนสีและนูนขึ้นตามความชื้นในบ้านของคนซื้อ ป่านอยากให้งานชิ้นนี้ไม่มีวันเสร็จ แต่เติบโตไปพร้อมกับเจ้าของ (รดน้ำเดือนละครั้ง)',
    stEn='A living mycelium panel whose surface slowly changes colour and swells with the humidity of its new home. Pan wanted a piece that is never finished, one that grows along with its owner. (Water once a month.)'),
}

OLD_BTN = '''            <i class="tape"></i><span class="art" style="--ar:${A.pieces[k].ar};--h:${frameH(A.pieces[k].ar)}px;--art:${artBg(A.works, k)}">${artImg(A, k)}</span>
            <span class="cap">${esc(pk(A.pieces[k], 't'))} · ${usd(A.pieces[k].p)}</span>'''
NEW_BTN = '''            <span class="aw"><i class="beam"></i><span class="art" style="--ar:${A.pieces[k].ar};--h:${frameH(A.pieces[k].ar)}px;--art:${artBg(A.works, k)}">${artImg(A, k)}</span></span>
            <span class="lbl"><i class="tape"></i><small>${A.pieces[k].y} · ${esc(fmtSize(A.pieces[k]))}</small><b>${esc(pk(A.pieces[k], 't'))}</b>${A.pieces[k].q ? `<i class="q">“${esc(pk(A.pieces[k], 'q'))}”</i>` : ''}<span class="pr">${usd(A.pieces[k].p)}</span><span class="go">${esc(t('cw_look'))}</span></span>'''

OLD_DLG = '''      <dl id="dlg-dl"></dl>
      <div class="dlg-price" id="dlg-price"></div>
      <div class="dlg-act"><button type="button" class="btn pk" id="dlg-buy"></button></div>
      <div class="dlg-pn"><button type="button" id="dlg-prev"></button><button type="button" id="dlg-next"></button></div>'''
NEW_DLG = '''      <p class="dlg-by" id="dlg-by"></p>
      <div class="dlg-story" id="dlg-story"><small id="dlg-sk"></small><blockquote id="dlg-q"></blockquote><p id="dlg-st"></p></div>
      <dl id="dlg-dl"></dl>
      <div class="dlg-deal">
        <div class="dlg-pr"><div class="dlg-price" id="dlg-price"></div><small id="dlg-pnote"></small></div>
        <button type="button" class="btn pk" id="dlg-buy"></button>
        <ol class="dlg-how" id="dlg-how"></ol>
      </div>
      <div class="dlg-nav"><button type="button" id="dlg-prev">←</button><div class="dlg-th" id="dlg-th"></div><button type="button" id="dlg-next">→</button><span class="dlg-cnt" id="dlg-cnt"></span></div>'''

OLD_FILL = '''  $('#dlg-dl').innerHTML = `<dt>${esc(t('lb_artist'))}</dt><dd>${esc(nameL(A))}</dd><dt>${esc(t('lb_year'))}</dt><dd>${p.y}</dd><dt>${esc(t('lb_medium'))}</dt><dd>${esc(pk(p, 'm'))}</dd><dt>${esc(t('lb_size'))}</dt><dd>${esc(fmtSize(p))}</dd>`;
  $('#dlg-price').textContent = usd(p.p);
  $('#dlg-buy').textContent = t('buy', {a: nameL(A)});
  const pv = $('#dlg-prev'), nx = $('#dlg-next');
  pv.textContent = t('w_prev'); nx.textContent = t('w_next'); pv.disabled = k === 0; nx.disabled = k === A.pieces.length - 1;'''
NEW_FILL = '''  $('#dlg-by').innerHTML = t('d_by', {a: esc(nameL(A)), d: esc(discL(A)), c: esc(cityL(A))});
  const story = $('#dlg-story'); story.hidden = !p.st;
  if (p.st) { $('#dlg-sk').textContent = t('d_story'); $('#dlg-q').textContent = pk(p, 'q') || ''; $('#dlg-st').textContent = pk(p, 'st'); }
  $('#dlg-dl').innerHTML = `<div><dt>${esc(t('lb_year'))}</dt><dd>${p.y}</dd></div><div><dt>${esc(t('lb_size'))}</dt><dd>${esc(fmtSize(p))}</dd></div><div class="w"><dt>${esc(t('lb_medium'))}</dt><dd>${esc(pk(p, 'm'))}</dd></div>`;
  $('#dlg-price').textContent = usd(p.p);
  $('#dlg-pnote').textContent = t('d_note');
  $('#dlg-buy').textContent = t('buy', {a: nameL(A)});
  $('#dlg-how').innerHTML = ['d_how1', 'd_how2', 'd_how3'].map(x => `<li>${esc(t(x))}</li>`).join('');
  const pv = $('#dlg-prev'), nx = $('#dlg-next'), n = A.pieces.length;
  pv.setAttribute('aria-label', t('w_prev')); nx.setAttribute('aria-label', t('w_next')); pv.disabled = k === 0; nx.disabled = k === n - 1;
  $('#dlg-th').innerHTML = A.pieces.map((q, j) => `<button type="button" class="th${j === k ? ' on' : ''}" data-th="${j}" style="--art:${artBg(A.works, j)}" aria-label="${esc(pk(q, 't'))}"${j === k ? ' aria-current="true"' : ''}>${artImg(A, j)}</button>`).join('');
  $('#dlg-cnt').textContent = `${k + 1} / ${n}`;'''

OLD_WIRE = "$('#dlg-next').addEventListener('click', () => { if (openK < A.pieces.length - 1) openWork(openK + 1); });"
NEW_WIRE = OLD_WIRE + "\n$('#dlg-th').addEventListener('click', e => { const b = e.target.closest('[data-th]'); if (b) openWork(+b.dataset.th); });"

STR_TH_AT, STR_EN_AT = "w_next:'ชิ้นถัดไป →',", "w_next:'Next work →',"
STR_TH = (" cw_look:'ดูรายละเอียด · ซื้อ →', d_by:'โดย <b>{a}</b> · {d} · {c}', d_note:'ราคาที่ศิลปินตั้งเอง ไม่มีค่าคอมมิชชัน', d_story:'ที่มาของงานชิ้นนี้',"
          " d_how1:'ส่งข้อความถึงศิลปิน', d_how2:'คุยเรื่องราคาและการจัดส่ง', d_how3:'จ่ายเงินให้ศิลปินโดยตรง',")
STR_EN = (" cw_look:'View & buy →', d_by:'by <b>{a}</b> · {d} · {c}', d_note:'Price set by the artist. No commission.', d_story:'The story behind it',"
          " d_how1:'Message the artist', d_how2:'Agree on price and shipping', d_how3:'Pay the artist directly',")


def sub(s, old, new, what, f):
    if new in s: return s
    if s.count(old) != 1: sys.exit(f'!! {os.path.basename(f)}: could not find {what} (found {s.count(old)}x). Nothing written to this file.')
    return s.replace(old, new)


pages = [os.path.join(ROOT, 'cutaway.html')] + sorted(glob.glob(os.path.join(ROOT, 'studio-*.html')))
for f in pages:
    s0 = s = open(f, encoding='utf-8').read()
    if MARK not in s:
        s = sub(s, '</style>', CSS + '</style>', 'end of <style>', f)
    else:   # already there: refresh the block (it always sits right before </style>)
        a = s.index(MARK); s = s[:a] + CSS + s[s.index('</style>', a):]
    s = sub(s, OLD_BTN, NEW_BTN, 'floor markup', f)
    s = sub(s, OLD_DLG, NEW_DLG, 'dialog markup', f)
    s = sub(s, OLD_FILL, NEW_FILL, 'fillDlg', f)
    s = sub(s, OLD_WIRE, NEW_WIRE, 'dialog wiring', f)
    if s != s0: open(f, 'w', encoding='utf-8').write(s); print('  updated', os.path.basename(f))
    else: print('  ok', os.path.basename(f))

cj = os.path.join(ROOT, 'circles.js')
s0 = s = open(cj, encoding='utf-8').read()
if 'cw_look:' not in s:
    s = sub(s, STR_TH_AT, STR_TH_AT + STR_TH, 'Thai words', cj)
    s = sub(s, STR_EN_AT, STR_EN_AT + STR_EN, 'English words', cj)
if s != s0: open(cj, 'w', encoding='utf-8').write(s); print('  updated circles.js')
else: print('  ok circles.js')
aj = os.path.join(ROOT, 'artists.js')
s0 = s = open(aj, encoding='utf-8').read()
import json
for img, d in STORIES.items():
    at = "img:'" + img + "'"
    if at + ',q:' in s: continue
    if s.count(at + '}') != 1: print('  (skipped a story: ' + img + ' not found in artists.js)'); continue
    s = s.replace(at + '}', at + ''.join(f',{k}:{json.dumps(v, ensure_ascii=False)}' for k, v in d.items()) + '}')
if s != s0: open(aj, 'w', encoding='utf-8').write(s); print('  updated artists.js (stories)')
else: print('  ok artists.js')
print('done. Later, run  node tools/build.mjs  so the pre-rendered studio pages pick up the new floor markup too.')
