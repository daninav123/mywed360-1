#!/usr/bin/env node
/*
  runTask.js
  - Lee roadmap.json y ejecuta la primera tarea con estado "pending" o la indicada por --id.
  - Registra logs JSONL en logs/tasks.log con start/end/error.
  - Health check al finalizar: npm run test:unit && npm run lint && npm run validate:schemas
    con reintentos (2s, 4s, 8s). Si fallan 3 veces, envía alerta a Slack y Email
    y crea docs/incidents/YYYY-MM-DD_task_errors.md
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const LOG_DIR = path.join(repoRoot, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'tasks.log');
const ROADMAP_PATH = path.join(repoRoot, 'roadmap.json');
const INCIDENTS_DIR = path.join(repoRoot, 'docs', 'incidents');

function ts() { return new Date().toISOString(); }
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function appendLog(obj) {
  try {
    ensureDir(LOG_DIR);
    fs.appendFileSync(LOG_FILE, JSON.stringify(obj) + '\n', 'utf8');
  } catch (e) { console.warn('[runTask] No se pudo escribir log:', e.message); }
}

function readRoadmap() {
  try {
    const raw = fs.readFileSync(ROADMAP_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[runTask] roadmap.json no encontrado o inválido. Crearé uno base.');
    const base = { tasks: [] };
    try { fs.writeFileSync(ROADMAP_PATH, JSON.stringify(base, null, 2)); } catch {}
    return base;
  }
}

function writeRoadmap(data) {
  try { fs.writeFileSync(ROADMAP_PATH, JSON.stringify(data, null, 2)); } catch (e) { console.warn('No se pudo escribir roadmap:', e.message); }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function runCmd(cmd, opts = {}) {
  return new Promise((resolve) => {
    // Cross-plat: usar shell
    const child = spawn(cmd, { shell: true, cwd: opts.cwd || repoRoot, stdio: 'inherit' });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

async function healthCheckWithRetries() {
  const seatingOnly = process.env.RUN_TASK_SEATING_ONLY === 'true';
  const testCmd = seatingOnly
    ? 'npm run test:unit -- src/__tests__/SeatingPlanRefactored.test.jsx src/__tests__/useSeatingPlan*.test.jsx src/__tests__/firestore.rules.seating.test.js'
    : 'npm run test:unit';
  const lintCmd = seatingOnly
    ? 'npm run lint -- "src/components/seating/**/*.{js,jsx}" "src/features/seating/**/*.{js,jsx}" "src/components/Seating*.jsx" "src/features/seating/**/*.{js,jsx}"'
    : 'npm run lint';
  const steps = [
    { name: seatingOnly ? 'test:unit (seating)' : 'test:unit', cmd: testCmd },
    { name: seatingOnly ? 'lint (seating)' : 'lint', cmd: lintCmd },
    { name: 'validate:schemas', cmd: 'npm run validate:schemas' },
  ];

  for (const step of steps) {
    let attempt = 0;
    while (attempt < 3) {
      const code = await runCmd(step.cmd);
      if (code === 0) break;
      attempt += 1;
      if (attempt >= 3) return { ok: false, failedStep: step.name };
      const delay = 2 ** attempt * 1000; // 2s, 4s, 8s
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return { ok: true };
}

async function notifySlack(message) {
  try {
    const url = process.env.SLACK_WEBHOOK_URL || process.env.VITE_SLACK_WEBHOOK_URL;
    if (!url) { console.warn('[runTask] SLACK_WEBHOOK_URL no configurado'); return; }
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch (e) { console.warn('[runTask] Slack webhook fallo:', e.message); }
}

async function notifyEmail(subject, text) {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const to = process.env.ALERT_EMAIL_TO;
    const from = process.env.ALERT_EMAIL_FROM || user;
    if (!host || !user || !pass || !to) { console.warn('[runTask] SMTP no configurado'); return; }
    let nodemailer;
    try { nodemailer = (await import('nodemailer')).default; } catch { console.warn('[runTask] nodemailer no instalado'); return; }
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    await transporter.sendMail({ from, to, subject, text });
  } catch (e) { console.warn('[runTask] Email fallo:', e.message); }
}

async function writeIncident(taskId, errorMsg) {
  try {
    ensureDir(INCIDENTS_DIR);
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const file = path.join(INCIDENTS_DIR, `${yyyy}-${mm}-${dd}_task_errors.md`);
    const now = ts();
    const block = `### ${now}\n- **Tarea:** ${taskId}\n- **Error:** ${errorMsg}\n- **Acciones:** Reintentos x3, health-check fallido, notificaciones enviadas.\n\n`;
    fs.appendFileSync(file, block, 'utf8');
  } catch (e) { console.warn('[runTask] No se pudo escribir incidente:', e.message); }
}

async function main() {
  const args = parseArgs();
  const roadmap = readRoadmap();
  const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];
  let task = null;
  if (args.id) task = tasks.find((t) => String(t.id) === String(args.id));
  if (!task) task = tasks.find((t) => (t.status || 'pending') === 'pending');
  if (!task) { console.log('[runTask] No hay tareas pending'); return; }

  const start = { timestamp: ts(), taskId: String(task.id), action: 'start' };
  appendLog(start);

  let runExit = 0;
  try {
    // Ejecutar acción
    if (task.command) {
      runExit = await runCmd(task.command);
    } else if (task.script) {
      const cmd = `node ${task.script}`;
      runExit = await runCmd(cmd);
    } else {
      console.log('[runTask] Tarea sin command/script. Marcando como noop.');
      runExit = 0;
    }

    if (runExit !== 0) throw new Error(`Task process exit code ${runExit}`);

    // Health check
    const hc = await healthCheckWithRetries();
    if (!hc.ok) throw new Error(`HealthCheck failed at step ${hc.failedStep}`);

    appendLog({ timestamp: ts(), taskId: String(task.id), action: 'end', status: 'success' });

    // Marcar tarea como completed en roadmap.json
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx].status = 'completed';
      writeRoadmap({ ...roadmap, tasks });
    }
  } catch (e) {
    appendLog({ timestamp: ts(), taskId: String(task.id), error: e?.message || String(e) });
    await writeIncident(String(task.id), e?.message || String(e));
    await notifySlack(`:rotating_light: Task ${task.id} falló: ${e?.message || e}`);
    await notifyEmail(`Task ${task.id} falló`, `Detalles: ${e?.message || e}`);
    appendLog({ timestamp: ts(), taskId: String(task.id), action: 'end', status: 'error' });
    process.exitCode = 1;
  }
}

// Node 18+ tiene fetch global; si no, se podría importar node-fetch
main();
