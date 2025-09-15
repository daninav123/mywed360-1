import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import path from 'path';
export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    },
    dedupe: ['react', 'react-dom']
  },
  plugins: [react(), VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'serviceWorker.js',
      registerType: 'autoUpdate',
      includeAssets: ['logo-app.png', 'icon-192.png', 'icon-512.png', 'badge-72.png'],
      manifest: false,
      // legacy (ignored) manifest kept for reference
      manifestDeprecated: {
        id: '/?app=lovenda-email',
        name: 'Lovenda Email',
        short_name: 'Lovenda',
        description: 'Correo unificado para tus bodas y proveedores en Lovenda/MyWed360.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        categories: ['communication', 'productivity', 'utilities'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        shortcuts: [
          { name: 'Bandeja de entrada', short_name: 'Bandeja', description: 'Abrir inbox de correo', url: '/email', icons: [{ src: '/logo-app.png', sizes: '192x192' }] },
          { name: 'Redactar correo', short_name: 'Redactar', description: 'Escribir un nuevo correo', url: '/email/compose', icons: [{ src: '/logo-app.png', sizes: '192x192' }] },
          { name: 'Estadísticas', short_name: 'Stats', description: 'Ver estadísticas de correo', url: '/email/stats', icons: [{ src: '/logo-app.png', sizes: '192x192' }] },
          { name: 'Configurar correo', short_name: 'Setup', description: 'Configurar dirección myWed360', url: '/email/setup', icons: [{ src: '/logo-app.png', sizes: '192x192' }] }
        ],
        protocol_handlers: [
          { protocol: 'mailto', url: '/email/compose?to=%s' }
        ],
        share_target: {
          action: '/email/compose',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'subject',
            text: 'body',
            url: 'body'
          },
          files: [
            {
              name: 'files',
              accept: ['image/*', 'application/pdf', 'text/*', '*/*']
            }
          ]
        }
      }
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
