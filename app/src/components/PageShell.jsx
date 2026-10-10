/* PageShell — what every old page had around its content: its own CSS (in the old order), its hidden <svg> sprite,
   and the page-change curtain. Pages render inside it. */
import {useEffect} from 'react';
import {usePageStyles} from '../lib/pageStyle.js';
import {startCurtain} from '../lib/curtain.js';
import Sprite from './Sprite.jsx';

export default function PageShell({styles, sprite, lead = null, children}) {
  usePageStyles(styles);
  useEffect(() => { startCurtain(); }, []);           // after the sprite is in the page: the curtain coin needs #orb
  return <>{lead}{sprite != null && <Sprite svg={sprite}/>}{children}</>;   // lead: what the old page had before its sprite (join's skip link)
}
