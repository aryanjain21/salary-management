import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    // The employees route chunk is dominated by MUI DataGrid (~190 kB gzip).
    // It is lazy-loaded per route, so we accept it rather than hide the warning globally.
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5173,
    // In development the API runs separately; proxy keeps requests same-origin.
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html'],
    },
  },
});
