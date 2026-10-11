/* small pieces several old pages repeat */
import {Fragment} from 'react';
import {useLang} from '../lib/i18n.jsx';

/* the footer of buy / profile (and studio) pages */
export function MiniFoot() {
  const {t} = useLang();
  return <footer className="mini-foot"><a href="index.html">circles</a> · <a href="privacy.html" data-t="legal_privacy">{t('legal_privacy')}</a> · <a href="terms.html" data-t="legal_terms">{t('legal_terms')}</a></footer>;
}

/* "no such building" inside a page whose id is unknown */
export function NotFoundSection() {
  const {t} = useLang();
  return <section className="nf"><h1>{t('nf_h')}</h1><p>{t('nf_p')}</p><a className="btn pk" href="index.html#city">{t('cw_back')}</a></section>;
}

/* a translated string with markers (@@, @A …) swapped for nodes: the old code escaped the text, then replaced the marker with HTML */
export function Fill({text, with: parts}) {
  const keys = Object.keys(parts), re = new RegExp('(' + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')');
  return <>{text.split(re).map((x, i) => keys.includes(x) ? <Fragment key={i}>{parts[x]}</Fragment> : x)}</>;
}
