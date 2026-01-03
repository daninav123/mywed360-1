/**
 * Script para verificar si los índices de Firestore están listos
 */

import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../backend/serviceAccountKey.json');
const serviceAccount = JSON.parse(await import('fs').then(fs => fs.promises.readFile(serviceAccountPath, 'utf8')));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function checkIndexes() {
  console.log('\n🔍 Verificando índices de Firestore...\n');
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const timestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);
  
  // Test 1: Query con status + updatedAt
  console.log('📋 Test 1: payments → status + updatedAt');
  try {
    const snap1 = await db.collection('payments')
      .where('status', '==', 'paid')
      .where('updatedAt', '>=', timestamp)
      .limit(5)
      .get();
    
    console.log(`  ✅ ÉXITO - ${snap1.size} documentos encontrados`);
    console.log('  ✓ Índice status + updatedAt: OPERATIVO\n');
  } catch (error) {
    if (error.code === 9) {
      console.log('  ⏳ CONSTRUYÉNDOSE - Los índices aún no están listos');
      console.log('  ℹ️  Tiempo estimado: 2-5 minutos desde el deploy\n');
      return false;
    }
    console.log(`  ❌ ERROR: ${error.message}\n`);
    return false;
  }
  
  // Test 2: Query con status + createdAt
  console.log('📋 Test 2: payments → status + createdAt');
  try {
    const snap2 = await db.collection('payments')
      .where('status', '==', 'succeeded')
      .where('createdAt', '>=', timestamp)
      .limit(5)
      .get();
    
    console.log(`  ✅ ÉXITO - ${snap2.size} documentos encontrados`);
    console.log('  ✓ Índice status + createdAt: OPERATIVO\n');
  } catch (error) {
    if (error.code === 9) {
      console.log('  ⏳ CONSTRUYÉNDOSE - Los índices aún no están listos\n');
      return false;
    }
    console.log(`  ❌ ERROR: ${error.message}\n`);
    return false;
  }
  
  // Calcular facturación
  console.log('💰 Calculando facturación de prueba...');
  try {
    const paymentsSnap = await db.collection('payments')
      .where('status', '==', 'paid')
      .where('updatedAt', '>=', timestamp)
      .get();
    
    let total = 0;
    paymentsSnap.forEach(doc => {
      const data = doc.data();
      total += Number(data.amount || 0);
    });
    
    console.log(`  📊 Pagos encontrados: ${paymentsSnap.size}`);
    console.log(`  💵 Facturación (30 días): ${total.toLocaleString('es-ES')} EUR/USD\n`);
  } catch (error) {
    console.log(`  ⚠️  No se pudo calcular facturación: ${error.message}\n`);
  }
  
  console.log('✅ TODOS LOS ÍNDICES OPERATIVOS\n');
  console.log('🎯 PRÓXIMOS PASOS:');
  console.log('  1. Recarga el dashboard de admin: http://localhost:5173/admin/dashboard');
  console.log('  2. Verifica la tarjeta "Facturación (30 días)"');
  console.log('  3. Los logs del backend ya no mostrarán errores FAILED_PRECONDITION\n');
  
  return true;
}

// Ejecutar con reintento
async function runWithRetry() {
  const maxRetries = 6; // 6 intentos = 3 minutos (cada 30s)
  
  for (let i = 1; i <= maxRetries; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Intento ${i}/${maxRetries}`);
    console.log('='.repeat(60));
    
    const success = await checkIndexes();
    
    if (success) {
      console.log('✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');
      process.exit(0);
    }
    
    if (i < maxRetries) {
      console.log(`⏳ Esperando 30 segundos antes del siguiente intento...\n`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⚠️  Los índices siguen construyéndose después de 3 minutos');
  console.log('💡 Esto es normal para índices grandes o si Firebase tiene alta carga');
  console.log('🔄 Puedes ejecutar este script nuevamente en unos minutos:\n');
  console.log('   node scripts/checkIndexes.js\n');
  process.exit(1);
}

runWithRetry().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
