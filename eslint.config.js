// ESLint 9 flat config: migrate ignores from .eslintignore
/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // Ignores migrados desde .eslintignore
  {
    ignores: [
      "src/components/email/EmailTemplateManager.jsx",
      "src/pages/Buzon_fixed_complete.jsx",
      "src/pages/InvitadosLegacy.jsx",
      "src/pages/MomentosEspeciales.old.jsx",
      "src/pages/SeatingPlanLegacy.jsx",
      "src/pages/Timing.jsx",
      "src/pages/FinanceLegacy.jsx",
      "src/pages/Proveedores.jsx",
      "src/pages/ProveedoresNuevo.jsx",
      "src/pages/SeatingPlan.jsx",
      "src/pages/protocolo/AyudaCeremonia.jsx",
      "src/pages/user/EmailInbox.jsx",
      "src/services/PerformanceMonitor.js",
      "src/services/componentCacheService.js",
    ],
  },
  // Config mínima para archivos de src con JSX y plugins registradas
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "react-hooks": require("eslint-plugin-react-hooks"),
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      // No activamos reglas por defecto; solo registramos el plugin para evitar
      // errores con directivas de "eslint-disable react-hooks/exhaustive-deps".
    },
  },
];
