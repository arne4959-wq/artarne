/* Dist.jsx — the street signs to the other districts above the footer, and the "Help circles keep going" link (the footer row of circles.js ux()). */
import {useLang} from '../lib/i18n.jsx';
import {useDialogs} from './Dialogs.jsx';

export function Dist({here = ''}) {
  const {t} = useLang();
  return <nav className="pl-dist" aria-label={t('dist_aria')}><span className="pl-dist-k">{t('dist_k')}</span>
    {[['index.html#city', 'dist_city', 'home'], ['highlights.html', 'dist_hi', 'highlights'], ['legends.html', 'dist_lg', 'legends']].map(([h, k, pg]) =>
      <a key={k} className="pl-sign" href={h} aria-current={here === pg ? 'page' : undefined}>{t(k)}</a>)}</nav>;
}
export function ScLink() {
  const {t} = useLang(), {openSupportCircles} = useDialogs();
  return <button type="button" className="calm sc-foot" data-sc="" onClick={() => openSupportCircles()}>{t('sc_link')}</button>;
}
