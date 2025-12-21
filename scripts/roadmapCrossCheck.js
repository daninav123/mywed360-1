#!/usr/bin/env node
/**
 * Cruza roadmap_aggregated.json (docs agregados) con roadmap.json (tareas automatizadas)
 * y produce:
 *  - roadmap_crosscheck.json (detallado, máquina)
 *  - docs/ROADMAP_DIFF.md (resumen legible)
 */

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';

function readJSON(p) {
  const txt = fs.readFileSync(p, 'utf8');
  return JSON.parse(txt);
}

function safeWriteFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

function norm(p) {
  return p.replace(/\\/g, '/');
}

function extractSpecPathsFromCommand(cmd = '') {
  const specs = [];
  // Busca --spec "cypress/e2e/.." o sin comillas
  const re = /--spec\s+"?([^\"\s][^\"]*)"?/g;
  let m;
  while ((m = re.exec(cmd))) {
    const s = m[1];
    if (s && s.includes('cypress/')) specs.push(norm(s));
  }
  // fallback: cualquier cypress/e2e/*.cy.js en el string
  const re2 = /(cypress\/e2e\/[^\s"']+\.cy\.js)/g;
  while ((m = re2.exec(cmd))) {
    specs.push(norm(m[1]));
  }
  return [...new Set(specs)];
}

function main() {
  const root = process.cwd();
  const aggPath = path.join(root, 'roadmap_aggregated.json');
  const rmPath = path.join(root, 'roadmap.json');
  if (!fs.existsSync(aggPath)) {
    console.error('[crosscheck] No existe roadmap_aggregated.json. Ejecuta primero: node scripts/aggregateRoadmap.js');
    process.exit(1);
  }
  if (!fs.existsSync(rmPath)) {
    console.error('[crosscheck] No existe roadmap.json');
    process.exit(1);
  }

  const aggregated = readJSON(aggPath);
  const roadmap = readJSON(rmPath);
  const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];

  // Build spec -> tasks mapping
  const specToTasks = new Map();
  const taskSpecSet = new Set();
  const dupSpecTasks = [];

  for (const t of tasks) {
    const list = [t.command, t.script].filter(Boolean).join(' ');
    const specs = extractSpecPathsFromCommand(list);
    for (const s of specs) {
      taskSpecSet.add(s);
      const arr = specToTasks.get(s) || [];
      arr.push({ id: t.id, status: t.status || 'unknown', title: t.title || '' });
      specToTasks.set(s, arr);
      if (arr.length > 1) {
        dupSpecTasks.push({ spec: s, count: arr.length, tasks: arr.map(x => x.id) });
      }
    }
  }

  // List actual spec files (optional)
  let actualSpecs = new Set();
  try {
    if (fg) {
      const files = fg.sync('cypress/e2e/**/*.cy.js', { cwd: root, dot: false, onlyFiles: true });
      actualSpecs = new Set(files.map(norm));
    }
  } catch (e) {
    // ignore
  }

  // Aggregated modules data
  const modules = Array.isArray(aggregated.modules) ? aggregated.modules : [];

  const aggregatedMissingSpecs = [];
  const modulesWithNoTaskForSpecs = [];
  const tasksSpecNotInDocs = [];

  // Set of specs present in docs
  const docsSpecSet = new Set();

  for (const m of modules) {
    const e2e = Array.isArray(m.e2eChecks) ? m.e2eChecks : [];
    const moduleSpecs = [];
    for (const c of e2e) {
      const s = norm(c.spec);
      moduleSpecs.push(s);
      docsSpecSet.add(s);
      if (c.exists === false) {
        aggregatedMissingSpecs.push({ module: m.title || m.filePath, spec: s });
      }
    }
    if (moduleSpecs.length) {
      const hasTask = moduleSpecs.some(s => specToTasks.has(s));
      if (!hasTask) {
        modulesWithNoTaskForSpecs.push({ module: m.title || m.filePath, specs: moduleSpecs });
      }
    }
  }

  // Tasks referencing specs not in docs
  for (const s of taskSpecSet) {
    if (!docsSpecSet.has(s)) {
      tasksSpecNotInDocs.push({ spec: s, tasks: specToTasks.get(s) || [] });
    }
  }

  // Tasks that reference specs missing on disk (if actualSpecs available)
  const tasksWithMissingSpecOnDisk = [];
  if (actualSpecs.size) {
    for (const s of taskSpecSet) {
      if (!actualSpecs.has(s)) {
        tasksWithMissingSpecOnDisk.push({ spec: s, tasks: specToTasks.get(s) || [] });
      }
    }
  }

  // Orphan spec files (present on disk but no task references)
  const orphanSpecs = [];
  if (actualSpecs.size) {
    for (const s of actualSpecs) {
      if (!taskSpecSet.has(s)) {
        orphanSpecs.push(s);
      }
    }
  }

  const outJSON = {
    generatedAt: new Date().toISOString(),
    counts: {
      modules: modules.length,
      tasks: tasks.length,
      docSpecs: docsSpecSet.size,
      taskSpecs: taskSpecSet.size,
      actualSpecs: actualSpecs.size || null
    },
    dupSpecTasks,
    aggregatedMissingSpecs,
    modulesWithNoTaskForSpecs,
    tasksSpecNotInDocs,
    tasksWithMissingSpecOnDisk,
    orphanSpecs
  };

  const outJsonPath = path.join(root, 'roadmap_crosscheck.json');
  safeWriteFile(outJsonPath, JSON.stringify(outJSON, null, 2));

  // Markdown summary
  const lines = [];
  lines.push('# Roadmap: cross-check docs vs tasks');
  lines.push('');
  lines.push(`- Fecha: ${outJSON.generatedAt}`);
  lines.push(`- Módulos (docs): ${outJSON.counts.modules}`);
  lines.push(`- Tareas (roadmap.json): ${outJSON.counts.tasks}`);
  lines.push(`- Specs en docs: ${outJSON.counts.docSpecs}`);
  lines.push(`- Specs en tareas: ${outJSON.counts.taskSpecs}`);
  if (outJSON.counts.actualSpecs) lines.push(`- Specs en disco: ${outJSON.counts.actualSpecs}`);
  lines.push('');

  function section(title, arr, render) {
    lines.push(`## ${title}`);
    if (!arr || arr.length === 0) {
      lines.push('- Ninguno');
    } else {
      for (const item of arr) {
        lines.push(render(item));
      }
    }
    lines.push('');
  }

  section('Specs duplicados en tareas', dupSpecTasks, (d) => `- **${d.spec}** -> ${d.count} tareas: ${d.tasks.map(t=>t).join(', ')}`);
  section('Specs faltantes según docs (E2E no encontrado)', aggregatedMissingSpecs, (d) => `- ${d.module}: ${d.spec}`);
  section('Módulos con specs pero sin tareas asociadas', modulesWithNoTaskForSpecs, (d) => `- ${d.module}: ${d.specs.join(', ')}`);
  section('Tareas con specs no mencionados en docs', tasksSpecNotInDocs, (d) => `- ${d.spec} -> ${d.tasks.map(t=>t.id).join(', ')}`);
  section('Tareas con specs inexistentes en disco', tasksWithMissingSpecOnDisk, (d) => `- ${d.spec} -> ${d.tasks.map(t=>t.id).join(', ')}`);
  section('Specs huérfanos (en disco, sin tarea)', orphanSpecs, (s) => `- ${s}`);

  const outMdPath = path.join(root, 'docs', 'ROADMAP_DIFF.md');
  safeWriteFile(outMdPath, lines.join('\n'));

  console.log('[crosscheck] Generados roadmap_crosscheck.json y docs/ROADMAP_DIFF.md');
}

main();
