import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import legacySite from './legacy-site.js';

export default defineConfig({
  base: './',               // relative URLs: the built site works from any folder (GitHub Pages project sites too)
  plugins: [react(), legacySite()],
  build: {outDir: 'dist', emptyOutDir: true},
});
