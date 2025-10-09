#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ROADMAP_PATH = path.join(ROOT, 'roadmap.json');
const CROSS_PATH = path.join(ROOT, 'roadmap_crosscheck.json');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function backupFile(p) {
  const dir = path.dirname(p);
  const base = path.basename(p);
  const backup = path.join(dir, base + '.bak.' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.copyFileSync(p, backup);
  return backup;
}

function extractSpecPathsFromCommand(cmd = '') {
  const specs = [];
  const re = /--spec\s+"?([^\"\s][^\"]*)"?/g;
  let m;
  while ((m = re.exec(cmd))) {
    const s = m[1];
    if (s && s.includes('cypress/')) specs.push(s.replace(/\\/g, '/'));
  }
  const re2 = /(cypress\/e2e\/[^\s"']+\.cy\.js)/g;
  while ((m = re2.exec(cmd))) {
    specs.push(m[1].replace(/\\/g, '/'));
  }
  return [...new Set(specs)];
}

function slugFromSpec(spec) {
  const after = spec.replace(/^cypress\/e2e\//, '');
  return 'e2e_' + after.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function titleFromSpec(spec) {
  const after = spec.replace(/^cypress\/e2e\//, '');
  const parts = after.split('/');
  const folder = parts.length > 1 ? parts[0] : '';
  const file = parts[parts.length - 1] || after;
  const map = {
    email: 'Email',
    proveedores: 'Proveedores',
    protocolo: 'Protocolo',
    tasks: 'Tareas',
    contracts: 'Contratos',
    finance: 'Finance',
    guests: 'Invitados',
    onboarding: 'Onboarding',
    notifications: 'Notificaciones',
    seating: 'Seating',
    weddings: 'Bodas múltiples',
    admin: 'Administración',
    auth: 'Autenticación',
    web: 'Diseño Web',
    inspiration: 'Inspiración',
    news: 'Noticias'
  };
  const moduleName = map[folder] || (folder ? folder : 'E2E');
  const fileBase = file.replace(/\.cy\.js$/i, '').replace(/[-_]/g, ' ').trim();
  return `E2E: ${moduleName} – ${fileBase}`;
}

function main() {
  if (!fs.existsSync(ROADMAP_PATH)) {
    console.error('[add-orphans] No existe roadmap.json');
    process.exit(1);
  }
  if (!fs.existsSync(CROSS_PATH)) {
    console.error('[add-orphans] No existe roadmap_crosscheck.json. Ejecuta primero: node scripts/roadmapCrossCheck.js');
    process.exit(1);
  }

  const cross = readJSON(CROSS_PATH);
  const orphans = Array.isArray(cross.orphanSpecs) ? cross.orphanSpecs : [];
  if (!orphans.length) {
    console.log('[add-orphans] No hay specs huérfanos. Nada que hacer.');
    return;
  }

  const roadmap = readJSON(ROADMAP_PATH);
  const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];

  // Build sets for quick lookups
  const idSet = new Set(tasks.map(t => t.id));
  const specInTasks = new Set();
  for (const t of tasks) {
    const list = [t.command, t.script].filter(Boolean).join(' ');
    for (const s of extractSpecPathsFromCommand(list)) specInTasks.add(s);
  }

  let added = 0;
  for (const spec of orphans) {
    if (specInTasks.has(spec)) continue; // already referenced by a task

    let id = slugFromSpec(spec);
    let suffix = 2;
    while (idSet.has(id)) { id = slugFromSpec(spec) + '_' + suffix++; }

    const newTask = {
      id,
      title: titleFromSpec(spec),
      status: 'pending',
      priority: 15,
      command: `npm run cypress:run -- --spec "${spec}"`
    };

    tasks.push(newTask);
    idSet.add(id);
    added++;
  }

  if (!added) {
    console.log('[add-orphans] No se añadieron tareas (posible duplicado con tareas existentes).');
    return;
  }

  const backup = backupFile(ROADMAP_PATH);
  roadmap.tasks = tasks;
  writeJSON(ROADMAP_PATH, roadmap);
  console.log(`[add-orphans] Añadidas ${added} tareas. Backup creado: ${path.basename(backup)}`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}
