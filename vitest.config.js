import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Estabilizar ejecución en Windows: usar threads en vez de forks
    pool: 'threads',
    minThreads: 1,
    maxThreads: 1,

    // Ámbitos de tests: frontend + backend
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/**/*.{test,spec}.{js,ts}',
      'functions/**/*.{test,spec}.{js,ts}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    passWithNoTests: false,
    testTimeout: 30000,
    hookTimeout: 10000,

    // Entornos por ruta: jsdom para src, node para backend
    globals: true,
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['backend/**', 'node'],
      ['functions/**', 'node'],
    ],

    // Reporters
    reporters: [
      'default',
    ],

    // Setups para front (src) y mocks globales controlados
    setupFiles: ['src/test/setup.js', 'backend/vitest.setup.js'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './coverage',
      all: false,
      // Excluir únicamente artefactos y utilidades, no toda la base
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/cypress/**',
        '**/logs/**',
        'src/test/**',
        'backend/vitest.setup.js',
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Permitir imports absolutos tipo 'src/...'
      'src': resolve(__dirname, './src'),
    },
  },
});
