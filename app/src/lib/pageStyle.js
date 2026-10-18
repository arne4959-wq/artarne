/* pageStyle.js — every old page had its own <style> plus its own <link>s, and they clash (body, :root, .hero ...).
   usePageStyles(list) puts a page's CSS into <head> while that page is on screen and takes it out when it leaves,
   so each route looks exactly like its old page. Order in the list = the old <link> order, then the page's <style>. */
import {useLayoutEffect} from 'react';

export function usePageStyles(list) {
  useLayoutEffect(() => {
    const els = list.map(css => {
      const el = document.createElement('style');
      el.dataset.page = '';
      el.textContent = css;
      document.head.appendChild(el);
      return el;
    });
    return () => els.forEach(el => el.remove());
  }, [list]);
}
