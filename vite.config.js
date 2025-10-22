import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import path from 'path';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const ENABLE_PWA = String(env.VITE_ENABLE_PWA || '').toLowerCase() === 'true' || String(env.VITE_ENABLE_PWA || '') === '1';
  const BACKEND_BASE = (env.VITE_BACKEND_BASE_URL || '').replace(/\/$/, '') || 'http://localhost:4004';

  return {
    resolve: {
      alias: {
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        '@': path.resolve(__dirname, 'src'),
      },
      dedupe: ['react', 'react-dom']
    },
    plugins: [
      react(),
      ...(ENABLE_PWA
        ? [VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src/pwa',
            filename: 'serviceWorker.js',
            registerType: 'autoUpdate',
            includeAssets: ['logo-app.png', 'icon-192.png', 'icon-512.png', 'badge-72.png'],
            manifest: false
          })]
        : [])
    ],
    server: {
      host: '0.0.0.0', // Escuchar en todas las interfaces (IPv4 + IPv6)
      // Puerto de desarrollo
      port: 5173,
      strictPort: true,
      // Configuración HMR para evitar errores WebSocket
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
        clientPort: 5173,
      },
      // Ignorar archivos que no necesitan recargar el frontend
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/backend/**',
          '**/docs/**',
          '**/dist/**',
          '**/.git/**',
          '**/logs/**',
          '**/*.log',
          '**/scripts/**',
          '**/cypress/**',
        ],
      },
      // Proxy para API backend
      proxy: {
        '/api': {
          target: BACKEND_BASE,
          changeOrigin: true,
          secure: BACKEND_BASE.startsWith('https'),
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
          target: BACKEND_BASE,
          changeOrigin: true,
          secure: BACKEND_BASE.startsWith('https'),
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
  };
});

