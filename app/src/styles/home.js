/* CSS of the old index.html, in its old order (circles.css, then its <style>, then punk.css, which index.html links after the <style> so it wins ties). fonts.css stays a render-blocking <link> in index.html. */
import c from 'virtual:circles/css/circles';
import p from 'virtual:circles/page-css/index';
import k from 'virtual:circles/css/punk';
export default [c, p, k];
