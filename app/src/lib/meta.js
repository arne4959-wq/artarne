/* meta.js — setMeta of circles.js as a hook: title + description + og / twitter copies */
import {useEffect} from 'react';

export function setMeta(title, desc) {
  document.title = title;
  const set = (sel, v) => { const m = document.querySelector(sel); if (m) m.setAttribute('content', v); };
  set('meta[name="description"]', desc); set('meta[property="og:title"]', title); set('meta[property="og:description"]', desc);
  set('meta[name="twitter:title"]', title); set('meta[name="twitter:description"]', desc);
}
export function usePageMeta(title, desc) {
  useEffect(() => { setMeta(title, desc); }, [title, desc]);
}
