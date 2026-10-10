import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {LITE} from './lib/env.js';
import {LangProvider} from './lib/i18n.jsx';
import App from './App.jsx';

if (LITE) document.documentElement.classList.add('lite');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <App/>
    </LangProvider>
  </StrictMode>
);
