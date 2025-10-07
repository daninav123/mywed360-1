"use strict";

// Plugin mínimo para registrar la regla react-hooks/exhaustive-deps
// No reporta nada; solo evita errores por regla desconocida.

module.exports = {
  rules: {
    'exhaustive-deps': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Stub de exhaustive-deps (sin comprobaciones)',
          recommended: false,
        },
        schema: [],
      },
      create() {
        return {};
      },
    },
  },
};

