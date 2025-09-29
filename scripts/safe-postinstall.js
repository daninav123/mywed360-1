#!/usr/bin/env node
// Safe postinstall for CI and local dev.
// - Always patch gantt-task-react month range.
// - Install backend deps only outside CI (to avoid native build failures).

const { execSync } = require('child_process');
const path = require('path');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', windowsHide: true, ...opts });
}

const inCI = String(process.env.CI || '').toLowerCase() === 'true';
const skipBackend = String(process.env.SKIP_BACKEND_INSTALL || '').toLowerCase() === '1';
// Detectar ejecución anidada iniciada desde backend/ para evitar recursión
const initCwd = String(process.env.INIT_CWD || '');
const isRunningFromBackendInstall = initCwd.includes(`${path.sep}backend`) || /[\\\/]backend$/.test(initCwd);

try {
  if (inCI || skipBackend || isRunningFromBackendInstall) {
    console.log('[postinstall] CI/Skip detected => omitiendo instalación de backend');
  } else {
    console.log('[postinstall] Instalando dependencias de backend…');
    run('npm --prefix backend install');
  }
} catch (e) {
  // No fallar toda la instalación por backend opcional
  console.warn('[postinstall] Backend install falló, continuando:', e?.message || e);
}

// Omitido: ya no usamos gantt-task-react

console.log('[postinstall] Hecho.');
