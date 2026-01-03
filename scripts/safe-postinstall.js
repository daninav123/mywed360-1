#!/usr/bin/env node
// Safe postinstall for CI and local dev.
// - Always patch gantt-task-react month range.
// - Install backend deps only outside CI (to avoid native build failures).

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', windowsHide: true, ...opts });
}

const inCI = String(process.env.CI || '').toLowerCase() === 'true';
const skipBackend = String(process.env.SKIP_BACKEND_INSTALL || '').toLowerCase() === '1';
const onRender = Boolean(
  process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_INTERNAL_HOSTNAME
);
// Detectar ejecución anidada iniciada desde backend/ para evitar recursión
const initCwd = String(process.env.INIT_CWD || '');
const isRunningFromBackendInstall =
  initCwd.includes(`${path.sep}backend`) || /[\\\/]backend$/.test(initCwd);

try {
  if (inCI || onRender || skipBackend || isRunningFromBackendInstall) {
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
