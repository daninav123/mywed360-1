import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccount.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testAddDynamic() {
  try {
    console.log('🧪 Test de addDynamicOption con sugerencia aprobada...\n');
    
    // Buscar una sugerencia aprobada
    const snapshot = await db.collection('supplier_option_suggestions')
      .where('status', '==', 'approved')
      .where('category', '==', 'fotografia')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No hay sugerencias aprobadas de fotografía');
      process.exit(0);
    }
    
    const doc = snapshot.docs[0];
    const suggestion = { id: doc.id, ...doc.data() };
    
    console.log('📋 Usando sugerencia aprobada:');
    console.log(`  ID: ${suggestion.id}`);
    console.log(`  Label: ${suggestion.optionLabel}`);
    console.log(`  Category: ${suggestion.category}`);
    
    // Importar función
    console.log('\n📦 Importando módulos...');
    const { addDynamicOption } = await import('./jobs/addDynamicOption.js');
    const { generateKey } = await import('./services/aiOptionValidation.js');
    console.log('✅ Módulos importados');
    
    const validation = suggestion.aiValidation || {
      suggestedKey: generateKey(suggestion.optionLabel),
      suggestedLabel: suggestion.optionLabel,
      suggestedType: suggestion.type || 'boolean'
    };
    
    console.log('\n📝 Validation object:');
    console.log(JSON.stringify(validation, null, 2));
    
    console.log('\n🚀 Ejecutando addDynamicOption...\n');
    
    const result = await addDynamicOption(suggestion, validation);
    
    console.log('\n✅ Resultado:', JSON.stringify(result, null, 2));
    
    // Verificar en Firestore
    console.log('\n🔍 Verificando en Firestore...');
    const fotDoc = await db.collection('supplier_dynamic_specs').doc('fotografia').get();
    
    if (fotDoc.exists) {
      console.log('✅ Documento encontrado:');
      console.log(JSON.stringify(fotDoc.data(), null, 2));
    } else {
      console.log('❌ Documento NO existe en Firestore');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAddDynamic();
