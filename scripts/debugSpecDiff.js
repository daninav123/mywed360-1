#!/usr/bin/env node
/**
 * Debug helper: compara specs definidos en docs (roadmap_aggregated.json)
 * contra los que aparecen en roadmap.json.
 */

import fs from 'node:fs';

const norm = (p) => p.replace(/\\/g, '/');

const aggregated = JSON.parse(fs.readFileSync('roadmap_aggregated.json', 'utf8'));
const roadmap = JSON.parse(fs.readFileSync('roadmap.json', 'utf8'));

const docSpecs = new Set();
for (const module of aggregated.modules || []) {
  if (Array.isArray(module.e2eChecks)) {
    for (const check of module.e2eChecks) {
      if (check?.spec) {
        docSpecs.add(norm(check.spec));
      }
    }
  }
}

const taskSpecs = new Set();
const re = /--spec\s+"?([^"\s][^"]*)"?/g;
for (const task of roadmap.tasks || []) {
  const text = `${task.command || ''} ${task.script || ''}`;
  let match;
  while ((match = re.exec(text))) {
    taskSpecs.add(norm(match[1]));
  }
}

const missingInDocs = [...taskSpecs].filter((spec) => !docSpecs.has(spec)).sort();
const missingInTasks = [...docSpecs].filter((spec) => !taskSpecs.has(spec)).sort();

console.log('Specs en docs:', docSpecs.size);
console.log('Specs en tareas:', taskSpecs.size);
console.log('En tareas pero no en docs:', missingInDocs.length);
if (missingInDocs.length) {
  console.log(missingInDocs.join('\n'));
}

console.log('En docs pero sin tarea:', missingInTasks.length);
if (missingInTasks.length) {
  console.log(missingInTasks.join('\n'));
}
