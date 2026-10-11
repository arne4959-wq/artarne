/* manage.html has no old page. It borrows the look of join.html (nav, ransom letters, .btn, tape, hazard stripe), then adds its own rules.
   Palette tokens only. Only transform and opacity are animated. */
import c from 'virtual:circles/css/circles';
import join from 'virtual:circles/page-css/join';

/* a tartan with one repeat `w` px wide: weft and warp bands over a red ground (crossings come out darker, like woven cloth), plus a 45° twill */
const tartan = w => {
  const k = w / 192, px = n => (n * k).toFixed(1) + 'px';
  const bands = [[0, 48, 'rgba(14,13,12,.72)'], [48, 54, 'transparent'], [54, 58, 'rgba(232,183,48,.92)'], [58, 112, 'transparent'], [112, 115, 'rgba(244,241,232,.88)'],
    [115, 136, 'transparent'], [136, 160, 'rgba(14,13,12,.55)'], [160, 192, 'transparent']];
  const stops = bands.map(([a, b, c]) => `${c} ${px(a)} ${px(b)}`).join(',');
  return `repeating-linear-gradient(90deg,${stops}),repeating-linear-gradient(0deg,${stops}),repeating-linear-gradient(45deg,rgba(14,13,12,.14) 0 1px,transparent 1px 3px),var(--tartan-red)`;
};

const manage = `
/* ───────── the wall: a big tartan (the colours of the site: red ground, black bands, gold and paper hairlines), a twill weave, a dark vignette ───────── */
.mg-wall,main.mg-wall{max-width:none;margin:0;position:relative;min-height:calc(100vh - 70px);display:grid;place-items:center;padding:3.4rem 1rem 5rem;overflow:hidden;
  background:var(--grain),${tartan(192)};}
.mg-wall::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 45%,transparent 38%,rgba(14,13,12,.55) 100%);}
.mg-wall::after{content:"";position:absolute;left:0;right:0;bottom:0;height:22px;
  background:repeating-linear-gradient(135deg,var(--black) 0 16px,var(--gold) 16px 32px);}

/* ───────── the wall comes alive ─────────
   Far and mid pieces sit behind the door, near pieces in front of its edge, all standing still. Stickers: a black copy of every piece sits
   a little down and right. Only transform and opacity ever animate. */
.mg-wall{container-type:inline-size;}
.mg-lay{position:absolute;inset:0;pointer-events:none;z-index:0;}
.mg-lay.far{opacity:.62;}
.mg-lay.near{z-index:3;}
.sp{position:absolute;width:var(--z);height:calc(var(--z) * var(--a,1));transform:rotate(var(--r));}
.bl{position:absolute;inset:0;display:block;}
.mg-lay.far .bl{filter:blur(1px);}.mg-lay.near .bl{filter:blur(2.5px);}
.sh,.fg{position:absolute;inset:0;display:block;}
.sh{background:var(--black);transform:translate(calc(var(--z) * .11),calc(var(--z) * .11));}
.fg{background:var(--c);}
.b-tape{clip-path:polygon(0 0,5% 18%,0 36%,5% 54%,0 72%,5% 90%,0 100%,100% 100%,95% 82%,100% 64%,95% 46%,100% 28%,95% 10%,100% 0);}
.fg.b-tape{background:repeating-linear-gradient(90deg,transparent 0 9px,rgba(14,13,12,.16) 9px 11px),var(--c);}
.fg.b-patch{background:${tartan(46)};border:2px dashed var(--paper);outline:2px solid var(--black);outline-offset:-2px;}
svg.sh,svg.fg{background:none;width:100%;height:100%;overflow:visible;}
.peel{clip-path:polygon(0 0,100% 0,100% 62%,62% 100%,0 100%);}
.fold{position:absolute;right:0;bottom:0;width:38%;height:38%;background:var(--paper);clip-path:polygon(0 0,100% 0,0 100%);transform:translate(calc(var(--z) * .06),calc(var(--z) * .06));}

/* light (the look of the city strip on the home page): below the door so the text on it stays clear */
.mg-fx{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;}
.mg-ray{position:absolute;top:-12%;height:126%;left:var(--x);width:var(--w);transform:skewX(22deg);transform-origin:0 0;
  background:linear-gradient(90deg,transparent,rgba(232,183,48,.22) 28%,rgba(244,241,232,.16) 50%,rgba(232,183,48,.22) 72%,transparent);
  -webkit-mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.55) 45%,transparent 84%);mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.55) 45%,transparent 84%);
  opacity:.7;}

/* people on the kerb (pixel art, lib/pixel.js). The wall is a size container, so cqw = a percent of its width. */
.spr{position:relative;width:calc(16px * var(--px,3));height:calc(16px * var(--px,3));}
.spr canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;opacity:0;animation:fr4 var(--dur) steps(1,end) infinite;animation-delay:calc(var(--i) * var(--dur) / var(--n));}
.spr.n2 canvas{animation-name:fr2;}
@keyframes fr4{0%{opacity:1;}25%{opacity:0;}}
@keyframes fr2{0%{opacity:1;}50%{opacity:0;}}
.mg-folk{position:absolute;left:0;right:0;bottom:18px;height:0;z-index:1;pointer-events:none;--px:3;}
.mg-folk::before{content:"";position:absolute;left:0;right:0;bottom:4px;height:110px;background:linear-gradient(0deg,rgba(244,241,232,.62),rgba(244,241,232,.22) 55%,transparent);}   /* a pale pavement, so the people read against the dark tartan */
.mg-w{position:absolute;left:0;bottom:0;will-change:transform;}
.mg-w .flip.rev{transform:scaleX(-1);}
.mg-w .st{position:absolute;left:0;top:0;opacity:0;}
.mg-w.a{animation:mgPathA 84s linear infinite;animation-delay:-14s;}
.mg-w.a .wk{animation:mgOnA 84s linear infinite;animation-delay:-14s;}
.mg-w.a .st{animation:mgStA 84s linear infinite;animation-delay:-14s;}
.mg-w.b{animation:mgPathB 104s linear infinite;animation-delay:-40s;}
.mg-w.b .wk{animation:mgOnB 104s linear infinite;animation-delay:-40s;}
.mg-w.b .st{animation:mgStB 104s linear infinite;animation-delay:-40s;}
@keyframes mgPathA{0%{transform:translate3d(-80px,0,0);}38%,52%{transform:translate3d(calc(50cqw - 24px),0,0);}100%{transform:translate3d(calc(100cqw + 80px),0,0);}}
@keyframes mgOnA{0%,37.9%{opacity:1;}38%,52%{opacity:0;}52.1%,100%{opacity:1;}}
@keyframes mgStA{0%,37.9%{opacity:0;}38%,52%{opacity:1;}52.1%,100%{opacity:0;}}
@keyframes mgPathB{0%{transform:translate3d(calc(100cqw + 80px),0,0);}60%,72%{transform:translate3d(calc(30cqw - 24px),0,0);}100%{transform:translate3d(-80px,0,0);}}
@keyframes mgOnB{0%,59.9%{opacity:1;}60%,72%{opacity:0;}72.1%,100%{opacity:1;}}
@keyframes mgStB{0%,59.9%{opacity:0;}60%,72%{opacity:1;}72.1%,100%{opacity:0;}}
.mg-sit{position:absolute;left:5cqw;bottom:0;}
/* the bird: flies in from the right, lands on the door's corner, looks about, flies off. Lives inside the door. */
.mg-bird{position:absolute;left:10px;top:-68px;z-index:5;pointer-events:none;--px:4;animation:mgBird 48s linear infinite;will-change:transform;}
.mg-bird .perch{position:absolute;left:0;top:0;opacity:0;animation:mgPerchOn 48s linear infinite;}
.mg-bird .fly{animation:mgFlyOn 48s linear infinite;}
@keyframes mgBird{0%{transform:translate3d(60cqw,-130px,0);}12%,32%{transform:translate3d(0,0,0);}42%,100%{transform:translate3d(-60cqw,-170px,0);}}
@keyframes mgFlyOn{0%,11.9%{opacity:1;}12%,31.9%{opacity:0;}32%,100%{opacity:1;}}
@keyframes mgPerchOn{0%,11.9%{opacity:0;}12%,31.9%{opacity:1;}32%,100%{opacity:0;}}
.mg-bird .fly canvas{animation-name:fr4;}
.mg-bird .fly.n4 canvas{animation-name:fr4;}

/* the lock on the door's edge, the key and the confetti */
.mg-lock{position:absolute;right:-26px;top:56%;width:46px;height:70px;z-index:4;background:var(--black);border:3px solid var(--black);box-shadow:4px 4px 0 var(--pink);pointer-events:none;
  background-image:radial-gradient(circle at 50% 36%,var(--paper) 0 6px,transparent 7px);}
.mg-lock::after{content:"";position:absolute;left:50%;top:44%;width:12px;height:22px;margin-left:-6px;background:var(--paper);clip-path:polygon(25% 0,75% 0,100% 100%,0 100%);}
.mg-key{position:absolute;left:50%;top:36%;width:76px;height:22px;margin:-11px 0 0 -76px;transform-origin:100% 50%;opacity:0;animation:mgKey 1.1s var(--ease) both;}
.k-ring{position:absolute;left:0;top:0;width:22px;height:22px;border-radius:50%;border:5px solid var(--gold);box-shadow:3px 3px 0 var(--black);}
.k-body{position:absolute;left:20px;top:8px;width:56px;height:7px;background:var(--gold);box-shadow:3px 3px 0 var(--black);clip-path:polygon(0 0,100% 0,100% 100%,86% 100%,86% 190%,74% 190%,74% 100%,60% 100%,60% 230%,46% 230%,46% 100%,0 100%);}
@keyframes mgKey{0%{opacity:0;transform:translate3d(-300px,90px,0) rotate(-35deg);}12%{opacity:1;}55%{opacity:1;transform:translate3d(-26px,0,0) rotate(0deg);}68%{opacity:1;transform:translate3d(0,0,0) rotate(0deg);}100%{opacity:1;transform:translate3d(0,0,0) rotate(90deg);}}
.mg-bit{position:absolute;left:50%;top:36%;width:var(--s);height:calc(var(--s) * .62);background:var(--c);border:2px solid var(--black);opacity:0;animation:mgBit .95s var(--ease) calc(.72s + var(--d)) both;}
@keyframes mgBit{0%{opacity:0;transform:translate3d(0,0,0) scale(.4) rotate(0deg);}12%{opacity:1;}45%{opacity:1;transform:translate3d(calc(var(--dx) * .85),calc(var(--dy) * .85),0) scale(1) rotate(calc(var(--rot) * .6));}100%{opacity:0;transform:translate3d(var(--dx),calc(var(--dy) + 150px),0) scale(.9) rotate(var(--rot));}}
.mg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}

/* answers to what the visitor does */
.mg-bolt.re{animation:mgRattle .5s ease-out both;}
@keyframes mgRattle{0%,100%{transform:translate3d(0,0,0) rotate(0deg);}15%{transform:translate3d(-3px,1px,0) rotate(-14deg);}35%{transform:translate3d(3px,-1px,0) rotate(12deg);}55%{transform:translate3d(-2px,1px,0) rotate(-8deg);}75%{transform:translate3d(1px,0,0) rotate(4deg);}}
.mg-stamp.re{animation:mgThump .38s var(--ease) both;}
.mg-door.opening{animation:mgShudder .35s .8s ease-out both;}
@keyframes mgShudder{0%,100%{transform:translate3d(0,0,0);}30%{transform:translate3d(-3px,0,0);}60%{transform:translate3d(2px,0,0);}}
@media(max-width:860px){
  .mg-lay.near{display:none;}
  .mg-lock{right:-4px;top:42%;width:36px;height:56px;}
  .mg-folk{--px:2;}.mg-bird{--px:3;top:-52px;}
  .mg-sit{left:4cqw;}
}


/* ───────── the door ───────── */
.mg-door{position:relative;z-index:2;width:min(560px,100%);background:var(--grain),var(--bone);border:6px solid var(--black);box-shadow:14px 14px 0 var(--black);
  padding:4.4rem 2.2rem 2.2rem;transform-origin:50% 0;}
.mg-door.in{animation:mgSlam .55s var(--ease) both;}
@keyframes mgSlam{0%{opacity:0;transform:translateY(-46px) rotate(-2.4deg);}70%{opacity:1;transform:translateY(5px) rotate(.4deg);}100%{opacity:1;transform:none;}}
.mg-bolt{position:absolute;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--paper) 0 18%,var(--concrete) 20% 55%,var(--black) 58%);border:2px solid var(--black);}
.mg-bolt::after{content:"";position:absolute;left:3px;right:3px;top:50%;height:3px;margin-top:-1.5px;background:var(--black);transform:rotate(var(--r,35deg));}
.mg-bolt.a{left:12px;top:42px;}.mg-bolt.b{right:12px;top:42px;--r:-20deg;}.mg-bolt.c{left:12px;bottom:12px;--r:80deg;}.mg-bolt.d{right:12px;bottom:12px;--r:10deg;}
.mg-hazard{position:absolute;left:-6px;right:-6px;top:-6px;height:26px;border:6px solid var(--black);border-bottom-width:4px;
  background:repeating-linear-gradient(135deg,var(--black) 0 14px,var(--gold) 14px 28px);}
.mg-kick{position:absolute;left:1.4rem;top:1.7rem;background:var(--pink);color:var(--black);border:var(--line) solid var(--black);padding:.3rem .8rem;z-index:1;
  font:400 .95rem var(--anton);letter-spacing:.14em;transform:rotate(-2.5deg);box-shadow:4px 4px 0 var(--black);}
.mg-pin{position:absolute;left:4px;top:1.1rem;width:62px;z-index:3;transform:rotate(-28deg);overflow:visible;pointer-events:none;}
.mg-stamp{position:absolute;right:1.2rem;top:3.3rem;padding:.25rem .7rem;border:4px solid var(--tartan-red);color:var(--tartan-red);background:var(--paper);
  font:400 1.05rem var(--anton);letter-spacing:.12em;transform:rotate(9deg);mix-blend-mode:multiply;}
.mg-door.in .mg-stamp{animation:mgThump .38s .5s var(--ease) both;}
@keyframes mgThump{0%{opacity:0;transform:rotate(9deg) scale(1.9);}100%{opacity:1;transform:rotate(9deg) scale(1);}}
.mg-door h1{font-size:clamp(2.6rem,9vw,4.4rem);margin:.4rem 0 1rem;}
.mg-door h1.rn span{border-color:var(--black);}
.mg-sub{font:400 1rem/1.85 var(--thai);margin-bottom:1.6rem;border-left:5px solid var(--pink);padding-left:.9rem;}
.mg-field{display:block;margin-bottom:1.3rem;}
.mg-field>span{display:block;font:400 .85rem var(--type);letter-spacing:.14em;text-transform:uppercase;margin-bottom:.4rem;}
.mg-slot{width:100%;background:var(--black);color:var(--paper);border:var(--line) solid var(--black);padding:.95rem 1rem;font:400 1.25rem var(--type);letter-spacing:.04em;
  border-radius:0;box-shadow:inset 0 5px 0 rgba(244,241,232,.1);}
.mg-slot::placeholder{color:var(--concrete);}
.mg-slot:focus{outline:3px solid var(--pink);outline-offset:3px;}
.mg-err{margin:-.6rem 0 1rem;font:400 .95rem var(--type);color:var(--tartan-red);}
.mg-go{width:100%;text-align:center;}
.mg-go:disabled{opacity:.55;cursor:wait;}
.mg-nokey{margin-top:1.6rem;padding-top:1.1rem;border-top:3px dashed var(--black);font:400 .95rem var(--type);display:flex;flex-wrap:wrap;gap:.4rem 1rem;align-items:center;}
.mg-nokey a{color:var(--black);font-weight:700;text-decoration:none;border-bottom:3px solid var(--pink);}
.mg-sent h2{font:400 clamp(2rem,7vw,3rem)/1.1 var(--anton);letter-spacing:.05em;display:inline-block;background:var(--gold);border:var(--line) solid var(--black);padding:.2rem .8rem;transform:rotate(-2deg);margin:.4rem 0 1.1rem;box-shadow:5px 5px 0 var(--black);}
html[lang="th"] .mg-sent h2,html[lang="lo"] .mg-sent h2{font-family:"Chonburi",var(--thai);letter-spacing:0;}
.mg-sent p{font:400 1rem/1.85 var(--thai);margin-bottom:1.3rem;}
.mg-status{font:400 .95rem var(--type);margin:0 0 1rem;min-height:1.4em;}
.mg-bad{background:var(--tartan-red);color:var(--paper);border:var(--line) solid var(--black);padding:.7rem .9rem;margin-bottom:1.2rem;font:400 .98rem/1.6 var(--thai);}

/* ───────── control room (signed in) ───────── */
.mg-room{background:var(--black);color:var(--paper);padding:2.6rem 3rem 2.4rem;position:relative;overflow:hidden;}
.mg-room::after{content:"";position:absolute;left:0;right:0;bottom:0;height:18px;background:repeating-linear-gradient(135deg,var(--black) 0 16px,var(--gold) 16px 32px);}
.mg-room .mg-kick2{display:table;background:var(--pink);color:var(--black);font:400 .95rem var(--anton);letter-spacing:.14em;padding:.25rem .8rem;margin-bottom:1rem;}
.mg-room h1{font:400 clamp(2rem,6vw,3.8rem)/1.1 "Chonburi",var(--thai);}
.mg-out{position:absolute;right:3rem;top:2.4rem;}
.mg-out .btn{font-size:.95rem;padding:.55rem 1.1rem;background:var(--paper);color:var(--black);border-color:var(--paper);}
.mg-shell{max-width:1100px;margin:0 auto;padding:2.2rem 1.2rem 4rem;}
.mg-tabs{display:flex;flex-wrap:wrap;gap:.8rem;margin-bottom:1.8rem;}
.mg-tab{font:400 1.05rem var(--anton);letter-spacing:.14em;text-transform:uppercase;padding:.65rem 1.3rem;border:var(--line) solid var(--black);background:var(--paper);color:var(--black);cursor:pointer;box-shadow:5px 5px 0 var(--black);}
html[lang="th"] .mg-tab,html[lang="lo"] .mg-tab{font-family:"Chonburi",var(--thai);letter-spacing:.02em;text-transform:none;}
.mg-tab[aria-selected="true"]{background:var(--black);color:var(--paper);transform:translate(3px,3px);box-shadow:2px 2px 0 var(--pink);}
.mg-panel{background:var(--paper);border:var(--line) solid var(--black);box-shadow:8px 8px 0 var(--black);padding:1.8rem 1.6rem 1.6rem;margin-bottom:2rem;position:relative;}
.mg-panel>h2{font:400 1.45rem/1.3 "Chonburi",var(--thai);margin-bottom:1.1rem;}
.mg-note{background:var(--gold);border:var(--line) solid var(--black);padding:.8rem 1rem;margin-bottom:1.4rem;font:400 .98rem/1.7 var(--thai);}
.mg-note.warn{background:var(--paper);border-style:dashed;}
.mg-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0 1.4rem;}
.mg-grid .wide{grid-column:1/-1;}
.mg-lbl{display:block;margin-bottom:1.1rem;}
.mg-lbl>span{display:block;font:400 .82rem var(--type);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.3rem;}
.mg-in,.mg-sel,.mg-ta{width:100%;background:var(--bone);color:var(--black);border:var(--line) solid var(--black);padding:.65rem .8rem;font:400 1rem var(--thai);border-radius:0;}
.mg-ta{min-height:6.5rem;resize:vertical;line-height:1.7;}
.mg-in:focus,.mg-sel:focus,.mg-ta:focus{outline:3px solid var(--pink);outline-offset:2px;}
.mg-lbl.bad .mg-in,.mg-lbl.bad .mg-sel,.mg-lbl.bad .mg-ta{border-color:var(--tartan-red);}
.mg-lbl small{display:block;color:var(--tartan-red);font:400 .88rem var(--type);margin-top:.25rem;}
.mg-check{display:flex;align-items:center;gap:.7rem;margin-bottom:1.1rem;font:400 1rem var(--thai);cursor:pointer;}
.mg-check input{width:26px;height:26px;accent-color:var(--black);}
.mg-h3{font:400 .9rem var(--anton);letter-spacing:.16em;text-transform:uppercase;margin:1.4rem 0 1rem;padding-bottom:.4rem;border-bottom:var(--line) solid var(--black);}
.mg-bar{display:flex;flex-wrap:wrap;align-items:center;gap:.9rem 1.2rem;margin-top:.6rem;}
.mg-bar .btn{font-size:1rem;padding:.7rem 1.5rem;}
.mg-bar .btn:disabled{opacity:.55;cursor:wait;}
.mg-ok{font:400 .95rem var(--type);}
.mg-ok.bad{color:var(--tartan-red);}

/* works */
.mg-works{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:2rem;margin-bottom:1.6rem;}
.mg-work{background:var(--bone);border:var(--line) solid var(--black);box-shadow:6px 6px 0 var(--black);display:flex;flex-direction:column;position:relative;}
.mg-work::before{content:"";position:absolute;top:-12px;left:1rem;width:64px;height:22px;background:var(--pink);border:2px solid var(--black);transform:rotate(-4deg);z-index:1;}
.mg-work:nth-child(3n+2)::before{background:var(--gold);}.mg-work:nth-child(3n)::before{background:var(--tartan-red);}
.mg-pic{aspect-ratio:var(--ar,1/1);background:var(--concrete);border-bottom:var(--line) solid var(--black);display:grid;place-items:center;overflow:hidden;font:400 .85rem var(--type);}
.mg-pic img{width:100%;height:100%;object-fit:cover;display:block;}
.mg-wbody{padding:.8rem .9rem 1rem;display:flex;flex-direction:column;gap:.55rem;flex:1;}
.mg-wbody b{font:400 1.1rem/1.4 "Chonburi",var(--thai);}
.mg-wbody .meta{font:400 .85rem var(--type);}
.mg-seg{display:grid;grid-template-columns:repeat(3,1fr);border:var(--line) solid var(--black);}
.mg-seg button{padding:.5rem .2rem;font:400 .82rem var(--thai);background:var(--paper);color:var(--black);border:0;border-right:2px solid var(--black);cursor:pointer;}
.mg-seg button:last-child{border-right:0;}
.mg-seg button[aria-pressed="true"]{background:var(--black);color:var(--paper);}
.mg-seg button[aria-pressed="true"].res{background:var(--gold);color:var(--black);}
.mg-seg button[aria-pressed="true"].sold{background:var(--tartan-red);color:var(--paper);}
.mg-acts{display:flex;gap:.6rem;margin-top:auto;}
.mg-mini{flex:1;font:400 .85rem var(--thai);padding:.5rem .4rem;border:var(--line) solid var(--black);background:var(--paper);color:var(--black);cursor:pointer;}
.mg-mini.del[data-sure]{background:var(--tartan-red);color:var(--paper);}
.mg-empty{padding:2.4rem 1rem;text-align:center;font:400 1.05rem var(--type);border:var(--line) dashed var(--black);margin-bottom:1.6rem;}
.mg-up{display:flex;flex-wrap:wrap;gap:1rem;align-items:center;margin-bottom:1.2rem;}
.mg-up .mg-pic{width:160px;border:var(--line) solid var(--black);flex:none;}
.mg-up input[type=file]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
.mg-file{display:inline-block;font:400 1rem var(--thai);padding:.6rem 1.1rem;border:var(--line) solid var(--black);background:var(--gold);cursor:pointer;box-shadow:4px 4px 0 var(--black);}
.mg-file:focus-within{outline:3px solid var(--pink);outline-offset:3px;}
.mg-up small{flex:1 1 220px;font:400 .85rem/1.6 var(--type);}
.mg-qr{width:200px;}

@media(max-width:860px){
  .mg-room{padding:2rem 1.2rem 2rem;}.mg-out{position:static;margin-top:1rem;}
  .mg-grid{grid-template-columns:1fr;}
  .mg-door{padding:4.2rem 1.2rem 1.6rem;box-shadow:9px 9px 0 var(--black);}
  .mg-stamp{position:static;display:table;margin:.6rem 0 .5rem auto;font-size:.85rem;}
  .mg-tab{flex:1 1 auto;text-align:center;}
}
@media(prefers-reduced-motion:reduce){
  .mg-door.in,.mg-door.in .mg-stamp,.mg-bolt.re,.mg-stamp.re,.mg-door.opening{animation:none;}
  .mg-door.in,.mg-door.in .mg-stamp{opacity:1;}.mg-door.in .mg-stamp,.mg-stamp.re{transform:rotate(9deg);opacity:1;}
  .mg-ray{opacity:.7;}
  .mg-w{animation:none!important;transform:translate3d(var(--rx),0,0);}.mg-w .wk{animation:none!important;opacity:1;}.mg-w .st{animation:none!important;opacity:0;}
  .mg-bird{animation:none;transform:translate3d(0,0,0);}.mg-bird .fly{animation:none;opacity:0;}.mg-bird .perch{animation:none;opacity:1;}
  .spr canvas{animation:none!important;}.spr canvas:first-child{opacity:1;}
}
`;

export default [c, join, manage];
