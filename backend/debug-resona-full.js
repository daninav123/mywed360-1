// Script para ver la estructura COMPLETA del proveedor ReSona
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const possiblePaths = [
  'C:\\Users\\Administrator\\Downloads\\serviceAccount.json',
  'C:\\Users\\Administrator\\Documents\\Lovenda\\lovenda13123123 - copia\\serviceAccount.json',
];

let serviceAccount;
for (const path of possiblePaths) {
  try {
    serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
    console.log(`✅ Usando: ${path}`);
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

async function debugResona() {
  console.log('\n🔍 DEBUG COMPLETO: Proveedor ReSona\n');

  try {
    const doc = await db.collection('suppliers').doc('z0BAVOrrub8xQvUtHIOw').get();

    if (!doc.exists) {
      console.log('❌ ReSona NO EXISTE en Firestore');
      process.exit(1);
    }

    const data = doc.data();

    console.log('📄 DOCUMENTO COMPLETO:\n');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n\n🔎 CAMPOS RELEVANTES PARA UBICACIÓN:\n');
    console.log('location:', data.location);
    console.log('city:', data.city);
    console.log('province:', data.province);
    console.log('country:', data.country);
    console.log('serviceArea:', data.serviceArea);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugResona();
