/* cityPlan.js — the top-down plans of the city map (one per building kind) and the district layout, from site.js unchanged.
   An unknown kind (a real artist may pick any) has no plan: use planOf(kind), which falls back to the collage plan. */

export const PLAN = {
  arch: '<rect x="14" y="10" width="92" height="60"/><path d="M40,70 V42 A20,20 0 0 1 80,42 V70"/>',
  lens: '<rect x="10" y="18" width="42" height="50"/><circle cx="84" cy="44" r="28"/><circle cx="84" cy="44" r="16"/>',
  tower: '<circle cx="60" cy="40" r="32"/><circle cx="60" cy="40" r="20" stroke-dasharray="3 4"/>',
  vase: '<ellipse cx="60" cy="40" rx="42" ry="28"/><circle cx="60" cy="40" r="12"/>',
  shell: '<rect x="8" y="16" width="104" height="50"/><path d="M8,16 q13,-12 26,0 t26,0 t26,0 t26,0"/><path d="M8,41 H112" stroke-dasharray="4 4"/>',
  stack: '<rect x="8" y="48" width="64" height="22"/><rect x="26" y="28" width="64" height="22"/><rect x="14" y="8" width="60" height="22"/>',
  dome: '<circle cx="60" cy="40" r="34"/><circle cx="60" cy="40" r="22"/><circle cx="60" cy="40" r="10"/><path d="M26,40 H94 M60,6 V74" stroke-dasharray="3 4"/>',
  pixel: '<rect x="14" y="50" width="44" height="12"/><rect x="34" y="36" width="44" height="12"/><rect x="8" y="22" width="40" height="12"/><rect x="48" y="8" width="44" height="12"/><rect x="92" y="46" width="8" height="8"/>',
  spore: '<circle cx="60" cy="34" r="30"/><circle cx="60" cy="34" r="10"/><circle cx="20" cy="62" r="12"/><circle cx="96" cy="60" r="9"/>',
  collage: '<rect x="10" y="38" width="50" height="32"/><rect x="38" y="22" width="48" height="32" transform="rotate(-4 62 38)"/><rect x="66" y="8" width="46" height="32"/>',
};
/* district layout for any number of artists: one wide + one narrow block, then rows of three, the leftovers share a row with the plaza */
export function mapSpans(n) {
  if (n <= 1) return {s: [6].slice(0, n), p: 0};
  const s = [4, 2]; let rest = n - 2;
  while (rest >= 3) { s.push(2, 2, 2); rest -= 3; }
  let p = 6;
  if (rest === 1) { s.push(3); p = 3; } else if (rest === 2) { s.push(2, 2); p = 2; }
  return {s, p};
}
export const planOf = kind => PLAN[kind] || PLAN.collage;
