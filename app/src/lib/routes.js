/* routes.js — which page an address shows. The old .html names are kept, so every page is a real file and links
   are plain <a href="x.html"> (no client-side router). The dynamic forms (cutaway.html?id=, buy.html?id=&k=,
   profile.html?id=) still work, like before. */
export function route(pathname, search = '') {
  const file = decodeURIComponent(pathname.split('/').pop() || 'index.html');
  const q = new URLSearchParams(search);
  let m;
  if (file === 'index.html') return {page: 'home'};
  if (['join.html', 'privacy.html', 'terms.html'].includes(file)) return {page: file.slice(0, -5)};
  if (file === '404.html') return {page: 'notFound'};
  if ((m = file.match(/^studio-([a-z0-9-]+)\.html$/i))) return {page: 'studio', id: m[1]};
  if (file === 'cutaway.html') return {page: 'studio', id: q.get('id') || ''};
  if ((m = file.match(/^cutaway-([a-z0-9-]+)\.html$/i))) return {redirect: `studio-${m[1]}.html${search}`};   // pages from before the rename
  if ((m = file.match(/^profile-([a-z0-9-]+)\.html$/i))) return {page: 'profile', id: m[1]};
  if (file === 'profile.html') return {page: 'profile', id: q.get('id') || ''};
  if ((m = file.match(/^buy-([a-z0-9-]+)-(\d+)\.html$/i))) return {page: 'buy', id: m[1], k: +m[2]};
  if (file === 'buy.html') return {page: 'buy', id: q.get('id') || '', k: +(q.get('k') || 0)};
  return {page: 'notFound'};
}
