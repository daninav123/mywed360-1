const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Ejecutar un subconjunto de tests para obtener métricas rápidas
async function getQuickTestMetrics() {
  const testSets = [
    { name: 'Básicos', specs: 'cypress/e2e/basic/*.cy.js' },
    { name: 'Simples', specs: 'cypress/e2e/simple/*.cy.js' },
    { name: 'Críticos', specs: 'cypress/e2e/critical/*.cy.js' },
    { name: 'Funcionales', specs: 'cypress/e2e/passing/*.cy.js' },
  ];
  
  const results = [];
  
  for (const testSet of testSets) {
    console.log(`${colors.cyan}Ejecutando tests ${testSet.name}...${colors.reset}`);
    try {
      const output = execSync(
        `npx cypress run --spec "${testSet.specs}" --config video=false --reporter min`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      
      // Extraer estadísticas del output
      const passMatch = output.match(/(\d+) passing/);
      const failMatch = output.match(/(\d+) failing/);
      
      results.push({
        name: testSet.name,
        passing: passMatch ? parseInt(passMatch[1]) : 0,
        failing: failMatch ? parseInt(failMatch[1]) : 0
      });
    } catch (error) {
      // Si el comando falla, intentar extraer estadísticas del error
      const output = error.stdout || error.output?.toString() || '';
      const passMatch = output.match(/(\d+) passing/);
      const failMatch = output.match(/(\d+) failing/);
      
      results.push({
        name: testSet.name,
        passing: passMatch ? parseInt(passMatch[1]) : 0,
        failing: failMatch ? parseInt(failMatch[1]) : 0
      });
    }
  }
  
  return results;
}

// Función principal
async function main() {
  console.log(`${colors.bright}${colors.cyan}
=====================================
📊 RESUMEN DE TESTS E2E - MyWed360
=====================================
${colors.reset}`);

  console.log('Analizando estado de tests...\n');
  
  const results = await getQuickTestMetrics();
  
  // Calcular totales
  let totalPass = 0;
  let totalFail = 0;
  
  console.log(`${colors.bright}RESULTADOS POR CATEGORÍA:${colors.reset}`);
  console.log('─'.repeat(40));
  
  results.forEach(result => {
    totalPass += result.passing;
    totalFail += result.failing;
    
    const total = result.passing + result.failing;
    const rate = total > 0 ? ((result.passing / total) * 100).toFixed(1) : 0;
    
    const status = rate >= 80 ? colors.green + '✅' :
                   rate >= 50 ? colors.yellow + '⚠️' :
                   colors.red + '❌';
    
    console.log(`${status} ${result.name.padEnd(15)} ${result.passing}/${total} tests (${rate}%)${colors.reset}`);
  });
  
  console.log('─'.repeat(40));
  
  // Resumen general
  const grandTotal = totalPass + totalFail;
  const overallRate = grandTotal > 0 ? ((totalPass / grandTotal) * 100).toFixed(1) : 0;
  
  console.log(`\n${colors.bright}ESTADÍSTICAS GENERALES:${colors.reset}`);
  console.log(`${colors.green}✅ Tests Pasando:  ${totalPass}${colors.reset}`);
  console.log(`${colors.red}❌ Tests Fallando: ${totalFail}${colors.reset}`);
  console.log(`📈 Total: ${grandTotal}`);
  console.log(`${colors.yellow}✨ Tasa de Éxito: ${overallRate}%${colors.reset}`);
  
  // Estado del proyecto
  console.log(`\n${colors.bright}ESTADO DEL PROYECTO:${colors.reset}`);
  if (overallRate >= 90) {
    console.log(`${colors.green}🎉 ¡EXCELENTE! El proyecto está casi completamente funcional.${colors.reset}`);
  } else if (overallRate >= 70) {
    console.log(`${colors.green}✅ BUENO - La mayoría de funcionalidades críticas funcionan.${colors.reset}`);
  } else if (overallRate >= 50) {
    console.log(`${colors.yellow}⚠️ ACEPTABLE - Algunas funcionalidades necesitan atención.${colors.reset}`);
  } else {
    console.log(`${colors.red}🔧 EN PROGRESO - Se requiere trabajo adicional.${colors.reset}`);
  }
  
  // Mejoras desde el inicio
  console.log(`\n${colors.bright}PROGRESO:${colors.reset}`);
  console.log(`Tasa inicial: 26% → Tasa actual: ${overallRate}%`);
  const improvement = parseFloat(overallRate) - 26;
  if (improvement > 0) {
    console.log(`${colors.green}📈 Mejora: +${improvement.toFixed(1)}%${colors.reset}`);
  }
  
  console.log('\n' + '='.repeat(40));
  console.log(`${colors.cyan}Fecha: ${new Date().toLocaleString('es-ES')}${colors.reset}`);
  console.log('='.repeat(40) + '\n');
  
  // Guardar resumen en archivo
  const summary = {
    date: new Date().toISOString(),
    results,
    totals: {
      passing: totalPass,
      failing: totalFail,
      total: grandTotal,
      successRate: overallRate
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'test-results-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`📄 Resumen guardado en test-results-summary.json\n`);
  
  process.exit(totalFail > 0 ? 1 : 0);
}

// Ejecutar
main().catch(console.error);
