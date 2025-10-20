const fs = require('fs');

const roadmap = JSON.parse(fs.readFileSync('roadmap.json', 'utf8'));

const failedTests = roadmap.tasks.filter(t => t.status === 'failed' && t.command);

console.log('=== ANÁLISIS DE TESTS FALLIDOS ===\n');
console.log(`Total tests fallidos: ${failedTests.length}\n`);

// Agrupar por tipo de error
const errorPatterns = {};
failedTests.forEach(t => {
  const error = t.lastError || 'Unknown';
  if (!errorPatterns[error]) {
    errorPatterns[error] = [];
  }
  errorPatterns[error].push(t);
});

// Mostrar patterns
Object.keys(errorPatterns).sort((a, b) => errorPatterns[b].length - errorPatterns[a].length).forEach(error => {
  const tests = errorPatterns[error];
  console.log(`\n${error}: ${tests.length} tests`);
  
  // Mostrar primeros 5
  tests.slice(0, 5).forEach(t => {
    console.log(`  - ${t.title}`);
    console.log(`    Spec: ${t.command.match(/--spec "([^"]+)"/)?.[1] || 'N/A'}`);
  });
  
  if (tests.length > 5) {
    console.log(`  ... y ${tests.length - 5} más`);
  }
});

// Tests que bloquean por healthcheck
console.log('\n\n=== TESTS BLOQUEADOS POR HEALTHCHECK ===\n');
const blockedByHealthcheck = failedTests.filter(t => 
  t.lastError && t.lastError.includes('HealthCheck')
);
console.log(`Total: ${blockedByHealthcheck.length} tests`);
console.log('Estos tests no pueden ejecutarse hasta resolver los unit tests de Firestore rules\n');

// Tests con exit code 1 (errores generales)
console.log('\n=== TESTS CON EXIT CODE 1 (a revisar) ===\n');
const exitCode1 = failedTests.filter(t => 
  t.lastError === 'Task process exit code 1'
);
console.log(`Total: ${exitCode1.length} tests`);
console.log('Estos tests tienen problemas específicos que deben analizarse individualmente\n');

// Recomendar siguiente acción
console.log('\n=== RECOMENDACIÓN ===\n');
console.log('1. Resolver unit tests de Firestore (requieren emulador)');
console.log('   - Esto desbloqueará 10 tests E2E');
console.log('2. Analizar individualmente los 37 tests con exit code 1');
console.log('3. Revisar tests con timeouts (codes 3, 4, 5)');
console.log('4. Ejecutar los 35 tests pendientes restantes');
