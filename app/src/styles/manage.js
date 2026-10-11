/* manage.html has no old page. It borrows the look of join.html (nav, ransom letters, .btn, tape, hazard stripe), then adds its own rules.
   Palette tokens only. Only transform and opacity are animated. */
import c from 'virtual:circles/css/circles';
import join from 'virtual:circles/page-css/join';

const manage = `
/* ───────── the wall: poured concrete with form seams and tie holes ───────── */
.mg-wall,main.mg-wall{max-width:none;margin:0;position:relative;min-height:calc(100vh - 70px);display:grid;place-items:center;padding:3.4rem 1rem 5rem;overflow:hidden;
  background:var(--grain),
    radial-gradient(circle at 12.5% 50%,var(--black) 0 5px,transparent 6px) 0 0/25% 220px,
    repeating-linear-gradient(90deg,transparent 0 calc(25% - 3px),rgba(14,13,12,.42) calc(25% - 3px) 25%),
    var(--concrete);}
.mg-wall::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(14,13,12,.38),transparent 22%,transparent 70%,rgba(14,13,12,.5));}
.mg-tag{position:absolute;left:4%;bottom:7%;font:400 clamp(3rem,11vw,9rem)/.9 var(--anton);letter-spacing:.06em;color:transparent;-webkit-text-stroke:3px rgba(14,13,12,.28);
  transform:rotate(-7deg);pointer-events:none;user-select:none;}
.mg-wall::after{content:"";position:absolute;left:0;right:0;bottom:0;height:22px;
  background:repeating-linear-gradient(135deg,var(--black) 0 16px,var(--gold) 16px 32px);}

/* floating shapes: small, a few colours, drifting slowly. Only transform moves. They sit at the sides, the door covers the middle. */
.mg-conf{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.mg-conf i{position:absolute;display:block;width:var(--z);height:var(--z);background:var(--c);opacity:.9;transform:rotate(var(--r));animation:mgFloat var(--t) ease-in-out var(--w) infinite alternate;}
.mg-conf .b-dot{border-radius:50%;}
.mg-conf .b-ring{border-radius:50%;background:none;border:5px solid var(--c);}
.mg-conf .b-sq{border:2px solid var(--black);}
.mg-conf .b-star{clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);}
.mg-conf .b-plus{clip-path:polygon(35% 0,65% 0,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0 65%,0 35%,35% 35%);}
.mg-conf .b-tri{clip-path:polygon(50% 4%,98% 92%,2% 92%);}
@keyframes mgFloat{from{transform:translateY(0) rotate(var(--r));}to{transform:translateY(-16px) rotate(calc(var(--r) + 14deg));}}
@media(max-width:860px){.mg-conf i:nth-child(n+11){display:none;}}

/* ───────── the door ───────── */
.mg-door{position:relative;z-index:1;width:min(560px,100%);background:var(--grain),var(--bone);border:6px solid var(--black);box-shadow:14px 14px 0 var(--black);
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
@media(prefers-reduced-motion:reduce){.mg-conf i{animation:none;}.mg-door.in,.mg-door.in .mg-stamp{animation:none;opacity:1;}.mg-door.in .mg-stamp{transform:rotate(9deg);}}
`;

export default [c, join, manage];
