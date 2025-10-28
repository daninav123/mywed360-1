// scripts/migrations/02-migrate-supplier-events.mjs
// Migra supplier_events/ → suppliers/{id}/analytics/events/

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('C:\\Users\\Administrator\\Downloads\\serviceAccount.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const DRY_RUN = !process.argv.includes('--force');

async function migrateSupplierEvents() {
  console.log('📊 MIGRACIÓN: supplier_events/ → suppliers/{id}/analytics/events/\n');
  console.log('═'.repeat(80));
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (simulación)\n');
  } else {
    console.log('🔥 MODO REAL\n');
  }
  
  try {
    // 1. Obtener todos los eventos
    const eventsSnapshot = await db.collection('supplier_events').get();
    
    console.log(`✅ Encontrados ${eventsSnapshot.size} eventos\n`);
    
    if (eventsSnapshot.empty) {
      console.log('ℹ️  No hay eventos para migrar.');
      return;
    }
    
    // 2. Agrupar por proveedor
    const eventsBySupplier = new Map();
    const orphanEvents = [];
    
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      const supplierId = data.supplierId || data.providerId;
      
      if (!supplierId) {
        orphanEvents.push({ id: doc.id, data });
        return;
      }
      
      if (!eventsBySupplier.has(supplierId)) {
        eventsBySupplier.set(supplierId, []);
      }
      
      eventsBySupplier.get(supplierId).push({
        id: doc.id,
        data: {
          ...data,
          migratedFrom: 'supplier_events',
          migratedAt: FieldValue.serverTimestamp()
        }
      });
    });
    
    console.log('📊 Agrupación:\n');
    console.log(`   Proveedores: ${eventsBySupplier.size}`);
    console.log(`   Huérfanos: ${orphanEvents.length}\n`);
    
    if (orphanEvents.length > 0) {
      console.log('⚠️  EVENTOS HUÉRFANOS:\n');
      orphanEvents.forEach(event => {
        console.log(`   - ${event.id}: ${JSON.stringify(event.data).substring(0, 100)}...`);
      });
      console.log('');
    }
    
    // 3. Migrar
    if (!DRY_RUN) {
      console.log('🔄 Migrando eventos...\n');
      
      let totalMigrated = 0;
      
      for (const [supplierId, events] of eventsBySupplier.entries()) {
        console.log(`📊 Proveedor ${supplierId}: ${events.length} eventos`);
        
        const batch = db.batch();
        
        for (const event of events) {
          const newRef = db.collection('suppliers')
            .doc(supplierId)
            .collection('analytics')
            .doc('events')
            .collection('log')
            .doc(event.id);
          
          batch.set(newRef, event.data);
        }
        
        await batch.commit();
        totalMigrated += events.length;
        console.log(`   ✅ Migrados`);
      }
      
      console.log('\n✅ MIGRACIÓN COMPLETADA');
      console.log(`   Total: ${totalMigrated} eventos\n`);
      console.log('⚠️  PRÓXIMO PASO:');
      console.log('   node scripts/migrations/cleanup-supplier-events.mjs --force\n');
      
    } else {
      console.log('🔍 SIMULACIÓN:\n');
      
      for (const [supplierId, events] of eventsBySupplier.entries()) {
        console.log(`   ${supplierId}: ${events.length} eventos`);
        console.log(`   → suppliers/${supplierId}/analytics/events/log/`);
      }
      
      console.log('\n💡 Para ejecutar:');
      console.log('   node scripts/migrations/02-migrate-supplier-events.mjs --force\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

migrateSupplierEvents()
  .then(() => {
    console.log('✅ Completado.\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal:', error);
    process.exit(1);
  });
