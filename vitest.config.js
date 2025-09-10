import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Activar tests unitarios
    include: [
      'src/**/?(*.)+(test).[jt]s?(x)',
      'src/**/?(*.)+(spec).[jt]s?(x)',
    ],
    exclude: ['node_modules/**'],
    passWithNoTests: false,
    testTimeout: 30000,
    hookTimeout: 10000,
    environment: 'jsdom',
    globals: true,
    // Reporters: salida por consola y JUnit a archivo junit.xml
    reporters: [
      'default',
      ['junit', { outputFile: 'junit.xml', suiteName: 'vitest', useShortPaths: true }],
    ],
    setupFiles: ['backend/vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './coverage',
      all: false,
      exclude: ['**/*'], // Excluir todo de coverage también
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
