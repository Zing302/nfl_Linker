import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // webOS packaged apps load from the filesystem, so assets must be relative.
  base: './',
  build: {
    // webOS 4.x+ ships Chromium 53+; ES2017 is a safe floor for modern TVs.
    target: 'es2017',
  },
});
