/**
 * Script para verificar transacciones en Firebase
 */
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkTransactions() {
  console.log('\n🔍 Verificando transacciones en Firebase...\n');
  
  try {
    const weddingsSnapshot = await db.collection('weddings').get();
    console.log(`📋 Total bodas: ${weddingsSnapshot.size}\n`);

    let totalFound = 0;

    for (const weddingDoc of weddingsSnapshot.docs) {
      const weddingId = weddingDoc.id;
      const weddingData = weddingDoc.data();
      
      // Verificar transacciones en subcolección
      const transactionsSnapshot = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('transactions')
        .get();

      if (transactionsSnapshot.size > 0) {
        console.log(`\n📍 Boda: ${weddingData.coupleName || weddingId}`);
        console.log(`   💰 Transacciones: ${transactionsSnapshot.size}`);
        
        transactionsSnapshot.docs.slice(0, 3).forEach(doc => {
          const tx = doc.data();
          console.log(`   - ${tx.concept || tx.description}: $${tx.amount} (${tx.type || 'expense'})`);
        });
        
        totalFound += transactionsSnapshot.size;
      }
    }

    console.log(`\n✅ Total transacciones encontradas: ${totalFound}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTransactions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
