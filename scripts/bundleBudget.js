#!/usr/bin/env node
/**
 * Simple bundle size budget checker
 * - Expects a Vite build at ./dist
 * - Sums all JS assets under dist/assets and fails if total > --maxBytes
 *
 * Usage:
 *   node scripts/bundleBudget.js --maxBytes=2000000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const out = { maxBytes: 2_000_000, metric: 'gzip' };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) {
      const k = m[1];
      const v = m[2];
      if (k === 'maxBytes') out.maxBytes = parseInt(v, 10);
      if (k === 'metric') out.metric = String(v || '').toLowerCase();
    }
    if (a === '--gzip') out.metric = 'gzip';
    if (a === '--raw') out.metric = 'raw';
  }
  return out;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function main() {
  const { maxBytes, metric } = parseArgs();
  const dist = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(dist)) {
    console.error('[bundleBudget] dist/ not found. Run vite build first.');
    process.exit(1);
  }
  const assetsDir = path.join(dist, 'assets');
  const files = fs.existsSync(assetsDir) ? walk(assetsDir) : walk(dist);
  const jsFiles = files.filter((f) => /\.(m?js|cjs)$/i.test(f));
  let total = 0;
  if (metric === 'gzip') {
    const zlib = require('zlib');
    for (const f of jsFiles) {
      const buf = fs.readFileSync(f);
      const gz = zlib.gzipSync(buf, { level: 9 });
      total += gz.length;
    }
  } else {
    for (const f of jsFiles) {
      const stat = fs.statSync(f);
      total += stat.size;
    }
  }
  const mb = (n) => (n / (1024 * 1024)).toFixed(2);
  console.log(
    `[bundleBudget] JS total (${metric}): ${total} bytes (${mb(total)} MB). Max: ${maxBytes} (${mb(maxBytes)} MB)`
  );
  if (total > maxBytes) {
    console.error(
      `[bundleBudget] Budget exceeded by ${total - maxBytes} bytes (${mb(total - maxBytes)} MB)`
    );
    process.exit(1);
  }
}

try {
  main();
} catch (e) {
  console.error('[bundleBudget] error:', e?.message || e);
  process.exit(1);
}
