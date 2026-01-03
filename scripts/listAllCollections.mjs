// scripts/listAllCollections.mjs
// Lista todas las colecciones root en Firestore

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('C:\\Users\\Administrator\\Downloads\\serviceAccount.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listAllCollections() {
  console.log('📊 LISTANDO TODAS LAS COLECCIONES EN FIRESTORE\n');
  console.log('═'.repeat(80));
  
  try {
    const collections = await db.listCollections();
    
    console.log(`\n✅ Encontradas ${collections.length} colecciones root:\n`);
    
    const results = [];
    
    for (const collection of collections) {
      const snapshot = await collection.limit(1).get();
      const countSnapshot = await collection.count().get();
      const count = countSnapshot.data().count;
      
      let sampleDoc = null;
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        sampleDoc = {
          id: doc.id,
          fields: Object.keys(doc.data()).slice(0, 8)
        };
      }
      
      results.push({
        name: collection.id,
        count: count,
        exists: count > 0,
        sample: sampleDoc
      });
    }
    
    // Ordenar por nombre
    results.sort((a, b) => a.name.localeCompare(b.name));
    
    // Mostrar resultados
    results.forEach(result => {
      console.log(`📂 ${result.name}`);
      console.log(`   Documentos: ${result.count}`);
      if (result.sample) {
        console.log(`   Campos ejemplo: ${result.sample.fields.join(', ')}`);
      }
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log(`\n📊 Total: ${results.length} colecciones\n`);
    
    // Agrupar por categoría
    const categories = {
      users: results.filter(r => r.name.includes('user') || r.name === 'users'),
      weddings: results.filter(r => r.name.includes('wedding')),
      suppliers: results.filter(r => r.name.includes('supplier') || r.name.includes('provider')),
      admin: results.filter(r => r.name.includes('admin')),
      system: results.filter(r => r.name.startsWith('_system')),
      payments: results.filter(r => r.name.includes('payment') || r.name.includes('subscription') || r.name.includes('invoice')),
      email: results.filter(r => r.name.includes('email') || r.name.includes('mail')),
      analytics: results.filter(r => r.name.includes('analytics') || r.name.includes('metric')),
      other: []
    };
    
    // Resto va a "other"
    const categorized = new Set();
    Object.values(categories).forEach(cat => cat.forEach(r => categorized.add(r.name)));
    categories.other = results.filter(r => !categorized.has(r.name));
    
    console.log('📋 AGRUPADAS POR CATEGORÍA:\n');
    
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        items.forEach(item => {
          console.log(`  - ${item.name} (${item.count} docs)`);
        });
      }
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

listAllCollections()
  .then(() => {
    console.log('✅ Completado.\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal:', error);
    process.exit(1);
  });
