// ESLint flat config compatible with ESLint v9
// Replicates the previous .eslintrc.json behavior

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    // Ignorar rutas problemáticas o generadas
    ignores: [
      'cypress/**',
      'scripts/**',
      'mailgun-*.js',
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.test.jsx',
      'src/test/**',
      'src/components/email/EmailTemplateManager.jsx',
      'src/pages/Buzon_fixed_complete.jsx',
      'src/pages/InvitadosLegacy.jsx',
      'src/pages/MomentosEspeciales.old.jsx',
      'src/pages/SeatingPlanLegacy.jsx',
      'src/pages/Timing.jsx',
      'src/pages/FinanceLegacy.jsx',
      'src/pages/Proveedores.jsx',
      'src/pages/ProveedoresNuevo.jsx',
      'src/pages/SeatingPlan.jsx',
      'src/pages/protocolo/AyudaCeremonia.jsx',
      'src/pages/user/EmailInbox.jsx',
      '**/PerformanceMonitor.js',
      '**/componentCacheService.js',
      '**/imageOptimizationService.js',
    ],
  },
  {
    name: 'base',
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        chrome: 'readonly',
        clients: 'readonly',
        self: 'readonly',
      },
    },
    plugins: {
      // react-hooks plugin removed - causes issues without tools/ directory
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      'no-unused-vars': 'off',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      // Desactivado para evitar falsos positivos sin dependencias de "globals"
      'no-undef': 'off',
      'no-unreachable': 'off',
      'no-useless-catch': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      // react-hooks/exhaustive-deps removido - plugin no disponible
      // Reglas de React del plugin se omiten para no depender de node_modules
    },
  },
  {
    name: 'tests',
    files: ['**/*.test.js', '**/*.test.jsx', 'src/test/**', 'src/**/__tests__/**'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-const-assign': 'off',
    },
  },
];
