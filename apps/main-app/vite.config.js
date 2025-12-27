import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // Firebase
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'firebase';
          }
          // UI libraries
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'ui-motion';
          }
          // Forms & validation
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'forms';
          }
          // Charts
          if (id.includes('chart.js') || id.includes('recharts')) {
            return 'charts';
          }
          // i18n
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n';
          }
          // Editor/Rich content
          if (id.includes('slate') || id.includes('draft-js') || id.includes('quill')) {
            return 'editors';
          }
          // Date utilities
          if (id.includes('date-fns') || id.includes('dayjs')) {
            return 'dates';
          }
          // Other vendors
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
