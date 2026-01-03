// Script para corregir el status del proveedor
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const possiblePaths = [
  'C:\\Users\\Administrator\\Downloads\\serviceAccount.json',
  join(__dirname, '..', 'serviceAccount.json'),
  join(__dirname, 'serviceAccount.json'),
];

let serviceAccount;
let serviceAccountPath;

for (const path of possiblePaths) {
  try {
    serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
    serviceAccountPath = path;
    break;
  } catch (error) {
    continue;
  }
}

if (!serviceAccount) {
  console.error('❌ No se encontró serviceAccount.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const SUPPLIER_ID = 'z0BAVOrrub8xQvUtHIOw';

async function fixSupplierStatus() {
  console.log(`\n🔧 CORRIGIENDO STATUS DEL PROVEEDOR: ${SUPPLIER_ID}\n`);
  console.log('='.repeat(60));

  try {
    // Verificar estado actual
    const supplierRef = db.collection('suppliers').doc(SUPPLIER_ID);
    const supplierDoc = await supplierRef.get();

    if (!supplierDoc.exists) {
      console.log('❌ El proveedor no existe');
      process.exit(1);
    }

    const currentData = supplierDoc.data();
    console.log('📋 Estado actual:');
    console.log(`   Nombre: ${currentData.name}`);
    console.log(`   Status: ${currentData.status || '❌ NO TIENE'}`);
    console.log('');

    // Actualizar status
    console.log('⚙️  Actualizando status a "active"...');
    await supplierRef.update({
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Status actualizado correctamente');
    console.log('');

    // Verificar cambio
    const updatedDoc = await supplierRef.get();
    const updatedData = updatedDoc.data();

    console.log('📋 Estado actualizado:');
    console.log(`   Nombre: ${updatedData.name}`);
    console.log(`   Status: ${updatedData.status} ✅`);
    console.log('');

    console.log('='.repeat(60));
    console.log('');
    console.log('🎉 ¡CORRECCIÓN COMPLETADA!');
    console.log('');
    console.log('💡 PRÓXIMOS PASOS:');
    console.log('   1. Recarga el frontend en el navegador');
    console.log('   2. Busca "música" en "Valencia"');
    console.log('   3. Deberías ver aparecer "ReSona" en los resultados');
    console.log('');
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error(error.stack);
  }

  process.exit(0);
}

fixSupplierStatus();
