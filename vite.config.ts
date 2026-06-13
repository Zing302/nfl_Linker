import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * webOS packaged apps load index.html from a file:// origin, where
 * `<script type="module">` is blocked by strict MIME-type checking (the
 * filesystem serves an empty MIME). Swap the module attributes for `defer`
 * so the bundle — emitted as a classic IIFE below — loads as a plain
 * script (no MIME enforcement) but still runs after the DOM is parsed, so
 * the #root element exists when React mounts.
 */
function webosClassicScript(): Plugin {
  return {
    name: 'webos-classic-script',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html.replace(/ type="module"/g, ' defer').replace(/ crossorigin/g, ''),
    },
  };
}

export default defineConfig({
  plugins: [react(), webosClassicScript()],
  // webOS packaged apps load from the filesystem, so assets must be relative.
  base: './',
  build: {
    // webOS 5.x (2020 TVs) ships Chromium 68; es2017 is a safe floor.
    target: 'es2017',
    // A single classic script that runs without native ES-module support.
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
});
