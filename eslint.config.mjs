// ESLint flat config compatible with ESLint v9
// Replicates the previous .eslintrc.json behavior, but avoids external plugins
// to ensure the linter runs even without a full node_modules install.

/** @type {import('eslint').Linter.FlatConfig[]} */
import reactHooksPlugin from './tools/eslint-plugin-react-hooks/index.js';

export default [
  {
    // Ignorar rutas problemáticas o generadas
    ignores: [
      'cypress/**',
      'scripts/**',
      'mailgun-*.js',
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
      'src/services/PerformanceMonitor.js',
      'src/services/componentCacheService.js',
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
      'react-hooks': reactHooksPlugin,
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
      'react-hooks/exhaustive-deps': 'off',
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
