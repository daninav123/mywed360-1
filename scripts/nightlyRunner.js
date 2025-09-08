#!/usr/bin/env node
/*
  nightlyRunner.js
  - Orquesta la ejecución continua de tareas "pending" definidas en roadmap.json
    durante una ventana temporal (por defecto 8h).
  - Invoca scripts/runTask.js por cada tarea. Éste ya gestiona health checks,
    reintentos, logging JSONL, notificaciones Slack/Email e incidentes.
  - Este runner añade:
      * Bucle con espera cuando no hay pendientes
      * Log propio en logs/nightly.log
      * Opción de auto-push a rama (p.ej. windows) si se configura

  Uso:
    node scripts/nightlyRunner.js --durationHours=8 --sleepSeconds=120 --stopOnError=false --pushBranch=

  Notas:
    - Por defecto NO hace push. Para habilitarlo establecer env AUTO_PUSH_BRANCH=windows
      o pasar --pushBranch=windows.
*/

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const LOG_DIR = path.join(repoRoot, 'logs');
const NIGHTLY_LOG = path.join(LOG_DIR, 'nightly.log');
const ROADMAP_PATH = path.join(repoRoot, 'roadmap.json');

// Defaults de entorno para ejecución autónoma
if (!process.env.BACKEND_BASE_URL && !process.env.VITE_BACKEND_BASE_URL) {
  process.env.BACKEND_BASE_URL = 'https://mywed360-backend.onrender.com';
}
if (!process.env.RUN_TASK_SEATING_ONLY) {
  process.env.RUN_TASK_SEATING_ONLY = 'true';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

function ts() { return new Date().toISOString(); }
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function appendNightlyLog(obj) {
  try {
    ensureDir(LOG_DIR);
    fs.appendFileSync(NIGHTLY_LOG, JSON.stringify(obj) + '\n', 'utf8');
  } catch (e) {
    console.warn('[nightly] No se pudo escribir nightly.log:', e.message);
  }
}

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function readRoadmap() {
  try {
    const raw = fs.readFileSync(ROADMAP_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { tasks: [] };
  }
}

function getRunnableTaskIds(options = {}) {
  const { includeFailed = false, includeInProgress = false } = options;
  const roadmap = readRoadmap();
  const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];
  const statuses = ['pending'];
  if (includeFailed) statuses.push('failed');
  if (includeInProgress) statuses.push('in_progress');
  const skipE2E = String(process.env.RUN_E2E || 'false') !== 'true';
  return tasks
    .filter((x) => statuses.includes(String(x.status || 'pending')))
    .filter((x) => {
      const cmd = String(x.command || '');
      // Omitir specs E2E si RUN_E2E no está habilitado
      return !(skipE2E && cmd.includes('cypress:run'));
    })
    .map((x) => String(x.id));
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function runOneTask(taskId) {
  return new Promise((resolve) => {
    const directArgs = taskId ? ['scripts/runTask.js', `--id=${taskId}`] : ['scripts/runTask.js'];
    const child = spawn(process.execPath, directArgs, { cwd: repoRoot, stdio: 'inherit' });
    let triedFallback = false;
    const runFallback = () => {
      if (triedFallback) return;
      triedFallback = true;
      const codeStr = 'import(\"./scripts/runTask.js\")';
      const fallbackArgs = taskId ? ['-e', codeStr, `--id=${taskId}`] : ['-e', codeStr];
      const child2 = spawn(process.execPath, fallbackArgs, { cwd: repoRoot, stdio: 'inherit' });
      child2.on('exit', (code2) => resolve(code2 ?? 1));
      child2.on('error', () => resolve(1));
    };
    child.on('exit', (code) => {
      if (code === 0) return resolve(0);
      runFallback();
    });
    child.on('error', () => runFallback());
  });
}

async function gitPushIfConfigured(pushBranch) {
  try {
    const branch = pushBranch || process.env.AUTO_PUSH_BRANCH || '';
    if (!branch) return;
    // Commit y push condicionales
    const cmd = process.platform === 'win32'
      ? `git add -A ; git commit -m "nightly runner: auto-commit ${ts()}" ; git push origin ${branch}`
      : `git add -A && git commit -m "nightly runner: auto-commit ${ts()}" && git push origin ${branch}`;
    await new Promise((resolve) => {
      const child = spawn(cmd, { cwd: repoRoot, stdio: 'inherit', shell: true });
      child.on('exit', () => resolve());
      child.on('error', () => resolve());
    });
  } catch (e) {
    console.warn('[nightly] git push fallo:', e.message);
  }
}

async function main() {
  const args = parseArgs();
  const durationHours = Math.max(0.1, Math.min(24, parseFloat(args.durationHours || '8')));
  const sleepSeconds = Math.max(10, Math.min(1800, parseInt(args.sleepSeconds || '180', 10)));
  const stopOnError = String(args.stopOnError || 'false') === 'true';
  const pushBranch = args.pushBranch || '';
  const includeFailed = String(args.includeFailed || 'false') === 'true';
  const includeInProgress = String(args.includeInProgress || 'false') === 'true';

  const start = Date.now();
  const deadline = start + durationHours * 3600 * 1000;

  appendNightlyLog({ timestamp: ts(), action: 'start', durationHours, sleepSeconds, stopOnError, pushBranch: pushBranch || process.env.AUTO_PUSH_BRANCH || '', includeFailed, includeInProgress });

  let cycles = 0;
  let completed = 0;
  let failures = 0;
  let attemptedThisCycle = new Set();

  while (Date.now() < deadline) {
    cycles += 1;
    appendNightlyLog({ timestamp: ts(), action: 'cycle_start', cycle: cycles });
    let progressed = false;
    let runnables = getRunnableTaskIds({ includeFailed, includeInProgress });
    if (runnables.length === 0) {
      appendNightlyLog({ timestamp: ts(), action: 'idle', message: `Sin pendientes. Durmiendo ${sleepSeconds}s` });
      await sleep(sleepSeconds * 1000);
      continue;
    }

    for (const nextId of runnables) {
      if (attemptedThisCycle.has(nextId)) continue; // evitar loops en el mismo ciclo
      attemptedThisCycle.add(nextId);
      appendNightlyLog({ timestamp: ts(), action: 'run', taskId: nextId, cycle: cycles });
      const code = await runOneTask(nextId);
      if (code === 0) {
        completed += 1;
        progressed = true;
        appendNightlyLog({ timestamp: ts(), action: 'task_end', taskId: nextId, status: 'success' });
        await gitPushIfConfigured(pushBranch); // opcional
      } else {
        failures += 1;
        appendNightlyLog({ timestamp: ts(), action: 'task_end', taskId: nextId, status: 'error', exitCode: code });
        if (stopOnError) {
          appendNightlyLog({ timestamp: ts(), action: 'cycle_end', cycle: cycles, progressed, completed, failures });
          return appendNightlyLog({ timestamp: ts(), action: 'end', completed, failures, cycles, ranForMinutes: Math.round((Date.now() - start)/60000) });
        }
      }
    }

    appendNightlyLog({ timestamp: ts(), action: 'cycle_end', cycle: cycles, progressed, completed, failures });
    // Reset del set para el siguiente ciclo; si no hubo progreso, esperar y reintentar
    attemptedThisCycle = new Set();
    await sleep(sleepSeconds * 1000);
  }

  appendNightlyLog({ timestamp: ts(), action: 'end', completed, failures, cycles, ranForMinutes: Math.round((Date.now() - start)/60000) });
}

main();
