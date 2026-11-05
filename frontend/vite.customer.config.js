import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'apps/customer'),
  cacheDir: path.resolve(__dirname, 'node_modules/.vite-customer'),
  optimizeDeps: {
    include: [
      '@react-oauth/google',
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      '@tanstack/react-query',
      'react-hook-form',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
    ],
  },
  server: {
    port: 5173,
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
