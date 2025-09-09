#!/usr/bin/env node
'use strict';
/**
 * vendorsIaScaffold.js
 * Crea esqueletos (no invasivos) para el flujo de Proveedores con IA.
 * - No modifica imports existentes ni registra rutas.
 * - Solo crea archivos si no existen, con contenido mínimo que no rompe el build.
 * - Genera un reporte en logs/outputs/vendors_ia_scaffold.report.json
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'logs', 'outputs');

function ensureDir(p) { try { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); } catch {}
}
function createIfMissing(absPath, content) {
  if (fs.existsSync(absPath)) return false;
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, content, 'utf8');
  return true;
}

ensureDir(outDir);

const created = [];

const files = [
  {
    rel: 'src/components/vendors/VendorDashboard.jsx',
    content: `import React from 'react';

/**
 * VendorDashboard (scaffold)
 * - Esqueleto de vista principal para Proveedores IA
 * - No está enlazada en rutas por defecto
 */
const VendorDashboard = () => {
  return (
    <div data-dev="vendor-dashboard-scaffold">
      <h2 className="text-lg font-semibold">Vendor Dashboard (scaffold)</h2>
      <p className="text-sm text-gray-500">Este componente es un placeholder. No está conectado aún.</p>
    </div>
  );
};
export default React.memo(VendorDashboard);
`
  },
  {
    rel: 'src/components/vendors/ServiceCards.jsx',
    content: `import React from 'react';

const ServiceCards = () => {
  return (
    <div data-dev="service-cards-scaffold" />
  );
};
export default React.memo(ServiceCards);
`
  },
  {
    rel: 'src/components/vendors/VendorSearch.jsx',
    content: `import React from 'react';

const VendorSearch = () => {
  return (
    <div data-dev="vendor-search-scaffold" />
  );
};
export default React.memo(VendorSearch);
`
  },
  {
    rel: 'src/components/vendors/AIEmailGenerator.jsx',
    content: `import React from 'react';

const AIEmailGenerator = () => {
  return (
    <div data-dev="ai-email-generator-scaffold" />
  );
};
export default React.memo(AIEmailGenerator);
`
  },
  {
    rel: 'src/components/vendors/ResponseAnalyzer.jsx',
    content: `import React from 'react';

const ResponseAnalyzer = () => {
  return (
    <div data-dev="response-analyzer-scaffold" />
  );
};
export default React.memo(ResponseAnalyzer);
`
  },
  {
    rel: 'src/components/vendors/VendorComparison.jsx',
    content: `import React from 'react';

const VendorComparison = () => {
  return (
    <div data-dev="vendor-comparison-scaffold" />
  );
};
export default React.memo(VendorComparison);
`
  }
];

for (const f of files) {
  const abs = path.join(repoRoot, f.rel);
  const ok = createIfMissing(abs, f.content);
  if (ok) created.push(f.rel);
}

const report = {
  timestamp: new Date().toISOString(),
  type: 'vendors_ia_scaffold',
  created,
  summary: created.length > 0 ? 'Scaffold creado' : 'Nada que crear (ya existía)'
};

const outFile = path.join(outDir, 'vendors_ia_scaffold.report.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
console.log('[vendorsIaScaffold] Reporte:', path.relative(repoRoot, outFile));
