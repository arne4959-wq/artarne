/* showcase.js — renders donate.html, legend.html and legend-work.html (body[data-page] = donate | legend | legend-work).
   Needs artists.js, circles.js and legends.js (LG.LEGENDS). Words here are Thai and English; Lao falls back to Thai until a native speaker reviews it.
   Rules: the DONATE page is only for living artists (the ARTISTS list); legends (the dead) never get a donate button. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s), main = $('#sc-main');
  const L = (th, en) => LANG === 'en' ? en : th;
  const q = new URLSearchParams(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- punk bits ---------- */
  const ransom = (parts, cls = '', sz = '', label = '', tag = 'h1') => `<${tag} class="sc-ransom ${cls}" ${sz ? `style="--sz:${sz}"` : ''} ${tag === 'h1' ? `aria-label="${esc(label || parts.join(' '))}"` : 'aria-hidden="true"'}>${parts.map((p, i) => `<span class="sc-in" style="--i:${i + 1}" aria-hidden="true">${esc(p)}</span>`).join('')}</${tag}>`;
  const MQ = {monet: ['LIGHT CHANGES', 'SAME STACK · NEW HOUR', 'FOLLOW NATURE', 'PAINT WHAT YOU SEE'], vangogh: ['LINE', 'COLOUR', 'LETTERS TO THEO', 'THE CYPRESSES STILL PREOCCUPY ME'], hokusai: ['THE WAVE', 'ONE MOUNTAIN · MANY VIEWS', 'THIRTY-SIX VIEWS OF FUJI', 'DRAW UNTIL THE END'], seurat: ['DOT BY DOT', 'PURE COLOUR', 'THE EYE DOES THE MIXING', 'TWO YEARS · ONE PICTURE']};
  const marquee = id => { const w = MQ[id] || ['ART NOT SORRY', 'NO MIDDLEMAN', L('ศิลปะไม่มีวันจบ', 'ART WITHOUT END'), 'NO GALLERY'], one = w.map(x => `<span>${esc(x)}</span><i>✱</i>`).join(''); return `<div class="sc-mq" aria-hidden="true"><div class="sc-mq-in">${one.repeat(6)}</div></div>`; };
  const hazard = '<div class="sc-hz" aria-hidden="true"></div>';
  const tape = (x, r, red) => `<i class="sc-tape${red ? ' red' : ''}" style="--tx:${x}%;--tr:${r}deg" aria-hidden="true"></i>`;
  const burst = txt => `<span class="sc-burst" aria-hidden="true">${txt}</span>`;
  const crumbs = items => breadcrumbHtml(items);
  let shown = false;
  const setPage = html => { main.classList.toggle('sc-still', shown); shown = true; main.innerHTML = html; if (reduce) main.querySelectorAll('.sc-in').forEach(e => e.style.opacity = 1); };

  /* ---------- the legends' words (painters; history in circles' words, not theirs) ---------- */
  const BIO = {
    monet: {
      name: ['CLAUDE', 'MONET'], years: '1840–1926', place: L('ฝรั่งเศส', 'France'),
      lead: L('จิตรกรผู้ตามแสงที่เปลี่ยนไปทุกชั่วโมง เขากลับไปวาดกองฟ่อนข้าวกองเดิมซ้ำ ๆ เพื่อดูว่าแสงและเวลาเปลี่ยนภาพได้แค่ไหน', 'A painter who chased light as it changed hour by hour. He went back to the same haystacks again and again to see how far light and time could change a picture.'),
      pillars: [[L('แสง', 'Light'), L('ภาพเดียวกันเปลี่ยนไปตามเวลาของวัน', 'The same scene changes with the hour')], [L('ซ้ำเพื่อให้เห็น', 'Repeat to see'), L('วาดสิ่งเดิมเป็นชุด เพื่อเห็นสิ่งที่เปลี่ยน', 'Paint one thing as a series to see what changes')], [L('ตามธรรมชาติ', 'Follow nature'), L('วาดสิ่งที่เห็น ไม่ใช่สิ่งที่รู้', 'Paint what you see, not what you know')]],
      timeline: [['1840', L('เกิดที่ปารีส เติบโตที่เลออาวร์', 'Born in Paris, grew up in Le Havre')], ['1874', L('ภาพ “Impression, Sunrise” ในนิทรรศการอิสระครั้งแรก เป็นที่มาของชื่อ Impressionism', '“Impression, Sunrise” shown at the first independent exhibition, the origin of the name Impressionism')], ['1883', L('ย้ายไปอยู่ที่ Giverny และสร้างสวนที่เป็นแรงบันดาลใจต่อมาอีกหลายสิบปี', 'Moves to Giverny and builds the garden that inspired decades of work')], ['1890–91', L('วาดชุด “กองฟ่อนข้าวสาลี” ราว 25 ภาพ', 'Paints the “Stacks of Wheat” series, about 25 canvases')], ['1926', L('เสียชีวิตที่ Giverny', 'Dies at Giverny')]],
      period: [[L('อยู่ที่ไหน', 'Where'), L('วาดกองฟ่อนข้าวใกล้บ้านที่ Giverny กลับไปที่กองเดิมซ้ำ ๆ ตลอดปี', 'Painted the stacks near his home at Giverny, returning to the same ones through the year')], [L('วิธีทำงาน', 'How he worked'), L('วาดเป็นชุดราว 25 ภาพ ปล่อยให้แสงและเวลาเปลี่ยนภาพแต่ละใบ แทนการวาดภาพเดียวให้สมบูรณ์', 'A series of about 25 canvases, letting light and time change each one instead of perfecting a single picture')], [L('สิ่งที่เปลี่ยน', 'What changed'), L('จากภาพเล่าเรื่อง มาเป็นการดูว่าแสงเปลี่ยนสีของสิ่งเดียวกันได้แค่ไหน — ต้นทางของชุดภาพที่ตามมา', 'From telling a story to testing how far light can change the colour of one thing — the start of the series that followed')]]
    },
    vangogh: {
      name: ['VINCENT', 'VAN GOGH'], years: '1853–1890', place: L('เนเธอร์แลนด์ · ฝรั่งเศส', 'Netherlands · France'),
      lead: L('จิตรกรผู้เขียนจดหมายถึงน้องชายเกือบทุกสัปดาห์ เส้นและสีของเขาคือวิธีเล่าความรู้สึกที่คำพูดเล่าไม่ได้', 'A painter who wrote to his brother almost every week. Line and colour were how he told what words could not.'),
      pillars: [[L('เส้น', 'Line'), L('เส้นที่หนาและหมุน ทำให้ภาพมีแรง', 'Thick, swirling strokes give the picture force')], [L('สี', 'Colour'), L('สีสดและตัดกัน เพื่อบอกความรู้สึก', 'Bright, clashing colour to carry feeling')], [L('จดหมาย', 'Letters'), L('คิดงานออกมาเป็นตัวหนังสือถึง Theo', 'Thinking out loud on paper to Theo')]],
      timeline: [['1853', L('เกิดที่ Zundert ประเทศเนเธอร์แลนด์', 'Born in Zundert, the Netherlands')], ['1880', L('ตัดสินใจเป็นจิตรกรอย่างจริงจัง', 'Decides to become an artist in earnest')], ['1888', L('ย้ายไปอาร์ล และเช่าบ้านสีเหลือง', 'Moves to Arles and rents the Yellow House')], ['1889', L('พักรักษาตัวที่แซ็ง-เรมี และวาดภาพทุ่งข้าวสาลีกับต้นไซเปรส', 'Recovers at Saint-Rémy and paints the wheat field with cypresses')], ['1890', L('เสียชีวิตที่ Auvers-sur-Oise', 'Dies at Auvers-sur-Oise')]],
      period: [[L('อยู่ที่ไหน', 'Where'), L('โรงพยาบาลที่แซ็ง-เรมี-เดอ-โพรวองซ์ ทางใต้ของฝรั่งเศส วาดจากสวนและทุ่งรอบ ๆ', 'The asylum at Saint-Rémy-de-Provence in the south of France, painting the garden and fields around it')], [L('วิธีทำงาน', 'How he worked'), L('ใช้สีหนาและเส้นหมุน ๆ เขียนถึงต้นไซเปรสว่า “งามด้วยเส้นและสัดส่วน”', 'Thick paint and swirling lines; he wrote of the cypresses as “beautiful as regards lines and proportions”')], [L('สิ่งที่เปลี่ยน', 'What changed'), L('จากความสว่างของอาร์ล มาเป็นภาพที่เส้นเคลื่อนไหวและแน่นขึ้น', 'From the brightness of Arles to pictures with moving, tighter line')]]
    },
    hokusai: {
      name: ['KATSUSHIKA', 'HOKUSAI'], years: '1760–1849', place: L('ญี่ปุ่น', 'Japan'),
      lead: L('ช่างพิมพ์ภาพแกะไม้และจิตรกรผู้ทำงานจนอายุเกือบเก้าสิบ เขาเปลี่ยนชื่อตัวเองหลายครั้ง และกลับไปหาภูเขาไฟฟูจิกับคลื่นซ้ำแล้วซ้ำอีก เพื่อดูว่าเส้นเดียวกันเล่าได้กี่แบบ', 'A woodblock printer and painter who worked until nearly ninety. He changed his own name many times and kept returning to Mount Fuji and the wave to see how many ways one line can tell it.'),
      pillars: [[L('เส้น', 'Line'), L('เส้นที่มั่นคงและเล่นกับจังหวะ ทำให้ภาพมีพลัง', 'A steady, rhythmic line gives the picture force')], [L('ซ้ำเพื่อเห็นมุมใหม่', 'Repeat for a new view'), L('วาดภูเขาลูกเดิมเป็นชุด มุมใหม่ทุกครั้ง', 'One mountain drawn as a series, a new angle each time')], [L('คนกับธรรมชาติ', 'People and nature'), L('คนตัวเล็กอยู่ในธรรมชาติที่ใหญ่กว่า', 'Small people inside a larger nature')]],
      timeline: [['1760', L('เกิดในเอโดะ (โตเกียวในปัจจุบัน)', 'Born in Edo (today’s Tokyo)')], ['1814', L('ตีพิมพ์เล่มแรกของ “โฮคุไซมังงะ” สมุดภาพร่างที่รวมสิ่งต่าง ๆ รอบตัว', 'Publishes the first volume of the Hokusai Manga, sketchbooks of everything around him')], ['1830–32', L('ทำชุด “สามสิบหกทัศนียภาพของภูเขาไฟฟูจิ” ซึ่งมีภาพคลื่นใหญ่', 'Makes Thirty-six Views of Mount Fuji, which includes the Great Wave')], ['1834', L('ตีพิมพ์ “หนึ่งร้อยทัศนียภาพของภูเขาไฟฟูจิ”', 'Publishes One Hundred Views of Mount Fuji')], ['1849', L('เสียชีวิตที่เอโดะ', 'Dies in Edo')]],
      period: [[L('อยู่ที่ไหน', 'Where'), L('เอโดะ เมืองหลวงที่คึกคักของญี่ปุ่นสมัยนั้น ซึ่งมีตลาดภาพพิมพ์ขนาดใหญ่', 'Edo, Japan’s busy capital, with a large market for prints')], [L('วิธีทำงาน', 'How he worked'), L('ภาพพิมพ์แกะไม้ ศิลปินเขียนแบบ ช่างแกะแม่พิมพ์ และช่างพิมพ์ทำงานร่วมกัน ภาพหนึ่งพิมพ์ได้หลายแผ่น', 'Woodblock prints: artist, block-cutter and printer worked together, and one design could be printed many times')], [L('สิ่งที่เปลี่ยน', 'What changed'), L('จากภาพคนและนักแสดง มาเป็นภาพทิวทัศน์ที่คนเป็นแค่ส่วนเล็ก ๆ', 'From pictures of people and actors to landscapes where people are a small part')]]
    },
    seurat: {
      name: ['GEORGES', 'SEURAT'], years: '1859–1891', place: L('ฝรั่งเศส', 'France'),
      lead: L('จิตรกรผู้เปลี่ยนการผสมสีให้เป็นงานของตาคนดู เขาวางจุดสีบริสุทธิ์เคียงกันอย่างอดทน และเสียชีวิตตั้งแต่อายุสามสิบเอ็ดปี', 'A painter who turned colour mixing into work for the viewer’s eye. He set pure dots of colour side by side with patience, and died at thirty-one.'),
      pillars: [[L('จุด', 'Dot'), L('จุดสีเล็ก ๆ เคียงกัน ให้ตาผสมเอง', 'Small dabs of colour side by side, mixed by the eye')], [L('วิทยาศาสตร์ของสี', 'Colour science'), L('เขาศึกษาทฤษฎีสีมาวางแผนภาพ', 'He studied colour theory to plan his pictures')], [L('ความอดทน', 'Patience'), L('ภาพใหญ่หนึ่งภาพใช้เวลาราวสองปี', 'One large picture took about two years')]],
      timeline: [['1859', L('เกิดที่ปารีส', 'Born in Paris')], ['1884', L('เริ่มวาด “บ่ายวันอาทิตย์บนเกาะลา กรองด์ ฌาตต์”', 'Begins A Sunday on La Grande Jatte')], ['1886', L('แสดงภาพนี้ที่นิทรรศการอิมเพรสชันนิสต์ครั้งสุดท้าย', 'Shows it at the last Impressionist exhibition')], ['1888–89', L('เพิ่มกรอบสีรอบภาพ', 'Adds the painted border')], ['1891', L('เสียชีวิตที่ปารีส', 'Dies in Paris')]],
      period: [[L('อยู่ที่ไหน', 'Where'), L('ปารีส เขาทำภาพศึกษาจำนวนมากริมแม่น้ำแซนก่อนลงมือวาดภาพใหญ่', 'Paris; he made many studies by the Seine before the large canvas')], [L('วิธีทำงาน', 'How he worked'), L('วางจุดสีบริสุทธิ์เคียงกัน ให้ตาของคนดูผสมสีเอง แทนการผสมสีบนจานสี', 'Pure dabs of colour set side by side so the viewer’s eye mixes them, instead of mixing on the palette')], [L('สิ่งที่เปลี่ยน', 'What changed'), L('จากพู่กันที่เป็นธรรมชาติของอิมเพรสชันนิสต์ มาเป็นระบบที่วางแผนไว้', 'From the loose brushwork of the Impressionists to a planned system')]]
    }
  };
  const idOf = x => x.file.split('/').pop().split('-')[0];
  const legend = id => { const x = LG.LEGENDS.find(l => idOf(l) === id); return x ? {x, b: BIO[id], id} : null; };
  const tabs = cur => `<div role="navigation" class="sc-tabs sc-in" style="--i:1" aria-label="${esc(L('ศิลปินตำนาน', 'Legends'))}"><span class="sc-tag k">${esc(L('ศิลปินตำนาน ' + LG.LEGENDS.length + ' คน', LG.LEGENDS.length + ' legends'))}</span>${LG.LEGENDS.map(l => { const i = idOf(l); return `<a href="legend.html?id=${i}"${i === cur ? ' aria-current="page"' : ''}>${esc(pk(l, 'maker'))}</a>`; }).join('')}</div>`;
  /* Each legend's page is that painter's own place: his picture behind the page, his palette and pattern (all in showcase.css under body[data-lg]). */
  /* Things that drift behind the page, each one his: Van Gogh = stars and sunflowers rising | Monet = water lilies and ripples on the pond |
     Hokusai = plovers sailing and foam curls bobbing | Seurat = dots of pure colour floating up. Decoration only (aria-hidden); still when the visitor asks for less motion. */
  const SVG = {
    star: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#1e3a7a" fill-opacity=".35"/><g fill="none" stroke="#f2c230" stroke-width="3"><circle cx="50" cy="50" r="40" stroke-opacity=".3"/><circle cx="50" cy="50" r="29" stroke-opacity=".5"/><circle cx="50" cy="50" r="19" stroke-opacity=".8"/></g><circle cx="50" cy="50" r="10" fill="#fff3a6"/></svg>',
    sunflower: '<svg viewBox="0 0 100 100"><g fill="#f2c230" stroke="#b9791a" stroke-width="1.5">' + Array.from({length: 12}, (_, i) => `<ellipse cx="50" cy="20" rx="8" ry="17" transform="rotate(${i * 30} 50 50)"/>`).join('') + '</g><circle cx="50" cy="50" r="14" fill="#6b4210"/><circle cx="50" cy="50" r="8" fill="#8a5a1c"/></svg>',
    lily: '<svg viewBox="0 0 100 100"><g fill="#f7bdd2" stroke="#c97a9a" stroke-width="1.5">' + Array.from({length: 8}, (_, i) => `<ellipse cx="50" cy="26" rx="9" ry="22" transform="rotate(${i * 45} 50 50)"/>`).join('') + '</g><circle cx="50" cy="50" r="9" fill="#f2c64a"/></svg>',
    pad: '<svg viewBox="0 0 100 70"><ellipse cx="50" cy="35" rx="46" ry="30" fill="#6aa890" stroke="#3f7a66" stroke-width="2"/><path d="M50 35 L96 30" stroke="#d8e8e2" stroke-width="3"/></svg>',
    ripple: '<svg viewBox="0 0 100 100"><g fill="none" stroke="#8f7fc2" stroke-width="2"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="18"/></g></svg>',
    bird: '<svg viewBox="0 0 80 40"><path d="M4 28Q22 4 40 24Q58 4 76 28" fill="none" stroke="#16466b" stroke-width="5" stroke-linecap="round"/></svg>',
    foam: '<svg viewBox="0 0 100 70"><path d="M5 62Q28 -4 72 20Q92 34 72 46Q58 36 62 28" fill="none" stroke="#16466b" stroke-width="5" stroke-linecap="round"/><g fill="#fffaf0" stroke="#16466b" stroke-width="2"><circle cx="82" cy="18" r="3"/><circle cx="90" cy="28" r="2.5"/><circle cx="76" cy="8" r="2.5"/></g></svg>',
    dot: c => `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.2" fill="${c}"/></svg>`
  };
  const FLOATS = {
    vangogh: [['star', 'rise', 70, 150], ['sunflower', 'rise', 60, 110]],
    monet: [['lily', 'sail', 70, 110], ['pad', 'sail', 90, 160], ['ripple', 'ripple', 120, 220]],
    hokusai: [['bird', 'sail', 50, 90], ['foam', 'bob', 80, 140]],
    seurat: [['dot', 'rise', 14, 38]]
  };
  const DOTS = ['#e0792b', '#2f5fa8', '#5b8f3a', '#e8c13c', '#8a5aa8'];
  const floatLayer = id => {
    document.querySelectorAll('.lg-float').forEach(e => e.remove());
    const kinds = FLOATS[id]; if (!kinds) return;
    const n = matchMedia('(max-width:700px)').matches ? 8 : 16, el = document.createElement('div');
    el.className = 'lg-float'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = Array.from({length: n}, (_, i) => {
      const [k, mv, a, b] = kinds[i % kinds.length], r = (m, o) => (i * m + o) % 100 / 100, size = Math.round(a + (b - a) * r(37, 11));
      const art = k === 'dot' ? SVG.dot(DOTS[i % DOTS.length]) : SVG[k];
      return `<span class="lg-f lg-${mv}" data-k="${k}" style="--x:${Math.round(r(29, 7) * 100)};--y:${Math.round(r(53, 19) * 100)};--s:${size}px;--d:${Math.round(55 + r(17, 3) * 60)}s;--dl:-${Math.round(r(41, 5) * 90)}s;--dx:${Math.round(r(23, 9) * 30 - 15)}vw">${art}</span>`;
    }).join('');
    document.body.appendChild(el);
  };
  const applyTheme = (id, x) => { document.body.dataset.lg = id; document.body.style.setProperty('--lg-img', `url("${x.file}")`); floatLayer(id); };
  const seal = id => id === 'hokusai' ? '<span class="sc-seal" aria-hidden="true">北斎</span>' : '';
  const bad = () => setPage(`<div class="sc-wrap"><p class="sc-lead">${esc(L('ไม่พบศิลปินคนนี้', 'No such artist'))} · <a href="legends.html">${esc(t('lg_h'))}</a></p></div>`);

  /* ---------- legend.html : the legend's introduction, then the works ---------- */
  function renderLegend() {
    const id = q.get('id') || 'monet', g = legend(id); if (!g) return bad();
    const {x, b} = g, who = pk(x, 'maker');
    setMeta(who + ' — ' + t('lg_h') + ' · circles', b.lead); applyTheme(id, x);
    setPage(marquee(id) + `<div class="sc-wrap">
      ${crumbs([[t('bc_city'), 'index.html#city'], [t('lg_h'), 'legends.html'], [who, '']])}
      ${tabs(id)}
      <div class="sc-hero"><div>
        <span class="sc-tag sc-in" style="--i:1">${esc(L('ศิลปินตำนาน', 'Legend'))} · ${b.years} · ${esc(b.place)}</span>${seal(id)}
        ${ransom(b.name[0].split(''), b.name[0].length > 8 ? 'long' : '', b.name[0].length > 8 ? 'min(3.4rem,8.4vw)' : 'min(4.6rem,12.5vw)', who)}${ransom(b.name[1].replace(/ /g, '·').split(''), '', b.name[1].length > 6 ? 'min(3.5rem,11vw)' : 'min(4.6rem,12.5vw)', '', 'div')}
        <p class="sc-lead sc-in" style="--i:9">${esc(b.lead)}</p>
        <div class="sc-row sc-in" style="--i:10"><a class="sc-btn" href="#works">${esc(L('ดูผลงาน ↓', 'See the works ↓'))}</a><span class="sc-note">${esc(L('ศิลปินตำนาน · ผลงานสาธารณสมบัติ · ไม่รับโดเนท', 'Legend · public-domain work · no donations'))}</span></div>
        <p class="sc-in" style="--i:11"><a href="highlights.html">${esc(t('lg_go'))}</a></p>
      </div>
      <figure class="sc-port sc-in" style="--i:4;--r:1.4deg">${tape(30, -5)}${burst('LEGEND<br>★')}<img class="gm-${idOf(x)}" src="${esc(x.file)}" width="${x.w}" height="${x.h}" alt="${esc(pk(x, 'title') + ' — ' + who)}"><figcaption>${esc(pk(x, 'title'))} · ${esc(x.year)}</figcaption></figure></div>
      <section class="sc-sec dark" aria-labelledby="sc-c"><span class="sc-tag">${esc(L('แนวคิด', 'Concept'))}</span>
        <h2 class="sc-h2" id="sc-c">${esc(L('แนวคิดของเขา', 'His idea'))}</h2>
        <blockquote class="sc-quote">${esc(pk(x, 'own'))}</blockquote>
        <p class="sc-src">${esc(who)} · ${esc(pk(x, 'src'))} · <a href="${esc(x.srcUrl)}" target="_blank" rel="noopener noreferrer">${esc(L('ต้นฉบับ', 'source'))}</a></p>
        <div class="sc-pill">${b.pillars.map((p, i) => `<div><span class="sc-tag">P${i + 1}</span><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div>`).join('')}</div></section>
      <section aria-labelledby="sc-t" style="padding-top:3.5rem"><span class="sc-tag">${esc(L('ประวัติ', 'History'))}</span><h2 class="sc-h2" id="sc-t">${esc(L('เส้นทางของเขา', 'His road'))}</h2>
        <ul class="sc-tl">${b.timeline.map(r => `<li><b>${esc(r[0])}</b><span>${esc(r[1])}</span></li>`).join('')}</ul>
        <p class="sc-src" style="color:#4a4943">${esc(L('ประวัติเรียบเรียงโดย circles ไม่ใช่คำของศิลปิน', 'History is written by circles, not the artist’s words'))}</p></section>
      <section id="works" aria-labelledby="sc-w" style="padding-top:3.5rem"><span class="sc-tag">${esc(L('ผลงาน', 'Works'))}</span><h2 class="sc-h2" id="sc-w">${esc(L('ผลงานของเขา', 'His work'))}</h2>
        <p class="sc-lead">${esc(L('กดดูภาพ แล้วอ่านว่าเขาเป็นศิลปินแบบไหนในช่วงปีนั้น', 'Open a picture to read who he was as an artist that year'))}</p>
        <div class="sc-works"><article class="sc-card sc-work sc-in" style="--i:1;--r:-.8deg">${tape(22, -4, true)}<img class="gm-${idOf(x)}" src="${esc(x.file)}" width="${x.w}" height="${x.h}" alt="${esc(pk(x, 'title'))}" loading="lazy"><span class="sc-tag">${esc(x.year)} · ${esc(pk(x, 'sign'))}</span><h3>${esc(pk(x, 'title'))}</h3><small>${esc(who)}</small><a class="sc-btn" href="legend-work.html?id=${id}&k=0">${esc(L('ดูช่วงชีวิตตอนวาดภาพนี้ →', 'Who he was when he painted this →'))}</a></article></div></section>
    </div>` + hazard);
    LG.more(id).then(list => {
      if (!list.length || document.body.dataset.lg !== id) return;
      const sec = document.getElementById('works'); if (!sec) return;
      const g = document.createElement('div'); g.className = 'sc-gal';
      g.innerHTML = '<h3 class="sc-h3">' + esc(L('ภาพอื่น ๆ ของเขา', 'More of his pictures')) + '</h3><div class="sc-gal-grid">' + list.map((m, i) =>
        `<figure class="sc-gal-i" style="--r:${(i % 2 ? 1 : -1) * (.6 + i % 3 * .4)}deg"><img class="gm-${id}" src="${esc(m.file)}" width="${m.w}" height="${m.h}" alt="${esc(pk(m, 'title'))}" loading="lazy"><span class="sc-gal-sign">${esc(pk(x, 'sign'))}</span><figcaption><b>${esc(pk(m, 'title'))}</b> · ${esc(m.year)}<br><small>${esc(m.place)}</small><p>${esc(pk(m, 'note'))}</p></figcaption></figure>`).join('') + '</div>' +
        '<p class="sc-src" style="color:#4a4943">' + esc(L('ภาพวาดเป็นสาธารณสมบัติ ภาพถ่ายจากคลังเปิดของพิพิธภัณฑ์ที่ระบุไว้', 'Paintings are public domain; images from the named museum’s open-access archive')) + '</p>';
      sec.appendChild(g);
    });
  }

  /* ---------- legend-work.html : one picture, and the artist in that period ---------- */
  function renderWork() {
    const id = q.get('id') || 'monet', g = legend(id); if (!g) return bad();
    const {x, b} = g, who = pk(x, 'maker'), other = LG.LEGENDS.find(l => idOf(l) !== id), oid = other && idOf(other);
    setMeta(pk(x, 'title') + ' — ' + who + ' · circles', pk(x, 'note')); applyTheme(id, x);
    setPage(marquee(id) + `<div class="sc-wrap">
      ${crumbs([[t('bc_city'), 'index.html#city'], [t('lg_h'), 'legends.html'], [who, 'legend.html?id=' + id], [pk(x, 'title'), '']])}
      <div class="sc-split">
        <div class="sc-pic sc-in" style="--i:1">${tape(40, -4)}${burst('CC0<br>' + esc(L('สาธารณะ', 'public')))}<figure><img class="gm-${idOf(x)}" src="${esc(x.file)}" width="${x.w}" height="${x.h}" alt="${esc(pk(x, 'title') + ' — ' + who)}"></figure></div>
        <div><div class="sc-row sc-in" style="--i:2"><span class="sc-tag">${esc(x.year)}</span><span class="sc-tag k">${esc(pk(x, 'sign'))}</span></div>
          ${ransom(pk(x, 'title').replace(/\s*\(.*\)$/, '').split(/\s+/).slice(0, 3), LANG === 'en' ? '' : 'th', '3.4rem')}
          <p class="sc-src" style="color:#4a4943">${esc(pk(x, 'title'))} · ${esc(who)}</p>
          <div class="sc-card sc-in" style="--i:6;--r:.7deg;margin-top:1.4rem">${tape(8, -5, true)}<span class="sc-tag">${esc(L('เสียงของศิลปิน', 'The artist’s words'))}</span><p class="sc-quote" style="font-size:1.4rem;margin:.8rem 0 .4rem">${esc(pk(x, 'own'))}</p><p class="sc-src" style="color:#4a4943">${esc(who)} · <a href="${esc(x.srcUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--black)">${esc(pk(x, 'src'))}</a></p></div>
          <div class="sc-row sc-in" style="--i:7"><span class="sc-note">${esc(L('ศิลปินตำนาน · ไม่รับโดเนท', 'Legend · no donations'))}</span><a class="sc-btn alt" href="legend.html?id=${id}">${esc(L('← กลับไปหน้าศิลปิน', '← Back to the artist'))}</a></div></div></div>
      <section class="sc-sec dark" aria-labelledby="sc-p"><span class="sc-tag">${esc(L('ช่วงชีวิตตอนวาดภาพนี้', 'Life when he made this'))} · ${esc(x.year)}</span>
        <h2 class="sc-h2" id="sc-p">${esc(L('เขาเป็นศิลปินแบบไหนในตอนนั้น', 'Who he was as an artist then'))}</h2>
        <div class="sc-cards3">${b.period.map((p, i) => `<div class="sc-card sc-in" style="--i:${i + 1};--r:${[-.6, .5, -.4][i]}deg"><b>0${i + 1}</b><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p></div>`).join('')}</div>
        <div class="sc-credit"><b>${esc(t('lg_f_credit'))}</b><br>${esc(pk(x, 'note'))}<br><a href="${esc(x.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(pk(x, 'credit'))}</a></div></section>
      <div role="navigation" class="sc-nav2" aria-label="${esc(L('ศิลปินตำนานคนอื่น', 'Other legend'))}"><a href="legend.html?id=${id}"><small>← ${esc(who)}</small><b>${esc(L('ผลงานทั้งหมดของเขา', 'All his work'))}</b></a>${other ? `<a href="legend.html?id=${oid}"><small>${esc(L('ศิลปินตำนานอีกคน →', 'The other legend →'))}</small><b>${esc(pk(other, 'maker'))}</b></a>` : ''}</div>
    </div>` + hazard);
  }

  /* ---------- donate.html : a whole page for a LIVING artist ---------- */
  let usd = 0, stage = 1;   // stage 1 amount · 2 scan · 3 notice · 4 thanks
  function renderDonate() {
    const A = ARTISTS.find(a => a.id === q.get('a')) || ARTISTS[0], who = nameL(A), steps = [L('เลือกยอด', 'Amount'), L('สแกนจ่าย', 'Scan'), L('แจ้งโอน', 'Notice'), L('ขอบคุณ', 'Thanks')];
    setMeta(t('pf_supb', {a: who}) + ' — circles', t('sup_direct', {a: who}));
    const amts = DON_AMOUNTS.map((n, i) => `<button type="button" class="sc-amt" data-amt="${n}" aria-pressed="${n === usd}">${esc(money(n))}</button>`).join('');
    const nm = ransomParts(who);
    setPage(marquee() + `<div class="sc-wrap">
      ${crumbs([[t('bc_city'), 'index.html#city'], [who, 'profile-' + A.id + '.html'], [L('โดเนท', 'Donate'), '']])}
      <span class="sc-tag sc-in" style="--i:1">${esc(L('ขั้น', 'Step'))} ${stage} / 4 · ${esc(steps[stage - 1])}</span>
      ${ransom([L('โดเนท', 'DONATE'), L('ให้', 'TO'), ...nm], LANG === 'en' ? '' : 'th', '4.4rem')}
      <p class="sc-lead sc-in" style="--i:8">${esc(t('sup_direct', {a: who}))}</p>
      <p class="sc-note sc-in" style="--i:9">${esc(t('sm_banner'))}</p>
      <ol class="sc-steps sc-in" style="--i:10">${steps.map((s, i) => `<li${i + 1 === stage ? ' aria-current="step"' : ''}><b>0${i + 1}</b>${esc(s)}</li>`).join('')}</ol>
      <div class="sc-grid">
        <section class="sc-card sc-in" style="--i:11;--r:-.6deg" aria-labelledby="sc-a">${tape(18, -5)}<h2 class="sc-h2" id="sc-a">${esc(t('tip_h'))}</h2>
          <div class="sc-amts">${amts}</div>
          <form class="sc-other" novalidate><label for="sc-n">${esc(t('tip_other'))}</label><input id="sc-n" type="number" inputmode="numeric" min="1" max="1000" step="1" placeholder="12"><button type="submit" class="sc-btn alt">${esc(t('tip_go'))}</button></form>
          <p class="sc-note" id="sc-err" role="alert" hidden>${esc(t('tip_bad'))}</p>
          <div class="sc-who"><i aria-hidden="true">${esc([...who][0] || '')}</i><div><b>${esc(who)}</b><br><small>${esc(discL(A))} · ${esc(cityL(A))}</small></div></div>
          <div class="sc-how"><b>${esc(L('วิธีโดเนท', 'How to donate'))}</b><ol><li><b>01</b>${esc(L('เลือกยอดที่สบายใจ หรือใส่ยอดเอง', 'Pick an amount, or type your own'))}</li><li><b>02</b>${esc(L('สแกน QR ด้วยแอปธนาคาร หรือโอนเข้าบัญชี', 'Scan the QR with your bank app, or transfer to the account'))}</li><li><b>03</b>${esc(L('กด “ฉันโอนแล้ว” แล้วบอกชื่อกับอีเมล', 'Press “I’ve donated” and leave your name and e-mail'))}</li><li><b>04</b>${esc(L('เงินถึงศิลปินโดยตรง circles ไม่หักค่าธรรมเนียม', 'The money goes straight to the artist, circles takes no fee'))}</li></ol></div></section>
        <section class="sc-card blue sc-pay sc-in" style="--i:12;--r:.6deg" id="sc-pay" aria-live="polite">${tape(55, 4, true)}${burst('0%<br>' + esc(L('หักเงิน', 'fee')))}<div id="sc-pay-in"></div></section>
      </div></div>` + hazard);
    paint(A, who);
    document.querySelectorAll('[data-amt]').forEach(b => b.onclick = () => { usd = +b.dataset.amt; stage = 2; renderDonate(); });
    const f = $('.sc-other'), inp = $('#sc-n'), err = $('#sc-err');
    f.addEventListener('submit', e => { e.preventDefault(); const v = inp.value.trim(); if (!/^\d{1,4}$/.test(v) || +v < 1 || +v > 1000) { err.hidden = false; inp.focus(); return; } usd = +v; stage = 2; renderDonate(); });
    inp.addEventListener('input', () => { err.hidden = true; });
  }
  const ransomParts = name => { const w = String(name).trim().split(/\s+/); return w.length > 1 ? w : [name]; };
  function paint(A, who) {   // the right-hand card for the current stage
    const box = $('#sc-pay-in'), again = () => { stage = 1; usd = 0; renderDonate(); };
    if (stage === 1) { box.innerHTML = `<div class="sc-empty"><b>${esc(L('เลือกยอดก่อน', 'Pick an amount first'))}</b><br>${esc(L('แล้ว QR กับเลขบัญชีจะขึ้นตรงนี้', 'then the QR and the account show up here'))}</div>`; return; }
    if (stage === 2) {
      box.innerHTML = samplePayHtml(A, usd, who) + `<div class="sc-act"><button type="button" class="sc-btn" data-sent>${esc(t('tip_sent'))}</button><button type="button" class="sc-btn alt" data-back>${esc(L('เปลี่ยนยอด', 'Change amount'))}</button></div>`;
      $('[data-sent]').onclick = () => { stage = 3; renderDonate(); }; $('[data-back]').onclick = again; return;
    }
    if (stage === 3) {
      box.innerHTML = `<h2 class="sc-h2">${esc(t('pay_notice_h'))}</h2>` + sampleNoticeHtml();
      sampleNoticeWire(box, () => { smTip(A.id, usd); stage = 4; renderDonate(); }, () => { stage = 2; renderDonate(); }); return;
    }
    box.innerHTML = `<div class="cdlg-done" role="status"><h2 class="sc-h2">${esc(t('pay_done_h'))}</h2><p class="sc-lead">${esc(t('pay_done_tip', {a: who, m: money(usd)}))}</p><p class="sc-note">${esc(t('sm_banner'))}</p><div class="sc-row"><a class="sc-btn" href="profile-${A.id}.html">${esc(L('← กลับไปที่ตึกของเขา', '← Back to the building'))}</a><button type="button" class="sc-btn alt" data-again>${esc(L('โดเนทอีกครั้ง', 'Donate again'))}</button></div></div>`;
    $('[data-again]').onclick = again;
  }

  const PAGE = document.body.dataset.page, render = PAGE === 'donate' ? renderDonate : PAGE === 'legend' ? renderLegend : renderWork;
  onLang(() => LG.ready.then(render)); wireNav(); applyLang();
})();
