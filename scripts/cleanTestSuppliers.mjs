// scripts/cleanTestSuppliers.mjs
// Limpia proveedores de prueba de Firestore

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('C:\\Users\\Administrator\\Downloads\\serviceAccount.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanTestSuppliers() {
  console.log('🧹 Limpiando proveedores de prueba de Firestore...\n');
  
  try {
    // Obtener TODOS los proveedores
    const snapshot = await db.collection('suppliers').get();
    
    console.log(`📊 Total de proveedores en BD: ${snapshot.size}\n`);
    
    if (snapshot.empty) {
      console.log('✅ No hay proveedores en la base de datos.');
      return;
    }
    
    // Listar todos los proveedores
    console.log('📋 Proveedores encontrados:\n');
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. [${doc.id}]`);
      console.log(`   Nombre: ${data.name || 'Sin nombre'}`);
      console.log(`   Registrado: ${data.registered === true ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Categoría: ${data.category || 'Sin categoría'}`);
      console.log(`   Email: ${data.contact?.email || 'Sin email'}`);
      console.log(`   Fuente: ${data.source || 'No especificado'}`);
      console.log('');
    });
    
    // Preguntar confirmación
    console.log('\n⚠️  ¿ELIMINAR TODOS LOS PROVEEDORES? (y/n)');
    console.log('   Esto NO se puede deshacer.\n');
    
    // Para ejecutar sin interacción, descomentar la siguiente línea:
    const shouldDelete = process.argv.includes('--force');
    
    if (!shouldDelete) {
      console.log('❌ Cancelado. Ejecuta con --force para eliminar:');
      console.log('   node scripts/cleanTestSuppliers.mjs --force');
      return;
    }
    
    // Eliminar todos los proveedores
    console.log('\n🗑️  Eliminando proveedores...\n');
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    console.log(`✅ ${count} proveedores eliminados correctamente.\n`);
    console.log('🧹 Base de datos limpia.\n');
    console.log('💡 Ahora las búsquedas solo mostrarán resultados de internet (Tavily).\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

// Ejecutar
cleanTestSuppliers()
  .then(() => {
    console.log('✅ Script completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
