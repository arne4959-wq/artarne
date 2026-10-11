/* lang.js — the language helpers of circles.js, as pure functions of one language.
   The old site kept LANG in a global; here makeLang(lang) returns the same helpers bound to that language,
   and the React side (i18n.jsx) builds a new set whenever the language changes.
   Same rules as before: a missing En / Lo field falls back to the Thai text, a missing key falls back to STR.th. */
import {STR} from 'virtual:circles/strings';
import {DISC_EN, CITY_EN, DISC_LO, CITY_LO} from 'virtual:circles/data';
import {CONFIG} from 'virtual:circles/config';

export const LANGS = ['th', 'en', 'lo'];
/* the language button cycles TH -> EN -> ລາວ -> TH; it shows the language it will switch to */
export const LANG_NEXT = {th: 'en', en: 'lo', lo: 'th'}, LANG_BTN = {th: 'TH', en: 'EN', lo: 'ລາວ'}, LANG_NAME = {th: 'ภาษาไทย', en: 'English', lo: 'ພາສາລາວ'};
export const LANG_KEY = 'circles-lang';

export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const NF = new Intl.NumberFormat('en-US');          // built once: constructing Intl objects per call is slow
export const usd = n => '$' + NF.format(n);
const lakRound = k => { const step = k < 1e6 ? 1e4 : 1e5; return Math.round(k / step) * step; };

/* first visit: ?lang= wins, then the saved choice, then the browser language (Thai, Lao, else English) */
export function detectLang({search = '', saved = null, navLang = 'th'} = {}) {
  const q = new URLSearchParams(search).get('lang'); if (LANGS.includes(q)) return q;
  if (LANGS.includes(saved)) return saved;
  const nav = String(navLang || 'th').toLowerCase();
  return nav.startsWith('th') ? 'th' : nav.startsWith('lo') ? 'lo' : 'en';
}

export function makeLang(lang) {
  const t = (k, v) => {
    let s = STR[lang][k]; if (s === undefined) s = STR.th[k]; if (s === undefined) return k;
    if (v && typeof s === 'string') for (const x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  };
  const pk = (o, k) => (lang === 'en' && o[k + 'En'] != null) ? o[k + 'En'] : (lang === 'lo' && o[k + 'Lo'] != null) ? o[k + 'Lo'] : o[k];
  const nameL = a => pk(a, 'name');
  const discL = a => lang === 'en' ? (DISC_EN[a.disc] || a.disc) : lang === 'lo' ? (DISC_LO[a.disc] || a.disc) : a.disc;
  const cityL = a => lang === 'en' ? (CITY_EN[a.city] || a.city) : lang === 'lo' ? (CITY_LO[a.city] || a.city) : a.city;
  const titleL = p => (lang === 'lo' && p.titleLo != null) ? p.titleLo : pk(p, 't');   // a work's title; Lao uses titleLo, missing = the Thai title
  const bldgL = a => lang === 'en' ? `${nameL(a)}'s building` : lang === 'lo' ? 'ຕຶກຂອງ' + nameL(a) : 'ตึกของ' + a.name;
  const fmtSize = p => p.s == null ? (lang === 'lo' && p.sLo != null ? p.sLo : '') : lang === 'en' ? p.s.replace('ซม.', 'cm').replace('สูง', 'H') : (lang === 'lo' && p.sLo != null) ? p.sLo : p.s;   // a work from the database may have no size
  /* prices: dollars in artists.js. Lao pages (with CONFIG.lakPerUsd set) show kip, a work's own priceLak first */
  const lakOn = lang === 'lo' && +CONFIG.lakPerUsd > 0;
  const lak = (n, w) => NF.format(w && +w.priceLak > 0 ? +w.priceLak : lakRound(n * CONFIG.lakPerUsd)) + ' ₭';
  const money = (n, w) => lakOn ? lak(n, w) : usd(n);
  const moneyHtml = (n, w) => lakOn ? `${esc(lak(n, w))}<small class="mny-s">${esc(usd(n))}</small>` : esc(usd(n));
  const kip = (n, w) => (+CONFIG.lakPerUsd > 0 ? lak(n, w) : '');   // kip in every language: the LAO QR block always asks for kip
  const usdText = usd;
  return {lang, t, pk, nameL, discL, cityL, titleL, bldgL, fmtSize, money, moneyHtml, lakOn, kip, usdText};
}
