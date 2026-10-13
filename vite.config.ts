import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// `npm run dev`            -> normal dev server at http://localhost:5173
// `npm run build`          -> production build in /dist
// `npm run build:artifact` -> one self-contained HTML file (used for the shareable preview link)
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'artifact' ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Same-origin browser requests work with either localhost or 127.0.0.1.
  server: mode === 'login-test' ? { proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true } } } : undefined,
  build: { outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
}));
