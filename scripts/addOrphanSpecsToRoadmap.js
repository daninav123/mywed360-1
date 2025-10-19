#!/usr/bin/env node
/**
 * Añade tareas pendientes en roadmap.json para cada spec huérfana
 * detectada en roadmap_crosscheck.json (sin referencia en tasks).
 *
 * Útil cuando el cross-check reporta "orphanSpecs".
 */

const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function extractSpecPathsFromCommand(cmd = '') {
  const specs = new Set();
  const re = /--spec\s+"?([^"\s][^"]*)"?/g;
  let match;
  while ((match = re.exec(cmd))) {
    const spec = match[1]?.trim();
    if (spec && spec.includes('cypress/')) specs.add(normalize(spec));
  }
  const re2 = /(cypress\/e2e\/[^\s"']+\.cy\.js)/g;
  while ((match = re2.exec(cmd))) {
    specs.add(normalize(match[1]));
  }
  return Array.from(specs);
}

function normalize(p) {
  return p.replace(/\\/g, '/');
}

function toTitleCase(str = '') {
  return str
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

function humanizeSegment(segment = '') {
  return toTitleCase(segment.replace(/[-_]+/g, ' '));
}

function buildTaskTitle(spec) {
  const trimmed = spec.replace(/^cypress\/e2e\//, '');
  const parts = trimmed.split('/');
  const fileSegment = parts.pop() || '';
  const categorySegment = parts[0] || 'general';
  const category = humanizeSegment(categorySegment);
  const file = humanizeSegment(fileSegment.replace(/\.cy\.js$/, ''));
  return `E2E: ${category} – ${file}`;
}

function buildTaskId(spec, existingIds) {
  const trimmed = spec.replace(/^cypress\/e2e\//, '');
  const base = `e2e_${trimmed.replace(/\//g, '_').replace(/\.cy\.js$/i, '_cy_js')}`;
  let candidate = base;
  let i = 1;
  while (existingIds.has(candidate)) {
    candidate = `${base}_${i++}`;
  }
  return candidate;
}

function main() {
  const root = process.cwd();
  const crossPath = path.join(root, 'roadmap_crosscheck.json');
  const roadmapPath = path.join(root, 'roadmap.json');

  if (!fs.existsSync(crossPath)) {
    console.error('[addOrphanSpecsToRoadmap] No se encontró roadmap_crosscheck.json. Ejecuta el crosscheck primero.');
    process.exit(1);
  }
  if (!fs.existsSync(roadmapPath)) {
    console.error('[addOrphanSpecsToRoadmap] No se encontró roadmap.json.');
    process.exit(1);
  }

  const crosscheck = readJSON(crossPath);
  const roadmap = readJSON(roadmapPath);
  const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];

  const orphanSpecs = Array.isArray(crosscheck.orphanSpecs) ? crosscheck.orphanSpecs : [];
  if (!orphanSpecs.length) {
    console.log('[addOrphanSpecsToRoadmap] No hay specs huérfanas registradas.');
    return;
  }

  const existingIds = new Set(tasks.map((t) => t.id));
  const existingSpecs = new Set(
    tasks
      .flatMap((task) => extractSpecPathsFromCommand(`${task.command || ''} ${task.script || ''}`))
      .map(normalize)
  );

  const additions = [];

  for (const rawSpec of orphanSpecs) {
    const spec = normalize(rawSpec);
    if (existingSpecs.has(spec)) continue;

    const id = buildTaskId(spec, existingIds);
    existingIds.add(id);
    const title = buildTaskTitle(spec);
    const command = `npm run cypress:run -- --spec "${spec}"`;

    tasks.push({
      id,
      title,
      status: 'pending',
      priority: 15,
      command,
      attempts: 0,
    });

    additions.push({ id, spec });
  }

  if (!additions.length) {
    console.log('[addOrphanSpecsToRoadmap] Todos los specs ya estaban referenciados.');
    return;
  }

  roadmap.tasks = tasks;
  writeJSON(roadmapPath, roadmap);

  console.log(`[addOrphanSpecsToRoadmap] Añadidas ${additions.length} tareas nuevas:`);
  additions.forEach(({ id, spec }) => {
    console.log(`  - ${id}: ${spec}`);
  });
}

main();
