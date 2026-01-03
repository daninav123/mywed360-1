/**
 * Script para verificar datos completos de finanzas en Firebase
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

async function checkFinanceData() {
  console.log('\n🔍 Verificando datos de finanzas en Firebase...\n');
  
  try {
    const weddingsSnapshot = await db.collection('weddings').get();
    console.log(`📋 Total bodas: ${weddingsSnapshot.size}\n`);

    for (const weddingDoc of weddingsSnapshot.docs) {
      const weddingId = weddingDoc.id;
      const weddingData = weddingDoc.data();
      
      // 1. Verificar transacciones en subcolección
      const transactionsSnapshot = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('transactions')
        .get();

      // 2. Verificar documento finance/main
      const financeDoc = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('finance')
        .doc('main')
        .get();

      const hasTransactions = transactionsSnapshot.size > 0;
      const hasFinanceDoc = financeDoc.exists;

      if (hasTransactions || hasFinanceDoc) {
        console.log(`\n📍 Boda: ${weddingData.coupleName || weddingId}`);
        console.log(`   ID: ${weddingId}`);
        
        if (hasTransactions) {
          console.log(`   💰 Transacciones (subcolección): ${transactionsSnapshot.size}`);
          transactionsSnapshot.docs.slice(0, 2).forEach(doc => {
            const tx = doc.data();
            console.log(`      - ${tx.concept || tx.description}: $${tx.amount}`);
          });
        }
        
        if (hasFinanceDoc) {
          const financeData = financeDoc.data();
          console.log(`   📊 Finance/main documento:`);
          
          if (financeData.budget) {
            console.log(`      - Presupuesto total: $${financeData.budget.total || 0}`);
            console.log(`      - Categorías: ${financeData.budget.categories?.length || 0}`);
          }
          
          if (financeData.contributions) {
            console.log(`      - Contribuciones configuradas: Sí`);
            console.log(`      - Invitados: ${financeData.contributions.guestCount || 0}`);
          }
          
          // Verificar si hay transacciones embebidas
          if (financeData.transactions && Array.isArray(financeData.transactions)) {
            console.log(`      - Transacciones embebidas: ${financeData.transactions.length}`);
          }
        }
      }
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFinanceData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
