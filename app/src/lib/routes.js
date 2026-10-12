/* routes.js — which page an address shows. The old .html names are kept, so every page is a real file and links
   are plain <a href="x.html"> (no client-side router). The dynamic forms (cutaway.html?id=, profile.html?id=) still work, like before. Old buy addresses redirect to the profile's donation block. */
export function route(pathname, search = '') {
  const file = decodeURIComponent(pathname.split('/').pop() || 'index.html');
  const q = new URLSearchParams(search);
  let m;
  if (file === 'index.html') return {page: 'home'};
  if (['join.html', 'privacy.html', 'terms.html'].includes(file)) return {page: file.slice(0, -5)};
  if (file === 'manage.html') return {page: 'manage'};
  if (file === '404.html') return {page: 'notFound'};
  if ((m = file.match(/^studio-([a-z0-9-]+)\.html$/i))) return {page: 'studio', id: m[1]};
  if (file === 'cutaway.html') return {page: 'studio', id: q.get('id') || ''};
  if ((m = file.match(/^cutaway-([a-z0-9-]+)\.html$/i))) return {redirect: `studio-${m[1]}.html${search}`};   // pages from before the rename
  if ((m = file.match(/^profile-([a-z0-9-]+)\.html$/i))) return {page: 'profile', id: m[1]};
  if (file === 'profile.html') return {page: 'profile', id: q.get('id') || ''};
  if ((m = file.match(/^buy-([a-z0-9-]+)-(\d+)\.html$/i))) return {redirect: `profile-${m[1]}.html#pf-tips`};   // buying was removed: the artist's donation block
  if (file === 'buy.html') return {redirect: q.get('id') ? `profile-${encodeURIComponent(q.get('id'))}.html#pf-tips` : 'index.html'};
  return {page: 'notFound'};
}
