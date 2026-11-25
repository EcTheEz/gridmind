import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages project-site path: https://ectheez.github.io/gridmind/
  base: '/gridmind/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
});
