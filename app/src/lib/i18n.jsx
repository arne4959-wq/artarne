/* i18n.jsx — the language as React state. Replaces applyLang() / onLang() / the data-t attributes of the old site:
   components read useLang() and re-render when the language changes. */
import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {detectLang, makeLang, LANG_KEY} from './lang.js';

const LangCtx = createContext(null);

function firstLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
  return detectLang({search: location.search, saved, navLang: (navigator.languages && navigator.languages[0]) || navigator.language});
}

export function LangProvider({children, initial}) {
  const [lang, setLangState] = useState(() => initial || firstLang());
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({
    ...makeLang(lang),
    setLang: l => { try { localStorage.setItem(LANG_KEY, l); } catch (e) {} setLangState(l); },
  }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const v = useContext(LangCtx);
  if (!v) throw new Error('useLang() needs a <LangProvider> above it');
  return v;
}

/* <Tx k="hero_cta"/> = the old data-t; add `html` for strings that carry markup (the old data-t-html: links, <em>, <br>) */
export function Tx({k, v, html = false, as: Tag = 'span', ...rest}) {
  const {t} = useLang();
  return html ? <Tag {...rest} dangerouslySetInnerHTML={{__html: t(k, v)}}/> : <Tag {...rest}>{t(k, v)}</Tag>;
}
