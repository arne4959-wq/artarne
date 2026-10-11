/* index.html — the home page: the city of artists. From index.html + site.js + hd2d.js + the home parts of circles.js.
   Look and behaviour unchanged. What is new: the featured works, the spotlight and the numbers follow the data (real artists first). */
import {useEffect, useLayoutEffect} from 'react';
import {ARTISTS} from '../lib/art.js';
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import {drawGrain} from '../lib/home.js';
import {observeIn, useHeroEffects, useCursor, useLenis, useCountUp} from '../lib/useHome.js';
import PageShell from '../components/PageShell.jsx';
import {SkipLink} from '../components/Ux.jsx';
import Nav from '../components/Nav.jsx';
import {Loader, CursorMarkup, Curtain, Marquee} from '../components/home/HomeTop.jsx';
import Hero from '../components/home/Hero.jsx';
import City from '../components/home/City.jsx';
import {TapeWrap, Manifesto, Cycle, How, Featured, Spotlight, Stats, JoinBand, Support, Footer} from '../components/home/Sections.jsx';
import sprite from 'virtual:circles/sprite/index';
import styles from '../styles/home.js';

const LINKS = [['#city', 'nav_city'], ['#manifesto', 'nav_about']];
const MENU = [['#city', 'nav_city'], ['#manifesto', 'foot_manifesto'], ['#how', 'foot_how'], ['#featured', 'foot_feat'], ['#map', 'foot_map'], ['join.html', 'foot_join']];

export default function Home() {
  const {t} = useLang();
  usePageMeta(t('title_idx'), t('desc_idx'));
  useLayoutEffect(() => { document.documentElement.classList.add('pre'); }, []);   // the hero's entrance waits until the loader is done
  useEffect(() => { drawGrain(); }, []);
  useEffect(() => observeIn([...document.querySelectorAll('.reveal')], null), []);   // sections rise as they scroll into view
  useHeroEffects(); useCursor(); useLenis(); useCountUp([]);
  return <PageShell styles={styles} sprite={sprite} lead={<SkipLink/>}>
    <Loader/><CursorMarkup/><Curtain/><Marquee/>
    <Nav id="nav" brandHref={null} links={LINKS} join menu={MENU}/>
    <main id="main" tabIndex={-1}>
    <Hero/>
    <City artists={ARTISTS}/>
    <TapeWrap/>
    <Manifesto/><Cycle/><How/>
    <TapeWrap/>
    <Featured artists={ARTISTS}/>
    <TapeWrap r/>
    <Spotlight artists={ARTISTS}/>
    <Stats artists={ARTISTS}/><JoinBand/><Support/>
    </main>
    <Footer/>
  </PageShell>;
}
