import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    preact(),
    {
      name: 'copy-embed-script',
      closeBundle() {
        const source = resolve(__dirname, 'public/embed.js');
        const target = resolve(__dirname, 'dist/embed.js');
        try {
          copyFileSync(source, target);
          console.log('✓ Copied embed.js to dist');
        } catch (err) {
          console.error('Failed to copy embed.js:', err);
        }
      }
    }
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3002,
  },
});
