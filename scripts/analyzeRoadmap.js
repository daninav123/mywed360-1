const fs = require('fs');

const roadmap = JSON.parse(fs.readFileSync('roadmap.json', 'utf8'));

const stats = {
  total: roadmap.tasks.length,
  completed: roadmap.tasks.filter(t => t.status === 'completed').length,
  failed: roadmap.tasks.filter(t => t.status === 'failed').length,
  pending: roadmap.tasks.filter(t => t.status === 'pending').length,
  in_progress: roadmap.tasks.filter(t => t.status === 'in_progress').length
};

const percent = ((stats.completed / stats.total) * 100).toFixed(2);

console.log('=== ESTADO ACTUAL DEL ROADMAP ===\n');
console.log(`TOTAL TAREAS: ${stats.total}`);
console.log(`COMPLETADAS: ${stats.completed} (${percent}%)`);
console.log(`FALLIDAS: ${stats.failed}`);
console.log(`PENDIENTES: ${stats.pending}`);
console.log(`EN PROGRESO: ${stats.in_progress}`);
console.log('\n=== BLOQUEADORES CRÍTICOS ===\n');

// Bloqueadores críticos (tests unitarios)
const unitTestsFailed = roadmap.tasks.filter(t => 
  t.id.includes('unit_rules') && t.status === 'failed'
);

console.log('Tests Unitarios Fallidos (bloquean tests E2E):');
unitTestsFailed.forEach(t => {
  console.log(`  - ${t.title}`);
  console.log(`    Error: ${t.lastError}`);
  console.log(`    Intentos: ${t.attempts}`);
});

console.log('\n=== TAREAS PENDIENTES SIN INTENTAR (attempts=0) ===\n');
const neverAttempted = roadmap.tasks.filter(t => 
  t.status === 'pending' && (t.attempts === 0 || !t.attempts)
);
console.log(`Total: ${neverAttempted.length} tareas`);

console.log('\n=== TAREAS FALLIDAS ===\n');
const failed = roadmap.tasks.filter(t => t.status === 'failed');
console.log(`Total: ${failed.length} tareas`);

// Agrupar errores comunes
const errorGroups = {};
failed.forEach(t => {
  const error = t.lastError || 'Unknown';
  if (!errorGroups[error]) errorGroups[error] = [];
  errorGroups[error].push(t.title);
});

console.log('\nErrores agrupados:');
Object.keys(errorGroups).forEach(error => {
  console.log(`\n  ${error}: ${errorGroups[error].length} tareas`);
});

console.log('\n=== PROGRESO PARA 100% ===\n');
const remaining = stats.total - stats.completed;
console.log(`Tareas restantes: ${remaining}`);
console.log(`  - Pendientes sin intentar: ${neverAttempted.length}`);
console.log(`  - Fallidas a corregir: ${stats.failed}`);
console.log(`  - En progreso: ${stats.in_progress}`);
