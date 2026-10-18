/* <Coin> = the span that coinSwap() put in place of a logo <svg> (see lib/coin.js) */
import {forwardRef} from 'react';
import {coinInner, coinClass} from '../lib/coin.js';

const Coin = forwardRef(function Coin({front, back, depth, n, mode, className, lead, ...rest}, ref) {
  return <span ref={ref} className={coinClass(mode, className, lead)} aria-hidden="true" {...rest}
    dangerouslySetInnerHTML={{__html: coinInner({front, back, depth, n})}}/>;
});
export default Coin;
