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
const OUTPUT_DIR = path.join(LOG_DIR, 'outputs');

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
    const logPath = opts.logPath;
    try { ensureDir(OUTPUT_DIR); if (logPath) ensureDir(path.dirname(logPath)); } catch {}
    const child = spawn(cmd, { shell: true, cwd: opts.cwd || repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    let outBuffer = '';
    let errBuffer = '';
    child.stdout.on('data', (d) => {
      const s = d.toString();
      outBuffer += s;
      try { process.stdout.write(s); } catch {}
    });
    child.stderr.on('data', (d) => {
      const s = d.toString();
      errBuffer += s;
      try { process.stderr.write(s); } catch {}
    });
    const flush = (code, err) => {
      if (!logPath) return;
      try {
        const header = `[${ts()}] CMD: ${cmd}\n`;
        const body = `${header}[STDOUT]\n${outBuffer}\n[STDERR]\n${errBuffer}${err ? `\n[ERROR]\n${String(err)}` : ''}\n[EXIT ${code}]\n\n`;
        fs.appendFileSync(logPath, body, 'utf8');
      } catch {}
    };
    child.on('exit', (code) => { flush(code ?? 1); resolve(code ?? 1); });
    child.on('error', (e) => { flush(1, e?.message || e); resolve(1); });
  });
}

function enhanceCypressCommand(cmd, taskId) {
  const str = String(cmd);
  const isCypress = str.includes('cypress:run');
  if (!isCypress) return cmd;
  const parts = [str];
  if (!/--browser\s+\S+/i.test(str)) {
    parts.push('--browser edge --headless');
  }
  // Añadir reporter JSON por tarea
  const reportOut = taskId ? `cypress/reports/${taskId}.json` : `cypress/reports/run.json`;
  if (!/--reporter\s+\S+/i.test(str)) {
    parts.push('--reporter json');
  }
  if (!/--reporter-options\s+[^\s]+/i.test(str)) {
    parts.push(`--reporter-options output=${reportOut}`);
  }
  return parts.join(' ');
}

async function healthCheckWithRetries(taskId = 'generic') {
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
      const logName = `${String(taskId)}.health.${String(step.name).replace(/[^a-z0-9_-]+/gi, '_')}.attempt${attempt + 1}.log`;
      const code = await runCmd(step.cmd, { logPath: path.join(OUTPUT_DIR, logName) });
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

  // Localizar índice y actualizar intentos/estado
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    const prevAttempts = parseInt(tasks[idx].attempts || 0, 10) || 0;
    tasks[idx].attempts = prevAttempts + 1;
    tasks[idx].status = 'in_progress';
    writeRoadmap({ ...roadmap, tasks });
  }

  const attempt = (idx >= 0 ? (tasks[idx].attempts || 1) : 1);
  const start = { timestamp: ts(), taskId: String(task.id), action: 'start', attempt };
  appendLog(start);

  let runExit = 0;
  try {
    // Ejecutar acción
    if (task.command) {
      // Si es Cypress, asegurar carpeta de reportes
      try {
        if (String(task.command).includes('cypress:run')) {
          ensureDir(path.join(repoRoot, 'cypress', 'reports'));
        }
      } catch {}
      const cmd = enhanceCypressCommand(task.command, String(task.id));
      runExit = await runCmd(cmd, { logPath: path.join(OUTPUT_DIR, `${String(task.id)}.run.log`) });
    } else if (task.script) {
      const cmd = `node ${task.script}`;
      runExit = await runCmd(cmd, { logPath: path.join(OUTPUT_DIR, `${String(task.id)}.run.log`) });
    } else {
      console.log('[runTask] Tarea sin command/script. Marcando como noop.');
      runExit = 0;
    }

    if (runExit !== 0) throw new Error(`Task process exit code ${runExit}`);

    // Health check (saltable)
    if (String(process.env.SKIP_HEALTH_CHECK || 'false') !== 'true') {
      const hc = await healthCheckWithRetries(String(task.id));
      if (!hc.ok) throw new Error(`HealthCheck failed at step ${hc.failedStep}`);
    } else {
      appendLog({ timestamp: ts(), taskId: String(task.id), action: 'health', status: 'skipped' });
    }

    appendLog({ timestamp: ts(), taskId: String(task.id), action: 'end', status: 'success', attempt });

    // Marcar tarea como completed en roadmap.json
    if (idx >= 0) {
      tasks[idx].status = 'completed';
      writeRoadmap({ ...roadmap, tasks });
    }
  } catch (e) {
    appendLog({ timestamp: ts(), taskId: String(task.id), error: e?.message || String(e), attempt });
    await writeIncident(String(task.id), e?.message || String(e));
    await notifySlack(`:rotating_light: Task ${task.id} falló: ${e?.message || e}`);
    await notifyEmail(`Task ${task.id} falló`, `Detalles: ${e?.message || e}`);
    // Actualizar roadmap según número de intentos
    if (idx >= 0) {
      const attempts = parseInt(tasks[idx].attempts || 1, 10) || 1;
      tasks[idx].lastError = e?.message || String(e);
      if (attempts >= 3) {
        tasks[idx].status = 'failed';
      } else {
        tasks[idx].status = 'pending';
      }
      writeRoadmap({ ...roadmap, tasks });
    }
    appendLog({ timestamp: ts(), taskId: String(task.id), action: 'end', status: 'error', attempt });
    process.exitCode = 1;
  }
}

// Node 18+ tiene fetch global; si no, se podría importar node-fetch
main();
