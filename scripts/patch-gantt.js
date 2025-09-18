// Small postinstall patch to clamp gantt-task-react Month view range
// It replaces the internal logic that extends end date by +1 year
// with a tighter +1 month end aligned to month start.
// Idempotent: only patches if exact pattern is found.

const fs = require('fs');
const path = require('path');

function patchFile(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.warn('[patch-gantt] File not found:', abs);
    return false;
  }
  let src = fs.readFileSync(abs, 'utf8');
  // Regex tolerante a espacios y saltos de línea
  const re = /case\s+exports\.ViewMode\.Month:\s*\n\s*newStartDate\s*=\s*addToDate\(newStartDate,\s*-1\s*\*\s*preStepsCount,\s*"month"\);\s*\n\s*newStartDate\s*=\s*startOfDate\(newStartDate,\s*"month"\);\s*\n\s*newEndDate\s*=\s*addToDate\(newEndDate,\s*1,\s*"year"\);\s*\n\s*newEndDate\s*=\s*startOfDate\(newEndDate,\s*"year"\);\s*\n\s*break;/m;
  const replacement = 'case exports.ViewMode.Month:\n      newStartDate = addToDate(newStartDate, -1 * preStepsCount, "month");\n      newStartDate = startOfDate(newStartDate, "month");\n      newEndDate = addToDate(newEndDate, 1, "month");\n      newEndDate = startOfDate(newEndDate, "month");\n      break;';
  if (/addToDate\(newEndDate,\s*1,\s*"month"\)\;[\s\S]*startOfDate\(newEndDate,\s*"month"\)/m.test(src)) {
    console.log('[patch-gantt] Already patched.');
    return true;
  }
  if (!re.test(src)) {
    console.warn('[patch-gantt] Expected pattern not found; library version may have changed.');
    return false;
  }
  src = src.replace(re, replacement);
  fs.writeFileSync(abs, src, 'utf8');
  console.log('[patch-gantt] Patched', abs);
  return true;
}

const target = 'node_modules/gantt-task-react/dist/index.js';
const okMain = patchFile(target);

// Intentar parchear también la versión pre‑empaquetada de Vite si existe
try {
  const depsDir = path.resolve('node_modules/.vite/deps');
  if (fs.existsSync(depsDir)) {
    const files = fs.readdirSync(depsDir).filter(f => /gantt-task-react.*\.js$/.test(f));
    for (const f of files) {
      const full = path.join(depsDir, f);
      let src = fs.readFileSync(full, 'utf8');
      const re2 = /case\s+[A-Za-z0-9_\.]*ViewMode\.Month:\s*\n[\s\S]*?newEndDate\s*=\s*addToDate\(newEndDate,\s*1,\s*"year"\);[\s\S]*?startOfDate\(newEndDate,\s*"year"\);/m;
      if (re2.test(src)) {
        src = src.replace(re2, (m) => m.replace('"year"', '"month"').replace('"year"', '"month"'));
        fs.writeFileSync(full, src, 'utf8');
        console.log('[patch-gantt] Patched Vite dep', full);
      }
    }
  }
} catch (e) {
  console.warn('[patch-gantt] Skipped vite deps patch:', e?.message || e);
}

if (!okMain) {
  process.exitCode = 0; // no romper instalación si cambia la librería
}
