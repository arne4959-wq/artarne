/* coin.js — the 3D spinning logo of circles.js (coin3d / coinPlay), as markup + a play function.
   A coin is a span.c3 with n edge slices and two faces that <use> the sprite's #orb / #orb-s. */
import {reduce} from './env.js';

export function coinInner({front = '#orb', back = '#orb-s', depth = 7, n = 13} = {}) {
  const edges = Array.from({length: n}, (_, i) =>
    `<i class="c3-edge${i === 0 || i === n - 1 ? ' hi' : ''}" style="transform:translateZ(${(-depth + 2 * depth * i / (n - 1)).toFixed(2)}px)"></i>`).join('');
  return `<span class="c3-lift"><span class="c3-coin">${edges}` +
    `<span class="c3-face" style="transform:translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${front}"/></svg></span>` +
    `<span class="c3-face" style="transform:rotateY(180deg) translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${back}"/></svg></span></span></span>`;
}
export const coinClass = (mode, extra) => ['c3', mode ? 'c3-m' + mode : '', extra || ''].filter(Boolean).join(' ');

/* one animation (c3-once: spin with a bounce, c3-settle: fast spin that slows and settles) */
export function coinPlay(host, cls) {
  if (reduce || !host) return;
  const c = host.querySelector('.c3-coin'); if (!c) return;
  c.classList.remove('c3-once', 'c3-settle'); void c.offsetWidth; c.classList.add(cls);
  c.addEventListener('animationend', () => c.classList.remove(cls), {once: true});
}
