#!/usr/bin/env node
// Safe postinstall for CI and local dev.
// - Always patch gantt-task-react month range.
// - Install backend deps only outside CI (to avoid native build failures).

const { execSync } = require('child_process');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', windowsHide: true, ...opts });
}

const inCI = String(process.env.CI || '').toLowerCase() === 'true';
const skipBackend = String(process.env.SKIP_BACKEND_INSTALL || '').toLowerCase() === '1';

try {
  if (inCI || skipBackend) {
    console.log('[postinstall] CI/Skip detected => omitiendo instalación de backend');
  } else {
    console.log('[postinstall] Instalando dependencias de backend…');
    run('npm --prefix backend install');
  }
} catch (e) {
  // No fallar toda la instalación por backend opcional
  console.warn('[postinstall] Backend install falló, continuando:', e?.message || e);
}

try {
  console.log('[postinstall] Parchando gantt-task-react…');
  run('node scripts/patch-gantt.js');
} catch (e) {
  console.warn('[postinstall] patch-gantt falló, continuando:', e?.message || e);
}

console.log('[postinstall] Hecho.');

