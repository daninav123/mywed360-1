/**
 * Verifica cuántos datos hay en Firebase para migrar
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccount) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS no configurado');
    process.exit(1);
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkFirebaseData() {
  console.log('\n🔍 VERIFICANDO DATOS EN FIREBASE\n');
  console.log('================================\n');
  
  try {
    // Verificar usuarios
    const usersSnapshot = await db.collection('users').limit(1).get();
    const usersCount = usersSnapshot.size > 0 ? '✅ SÍ' : '❌ NO';
    console.log(`Users: ${usersCount} (${usersSnapshot.size} encontrados)`);
    
    // Verificar bodas
    const weddingsSnapshot = await db.collection('weddings').limit(1).get();
    const weddingsCount = weddingsSnapshot.size > 0 ? '✅ SÍ' : '❌ NO';
    console.log(`Weddings: ${weddingsCount} (${weddingsSnapshot.size} encontrados)`);
    
    // Verificar proveedores
    const suppliersSnapshot = await db.collection('suppliers').limit(1).get();
    const suppliersCount = suppliersSnapshot.size > 0 ? '✅ SÍ' : '❌ NO';
    console.log(`Suppliers: ${suppliersCount} (${suppliersSnapshot.size} encontrados)`);
    
    const hasData = usersSnapshot.size > 0 || weddingsSnapshot.size > 0 || suppliersSnapshot.size > 0;
    
    console.log('\n' + '='.repeat(40));
    
    if (hasData) {
      console.log('\n✅ HAY DATOS EN FIREBASE');
      console.log('\n💡 Para migrar a PostgreSQL:');
      console.log('   node scripts/migrate-firebase-to-postgres.js --dry-run');
      console.log('   node scripts/migrate-firebase-to-postgres.js\n');
    } else {
      console.log('\n❌ NO HAY DATOS EN FIREBASE');
      console.log('\n💡 Puedes crear datos de prueba en PostgreSQL:');
      console.log('   node scripts/seed-test-data.js\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkFirebaseData();
