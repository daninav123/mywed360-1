#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const roadmapPath = path.join(__dirname, '..', 'roadmap.json');
const roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));

const stats = {
  completed: 0,
  failed: 0,
  pending: 0,
  total: roadmap.tasks.length
};

const failedTasks = [];
const pendingTasks = [];

roadmap.tasks.forEach(task => {
  if (task.status === 'completed') stats.completed++;
  else if (task.status === 'failed') {
    stats.failed++;
    failedTasks.push(task);
  } else if (task.status === 'pending') {
    stats.pending++;
    pendingTasks.push(task);
  }
});

console.log('='.repeat(60));
console.log('ROADMAP STATUS SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tasks: ${stats.total}`);
console.log(`✅ Completed: ${stats.completed} (${Math.round(stats.completed/stats.total*100)}%)`);
console.log(`❌ Failed: ${stats.failed} (${Math.round(stats.failed/stats.total*100)}%)`);
console.log(`⏳ Pending: ${stats.pending} (${Math.round(stats.pending/stats.total*100)}%)`);
console.log('='.repeat(60));

if (failedTasks.length > 0) {
  console.log('\n❌ FAILED TASKS:');
  failedTasks.forEach(task => {
    console.log(`  - ${task.id}: ${task.title}`);
    if (task.lastError) console.log(`    Error: ${task.lastError}`);
  });
}

if (pendingTasks.length > 0) {
  console.log('\n⏳ PENDING TASKS:');
  pendingTasks.forEach(task => {
    console.log(`  - ${task.id}: ${task.title}`);
  });
}

console.log('\n' + '='.repeat(60));
