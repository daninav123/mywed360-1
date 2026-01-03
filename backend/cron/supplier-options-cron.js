const cron = require('node-cron');
const { processOptionSuggestions, cleanupRejectedSuggestions } = require('../jobs/processOptionSuggestions');

function setupSupplierOptionsCron() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ [CRON] Ejecutando procesamiento de sugerencias...');
    try {
      await processOptionSuggestions();
    } catch (error) {
      console.error('❌ [CRON] Error en procesamiento de sugerencias:', error);
    }
  });

  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ [CRON] Ejecutando limpieza de sugerencias rechazadas...');
    try {
      await cleanupRejectedSuggestions();
    } catch (error) {
      console.error('❌ [CRON] Error en limpieza:', error);
    }
  });

  console.log('✅ Cron jobs de supplier options configurados:');
  console.log('   - Procesamiento: Cada 15 minutos');
  console.log('   - Limpieza: Diario a las 3:00 AM');
}

module.exports = { setupSupplierOptionsCron };
