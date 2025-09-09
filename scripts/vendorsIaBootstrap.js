#!/usr/bin/env node
'use strict';
/**
 * vendorsIaBootstrap.js (dry run)
 * - Lee el documento de flujo de Proveedores IA
 * - Comprueba presencia de rutas/backend y algunos componentes relevantes
 * - Genera un informe en logs/outputs/vendors_ia_bootstrap.report.json
 * - No realiza llamadas externas ni escritura en BBDD
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'logs', 'outputs');

function ensureDir(p) {
  try { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); } catch {}
}
function exists(relPath) {
  try { return fs.existsSync(path.join(repoRoot, relPath)); } catch { return false; }
}

ensureDir(outDir);

const report = {
  timestamp: new Date().toISOString(),
  type: 'vendors_ia_bootstrap',
  checks: {
    docs: {
      flujoProveedoresIA: exists('docs/flujos-especificos/flujo-5-proveedores-ia.md')
    },
    backendRoutes: {
      aiSuppliers: exists('backend/routes/ai-suppliers.js'),
      aiAssign: exists('backend/routes/ai-assign.js'),
      aiImage: exists('backend/routes/ai-image.js'),
      mailgunWebhook: exists('backend/routes/mailgun-webhook.js')
    },
    frontendHints: {
      // Indicadores indirectos útiles para integración posterior (no vinculantes)
      seatingToolbar: exists('src/components/seating/SeatingPlanToolbar.jsx'),
      useSeatingPlanHook: exists('src/hooks/useSeatingPlan.js')
    },
    suggestions: [
      'Definir esquema /weddings/{weddingId}/vendors con estados (empty/contacted/quoted/contracted/rejected)',
      'Esqueleto de componentes: VendorDashboard.jsx, ServiceCards.jsx, VendorSearch.jsx, AIEmailGenerator.jsx, ResponseAnalyzer.jsx, VendorComparison.jsx',
      'Plantillas IA en backend (Mailgun/Send) y análisis inbound (webhook ya existente)'
    ]
  },
  summary: 'Dry run OK. Informe de puntos de integración generado.'
};

const outFile = path.join(outDir, 'vendors_ia_bootstrap.report.json');
try {
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log('[vendorsIaBootstrap] Reporte generado en', path.relative(repoRoot, outFile));
  process.exit(0);
} catch (e) {
  console.error('[vendorsIaBootstrap] No se pudo escribir el reporte:', e.message);
  process.exit(1);
}
