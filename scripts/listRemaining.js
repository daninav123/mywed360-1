const fs = require('fs');

const r = JSON.parse(fs.readFileSync('roadmap.json', 'utf8'));
const pending = r.tasks.filter(t => t.status === 'pending' || t.status === 'failed' || t.status === 'in_progress');

console.log('=== TAREAS RESTANTES PARA 100% ===\n');
console.log(`Total restantes: ${pending.length}\n`);

const byStatus = {
  pending: pending.filter(t => t.status === 'pending'),
  failed: pending.filter(t => t.status === 'failed'),
  in_progress: pending.filter(t => t.status === 'in_progress')
};

console.log(`Pendientes: ${byStatus.pending.length}`);
console.log(`Fallidas: ${byStatus.failed.length}`);
console.log(`En progreso: ${byStatus.in_progress.length}\n`);

console.log('=== DETALLES ===\n');

pending.forEach((t, i) => {
  console.log(`${i+1}. [${t.status.toUpperCase()}] ${t.title}`);
  if (t.id) console.log(`   ID: ${t.id}`);
  if (t.lastError) console.log(`   Error: ${t.lastError}`);
  console.log('');
});
