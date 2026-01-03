import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Pool configurable para evitar procesos colgados en algunos entornos
    // - forks: tiende a terminar limpio (sin MessagePorts)
    // - threads: puede ser más rápido pero en algunos casos deja handles abiertos
    pool: process.env.VITEST_POOL || 'forks',
    minThreads: 1,
    maxThreads: 1,
    minForks: 1,
    maxForks: 1,

    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Ámbitos de tests: frontend + backend
    include: [
      'apps/main-app/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/**/*.{test,spec}.{js,ts}',
      'functions/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Tests legacy/manuales: pueden arrancar el servidor por orden de imports y duplican cobertura
      'backend/test/**', // ← legacy (Mocha y otros), no tocar
    ],
    passWithNoTests: false,
    testTimeout: 30000,
    hookTimeout: 10000,

    // Entornos por ruta: jsdom para src, node para backend
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000'
      }
    },
    environmentMatchGlobs: [
      ['apps/**/src/**', 'jsdom'],
      ['backend/**', 'node'],
      ['functions/**', 'node'],
    ],

    // Reporters
    reporters: ['default'],

    // Setups para front (src) y mocks globales controlados
    setupFiles: ['apps/main-app/src/test/setup.js', 'backend/vitest.setup.js'],

    deps: {
      inline: [
        /@testing-library\/(react|dom|user-event)/,
        /^react-i18next$/,
        /^react-i18next\/(.+)$/,
        /^i18next$/,
        /^i18next\/(.+)$/,
        /^react$/,
        /^react\/jsx-runtime$/,
        /^react\/jsx-dev-runtime$/,
        /^react-dom$/,
        /^react-dom\/client$/,
        /^react-dom\/test-utils$/,
      ],
    },

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
        'apps/**/src/test/**',
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
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    alias: [
      { find: /^react$/, replacement: resolve(__dirname, './node_modules/react') },
      {
        find: /^react\/(.+)$/,
        replacement: resolve(__dirname, './node_modules/react/$1'),
      },
      { find: /^react-dom$/, replacement: resolve(__dirname, './node_modules/react-dom') },
      {
        find: /^react-dom\/(.+)$/,
        replacement: resolve(__dirname, './node_modules/react-dom/$1'),
      },
      {
        find: /^react-i18next$/,
        replacement: resolve(__dirname, './node_modules/react-i18next'),
      },
      {
        find: /^react-i18next\/(.+)$/,
        replacement: resolve(__dirname, './node_modules/react-i18next/$1'),
      },
      {
        find: /^i18next$/,
        replacement: resolve(__dirname, './node_modules/i18next'),
      },
      {
        find: /^i18next\/(.+)$/,
        replacement: resolve(__dirname, './node_modules/i18next/$1'),
      },
      {
        find: /^react-router-dom$/,
        replacement: resolve(__dirname, './node_modules/react-router-dom'),
      },
      {
        find: /^react-router-dom\/(.+)$/,
        replacement: resolve(__dirname, './node_modules/react-router-dom/$1'),
      },
      { find: /^react-router$/, replacement: resolve(__dirname, './node_modules/react-router') },
      {
        find: /^react-router\/(.+)$/,
        replacement: resolve(__dirname, './node_modules/react-router/$1'),
      },
      { find: '@', replacement: resolve(__dirname, './apps/main-app/src') },
      // Permitir imports absolutos tipo 'src/...'
      { find: 'src', replacement: resolve(__dirname, './apps/main-app/src') },
    ],
  },
});
