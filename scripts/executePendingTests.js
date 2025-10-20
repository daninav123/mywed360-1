const fs = require('fs');
const { execSync } = require('child_process');

const roadmap = JSON.parse(fs.readFileSync('roadmap.json', 'utf8'));

// Filtrar tareas pendientes sin intentar (E2E tests)
const pendingTests = roadmap.tasks.filter(t => 
  t.status === 'pending' && 
  (t.attempts === 0 || !t.attempts) &&
  t.command &&
  t.command.includes('cypress:run')
).slice(0, 10); // Comenzar con los primeros 10

console.log(`\n=== EJECUTANDO ${pendingTests.length} TESTS PENDIENTES ===\n`);

let completed = 0;
let failed = 0;

for (const task of pendingTests) {
  console.log(`\n[${completed + failed + 1}/${pendingTests.length}] ${task.title}`);
  console.log(`Comando: ${task.command}`);
  
  try {
    execSync(task.command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      timeout: 120000 // 2 minutos timeout
    });
    
    console.log(`✅ PASSED: ${task.title}`);
    
    // Actualizar roadmap
    task.status = 'completed';
    task.attempts = (task.attempts || 0) + 1;
    completed++;
    
  } catch (error) {
    console.log(`❌ FAILED: ${task.title}`);
    console.log(`Error code: ${error.status || 'unknown'}`);
    
    // Actualizar roadmap
    task.status = 'failed';
    task.attempts = (task.attempts || 0) + 1;
    task.lastError = `Task process exit code ${error.status || 'unknown'}`;
    failed++;
  }
  
  // Guardar progreso después de cada test
  fs.writeFileSync('roadmap.json', JSON.stringify(roadmap, null, 2));
}

console.log(`\n\n=== RESUMEN ===`);
console.log(`Completados: ${completed}`);
console.log(`Fallidos: ${failed}`);
console.log(`Total: ${completed + failed}`);
