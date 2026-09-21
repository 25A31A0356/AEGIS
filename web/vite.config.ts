import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { agiesBackendPlugin } from './server/vitePlugin';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), agiesBackendPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
