import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
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
      '@malove/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
      '@malove/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@malove/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
