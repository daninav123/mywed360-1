#!/usr/bin/env node
/**
 * Aggrega roadmaps desde docs/flujos-especificos y valida existencia de evidencias (Cypress specs, archivos clave).
 *
 * Salidas:
 *  - roadmap_aggregated.json (raíz)
 *  - docs/ROADMAP.md (consolidado legible)
 *
 * Uso:
 *  node scripts/aggregateRoadmap.js           # genera archivos de salida
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FLOWS_DIR = path.join(ROOT, 'docs', 'flujos-especificos');
const OUTPUT_JSON = path.join(ROOT, 'roadmap_aggregated.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'ROADMAP.md');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; }
}

function listMarkdownFiles(dir) {
  const out = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) out.push(full);
    }
  }
  walk(dir);
  return out;
}

function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function extractLineAfterLabel(md, labelRegex) {
  // Devuelve lista de líneas que coinciden con el patrón (puede haber varias apariciones)
  const lines = md.split(/\r?\n/);
  const results = [];
  for (const line of lines) {
    const m = line.match(labelRegex);
    if (m) {
      results.push((m[1] || '').trim());
    }
  }
  return results;
}

function sectionBetween(md, startHeaderRegex) {
  // Extrae sección desde un encabezado hasta el siguiente encabezado de nivel 2 (##)
  const lines = md.split(/\r?\n/);
  let capturing = false;
  const buf = [];
  for (const line of lines) {
    if (!capturing) {
      if (startHeaderRegex.test(line)) capturing = true;
      continue;
    }
    if (/^##\s+/.test(line)) break;
    buf.push(line);
  }
  return buf.join('\n').trim();
}

function extractInlineCodeRefs(text) {
  const refs = [];
  if (!text) return refs;
  const re = /`([^`]+)`/g;
  let m;
  while ((m = re.exec(text)) !== null) refs.push(m[1]);
  return refs;
}

function extractCypressSpecs(sectionText) {
  const specs = [];
  if (!sectionText) return specs;
  const re = /cypress\/(e2e|integration)\/[\w\-/]+\.cy\.js/gi;
  let m;
  while ((m = re.exec(sectionText)) !== null) specs.push(m[0]);
  return Array.from(new Set(specs));
}

function fileExists(relOrAbs) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  return fs.existsSync(p);
}

function findByBasenameInRoots(basename, roots = ['src', 'backend', 'functions', 'scripts', 'docs']) {
  const found = [];
  for (const r of roots) {
    const baseDir = path.join(ROOT, r);
    if (!fs.existsSync(baseDir)) continue;
    const stack = [baseDir];
    while (stack.length) {
      const d = stack.pop();
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.isFile() && e.name === basename) found.push(full);
      }
    }
  }
  return found;
}

function parseFlowDoc(filePath) {
  const md = readFileSafe(filePath);
  if (!md) return null;
  const title = extractTitle(md) || path.basename(filePath);

  const implementedLines = extractLineAfterLabel(md, /^(?:>\s*)?Implementado:\s*(.+)$/i);
  const pendingLines = extractLineAfterLabel(md, /^(?:>\s*)?Pendiente[^:]*:\s*(.+)$/i);

  const roadmapSection = sectionBetween(md, /^##\s+.*Roadmap\s*\/\s*pendientes/i);
  const checklistSection = sectionBetween(md, /^##\s+.*Checklist de despliegue/i);
  const e2eSection = sectionBetween(md, /^##\s+.*Cobertura E2E implementada/i);

  const implementedRefs = implementedLines.flatMap(extractInlineCodeRefs);
  const pendingRefs = pendingLines.flatMap(extractInlineCodeRefs);
  const e2eSpecs = extractCypressSpecs(e2eSection);

  // Verificaciones de evidencia
  const e2eChecks = e2eSpecs.map(spec => ({ spec, exists: fileExists(spec) }));

  // Verificación básica de refs implementadas: buscar por basename
  const implChecks = implementedRefs.map(ref => {
    const base = path.basename(ref);
    const found = findByBasenameInRoots(base);
    return { ref, basename: base, matches: found.map(f => path.relative(ROOT, f)) };
  });

  // Conclusión heurística
  const hasImplementado = implementedLines.length > 0;
  const hasPendiente = pendingLines.length > 0 || (roadmapSection && roadmapSection.length > 0);
  const e2eOk = e2eChecks.length === 0 || e2eChecks.every(x => x.exists);
  const anyImplFound = implChecks.length === 0 || implChecks.some(x => x.matches.length > 0);

  let conclusion = 'desconocido';
  if (hasImplementado && !hasPendiente && e2eOk && anyImplFound) conclusion = 'implementado';
  else if (hasImplementado && hasPendiente) conclusion = 'parcial';
  else if (!hasImplementado && hasPendiente) conclusion = 'pendiente';

  return {
    filePath: path.relative(ROOT, filePath),
    title,
    implementedLines,
    pendingLines,
    roadmapSection,
    checklistSection,
    e2eSection,
    e2eChecks,
    implChecks,
    conclusion,
  };
}

function generateMarkdown(modules) {
  const lines = [];
  lines.push('# Roadmap Unificado');
  lines.push('');
  lines.push('Documento generado automáticamente a partir de `docs/flujos-especificos/`.');
  lines.push('');
  lines.push('> Estado: implementado/parcial/pendiente se infiere de lo declarado en cada flujo y de la existencia de evidencias (specs/archivos).');
  lines.push('');
  for (const m of modules) {
    lines.push(`## ${m.title}`);
    lines.push('');
    lines.push(`- **[archivo]** ${m.filePath}`);
    lines.push(`- **[conclusión]** ${m.conclusion}`);
    if (m.implementedLines?.length) {
      lines.push('- **[implementado (doc)]**');
      for (const l of m.implementedLines) lines.push(`  - ${l}`);
    }
    if (m.pendingLines?.length) {
      lines.push('- **[pendiente (doc)]**');
      for (const l of m.pendingLines) lines.push(`  - ${l}`);
    }
    if (m.e2eChecks?.length) {
      const ok = m.e2eChecks.filter(x => x.exists).length;
      const total = m.e2eChecks.length;
      lines.push(`- **[E2E specs]** ${ok}/${total} presentes`);
      for (const c of m.e2eChecks) {
        lines.push(`  - ${c.exists ? '✅' : '❌'} ${c.spec}`);
      }
    }
    if (m.implChecks?.length) {
      lines.push('- **[verificación de archivos implementados]**');
      for (const c of m.implChecks) {
        const list = c.matches.length ? c.matches.join(', ') : '(no encontrado)';
        // Evitar backticks anidados en template literals para compatibilidad
        lines.push('  - `' + c.ref + '` -> ' + list);
      }
    }
    if (m.roadmapSection) {
      lines.push('- **[roadmap/pending (doc)]**');
      for (const l of m.roadmapSection.split(/\r?\n/).filter(x => x.trim())) lines.push(`  - ${l}`);
    }
    if (m.checklistSection) {
      lines.push('- **[checklist despliegue]**');
      for (const l of m.checklistSection.split(/\r?\n/).filter(x => x.trim())) lines.push(`  - ${l}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(FLOWS_DIR)) {
    console.error(`[aggregateRoadmap] No existe ${FLOWS_DIR}`);
    process.exit(1);
  }
  const files = listMarkdownFiles(FLOWS_DIR);
  const modules = [];
  for (const f of files) {
    const parsed = parseFlowDoc(f);
    if (parsed) modules.push(parsed);
  }
  // Ordenar por nombre para estabilidad
  modules.sort((a, b) => a.title.localeCompare(b.title));

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), modules }, null, 2) + '\n');
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_MD, generateMarkdown(modules), 'utf8');

  console.log(`[aggregateRoadmap] Generado ${path.relative(ROOT, OUTPUT_JSON)} y ${path.relative(ROOT, OUTPUT_MD)}`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}
