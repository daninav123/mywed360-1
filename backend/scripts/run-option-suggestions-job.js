#!/usr/bin/env node

const { processOptionSuggestions } = require('../jobs/processOptionSuggestions');

(async () => {
  console.log('🚀 Ejecutando procesamiento de sugerencias de opciones...\n');
  
  try {
    const result = await processOptionSuggestions();
    
    console.log('\n✅ Job completado exitosamente');
    console.log(`📊 Resultados:`);
    console.log(`   - Procesadas: ${result.processed}`);
    console.log(`   - Aprobadas: ${result.approved}`);
    console.log(`   - Rechazadas: ${result.rejected}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error ejecutando job:', error);
    process.exit(1);
  }
})();
