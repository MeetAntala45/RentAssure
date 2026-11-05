import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'apps/vendor'),
  cacheDir: path.resolve(__dirname, 'node_modules/.vite-vendor'),
  optimizeDeps: {
    include: [
      '@react-oauth/google',
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      '@tanstack/react-query',
      'react-hook-form',
    ],
  },
  server: {
    port: 5174,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
