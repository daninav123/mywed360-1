#!/usr/bin/env node
'use strict';
/**
 * notificationsScaffold.js
 * Crea esqueletos mínimos para Centro de Notificaciones y Ajustes.
 * - No se registran en rutas ni navegación.
 * - Solo crea archivos si no existen.
 * - Reporte: logs/outputs/notifications_scaffold.report.json
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
    rel: 'src/components/notifications/NotificationCenter.jsx',
    content: `import React from 'react';

/**
 * NotificationCenter (scaffold)
 * - Lista simple, sin datos ni estilos finales
 * - No enlazado en UI por defecto
 */
const NotificationCenter = () => {
  return (
    <div data-dev="notification-center-scaffold">
      <h2 className="text-lg font-semibold">Notification Center (scaffold)</h2>
      <p className="text-sm text-gray-500">Placeholder de notificaciones.</p>
    </div>
  );
};
export default React.memo(NotificationCenter);
`
  },
  {
    rel: 'src/components/settings/NotificationSettings.jsx',
    content: `import React from 'react';

/**
 * NotificationSettings (scaffold)
 * - Panel de preferencias mínimo, sin integración
 */
const NotificationSettings = () => {
  return (
    <div data-dev="notification-settings-scaffold">
      <h2 className="text-lg font-semibold">Notification Settings (scaffold)</h2>
      <p className="text-sm text-gray-500">Placeholder de preferencias.</p>
    </div>
  );
};
export default React.memo(NotificationSettings);
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
  type: 'notifications_scaffold',
  created,
  summary: created.length > 0 ? 'Scaffold Notificaciones creado' : 'Nada que crear (ya existía)'
};

const outFile = path.join(outDir, 'notifications_scaffold.report.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
console.log('[notificationsScaffold] Reporte:', path.relative(repoRoot, outFile));
