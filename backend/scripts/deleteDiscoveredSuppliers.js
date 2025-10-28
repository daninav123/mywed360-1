// scripts/deleteDiscoveredSuppliers.js
// ⚠️ SCRIPT DE LIMPIEZA: Eliminar proveedores con status "discovered"
// Motivo: Implicaciones legales - no debemos almacenar datos scraped de internet

import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const serviceAccountPath = join(__dirname, '..', 'lovenda-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteDiscoveredSuppliers() {
  console.log('🗑️  INICIANDO ELIMINACIÓN DE PROVEEDORES "DISCOVERED"...\n');

  try {
    // 1. Buscar todos los proveedores con status "discovered"
    const snapshot = await db.collection('suppliers').where('status', '==', 'discovered').get();

    console.log(`📊 Encontrados ${snapshot.size} proveedores con status "discovered"\n`);

    if (snapshot.size === 0) {
      console.log('✅ No hay proveedores "discovered" para eliminar');
      process.exit(0);
    }

    // 2. Eliminar en lotes de 500 (límite de Firestore batch)
    const batchSize = 500;
    let deletedCount = 0;
    let batch = db.batch();
    let operationsInBatch = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      console.log(`   🗑️  Eliminando: ${doc.id}`);
      console.log(`      Nombre: ${data.name || 'Sin nombre'}`);
      console.log(`      Fuente: ${data.source || 'Desconocida'}`);
      console.log(`      URL: ${data.contact?.website || 'Sin URL'}`);
      console.log('');

      batch.delete(doc.ref);
      operationsInBatch++;
      deletedCount++;

      // Commit batch cada 500 operaciones
      if (operationsInBatch >= batchSize) {
        await batch.commit();
        console.log(
          `   ✅ Lote de ${operationsInBatch} eliminado (Total: ${deletedCount}/${snapshot.size})\n`
        );
        batch = db.batch();
        operationsInBatch = 0;
      }
    }

    // Commit operaciones restantes
    if (operationsInBatch > 0) {
      await batch.commit();
      console.log(`   ✅ Último lote de ${operationsInBatch} eliminado\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ COMPLETADO: ${deletedCount} proveedores "discovered" eliminados`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3. Verificar que no quedan proveedores discovered
    const verifySnapshot = await db
      .collection('suppliers')
      .where('status', '==', 'discovered')
      .limit(1)
      .get();

    if (verifySnapshot.size === 0) {
      console.log('✅ VERIFICADO: No quedan proveedores "discovered" en la base de datos');
    } else {
      console.warn(
        '⚠️  ADVERTENCIA: Aún quedan proveedores "discovered". Ejecuta el script de nuevo.'
      );
    }
  } catch (error) {
    console.error('❌ ERROR durante la eliminación:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Ejecutar script
deleteDiscoveredSuppliers();
