import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // Electron production runs on file://, so assets must be relative paths.
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true
  }
});
