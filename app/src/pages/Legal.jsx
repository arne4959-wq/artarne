/* privacy.html and terms.html — the long text is read from the old pages (Thai and English blocks, CSS shows one) */
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import PageShell from '../components/PageShell.jsx';
import Nav from '../components/Nav.jsx';
import sprite from 'virtual:circles/sprite/privacy';
import privacyBody from 'virtual:circles/page-body/privacy';
import termsBody from 'virtual:circles/page-body/terms';
import privacyCss from '../styles/privacy.js';
import termsCss from '../styles/terms.js';

const PAGES = {
  privacy: {body: privacyBody, styles: privacyCss, other: ['terms.html', 'legal_terms'],
    meta: th => [(th ? 'นโยบายความเป็นส่วนตัว' : 'Privacy policy') + ' — circles', th ? 'circles เก็บข้อมูลอะไร ใช้ทำอะไร ส่งให้ใคร และสิทธิของคุณ' : 'What circles collects, why, who sees it, and your rights']},
  terms: {body: termsBody, styles: termsCss, other: ['privacy.html', 'legal_privacy'],
    meta: th => [(th ? 'เงื่อนไขการใช้งาน' : 'Terms of use') + ' — circles', th ? 'กติกาการดูงาน ซื้อ และใช้เว็บไซต์ circles' : 'The rules for viewing work, buying and using circles']},
};

export default function Legal({which}) {
  const {t, lang} = useLang(), P = PAGES[which];
  usePageMeta(...P.meta(lang !== 'en'));
  return <PageShell styles={P.styles} sprite={sprite}>
    <Nav links={[['index.html#city', 'nav_city'], P.other]}/>
    <main className="legal" dangerouslySetInnerHTML={{__html: P.body}}/>
    <div className="legal-foot"><a href="index.html" data-t="cw_back">{t('cw_back')}</a><a href={P.other[0]} data-t={P.other[1]}>{t(P.other[1])}</a></div>
  </PageShell>;
}
