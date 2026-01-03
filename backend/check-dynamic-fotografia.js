import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccount.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkDynamic() {
  try {
    console.log('🔍 Verificando opciones dinámicas de fotografía...\n');
    
    const doc = await db.collection('supplier_dynamic_specs').doc('fotografia').get();
    
    if (!doc.exists) {
      console.log('❌ No existe documento de opciones dinámicas para fotografía');
    } else {
      console.log('✅ Documento encontrado:');
      console.log(JSON.stringify(doc.data(), null, 2));
    }
    
    console.log('\n🔍 Verificando sugerencias aprobadas recientes...\n');
    
    const snapshot = await db.collection('supplier_option_suggestions')
      .where('status', '==', 'approved')
      .where('category', '==', 'fotografia')
      .get();
    
    console.log(`📊 Total sugerencias aprobadas de fotografía: ${snapshot.size}`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n- ID: ${doc.id}`);
      console.log(`  Label: ${data.optionLabel}`);
      console.log(`  Aprobada: ${data.metadata?.approvedAt?.toDate()}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDynamic();
