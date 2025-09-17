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
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
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
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Ejecutar en un solo hilo para evitar conflictos de tinypool en algunos entornos (Windows/Node 22)
    threads: false,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.windsurf/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ],
      all: true,
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
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
