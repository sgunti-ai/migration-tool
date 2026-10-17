import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => ({
  root: path.resolve(__dirname, 'apps/web'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react(), tailwindcss()],
  resolve: { alias: {'@': path.resolve(__dirname, 'apps/web/src')} },
  build: {outDir:path.resolve(__dirname, 'dist'),emptyOutDir:true},
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {usePolling:process.platform === 'win32'}
  }
}));
