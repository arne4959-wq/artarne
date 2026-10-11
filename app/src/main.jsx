import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {LITE} from './lib/env.js';
import {route} from './lib/routes.js';
import {LangProvider} from './lib/i18n.jsx';
import {ToastProvider} from './components/Toast.jsx';
import {DialogsProvider} from './components/Dialogs.jsx';

/* one module per page, loaded on demand: a page brings only its own code and CSS */
const PAGES = {
  join: lazy(() => import('./pages/Join.jsx')),
  privacy: lazy(() => import('./pages/Legal.jsx').then(m => ({default: () => <m.default which="privacy"/>}))),
  terms: lazy(() => import('./pages/Legal.jsx').then(m => ({default: () => <m.default which="terms"/>}))),
  notFound: lazy(() => import('./pages/NotFound.jsx')),
  buy: lazy(() => import('./pages/Buy.jsx')),
  profile: lazy(() => import('./pages/Profile.jsx')),
  manage: lazy(() => import('./pages/Manage.jsx')),
};
/* pages that are not in React yet (only until their migration step is done; the old site still has them: npm start) */
const Pending = ({r}) => <main style={{padding: '3rem 1.2rem', font: '1rem/1.8 system-ui'}}><h1>“{r.page}” is not in React yet</h1></main>;

if (LITE) document.documentElement.classList.add('lite');
const r = route(location.pathname, location.search);
if (r.redirect) location.replace(r.redirect);
else {
  const Page = PAGES[r.page];
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LangProvider>
        <ToastProvider>
          <DialogsProvider>
            <Suspense fallback={null}>{Page ? <Page {...r}/> : <Pending r={r}/>}</Suspense>
          </DialogsProvider>
        </ToastProvider>
      </LangProvider>
    </StrictMode>
  );
}
