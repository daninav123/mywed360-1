const fs = require('fs');
const { execSync } = require('child_process');

const roadmap = JSON.parse(fs.readFileSync('roadmap.json', 'utf8'));

// Filtrar TODAS las tareas pendientes sin intentar (E2E tests)
const pendingTests = roadmap.tasks.filter(t => 
  t.status === 'pending' && 
  (t.attempts === 0 || !t.attempts) &&
  t.command &&
  t.command.includes('cypress:run')
);

console.log(`\n=== EJECUTANDO ${pendingTests.length} TESTS PENDIENTES ===\n`);
console.log(`Esto tomará aproximadamente ${Math.ceil(pendingTests.length * 2)} minutos\n`);

let completed = 0;
let failed = 0;
let skipped = 0;

for (let i = 0; i < pendingTests.length; i++) {
  const task = pendingTests[i];
  console.log(`\n[${ i + 1}/${pendingTests.length}] ${task.title}`);
  console.log(`Progreso: ${completed} ✅ | ${failed} ❌ | ${skipped} ⏭️`);
  
  try {
    execSync(task.command, {
      stdio: 'pipe', // No mostrar output para ir más rápido
      cwd: process.cwd(),
      timeout: 90000 // 90 segundos timeout por test
    });
    
    console.log(`✅ PASSED`);
    
    // Actualizar roadmap
    task.status = 'completed';
    task.attempts = (task.attempts || 0) + 1;
    completed++;
    
  } catch (error) {
    const exitCode = error.status || 'unknown';
    console.log(`❌ FAILED (exit code: ${exitCode})`);
    
    // Actualizar roadmap
    task.status = 'failed';
    task.attempts = (task.attempts || 0) + 1;
    task.lastError = `Task process exit code ${exitCode}`;
    failed++;
  }
  
  // Guardar progreso cada 5 tests
  if ((i + 1) % 5 === 0 || i === pendingTests.length - 1) {
    fs.writeFileSync('roadmap.json', JSON.stringify(roadmap, null, 2));
    console.log(`\n💾 Progreso guardado (${completed + failed}/${pendingTests.length} tests ejecutados)`);
  }
}

console.log(`\n\n=== RESUMEN FINAL ===`);
console.log(`✅ Completados: ${completed}`);
console.log(`❌ Fallidos: ${failed}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`📊 Total: ${completed + failed + skipped}`);
console.log(`\n📈 Tasa de éxito: ${((completed / (completed + failed)) * 100).toFixed(2)}%`);

// Calcular nuevo porcentaje del roadmap
const allTasks = roadmap.tasks;
const totalCompleted = allTasks.filter(t => t.status === 'completed').length;
const totalTasks = allTasks.length;
const percent = ((totalCompleted / totalTasks) * 100).toFixed(2);

console.log(`\n🎯 Progreso total del roadmap: ${totalCompleted}/${totalTasks} (${percent}%)`);
