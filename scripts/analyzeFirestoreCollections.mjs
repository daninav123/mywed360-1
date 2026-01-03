// scripts/analyzeFirestoreCollections.mjs
// Analiza colecciones problemáticas de Firestore

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

// Colecciones problemáticas identificadas
const PROBLEMATIC_COLLECTIONS = {
  critical: [
    { name: 'health', issue: 'Innecesaria - solo health checks', action: 'ELIMINAR' },
    { name: 'mails', issue: 'Duplicada con users/{uid}/mails', action: 'CONSOLIDAR' },
  ],
  medium: [
    { name: 'supplier_events', issue: 'Naming con guión bajo', action: 'MIGRAR' },
    { name: 'projectMetrics_events', issue: 'Naming inconsistente', action: 'RENOMBRAR' },
    { name: 'projectMetrics', issue: 'Estructura muy anidada', action: 'SIMPLIFICAR' },
    { name: 'emailTrashRetention_audit', issue: 'Sin namespace', action: 'MOVER a system/' },
  ],
  low: [
    { name: 'automationQueue', issue: 'Sin namespace', action: 'MOVER a system/' },
    { name: 'partnerPayouts', issue: 'Sin agrupar', action: 'MOVER a system/' },
    { name: 'discountLinks', issue: 'Sin agrupar', action: 'MOVER a system/' },
    { name: 'payments', issue: 'Sin agrupar', action: 'MOVER a system/' },
  ]
};

// Todas las colecciones root conocidas
const ALL_ROOT_COLLECTIONS = [
  'users',
  'weddings',
  'suppliers',
  'mails',
  'health',
  'supplier_events',
  'projectMetrics',
  'projectMetrics_events',
  'emailTrashRetention_audit',
  'automationQueue',
  'automationHistory',
  'partnerPayouts',
  'discountLinks',
  'payments',
  'subscriptions',
  'invoices',
  'emailTemplates',
  'emailDrafts',
  'emailEvents',
  'searchAnalytics',
  'userFeedback',
  'admin',
];

async function analyzeCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).limit(1).get();
    const countSnapshot = await db.collection(collectionName).count().get();
    const count = countSnapshot.data().count;
    
    let sampleDoc = null;
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      sampleDoc = {
        id: doc.id,
        fields: Object.keys(doc.data()).slice(0, 5) // Solo primeros 5 campos
      };
    }
    
    return {
      name: collectionName,
      exists: !snapshot.empty || count > 0,
      count: count,
      sample: sampleDoc
    };
  } catch (error) {
    return {
      name: collectionName,
      exists: false,
      count: 0,
      error: error.message
    };
  }
}

async function analyzeAllCollections() {
  console.log('🔍 ANÁLISIS DE COLECCIONES FIRESTORE\n');
  console.log('═'.repeat(80));
  
  const results = {
    critical: [],
    medium: [],
    low: [],
    empty: [],
    all: []
  };
  
  // Analizar colecciones críticas
  console.log('\n🔴 COLECCIONES CRÍTICAS (Alta prioridad)\n');
  console.log('-'.repeat(80));
  
  for (const col of PROBLEMATIC_COLLECTIONS.critical) {
    const analysis = await analyzeCollection(col.name);
    results.critical.push({ ...col, ...analysis });
    
    console.log(`📂 ${col.name}`);
    console.log(`   Estado: ${analysis.exists ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   Documentos: ${analysis.count}`);
    console.log(`   Problema: ${col.issue}`);
    console.log(`   Acción: ${col.action}`);
    if (analysis.sample) {
      console.log(`   Campos: ${analysis.sample.fields.join(', ')}`);
    }
    console.log('');
  }
  
  // Analizar colecciones media prioridad
  console.log('\n🟡 COLECCIONES MEDIA PRIORIDAD\n');
  console.log('-'.repeat(80));
  
  for (const col of PROBLEMATIC_COLLECTIONS.medium) {
    const analysis = await analyzeCollection(col.name);
    results.medium.push({ ...col, ...analysis });
    
    console.log(`📂 ${col.name}`);
    console.log(`   Estado: ${analysis.exists ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   Documentos: ${analysis.count}`);
    console.log(`   Problema: ${col.issue}`);
    console.log(`   Acción: ${col.action}`);
    console.log('');
  }
  
  // Analizar colecciones baja prioridad
  console.log('\n🟢 COLECCIONES BAJA PRIORIDAD\n');
  console.log('-'.repeat(80));
  
  for (const col of PROBLEMATIC_COLLECTIONS.low) {
    const analysis = await analyzeCollection(col.name);
    results.low.push({ ...col, ...analysis });
    
    console.log(`📂 ${col.name}`);
    console.log(`   Estado: ${analysis.exists ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   Documentos: ${analysis.count}`);
    console.log(`   Problema: ${col.issue}`);
    console.log(`   Acción: ${col.action}`);
    console.log('');
  }
  
  // Buscar colecciones vacías (seguras de eliminar)
  console.log('\n🗑️  COLECCIONES VACÍAS (Seguras de eliminar)\n');
  console.log('-'.repeat(80));
  
  for (const colName of ALL_ROOT_COLLECTIONS) {
    const analysis = await analyzeCollection(colName);
    results.all.push(analysis);
    
    if (analysis.exists && analysis.count === 0) {
      results.empty.push(analysis);
      console.log(`📂 ${colName} - ✅ VACÍA (segura de eliminar)`);
    }
  }
  
  if (results.empty.length === 0) {
    console.log('   No hay colecciones vacías.');
  }
  
  // Resumen
  console.log('\n═'.repeat(80));
  console.log('\n📊 RESUMEN\n');
  console.log('-'.repeat(80));
  
  const criticalWithData = results.critical.filter(r => r.exists && r.count > 0);
  const mediumWithData = results.medium.filter(r => r.exists && r.count > 0);
  const lowWithData = results.low.filter(r => r.exists && r.count > 0);
  
  console.log(`🔴 Críticas con datos: ${criticalWithData.length}/${results.critical.length}`);
  criticalWithData.forEach(r => {
    console.log(`   - ${r.name}: ${r.count} docs → ${r.action}`);
  });
  
  console.log(`\n🟡 Media prioridad con datos: ${mediumWithData.length}/${results.medium.length}`);
  mediumWithData.forEach(r => {
    console.log(`   - ${r.name}: ${r.count} docs → ${r.action}`);
  });
  
  console.log(`\n🟢 Baja prioridad con datos: ${lowWithData.length}/${results.low.length}`);
  lowWithData.forEach(r => {
    console.log(`   - ${r.name}: ${r.count} docs → ${r.action}`);
  });
  
  console.log(`\n🗑️  Vacías (seguras de eliminar): ${results.empty.length}`);
  
  const totalProblematic = criticalWithData.length + mediumWithData.length + lowWithData.length;
  const totalDocs = [...criticalWithData, ...mediumWithData, ...lowWithData]
    .reduce((sum, r) => sum + r.count, 0);
  
  console.log(`\n📈 Total colecciones problemáticas: ${totalProblematic}`);
  console.log(`📈 Total documentos a migrar/limpiar: ${totalDocs}`);
  
  console.log('\n═'.repeat(80));
  console.log('\n💡 RECOMENDACIONES:\n');
  
  if (results.empty.length > 0) {
    console.log('1. ✅ Eliminar colecciones vacías inmediatamente (sin riesgo)');
  }
  
  if (criticalWithData.length > 0) {
    console.log('2. 🔴 Priorizar migración de colecciones críticas');
  }
  
  if (criticalWithData.find(r => r.name === 'health' && r.count === 0)) {
    console.log('3. ✅ Eliminar colección "health" (innecesaria)');
  }
  
  if (criticalWithData.find(r => r.name === 'mails')) {
    console.log('4. 🔴 Consolidar "mails" en users/{uid}/emails/ (alta prioridad)');
  }
  
  console.log('\n');
  
  return results;
}

// Ejecutar
analyzeAllCollections()
  .then(() => {
    console.log('✅ Análisis completado.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
