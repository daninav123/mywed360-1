#!/usr/bin/env node
/**
 * Reordena roadmap.json respetando sprint, priority y dependencias (blockedBy).
 *
 * Uso:
 *   node scripts/roadmapOrder.js           # imprime JSON reordenado a stdout
 *   node scripts/roadmapOrder.js --write   # sobrescribe roadmap.json
 *   node scripts/roadmapOrder.js --check   # verifica orden; sale 0 si ok, 1 si no
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROADMAP_PATH = path.resolve(process.cwd(), 'roadmap.json');

function readRoadmap() {
  const raw = fs.readFileSync(ROADMAP_PATH, 'utf8');
  return JSON.parse(raw);
}

function cmp(a, b) {
  const sA = Number.isInteger(a.sprint) ? a.sprint : Number.MAX_SAFE_INTEGER;
  const sB = Number.isInteger(b.sprint) ? b.sprint : Number.MAX_SAFE_INTEGER;
  if (sA !== sB) return sA - sB;

  const pA = Number.isInteger(a.priority) ? a.priority : Number.MAX_SAFE_INTEGER;
  const pB = Number.isInteger(b.priority) ? b.priority : Number.MAX_SAFE_INTEGER;
  if (pA !== pB) return pA - pB;

  // order puede ser número o undefined
  const oA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
  const oB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
  if (oA !== oB) return oA - oB;

  return String(a.id).localeCompare(String(b.id));
}

function topoSort(tasks) {
  const idToTask = new Map(tasks.map(t => [t.id, t]));
  const outEdges = new Map();
  const indeg = new Map();

  for (const t of tasks) {
    indeg.set(t.id, 0);
  }

  for (const t of tasks) {
    const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : [];
    for (const b of blockers) {
      if (!idToTask.has(b)) continue; // ignorar dependencias desconocidas
      indeg.set(t.id, (indeg.get(t.id) || 0) + 1);
      if (!outEdges.has(b)) outEdges.set(b, new Set());
      outEdges.get(b).add(t.id);
    }
  }

  // Cola inicial con indegree 0, ordenada por cmp
  const queue = tasks.filter(t => (indeg.get(t.id) || 0) === 0).sort(cmp);
  const result = [];
  const pushed = new Set(queue.map(t => t.id));

  while (queue.length) {
    const node = queue.shift();
    result.push(node);
    const outs = outEdges.get(node.id);
    if (!outs) continue;
    for (const v of outs) {
      indeg.set(v, (indeg.get(v) || 0) - 1);
      if (indeg.get(v) === 0) {
        const t = idToTask.get(v);
        // insertar manteniendo orden (cola pequeña, coste aceptable)
        let inserted = false;
        for (let i = 0; i < queue.length; i++) {
          if (cmp(t, queue[i]) < 0) { queue.splice(i, 0, t); inserted = true; break; }
        }
        if (!inserted) queue.push(t);
        pushed.add(v);
      }
    }
  }

  if (result.length !== tasks.length) {
    // Ciclo o dependencias no satisfechas; añadir el resto manteniendo orden original
    const remaining = tasks.filter(t => !result.find(r => r.id === t.id));
    console.warn(`[roadmapOrder] Aviso: detectadas dependencias cíclicas o inválidas. Manteniendo orden original para ${remaining.length} tareas.`);
    return result.concat(remaining);
  }
  return result;
}

function reorder(roadmap) {
  const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks.slice() : [];
  const ordered = topoSort(tasks);
  return { ...roadmap, tasks: ordered };
}

function equalsOrder(a, b) {
  if (!Array.isArray(a.tasks) || !Array.isArray(b.tasks)) return false;
  if (a.tasks.length !== b.tasks.length) return false;
  for (let i = 0; i < a.tasks.length; i++) {
    if (a.tasks[i].id !== b.tasks[i].id) return false;
  }
  return true;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const roadmap = readRoadmap();
  const newRm = reorder(roadmap);

  if (args.has('--check')) {
    const ok = equalsOrder(roadmap, newRm);
    if (!ok) {
      const from = roadmap.tasks.map(t => t.id);
      const to = newRm.tasks.map(t => t.id);
      console.error('[roadmapOrder] El orden no cumple con sprint/priority/blockedBy');
      // Mostrar primeros cambios
      for (let i = 0; i < Math.min(from.length, 20); i++) {
        if (from[i] !== to[i]) {
          console.error(`  idx ${i}: ${from[i]} -> ${to[i]}`);
        }
      }
    }
    process.exit(ok ? 0 : 1);
  }

  if (args.has('--write')) {
    fs.writeFileSync(ROADMAP_PATH, JSON.stringify(newRm, null, 2) + '\n');
    console.log('[roadmapOrder] roadmap.json actualizado');
  } else {
    process.stdout.write(JSON.stringify(newRm, null, 2));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
