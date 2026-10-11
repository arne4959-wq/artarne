/* KeyBurst.jsx — the lock on the door's edge. When the key link has been sent (`open`), a gold key flies in, turns in the keyhole,
   and paper confetti bursts out. Transform and opacity only. */
const COLS = ['pink', 'gold', 'paper', 'tartan-red', 'gold', 'pink'];
/* 22 pieces thrown out in a fan: [dx, dy, spin] from fixed numbers, so every send looks the same */
const BITS = Array.from({length: 22}, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + (i % 3) * .21, r = 90 + (i * 37) % 110;
  return {dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r * .8) - 30, rot: ((i * 83) % 700) - 350, s: 11 + (i * 5) % 9, c: COLS[i % COLS.length], d: (i % 5) * .03};
});

export default function KeyBurst({open}) {
  return <div className="mg-lock" aria-hidden="true">
    {open && <>
      <span className="mg-key"><i className="k-ring"/><i className="k-body"/></span>
      {BITS.map((b, i) => <i key={i} className="mg-bit" style={{'--dx': b.dx + 'px', '--dy': b.dy + 'px', '--rot': b.rot + 'deg', '--s': b.s + 'px', '--c': `var(--${b.c})`, '--d': b.d + 's'}}/>)}
    </>}
  </div>;
}
