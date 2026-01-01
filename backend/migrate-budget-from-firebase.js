/**
 * Migrar presupuesto y finanzas de Firebase finance/main a PostgreSQL
 */
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
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
const prisma = new PrismaClient();

async function migrateBudgetData() {
  console.log('\n💰 Migrando presupuesto y finanzas de Firebase a PostgreSQL...\n');

  try {
    const weddingsSnapshot = await db.collection('weddings').get();
    console.log(`📋 Bodas encontradas: ${weddingsSnapshot.size}\n`);

    let migratedCount = 0;

    for (const weddingDoc of weddingsSnapshot.docs) {
      const weddingId = weddingDoc.id;
      const weddingData = weddingDoc.data();

      // Verificar si existe en PostgreSQL
      const wedding = await prisma.wedding.findUnique({
        where: { id: weddingId },
      });

      if (!wedding) {
        console.log(`⏭️  Boda ${weddingId} no existe en PostgreSQL, saltando...`);
        continue;
      }

      // Obtener datos de finance/main
      const financeDoc = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('finance')
        .doc('main')
        .get();

      if (!financeDoc.exists) {
        continue;
      }

      const financeData = financeDoc.data();
      
      console.log(`\n📍 Boda: ${weddingData.coupleName || weddingId}`);

      // Preparar datos de presupuesto para PostgreSQL
      const budgetData = {
        budget: financeData.budget || { total: 0, categories: [] },
        contributions: financeData.contributions || {
          initA: 0,
          initB: 0,
          monthlyA: 0,
          monthlyB: 0,
          extras: 0,
          giftPerGuest: 0,
          guestCount: 0,
          initialBalance: 0,
          balanceAdjustments: [],
        },
        settings: financeData.settings || {
          alertThresholds: { warn: 75, danger: 90 },
        },
        aiAdvisor: financeData.aiAdvisor || null,
      };

      // Actualizar en PostgreSQL
      await prisma.wedding.update({
        where: { id: weddingId },
        data: {
          budgetData: budgetData,
        },
      });

      console.log(`   ✅ Presupuesto migrado:`);
      console.log(`      - Total: $${budgetData.budget.total || 0}`);
      console.log(`      - Categorías: ${budgetData.budget.categories?.length || 0}`);
      console.log(`      - Invitados: ${budgetData.contributions.guestCount || 0}`);
      
      migratedCount++;
    }

    console.log(`\n✅ Migración completada. Total presupuestos migrados: ${migratedCount}`);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateBudgetData()
  .then(() => {
    console.log('\n✅ Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
