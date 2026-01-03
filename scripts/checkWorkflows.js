#!/usr/bin/env node

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_WORKFLOWS_DIR = path.join(repoRoot, '.windsurf', 'workflows');
const DEFAULT_LOG_DIR = path.join(repoRoot, 'logs', 'workflow-check');

const toInt = (v, fallback) => {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

function parseArgs(argv) {
  const out = {
    dir: DEFAULT_WORKFLOWS_DIR,
    timeoutSec: 30,
    idleSec: 0,
    execute: false,
    verbose: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir' && argv[i + 1]) {
      out.dir = path.resolve(process.cwd(), argv[i + 1]);
      i++;
      continue;
    }
    if (a.startsWith('--timeout=')) {
      out.timeoutSec = toInt(a.split('=')[1], out.timeoutSec);
      continue;
    }
    if (a.startsWith('--idle=')) {
      out.idleSec = toInt(a.split('=')[1], out.idleSec);
      continue;
    }
    if (a === '--execute') {
      out.execute = true;
      continue;
    }
    if (a === '--verbose') {
      out.verbose = true;
      continue;
    }
    if (a === '--json') {
      out.json = true;
      continue;
    }
  }

  if (out.execute) {
    if (out.timeoutSec === 30) out.timeoutSec = 900;
    if (out.idleSec === 0) out.idleSec = 180;
  }

  return out;
}

async function readDirRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await readDirRecursive(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

function extractFrontmatterAndBody(content) {
  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') return null;
  const endIndex = lines.slice(1).findIndex((l) => l.trim() === '---');
  if (endIndex === -1) return null;
  const fmEnd = endIndex + 1;
  const frontmatter = lines.slice(1, fmEnd).join('\n');
  const body = lines.slice(fmEnd + 1).join('\n');
  return { frontmatter, body };
}

function parseDescription(frontmatter) {
  const match = /^description\s*:\s*(.+)\s*$/m.exec(String(frontmatter || ''));
  if (!match) return null;
  let value = String(match[1] ?? '').trim();
  if (!value) return null;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).trim();
  }
  return value || null;
}

function extractCodeBlocks(markdown) {
  const out = [];
  const src = String(markdown).replace(/\r\n/g, '\n');
  const re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({
      lang: String(m[1] || '').trim().toLowerCase(),
      code: String(m[2] || ''),
    });
  }
  return out;
}

function safeName(input) {
  return String(input)
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/^_+/, '')
    .slice(0, 120) || 'workflow';
}

function ensureDirSync(p) {
  if (!fsSync.existsSync(p)) fsSync.mkdirSync(p, { recursive: true });
}

function runWithTimeout({ command, args, cwd, timeoutMs, idleMs, logPath, verbose }) {
  return new Promise((resolve) => {
    ensureDirSync(path.dirname(logPath));
    const logStream = fsSync.createWriteStream(logPath, { flags: 'a' });

    const startAt = Date.now();
    let done = false;
    let hardTimeout;
    let idleTimeout;

    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let outTail = '';
    let errTail = '';

    const pushTail = (buf, chunk) => {
      const s = String(chunk || '');
      const next = buf + s;
      return next.length > 4000 ? next.slice(next.length - 4000) : next;
    };

    const resetIdle = () => {
      if (!idleMs) return;
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        if (done) return;
        done = true;
        try { logStream.write(`\n[IDLE TIMEOUT ${idleMs}ms]\n`); } catch {}
        try { child.kill('SIGTERM'); } catch {}
        setTimeout(() => {
          try { child.kill('SIGKILL'); } catch {}
        }, 5000);
        resolve({
          ok: false,
          code: null,
          signal: 'IDLE_TIMEOUT',
          timedOut: false,
          idleTimedOut: true,
          durationMs: Date.now() - startAt,
          logPath,
          outTail,
          errTail,
        });
      }, idleMs);
    };

    if (timeoutMs) {
      hardTimeout = setTimeout(() => {
        if (done) return;
        done = true;
        try { logStream.write(`\n[HARD TIMEOUT ${timeoutMs}ms]\n`); } catch {}
        try { child.kill('SIGTERM'); } catch {}
        setTimeout(() => {
          try { child.kill('SIGKILL'); } catch {}
        }, 5000);
        resolve({
          ok: false,
          code: null,
          signal: 'HARD_TIMEOUT',
          timedOut: true,
          idleTimedOut: false,
          durationMs: Date.now() - startAt,
          logPath,
          outTail,
          errTail,
        });
      }, timeoutMs);
    }

    const onOut = (chunk) => {
      outTail = pushTail(outTail, chunk);
      try { logStream.write(chunk); } catch {}
      if (verbose) {
        try { process.stdout.write(chunk); } catch {}
      }
      resetIdle();
    };

    const onErr = (chunk) => {
      errTail = pushTail(errTail, chunk);
      try { logStream.write(chunk); } catch {}
      if (verbose) {
        try { process.stderr.write(chunk); } catch {}
      }
      resetIdle();
    };

    if (child.stdout) child.stdout.on('data', onOut);
    if (child.stderr) child.stderr.on('data', onErr);

    resetIdle();

    const cleanup = () => {
      if (hardTimeout) clearTimeout(hardTimeout);
      if (idleTimeout) clearTimeout(idleTimeout);
      try { logStream.end(); } catch {}
    };

    child.on('error', (err) => {
      if (done) return;
      done = true;
      cleanup();
      resolve({
        ok: false,
        code: null,
        signal: 'SPAWN_ERROR',
        timedOut: false,
        idleTimedOut: false,
        durationMs: Date.now() - startAt,
        logPath,
        outTail,
        errTail: pushTail(errTail, err?.message || String(err)),
      });
    });

    child.on('exit', (code, signal) => {
      if (done) return;
      done = true;
      cleanup();
      resolve({
        ok: code === 0,
        code,
        signal: signal || null,
        timedOut: false,
        idleTimedOut: false,
        durationMs: Date.now() - startAt,
        logPath,
        outTail,
        errTail,
      });
    });
  });
}

async function runValidateWorkflows({ dir, verbose }) {
  const logPath = path.join(DEFAULT_LOG_DIR, `validateWorkflows.${Date.now()}.log`);
  const res = await runWithTimeout({
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'validateWorkflows.js'), '--dir', dir],
    cwd: repoRoot,
    timeoutMs: 60_000,
    idleMs: 30_000,
    logPath,
    verbose,
  });
  return res;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const validate = await runValidateWorkflows({ dir: args.dir, verbose: args.verbose });
  if (!validate.ok) {
    console.error(`[workflows:check] validateWorkflows falló (ver log: ${path.relative(repoRoot, validate.logPath)})`);
    process.exit(1);
  }

  let files;
  try {
    files = (await readDirRecursive(args.dir)).filter((p) => p.toLowerCase().endsWith('.md'));
  } catch (e) {
    console.error(`[workflows:check] No se pudo leer el directorio: ${args.dir}`);
    console.error(e?.message || e);
    process.exit(2);
  }

  const results = [];

  for (const filePath of files) {
    const rel = path.relative(repoRoot, filePath);
    const content = await fs.readFile(filePath, 'utf8');
    const fm = extractFrontmatterAndBody(content);
    const description = fm ? parseDescription(fm.frontmatter) : null;

    const blocks = extractCodeBlocks(content).filter((b) => b.lang === 'bash' || b.lang === 'sh');

    const wfId = safeName(path.basename(filePath, path.extname(filePath)));

    if (!blocks.length) {
      results.push({ file: rel, description, ok: true, steps: [] });
      continue;
    }

    const steps = [];
    let wfOk = true;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const script = String(block.code || '').trim();
      if (!script) continue;

      const mode = args.execute ? 'execute' : 'syntax';
      const logPath = path.join(DEFAULT_LOG_DIR, wfId, `step${i + 1}.${mode}.log`);

      const cmd = 'bash';
      const cmdArgs = args.execute
        ? ['-lc', script]
        : ['-n', '-c', script];

      const res = await runWithTimeout({
        command: cmd,
        args: cmdArgs,
        cwd: repoRoot,
        timeoutMs: args.timeoutSec * 1000,
        idleMs: args.idleSec ? args.idleSec * 1000 : 0,
        logPath,
        verbose: args.verbose,
      });

      const step = {
        index: i + 1,
        lang: block.lang,
        mode,
        ok: res.ok,
        code: res.code,
        signal: res.signal,
        durationMs: res.durationMs,
        logPath: path.relative(repoRoot, res.logPath),
      };

      steps.push(step);
      if (!res.ok) wfOk = false;
    }

    results.push({ file: rel, description, ok: wfOk, steps });
  }

  const failed = results.filter((r) => !r.ok);

  if (args.json) {
    console.log(JSON.stringify({
      dir: path.relative(repoRoot, args.dir),
      total: results.length,
      failed: failed.length,
      results,
    }, null, 2));
  } else {
    console.log(`[workflows:check] Directorio: ${path.relative(repoRoot, args.dir)}`);
    console.log(`[workflows:check] Workflows: ${results.length}`);
    console.log(`[workflows:check] FAIL: ${failed.length}`);

    for (const r of results) {
      const title = r.description ? `${r.file} - ${r.description}` : r.file;
      console.log(`- ${r.ok ? 'OK ' : 'FAIL'} ${title}`);
      for (const s of r.steps) {
        console.log(`  - step ${s.index} (${s.mode}) -> ${s.ok ? 'OK' : 'FAIL'} (log: ${s.logPath})`);
      }
    }
  }

  process.exit(failed.length ? 1 : 0);
}

main();
