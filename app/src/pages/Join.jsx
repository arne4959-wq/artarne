/* join.html — "get a building", for artists */
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import PageShell from '../components/PageShell.jsx';
import Nav from '../components/Nav.jsx';
import {Ransom} from '../components/art.jsx';
import {useDialogs} from '../components/Dialogs.jsx';
import sprite from 'virtual:circles/sprite/join';
import styles from '../styles/join.js';

/* data-t marks the texts the old page translated in place: circles.css still styles them for Lao ([data-t]) */
export default function Join() {
  const {t, lang} = useLang(), {openJoin} = useDialogs(), th = lang !== 'en';   // Lao shows the Thai title, as before
  usePageMeta(th ? 'ขอมีตึก — สำหรับศิลปิน — circles' : 'Get a building — for artists — circles',
    th ? 'อยากมีตึกในเมืองของศิลปิน circles ตั้งราคาเอง รับเงินเอง ไม่มีใครคัดงาน ส่งงานมาได้เลย' : 'Want a building in the circles artists\' city? Set your own prices, get paid directly, no jury. Send us your work.');
  return <PageShell styles={styles} sprite={sprite} lead={<a className="skip" href="#main" data-t="skip_main">{t('skip_main')}</a>}>
    <Nav links={[['index.html#city', 'nav_city']]} menu={[['index.html#city', 'nav_city'], ['index.html#featured', 'foot_feat'], ['join.html', 'foot_join']]}/>
    <header className="jn-hero">
      <span className="jn-stk" aria-hidden="true">NO JURY</span>
      <div className="jn-kick" data-t="jn_kick">{t('jn_kick')}</div>
      <Ransom as="h1" className="rn" id="jn-title" aria-label={th ? 'ขอมีตึก' : 'Get a building'} text={th ? 'ขอมีตึก' : 'GET A BUILDING'} seed={2} wrap/>
      <p className="jn-sub" data-t="join_h">{t('join_h')}</p>
      <p className="jn-lead" data-t="foot_p">{t('foot_p')}</p>
    </header>
    <main id="main">
      <div className="perks">
        {[1, 2, 3].map(i => <div className="perk" key={i}><b>{`0${i}`}</b><h3 data-t={`p${i}_h`}>{t(`p${i}_h`)}</h3><p data-t={`p${i}_p`}>{t(`p${i}_p`)}</p></div>)}
      </div>
      <div className="jn-cta"><p data-t="jn_cta">{t('jn_cta')}</p><button type="button" className="btn" onClick={openJoin} data-t="join_btn">{t('join_btn')}</button></div>
    </main>
    <div className="jn-foot"><a href="index.html#city" data-t="cw_back">{t('cw_back')}</a><a href="privacy.html" data-t="legal_privacy">{t('legal_privacy')}</a><a href="terms.html" data-t="legal_terms">{t('legal_terms')}</a></div>
  </PageShell>;
}
