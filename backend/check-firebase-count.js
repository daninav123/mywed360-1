/**
 * Verifica cuántos registros hay en Firebase
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

console.log('\n📊 CONTEO DE DATOS EN FIREBASE\n');

try {
  const usersSnap = await db.collection('users').get();
  console.log(`Users: ${usersSnap.size} documentos`);
  
  const weddingsSnap = await db.collection('weddings').get();
  console.log(`Weddings: ${weddingsSnap.size} documentos`);
  
  const suppliersSnap = await db.collection('suppliers').get();
  console.log(`Suppliers: ${suppliersSnap.size} documentos`);
  
  // Contar invitados en todas las bodas
  let totalGuests = 0;
  for (const wedding of weddingsSnap.docs) {
    const guestsSnap = await db.collection('weddings').doc(wedding.id).collection('guests').get();
    totalGuests += guestsSnap.size;
  }
  console.log(`Guests (total): ${totalGuests} documentos`);
  
  console.log('\n' + '='.repeat(40));
  const total = usersSnap.size + weddingsSnap.size + suppliersSnap.size + totalGuests;
  console.log(`\n✅ TOTAL: ${total} documentos en Firebase`);
  
  if (total > 0) {
    console.log('\n💡 Hay datos reales para migrar a PostgreSQL\n');
  } else {
    console.log('\n⚠️  Firebase está vacío, no hay datos para migrar\n');
  }
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
}
