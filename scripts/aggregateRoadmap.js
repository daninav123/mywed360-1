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
const OUTPUT_E2E_MD = path.join(ROOT, 'docs', 'testing', 'e2e-coverage.md');

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
  lines.push('# Roadmap - Lovenda/MyWed360');
  lines.push('');
  lines.push('> Documento canonico que integra backlog, plan de sprints y estado por flujo. Actualiza esta fuente unica cuando haya cambios para evitar divergencias.');
  lines.push('');
  lines.push('## Resumen ejecutivo');
  lines.push('### Objetivos trimestrales');
  lines.push('- Estabilizar el core operativo (Seating Plan, RSVP, reglas de negocio).');
  lines.push('- Completar modulos prioritarios (Tasks/Checklist, Emails, Notificaciones) con calidad de produccion.');
  lines.push('- Habilitar primeras capacidades de IA aplicadas a Diseno Web y Proveedores.');
  lines.push('');
  lines.push('### KPIs y metas');
  lines.push('- Retencion de planners +10%.');
  lines.push('- Exportaciones listas para imprenta con <2% de incidencias rechazadas.');
  lines.push('- NPS planners = 45.');
  lines.push('- Cobertura E2E critica = 90% en CI.');
  lines.push('');
  lines.push('### Estado actual por flujo');
  lines.push('- Implementado/parcial: flujos 3, 5, 7, 9, 10, 11 (sub-secciones), 12 y 19.');
  lines.push('- Pendiente/por definir: integraciones IA avanzadas, marketplace de plantillas, automatizaciones push/SMS completas.');
  lines.push('- Ejecucion priorizada: ver docs/TODO.md (Seating plan, protocolo 11A-11E, asistente IA y modulo Momentos).');
  lines.push('');
  lines.push('> El detalle historico que antes vivia en docs/roadmap-unificado.md y docs/ROADMAP_DIFF.md se consolido aqui para mantener una unica referencia.');
  lines.push('');
  lines.push('## Detalle por flujo');
  lines.push('');
  for (const m of modules) {
    lines.push('## ' + m.title);
    lines.push('');
    lines.push('- **[archivo]** ' + m.filePath);
    lines.push('- **[conclusion]** ' + m.conclusion);
    if (m.implementedLines?.length) {
      lines.push('- **[implementado (doc)]**');
      for (const l of m.implementedLines) lines.push('  - ' + l);
    }
    if (m.pendingLines?.length) {
      lines.push('- **[pendiente (doc)]**');
      for (const l of m.pendingLines) lines.push('  - ' + l);
    }
    if (m.e2eChecks?.length) {
      const ok = m.e2eChecks.filter(x => x.exists).length;
      const total = m.e2eChecks.length;
      lines.push('- **[E2E specs]** ' + ok + '/' + total + ' presentes');
      for (const c of m.e2eChecks) {
        const mark = c.exists ? '[ok]' : '[faltante]';
        lines.push('  - ' + mark + ' ' + c.spec);
      }
    }
    if (m.implChecks?.length) {
      lines.push('- **[verificacion de archivos implementados]**');
      for (const c of m.implChecks) {
        const list = c.matches.length ? c.matches.join(', ') : '(no encontrado)';
        lines.push("  - `" + c.ref + "` -> " + list);
      }
    }
    if (m.roadmapSection) {
      lines.push('- **[roadmap/pending (doc)]**');
      for (const l of m.roadmapSection.split(/\r?\n/).filter(x => x.trim())) lines.push('  - ' + l);
    }
    if (m.checklistSection) {
      lines.push('- **[checklist despliegue]**');
      for (const l of m.checklistSection.split(/\r?\n/).filter(x => x.trim())) lines.push('  - ' + l);
    }
    lines.push('');
  }
  lines.push('Generado automaticamente por scripts/aggregateRoadmap.js. Ejecuta el script cuando cambie la documentacion o los tests.');
  lines.push('');
  return lines.join('\n');
}

function generateCoverageMatrix(modules) {
  const lines = [];
  lines.push('# Matriz de Cobertura E2E');
  lines.push('');
  lines.push('Generado automáticamente por `scripts/aggregateRoadmap.js`. Actualiza este archivo ejecutando el script cuando cambie la documentación o los tests.');
  lines.push('');
  lines.push('| Flujo | Specs declaradas | Specs faltantes | Estado |');
  lines.push('|-------|------------------|-----------------|--------|');

  for (const m of modules) {
    const specs = m.e2eChecks || [];
    const declared = specs.map((s) => s.spec);
    const missing = specs.filter((s) => !s.exists).map((s) => s.spec);
    let status = 'Sin cobertura declarada';
    if (declared.length === 0) {
      status = 'Sin specs en doc';
    } else if (missing.length === 0) {
      status = 'OK';
    } else {
      status = '⚠️ Falta implementar';
    }
    lines.push(
      `| ${m.title} | ${declared.length ? declared.join('<br>') : '—'} | ${missing.length ? missing.join('<br>') : '—'} | ${status} |`
    );
  }

  lines.push('');
  lines.push('_Nota:_ La matriz refleja lo declarado en la documentación de cada flujo (`## Cobertura E2E implementada`). Si el flujo no menciona ninguna spec, aparecerá como “Sin specs en doc”.');

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
  fs.mkdirSync(path.dirname(OUTPUT_E2E_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_E2E_MD, generateCoverageMatrix(modules), 'utf8');

  console.log(`[aggregateRoadmap] Generado ${path.relative(ROOT, OUTPUT_JSON)}, ${path.relative(ROOT, OUTPUT_MD)} y ${path.relative(ROOT, OUTPUT_E2E_MD)}`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}
