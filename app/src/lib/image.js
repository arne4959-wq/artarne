/* image.js — shrink a picture in the browser before it goes to Storage (phone photos are 5–12 MB; the site needs ~1600 px). */
import {IMAGE_TYPES, fitSize, ratioOf} from './manage.js';

const load = file => new Promise((res, rej) => {
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); res(img); };
  img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad_image')); };
  img.src = url;
});

/* → {blob, ext, ratio}. `max` = longest side in px. A QR must stay sharp, so it is PNG; artwork becomes WebP (JPEG where WebP is unavailable). */
export async function prepareImage(file, {max = 1600, png = false, limit = 4.8 * 1024 * 1024} = {}) {
  if (!file || !IMAGE_TYPES.includes(file.type)) throw new Error('bad_type');
  if (file.size > 25 * 1024 * 1024) throw new Error('too_big');
  const img = await load(file), {w, h} = fitSize(img.naturalWidth, img.naturalHeight, max);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  const to = (type, q) => new Promise(r => c.toBlob(r, type, q));
  let blob, ext;
  if (png) { blob = await to('image/png'); ext = 'png'; }
  else { blob = await to('image/webp', .86); ext = 'webp'; if (!blob || blob.type !== 'image/webp') { blob = await to('image/jpeg', .88); ext = 'jpg'; } }
  if (!blob) throw new Error('bad_image');
  if (blob.size > limit) throw new Error('too_big');   // the buckets accept 5 MB (art) and 2 MB (qr): callers pass their own limit
  return {blob, ext, ratio: ratioOf(w, h)};
}
