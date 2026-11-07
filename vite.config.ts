/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

/** Lista os arquivos do build para o service worker guardar tudo na primeira visita (jogo offline). */
const precacheList = (): Plugin => ({
  name: 'precache-list',
  apply: 'build',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify({ files }) });
  },
});

export default defineConfig({
  // Caminhos relativos: o mesmo build funciona no GitHub Pages (/alchemists-corner/) e na prévia do Claude.
  base: './',
  plugins: [react(), precacheList()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
