#!/usr/bin/env node
'use strict';
/**
 * rsvpScaffold.js
 * Crea esqueletos mínimos para el flujo de RSVP (dashboard y helpers).
 * - No registra rutas ni modifica páginas existentes.
 * - Solo crea archivos si no existen.
 * - Genera reporte en logs/outputs/rsvp_scaffold.report.json
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
    rel: 'src/components/rsvp/RSVPStats.jsx',
    content: `import React from 'react';

/**
 * RSVPStats (scaffold)
 * - Placeholder de dashboard de métricas RSVP
 * - No enlazado por defecto
 */
const RSVPStats = () => {
  return (
    <div data-dev="rsvp-stats-scaffold">
      <h2 className="text-lg font-semibold">RSVP Stats (scaffold)</h2>
      <p className="text-sm text-gray-500">Placeholder de métricas de confirmaciones.</p>
    </div>
  );
};
export default React.memo(RSVPStats);
`
  },
  {
    rel: 'src/components/rsvp/RSVPSchedulerInfo.md',
    content: `# RSVPScheduler (scaffold)\n\nArchivo informativo de scaffold para el scheduler de recordatorios.\nNo ejecuta lógica; se implementará en backend/cron o functions.\n`
  }
];

for (const f of files) {
  const abs = path.join(repoRoot, f.rel);
  const ok = createIfMissing(abs, f.content);
  if (ok) created.push(f.rel);
}

const report = {
  timestamp: new Date().toISOString(),
  type: 'rsvp_scaffold',
  created,
  summary: created.length > 0 ? 'Scaffold RSVP creado' : 'Nada que crear (ya existía)'
};

const outFile = path.join(outDir, 'rsvp_scaffold.report.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
console.log('[rsvpScaffold] Reporte:', path.relative(repoRoot, outFile));
