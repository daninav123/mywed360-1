/**
 * Script para listar todas las bodas y sus IDs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, '../backend/serviceAccount.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Error leyendo serviceAccount.json:', error.message);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function listWeddings() {
  try {
    const weddings = await db.collection('weddings').limit(10).get();
    
    console.log('\n📋 BODAS ENCONTRADAS:');
    console.log('====================\n');
    
    if (weddings.empty) {
      console.log('⚠️  No se encontraron bodas');
      return;
    }
    
    weddings.forEach((doc, idx) => {
      const data = doc.data();
      const coupleName = data.weddingInfo?.coupleName || 'Sin nombre';
      const hasSupplierReq = !!data.supplierRequirements;
      
      console.log(`${idx + 1}. ID: ${doc.id}`);
      console.log(`   Pareja: ${coupleName}`);
      console.log(`   SupplierRequirements: ${hasSupplierReq ? '✅ Sí' : '❌ No'}`);
      
      if (hasSupplierReq && data.supplierRequirements.fotografia?.customOptions) {
        const opts = data.supplierRequirements.fotografia.customOptions;
        console.log(`   CustomOptions (fotografia): ${opts.length} opciones`);
        opts.forEach(opt => console.log(`      - "${opt}"`));
      }
      
      console.log('');
    });
    
    console.log(`\n✅ Total: ${weddings.size} bodas\n`);
    
    // Retornar el primer ID para usarlo
    if (!weddings.empty) {
      return weddings.docs[0].id;
    }
    
  } catch (error) {
    console.error('❌ Error listando bodas:', error);
  }
}

listWeddings().then(firstWeddingId => {
  if (firstWeddingId) {
    console.log(`💡 Para diagnosticar la primera boda, ejecuta:`);
    console.log(`   node scripts/debug-custom-options.js ${firstWeddingId}\n`);
  }
  process.exit(0);
});
