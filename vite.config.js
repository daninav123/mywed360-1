import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import path from 'path';
export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom']
  },
  plugins: [react(), VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'serviceWorker.js',
      registerType: 'autoUpdate',
      includeAssets: ['logo-app.png', 'icon-192.png', 'icon-512.png', 'badge-72.png'],
      manifest: false
    })],
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces de red
    // Puerto de desarrollo
    port: 5173,
    strictPort: true,
    // Proxy para API backend
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_BASE_URL || 'https://mywed360-backend.onrender.com',
        changeOrigin: true,
        secure: true,
        // Conserva el path original (/api/…)
        rewrite: (path) => path
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_BASE_URL || 'https://mywed360-backend.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // Excluir dependencias solo usadas en rutas de desarrollo para evitar fallos de build
      external: ['react-colorful', 'react-draggable'],
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          charts: ['chart.js', 'react-chartjs-2'],
        }
      }
    }
  }
});

