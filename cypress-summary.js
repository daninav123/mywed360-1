const fs = require('fs');

// Leer el archivo de resultados cuando termine
const resultsFile = './cypress-results.json';

function summarizeResults() {
  try {
    if (!fs.existsSync(resultsFile)) {
      console.log('Esperando resultados...');
      return;
    }
    
    const content = fs.readFileSync(resultsFile, 'utf8');
    
    // Buscar estadísticas en el contenido
    const passMatch = content.match(/(\d+)\s+passing/g);
    const failMatch = content.match(/(\d+)\s+failing/g);
    const pendingMatch = content.match(/(\d+)\s+pending/g);
    
    let totalPass = 0;
    let totalFail = 0;
    let totalPending = 0;
    
    if (passMatch) {
      passMatch.forEach(match => {
        const num = parseInt(match.match(/\d+/)[0]);
        totalPass += num;
      });
    }
    
    if (failMatch) {
      failMatch.forEach(match => {
        const num = parseInt(match.match(/\d+/)[0]);
        totalFail += num;
      });
    }
    
    if (pendingMatch) {
      pendingMatch.forEach(match => {
        const num = parseInt(match.match(/\d+/)[0]);
        totalPending += num;
      });
    }
    
    const total = totalPass + totalFail + totalPending;
    const passRate = total > 0 ? ((totalPass / total) * 100).toFixed(2) : 0;
    
    console.log('\n========================================');
    console.log('📊 RESUMEN DE TESTS E2E - MyWed360');
    console.log('========================================');
    console.log(`✅ Tests Pasando:  ${totalPass}`);
    console.log(`❌ Tests Fallando: ${totalFail}`);
    console.log(`⏸️  Tests Pendientes: ${totalPending}`);
    console.log(`📈 Total: ${total}`);
    console.log(`✨ Tasa de Éxito: ${passRate}%`);
    console.log('========================================');
    
    if (passRate >= 80) {
      console.log('🎉 ¡Excelente! La mayoría de los tests están pasando.');
    } else if (passRate >= 50) {
      console.log('⚠️ Algunos tests necesitan atención.');
    } else {
      console.log('🔧 Se requiere trabajo adicional en los tests.');
    }
    
  } catch (err) {
    console.error('Error al leer resultados:', err.message);
  }
}

// Ejecutar el resumen
summarizeResults();

// Si no hay resultados aún, revisar cada 5 segundos
if (!fs.existsSync(resultsFile)) {
  const interval = setInterval(() => {
    if (fs.existsSync(resultsFile)) {
      summarizeResults();
      clearInterval(interval);
    }
  }, 5000);
}
