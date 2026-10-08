/* pixel-punks.js — HD-2D pixel people inside the studio buildings (cutaway.html / studio-*.html).
   · the artist, a little punk in camo / tartan / leather, at work in the top room (a different job for every discipline)
   · a punk visitor who follows you through the building: when you scroll to a floor, they come up the stairs and stop to look at the work
   · speech bubbles: the artist mutters about the work now and then, the visitor reacts to the piece in front of them
   Every sprite is drawn once from 16x24 text grids onto a canvas sheet, then animated with CSS steps() (no script runs per frame).
   Loaded after the page's own script (needs A, ARTISTS, onLang, reduce). Everything stays still for reduced motion. */
(function () {
  if (typeof A === 'undefined' || !A || !document.getElementById('floors')) return;

  /* ---------------- palette: the site's colours + skin, camo greens ---------------- */
  const C = {k: '#0E0D0C', w: '#F4F1E8', x: '#FFFFFF', p: '#FF2E88', g: '#E8B730', r: '#A3182C', o: '#6B6B3A', O: '#4A4A28', b: '#7A4A40',
             c: '#8F8C85', l: '#C8C4BA', u: '#4A6080', n: '#1E1C1B', y: '#F2D16B', e: '#2D4A6A'};
  const CAMO = {
    wood: ['oOoobo', 'OOobbo', 'oobbOO', 'kboOOo', 'ooOkoo', 'bOOooO'],
    pink: ['oOooOp', 'Opppoo', 'oopOOo', 'kooOpp', 'ppokoo', 'oOOppO'],
    urban: ['clcckc', 'llcckk', 'ckkllc', 'kcclcc', 'lckkcl', 'cllcck'],
  };
  /* a fill is a colour letter, or a pattern: camo / tartan / stripes */
  const fill = (f, x, y) => {
    if (typeof f === 'string') return C[f] || f;
    if (f.camo) { const t = CAMO[f.camo]; return C[t[y % 6][(x + (f.s || 0)) % 6]]; }
    if (f.tartan) return (x % 4 === 1 || y % 4 === 1) ? ((x % 4 === 1 && y % 4 === 1) ? C.g : C.k) : C[f.tartan];
    if (f.stripe) return C[f.stripe[y % 2]];
    return C.k;
  };

  /* ---------------- bodies: 16 x 24, facing right. H hair · F skin · E eye · J jacket · D stud · T shirt · N hand · P pants · B boots ---------------- */
  const HEAD = [
    '................', '................', '................',
    '.....FFFFF......', '....FFFFFFF.....', '....FFFFFEF.....', '....FFFFFFF.....', '.....FFFFFF.....', '......FFF.......'];
  const TORSO_DOWN = ['....JJJJJJJ.....', '...JJDJJJDJJ....', '...JJJTTTJJJ....', '...JJJTTTJJJ....', '...JJJTTTJJJ....', '...NJJJJJJJN....', '....JJJJJJJ.....'];
  const TORSO_REACH = ['....JJJJJJJ.....', '...JJDJJJDJJJ...', '...JJJTTTJJJJJN.', '...JJJTTTJJ.....', '...JJJTTTJJ.....', '...NJJJJJJJ.....', '....JJJJJJJ.....'];
  const TORSO_UP = ['....JJJJJJJ..N..', '...JJDJJJDJJJ...', '...JJJTTTJJ.....', '...JJJTTTJJ.....', '...JJJTTTJJ.....', '...NJJJJJJJ.....', '....JJJJJJJ.....'];
  const LEGS = {
    stand: ['....PPPPPPP.....', '....PPPPPPP.....', '....PPP.PPP.....', '....PPP.PPP.....', '....PPP.PPP.....', '....BBB.BBB.....', '....BBBBBBBB....'],
    a:     ['....PPPPPPP.....', '....PPPPPPP.....', '...PPP...PPP....', '..PPP.....PPP...', '..PPP.....PPP...', '.BBB.......BBB..', '.BBBB......BBBB.'],
    b:     ['....PPPPPPP.....', '.....PPPPP......', '.....PPPPP......', '.....PPPP.......', '.....PPPP.......', '.....BBBB.......', '.....BBBBB......'],
  };
  const HAIR = {
    mohawk:  ['......H.H.......', '.....HHHHH......', '.....HHHHH......', '......HHH.......'],
    spikes:  ['....H..H..H.....', '....HH.HH.HH....', '.....HHHHHH.....', '.....HHHHHH.....', '....H...........'],
    bob:     ['................', '................', '.....HHHHH......', '....HHHHHHH.....', '...HHHHHHHH.....', '...HHFFFFEF.....', '...HHFFFFFF.....', '...HH.FFFFF.....'],
    long:    ['................', '................', '.....HHHHH......', '....HHHHHHH.....', '...HHHHHHH......', '...HHFFFFEF.....', '...HHFFFFFF.....', '...HHHFFFFF.....', '...HHH.FFF......', '...HH...........', '...H............'],
    beanie:  ['.......h........', '......hhh.......', '.....HHHHH......', '....HHHHHHH.....', '....hhhhhhh.....'],
    bandana: ['................', '................', '................', '.....HHHHH......', '...HHHHHHHH.....', '..HH............'],
    pigtail: ['................', '................', '.....HHHHH......', '....HHHHHHH.....', '..hHHHHHHHH.....', '.hhHHFFFFEF.....', '.hh.FFFFFFF.....'],
    bucket:  ['................', '................', '.....HHHHH......', '.....HHHHH......', '...HHHHHHHHH....'],
    twotone: ['.....H.h.H......', '....HHhhHH......', '....HHhhhHH.....', '.....Hhhh.......'],
  };
  function body(torso, legs, hair, blink) {
    const rows = [...HEAD, ...torso, ...LEGS[legs], '................'];
    const ov = HAIR[hair] || [];
    const out = rows.map((r, y) => [...r].map((ch, x) => { const o = ov[y] && ov[y][x]; return o && o !== '.' ? o : ch; }).join(''));
    if (blink) out[5] = out[5].replace('E', 'F');
    return out;
  }

  /* ---------------- props: 16 x 24, colour letters straight from the palette ---------------- */
  const E16 = '................';
  const pad = (top, rows) => [...Array(top).fill(E16), ...rows, ...Array(Math.max(0, 24 - top - rows.length)).fill(E16)].slice(0, 24);
  const legs4 = (n, a, b) => Array(n).fill(`${'.'.repeat(a)}k${'.'.repeat(b - a - 1)}k${'.'.repeat(15 - b)}`);
  const TABLE = ['.bbbbbbbbbbbbbb.', '.bbbbbbbbbbbbbb.', ...legs4(7, 2, 13)];
  const PROPS = {
    arch: [   /* painting: easel, a new stroke appears */
      pad(5, ['....bbbbbbbb....', '....bwwwwwwb....', '....bwppwwwb....', '....bwppwgwb....', '....bwwwwggb....', '....bwowwwwb....', '....bwoowwwb....', '....bwwwwwwb....', '....bbbbbbbb....',
              '.......bb.......', '......b..b......', '......b..b......', '.....b....b.....', '.....b....b.....', '....b......b....', '....b......b....', '...b........b...', '...b........b...']),
      pad(5, ['....bbbbbbbb....', '....bwwwwwwb....', '....bwppwwwb....', '....bwppwgwb....', '....bwwwwggb....', '....bwowwuub....', '....bwoouuwb....', '....bwwwwwwb....', '....bbbbbbbb....',
              '.......bb.......', '......b..b......', '......b..b......', '.....b....b.....', '.....b....b.....', '....b......b....', '....b......b....', '...b........b...', '...b........b...'])],
    lens: [   /* photography: camera on a tripod, then the flash */
      pad(7, ['......kk........', '....kkkkkkk.....', '....kcckkllkk...', '....kcckllllk...', '....kkkkkllkk...', '....kkkkkkk.....', '.......k........', '.......k........',
              '......k.k.......', '......k.k.......', '.....k...k......', '.....k...k......', '....k.....k.....', '....k.....k.....', '...k.......k....', '...k.......k....']),
      pad(2, ['......x...x.....', '.......y.y......', '.....xyyyyyx....', '.......y.y......', '......x...x.....', '......kk........', '....kkkkkkk.....', '....kcckkllkk...', '....kcckllllk...', '....kkkkkllkk...', '....kkkkkkk.....',
              '.......k........', '.......k........', '......k.k.......', '......k.k.......', '.....k...k......', '.....k...k......', '....k.....k.....', '....k.....k.....', '...k.......k....', '...k.......k....'])],
    tower: [  /* illustration: drawing desk, the pencil moves */
      pad(12, ['.........g......', '........g.......', '..wwwwwwwwww....', ...TABLE.slice(0, 9)]),
      pad(12, ['......g.........', '.....g..........', '..wwwwkkwwww....', ...TABLE.slice(0, 9)])],
    vase: [   /* ceramics: a pot on the wheel, the wheel spins */
      pad(11, ['......bbbb......', '.....bbbbbb.....', '.....bbbbbb.....', '......bbbb......', '...cccccccccc...', '...clclclclcl...', '....kkkkkkkk....', '.....kk..kk.....', '.....kk..kk.....', '.....kk..kk.....', '....kkk..kkk....', '....kkk..kkk....']),
      pad(11, ['......bbbb......', '.....bbbbbb.....', '.....bbbbbb.....', '......bbbb......', '...cccccccccc...', '...lclclclclc...', '....kkkkkkkk....', '.....kk..kk.....', '.....kk..kk.....', '.....kk..kk.....', '....kkk..kkk....', '....kkk..kkk....'])],
    shell: [  /* textiles: a loom, the shuttle crosses */
      pad(6, ['.kkkkkkkkkkkkkk.', '.k.w.w.w.w.w.wk.', '.k.w.w.w.w.w.wk.', '.krrrrrrrrrrrrk.', '.krgrgrgrgrgrrk.', '.krrrrrrrrrrrrk.', '.kpprrrrrrrrrrk.', '.k.w.w.w.w.w.wk.', '.kkkkkkkkkkkkkk.',
              '.k............k.', '.k............k.', '.k............k.', '.k............k.', '.k............k.', '.k............k.', '.kk..........kk.', '.kk..........kk.']),
      pad(6, ['.kkkkkkkkkkkkkk.', '.k.w.w.w.w.w.wk.', '.k.w.w.w.w.w.wk.', '.krrrrrrrrrrrrk.', '.krgrgrgrgrgrrk.', '.krrrrrrrrrrrrk.', '.krrrrrrrrrrppk.', '.k.w.w.w.w.w.wk.', '.kkkkkkkkkkkkkk.',
              '.k............k.', '.k............k.', '.k............k.', '.k............k.', '.k............k.', '.k............k.', '.kk..........kk.', '.kk..........kk.'])],
    collage: [ /* collage: paper scraps and scissors that snip */
      pad(12, ['..........l..l..', '...wpw......ll..', '..wwwwppk...l.l.', ...TABLE.slice(0, 9)]),
      pad(12, ['................', '...wpw.....ll...', '..wwwwppk..ll...', ...TABLE.slice(0, 9)])],
    stack: [  /* risograph: the drum turns, a pink print comes out */
      pad(9, ['..kkkkkkkkkk....', '..kcccccccck....', '..kcgpcccclk....', '..kccccccclk....', '..kkkkkkkkkk....', '..kcccccccck....', '..kcccccccck....', '..kkkkkkkkkk....', '...k......k.....', '...k......k.....', '...k......k.....', '...k......k.....', '..kk......kk....']),
      pad(9, ['..kkkkkkkkkk....', '..kcccccccck....', '..kcgpcccclk....', '..kccccccclkwpw.', '..kkkkkkkkkkwpp.', '..kcccccccck....', '..kcccccccck....', '..kkkkkkkkkk....', '...k......k.....', '...k......k.....', '...k......k.....', '...k......k.....', '..kk......kk....'])],
    dome: [   /* generative: laptop, the code scrolls */
      pad(8, ['...kkkkkkkk.....', '...kngnnnnk.....', '...knnppnnk.....', '...kngggnnk.....', '...knnnpnnk.....', '...kkkkkkkk.....', '..kkkkkkkkkk....', ...TABLE.slice(0, 9)]),
      pad(8, ['...kkkkkkkk.....', '...knnnppnk.....', '...kgggnnnk.....', '...knnpnnnk.....', '...kngggnnk.....', '...kkkkkkkk.....', '..kkkkkkkkkk....', ...TABLE.slice(0, 9)])],
    pixel: [  /* glitch: a monitor that breaks up */
      pad(6, ['..kkkkkkkkkk....', '..kuuuuuuuuk....', '..kuuppuuuuk....', '..kuuuuggguk....', '..kuuuuuuuuk....', '..kuupuuuuuk....', '..kkkkkkkkkk....', '......kk........', '.....kkkk.......', ...TABLE.slice(0, 9)]),
      pad(6, ['..kkkkkkkkkk....', '..kppppuuuuk....', '..kuuuuuuuuk....', '..kgggguuppk....', '..kuxuxuxuxk....', '..kuuuuuuppk....', '..kkkkkkkkkk....', '......kk........', '.....kkkk.......', ...TABLE.slice(0, 9)])],
    spore: [  /* bio art: mushrooms in a planter, watered */
      pad(10, ['................', '................', '..rrr...rrrr....', '.rwrrr.rrwrrr...', '...w.....ww.....', '...w.....ww.....', '.bbbbbbbbbbbbb..', '.bbbbbbbbbbbbb..', '..bbbbbbbbbbb...', '..bbbbbbbbbbb...', '..b.........b...', '..b.........b...', '.bb.........bb..']),
      pad(10, ['....u.....u.....', '..u....u........', '..rrr...rrrr....', '.rwrrr.rrwrrr...', '...w.....ww.....', '...w.....ww.....', '.bbbbbbbbbbbbb..', '.bbbbbbbbbbbbb..', '..bbbbbbbbbbb...', '..bbbbbbbbbbb...', '..b.........b...', '..b.........b...', '.bb.........bb..'])],
  };

  /* ---------------- who is who: punk outfits ---------------- */
  const LOOK = {
    arch:    {F: '#D9A47E', hair: 'mohawk', H: 'p', J: {tartan: 'r'}, T: 'w', P: {camo: 'wood'}, B: 'k'},
    lens:    {F: '#C68E63', hair: 'spikes', H: 'k', J: 'n', T: 'p', P: 'c', B: 'k'},
    tower:   {F: '#E8B996', hair: 'bob', H: 'g', J: {camo: 'pink'}, T: 'k', P: 'u', B: 'k'},
    vase:    {F: '#A8714F', hair: 'bandana', H: 'r', J: {camo: 'wood', s: 2}, T: 'w', P: 'b', B: 'k'},
    shell:   {F: '#D9A47E', hair: 'long', H: 'k', h: 'p', J: 'n', T: 'g', P: {tartan: 'r'}, B: 'k'},
    collage: {F: '#E8B996', hair: 'pigtail', H: 'p', h: 'p', J: 'w', T: 'k', P: {camo: 'urban'}, B: 'k'},
    stack:   {F: '#C68E63', hair: 'mohawk', H: 'g', J: 'p', T: 'k', P: {tartan: 'r'}, B: 'k'},
    dome:    {F: '#D9A47E', hair: 'beanie', H: 'k', h: 'p', J: {stripe: ['k', 'n']}, T: 'p', P: {camo: 'urban', s: 3}, B: 'k'},
    pixel:   {F: '#E8B996', hair: 'twotone', H: 'p', h: 'g', J: 'n', T: 'u', P: 'p', B: 'k'},
    spore:   {F: '#A8714F', hair: 'bucket', H: 'o', J: {camo: 'wood', s: 4}, T: 'w', P: 'c', B: 'k'},
  };
  const VISITOR = {F: '#C68E63', hair: 'spikes', H: 'p', J: 'n', T: 'w', P: {camo: 'pink'}, B: 'k'};

  /* ---------------- drawing ---------------- */
  const W = 16, H = 24, CW = 20, CH = 28, OFF = 2;     // each frame sits in a 20x28 cell: room for a black outline and a paper 'sticker' edge
  function paint(g, rows, ox, look) {
    const grid = rows.map(r => [...r]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x]; if (ch === '.') continue;
      let col;
      if (look) {
        if (ch === 'F' || ch === 'N') col = look.F;
        else if (ch === 'E' || ch === 'B') col = C.k;
        else if (ch === 'D') col = C.g;
        else if (ch === 'H') col = fill(look.H, x, y);
        else if (ch === 'h') col = fill(look.h || look.H, x, y);
        else if (ch === 'J') col = fill(look.J, x, y);
        else if (ch === 'T') col = fill(look.T, x, y);
        else if (ch === 'P') col = fill(look.P, x, y);
      }
      g.fillStyle = col || C[ch] || C.k; g.fillRect(ox + OFF + x, OFF + y, 1, 1);
    }
    /* a black outline, then a paper edge around that: a punk sticker slapped on the wall */
    const ring = colour => {
      const d = g.getImageData(ox, 0, CW, CH).data, filled = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH && d[(y * CW + x) * 4 + 3] > 0, edge = [];
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) edge.push([x, y]);
      g.fillStyle = colour; edge.forEach(([x, y]) => g.fillRect(ox + x, y, 1, 1));
    };
    ring(C.k); ring('rgba(244,241,232,.9)');
  }
  function sheet(frames, look) {
    frames.forEach(f => { if (f.length !== H || f.some(r => r.length !== W)) console.error('pixel-punks: a frame is not 16x24', f); });
    const cv = document.createElement('canvas'); cv.width = CW * frames.length; cv.height = CH;
    const g = cv.getContext('2d'); frames.forEach((f, i) => paint(g, f, i * CW, look));
    return cv.toDataURL();
  }
  function sprite(cls, frames, look, dur) {
    const el = document.createElement('i'); el.className = 'pxs ' + cls; el.setAttribute('aria-hidden', 'true');
    el.style.backgroundImage = `url(${sheet(frames, look)})`; el.style.setProperty('--n', frames.length); el.style.setProperty('--dur', dur + 's');
    return el;
  }

  /* ---------------- styles ---------------- */
  const css = document.createElement('style');
  css.textContent = `
.tower{--px:3;}
.tower .room{padding-bottom:calc(24px * var(--px) + 40px);}      /* the floor the little people stand on, with room for a speech bubble */
.deco.person{display:none;}
.pxs{position:absolute;bottom:calc(8px - 3px * var(--px));display:block;width:calc(20px * var(--px));height:calc(28px * var(--px));z-index:1;pointer-events:none;
  background-repeat:no-repeat;background-size:calc(20px * var(--px) * var(--n)) 100%;image-rendering:pixelated;image-rendering:crisp-edges;
  animation:pxRun var(--dur) steps(var(--n)) infinite;filter:drop-shadow(calc(var(--px) * 1px) calc(var(--px) * 1px) 0 rgba(0,0,0,.45));}
@keyframes pxRun{to{background-position:calc(20px * var(--px) * var(--n) * -1) 0;}}
.px-artist{left:calc(14px - 2px * var(--px));}
.px-prop{left:calc(14px + 11px * var(--px));}
.px-say{position:absolute;z-index:4;bottom:calc(24px * var(--px) + 12px);max-width:min(200px,calc(100% - 12px));width:max-content;pointer-events:none;
  font:600 .8rem/1.35 "IBM Plex Sans Thai",sans-serif;color:var(--black);background:var(--paper);border:2px solid var(--black);box-shadow:3px 3px 0 var(--black);
  padding:.3rem .55rem;animation:pxSay .24s steps(3) both;}
.px-say::after{content:"";position:absolute;left:var(--tx,18px);bottom:-7px;width:9px;height:9px;margin-left:-5px;background:var(--paper);border-right:2px solid var(--black);border-bottom:2px solid var(--black);transform:rotate(45deg);}
.px-say.v{background:var(--pink);}.px-say.v::after{background:var(--pink);}
.px-say.out{animation:pxSayOut .18s steps(2) both;}
@keyframes pxSay{from{transform:translateY(6px) scale(.6);opacity:0;}}
@keyframes pxSayOut{to{transform:translateY(4px) scale(.7);opacity:0;}}
.px-visitor{position:absolute;display:block;left:0;bottom:calc(8px - 3px * var(--px));z-index:2;transition:transform var(--walk,1.4s) linear;}
.px-visitor .pxs{position:static;}
.px-visitor.flip .pxs{transform:scaleX(-1);}
.px-visitor .px-walk{display:none;}
.px-visitor.walking .px-walk{display:block;}.px-visitor.walking .px-idle{display:none;}
@media(max-width:860px){.tower{--px:2;}.tower .room{padding-bottom:calc(24px * var(--px) + 46px);}.px-say{bottom:calc(24px * var(--px) + 14px);font-size:.72rem;max-width:min(160px,calc(100% - 12px));}}
/* narrow floors (vase / spore buildings on phones): keep the floor plaque on one line */
@media(max-width:480px){.fl{font-size:.6rem;letter-spacing:.06em;white-space:nowrap;padding:.25rem .5rem;}}
@media(prefers-reduced-motion:reduce){.pxs,.px-say,.px-say.out{animation:none;}.px-visitor{transition:none;}}
`;
  document.head.appendChild(css);

  /* ---------------- what they say ---------------- */
  const LINES = {
    arch:    {th: ['อีกชั้นเดียว… หรือสามสิบชั้น', 'หอศิลป์ไม่เอา? ช่างมัน!', 'หมอกยังจางไม่พอ'], en: ['One more layer… or thirty', 'Galleries said no? Who cares!', 'The fog needs more fog']},
    lens:    {th: ['ฝนตกแล้ว ออกไปถ่ายกัน!', 'ห้ามกดปุ่ม "ทำให้สวย"', 'อีกเฟรมเดียว…'], en: ['Rain! Grab the camera!', 'No "make it pretty" button', 'Just one more frame…']},
    tower:   {th: ['ลมบอกให้วาดต่อ', 'ข้อมือขอลาพัก…', 'เส้นนี้ต้องวาดมือ'], en: ['The wind says keep drawing', 'My wrist wants a day off…', 'This line is hand-drawn']},
    vase:    {th: ['ร้าวก็สวย!', 'เตาพังอีกแล้ว 555', 'ไม่มีใบไหนเหมือนกัน'], en: ['Cracks are pretty!', 'The kiln broke again, ha', 'No two come out alike']},
    shell:   {th: ['ทอผิดก็ปล่อยไว้ มันจริงดี', 'ด้ายนี้เคยเป็นเสื้อป้าข้างบ้าน', 'อีกแถวเดียว…'], en: ['Mistakes stay. They are honest.', "This thread was the neighbour's shirt", 'One more row…']},
    collage: {th: ['ข่าวนี้ไม่มีใครอ่าน เดี๋ยวแปะให้ใหญ่', 'กรรไกร กาว ลุย!', 'คัตเตอร์ไว้ใช้ตอนโกรธ'], en: ["Nobody read this. I'll paste it big", 'Scissors, glue, go!', 'Box cutter is for angry days']},
    stack:   {th: ['สีเหลื่อมอีกแล้ว เยี่ยม!', 'เครื่องนี้รอดมาจากโรงเรียน', 'พิมพ์ทีละสี ใจเย็น ๆ'], en: ['Off register again. Perfect!', 'This machine survived a school', 'One colour at a time']},
    dome:    {th: ['ปากกาหมด = งานชิ้นเดียวในโลก', 'สมการนี้สวยกว่าที่คิด', 'รันโค้ด… รอแป๊บ'], en: ['Pen ran dry = one of a kind', 'This equation turned out pretty', 'Running the code… hang on']},
    pixel:   {th: ['ไฟล์พังอีกแล้ว สวยจัง', 'เน็ตช้า มีเวลาคิด', 'อย่ากด Ctrl+Z!'], en: ['File broke again. Gorgeous.', 'Slow wifi, more time to think', "Don't press Ctrl+Z!"]},
    spore:   {th: ['รดน้ำเดือนละครั้งนะ', 'เห็ดกำลังหายใจ', 'ชู่ว… มันกำลังโต'], en: ['Water it once a month', 'The mushrooms are breathing', 'Shh… it is growing']},
  };
  const HELLO = {th: '{a}เอง! กำลังทำงานอยู่', en: '{a} here. Working!'};
  const SEE = {
    th: {free: ['ว้าว “{t}”!', '{p}… เก็บตังค์ก่อน', 'อันนี้แหละ!', 'ขอยืนดูนาน ๆ', 'อยากได้ไปแขวนห้อง'], sold: ['ขายไปแล้ว… ช้าไป!'], reserved: ['มีคนจองแล้ว ขอต่อคิว!']},
    en: {free: ['Whoa, “{t}”!', '{p}… saving up', 'This one!', 'Can I just stare?', 'I want this on my wall'], sold: ['Sold… too late!'], reserved: ['On hold? Put me next!']},
  };
  const L = () => (LANG === 'en' ? 'en' : 'th');
  const pick = a => a[Math.floor(Math.random() * a.length)];
  /* a bubble above someone standing at x (px inside the room); kept inside the room, its tail points at the speaker */
  function say(room, x, text, cls, ms) {
    room.querySelectorAll('.px-say' + (cls ? '.' + cls : ':not(.v)')).forEach(b => b.remove());
    const b = document.createElement('span'); b.className = 'px-say' + (cls ? ' ' + cls : ''); b.setAttribute('aria-hidden', 'true'); b.textContent = text;
    room.appendChild(b);
    const rw = room.clientWidth, bw = b.offsetWidth, left = Math.max(6, Math.min(x - 22, rw - bw - 6));
    b.style.left = left + 'px'; b.style.setProperty('--tx', Math.max(12, Math.min(bw - 12, x - left)) + 'px');
    setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 200); }, ms);
    return b;
  }

  /* ---------------- the artist at work, top room ---------------- */
  function mountArtist() {
    const room = document.querySelector('#floors .floor .room'); if (!room || room.querySelector('.px-artist')) return;
    const kind = PROPS[A.kind] ? A.kind : 'arch', look = LOOK[kind];
    const reach = body(TORSO_REACH, 'stand', look.hair), up = body(TORSO_UP, 'stand', look.hair), still = body(TORSO_DOWN, 'stand', look.hair), blink = body(TORSO_DOWN, 'stand', look.hair, true);
    room.classList.add('px-has-artist');
    room.appendChild(sprite('px-artist', [reach, up, reach, up, reach, up, still, blink], look, 4.2));
    room.appendChild(sprite('px-prop', [PROPS[kind][0], PROPS[kind][1]], null, 1.05));
    let n = 0;
    const talk = () => {
      if (!room.isConnected) return;                                      // the building was re-drawn (language change)
      if (!document.hidden && !room.querySelector('.px-say.v')) {         // wait while the visitor is talking
        const head = room.querySelector('.px-artist'), x = head.offsetLeft + head.offsetWidth / 2;
        say(room, x, n === 0 ? HELLO[L()].replace('{a}', nameL(A)) : LINES[kind][L()][(n - 1) % 3], '', 3200);
        n++;
      }
      setTimeout(talk, n === 1 ? 6500 : 7500);
    };
    setTimeout(talk, 1200);
  }

  /* ---------------- the visitor who follows you up the building ---------------- */
  const vis = document.createElement('span'); vis.className = 'px-visitor'; vis.setAttribute('aria-hidden', 'true');
  vis.appendChild(sprite('px-idle', [body(TORSO_DOWN, 'stand', VISITOR.hair), body(TORSO_DOWN, 'stand', VISITOR.hair), body(TORSO_DOWN, 'stand', VISITOR.hair), body(TORSO_DOWN, 'stand', VISITOR.hair, true)], VISITOR, 3.2));
  vis.appendChild(sprite('px-walk', ['a', 'b', 'a', 'b'].map(l => body(TORSO_DOWN, l, VISITOR.hair)), VISITOR, .6));
  let curRoom = null, timer = 0;
  const pxNow = () => parseFloat(getComputedStyle(document.querySelector('.tower')).getPropertyValue('--px')) || 3;
  function goTo(room) {
    if (!room || room === curRoom) return;
    if (curRoom) curRoom.querySelectorAll('.px-say.v').forEach(b => b.remove());
    curRoom = room; clearTimeout(timer);
    const rw = room.clientWidth, sw = 20 * pxNow(), prop = room.querySelector('.px-prop');
    let to = Math.round(rw * (prop ? .34 : .2));                                   // stop in front of the work
    if (prop) to = Math.max(to, prop.offsetLeft + prop.offsetWidth - 2 * pxNow()); // never on top of the artist
    to = Math.min(to, rw - sw - 4);
    const from = Math.max(to, rw - sw - 18);                                       // come in from the stairs
    room.appendChild(vis);
    const react = () => {
      if (curRoom !== room) return;
      const w = room.querySelector('.work'), p = w && A.pieces[+w.dataset.k]; if (!p) return;
      const st = (typeof workStatus === 'function' && workStatus(p)) || 'free';
      room.querySelectorAll('.px-say:not(.v)').forEach(b => b.remove());
      say(room, to + sw / 2, pick(SEE[L()][st]).replace('{t}', pk(p, 't')).replace('{p}', usd(p.p)), 'v', 3000);
    };
    if (reduce) { vis.style.transform = `translateX(${to}px)`; setTimeout(react, 300); return; }
    vis.style.transition = 'none'; vis.style.transform = `translateX(${from}px)`; vis.classList.add('walking', 'flip');
    void vis.offsetWidth;
    const secs = Math.max(.6, (from - to) / (38 * pxNow()));
    vis.style.setProperty('--walk', secs + 's'); vis.style.transition = ''; vis.style.transform = `translateX(${to}px)`;
    timer = setTimeout(() => { vis.classList.remove('walking', 'flip'); timer = setTimeout(react, 350); }, secs * 1000);
  }
  let io = null;
  function watch() {
    if (io) io.disconnect();
    curRoom = null;
    const floors = [...document.querySelectorAll('#floors .floor')];
    if (!floors.length) return;
    if (!('IntersectionObserver' in window)) { goTo(floors[floors.length - 1].querySelector('.room')); return; }
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) goTo(e.target.querySelector('.room')); }), {rootMargin: '-45% 0px -45% 0px'});
    floors.forEach(f => io.observe(f));
    goTo(floors[0].querySelector('.room'));
  }

  function mount() { mountArtist(); watch(); }
  mount();
  onLang(() => setTimeout(mount, 0));      // the page re-draws the building when the language changes
  addEventListener('resize', () => { const r = curRoom; curRoom = null; goTo(r); });
})();
