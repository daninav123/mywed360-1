import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccount.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testApprove() {
  try {
    console.log('🧪 Test simulado de aprobación...\n');
    
    // Buscar una sugerencia pendiente de fotografía
    const snapshot = await db.collection('supplier_option_suggestions')
      .where('status', '==', 'pending')
      .where('category', '==', 'fotografia')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No hay sugerencias pendientes de fotografía');
      process.exit(0);
    }
    
    const doc = snapshot.docs[0];
    const suggestion = { id: doc.id, ...doc.data() };
    
    console.log('📋 Sugerencia encontrada:');
    console.log(`  ID: ${suggestion.id}`);
    console.log(`  Label: ${suggestion.optionLabel}`);
    console.log(`  Category: ${suggestion.category}`);
    
    // Importar función
    const { addDynamicOption } = await import('./jobs/addDynamicOption.js');
    const { generateKey } = await import('./services/aiOptionValidation.js');
    
    const validation = suggestion.aiValidation || {
      suggestedKey: generateKey(suggestion.optionLabel),
      suggestedLabel: suggestion.optionLabel,
      suggestedType: suggestion.type || 'boolean'
    };
    
    console.log('\n🚀 Ejecutando addDynamicOption...\n');
    
    const result = await addDynamicOption(suggestion, validation);
    
    console.log('\n✅ Resultado:', result);
    
    // Verificar en Firestore
    console.log('\n🔍 Verificando en Firestore...');
    const fotDoc = await db.collection('supplier_dynamic_specs').doc('fotografia').get();
    
    if (fotDoc.exists) {
      console.log('✅ Documento creado:');
      console.log(JSON.stringify(fotDoc.data(), null, 2));
    } else {
      console.log('❌ Documento NO creado');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testApprove();
