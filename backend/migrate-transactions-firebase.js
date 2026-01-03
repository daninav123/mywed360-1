import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function migrateTransactions() {
  console.log('🔄 Iniciando migración de transacciones desde Firebase...\n');

  try {
    // Obtener todas las bodas
    const weddingsSnapshot = await db.collection('weddings').get();
    console.log(`📋 Bodas encontradas: ${weddingsSnapshot.size}`);

    let totalMigrated = 0;

    for (const weddingDoc of weddingsSnapshot.docs) {
      const weddingId = weddingDoc.id;
      console.log(`\n📍 Procesando boda: ${weddingId}`);

      // Verificar si la boda existe en PostgreSQL
      const weddingExists = await prisma.wedding.findUnique({
        where: { id: weddingId },
      });

      if (!weddingExists) {
        console.log(`  ⚠️  Boda ${weddingId} no existe en PostgreSQL, saltando...`);
        continue;
      }

      // Obtener transacciones de Firebase
      const transactionsSnapshot = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('transactions')
        .get();

      console.log(`  💰 Transacciones encontradas: ${transactionsSnapshot.size}`);

      if (transactionsSnapshot.empty) {
        console.log(`  ℹ️  No hay transacciones para migrar`);
        continue;
      }

      let migratedCount = 0;

      for (const txDoc of transactionsSnapshot.docs) {
        const txData = txDoc.data();
        const txId = txDoc.id;

        try {
          // Verificar si ya existe
          const exists = await prisma.transaction.findUnique({
            where: { id: txId },
          });

          if (exists) {
            console.log(`    ⏭️  Transacción ${txId} ya existe, saltando...`);
            continue;
          }

          // Parsear fechas
          const parseDate = (value) => {
            if (!value) return null;
            if (value.toDate) return value.toDate();
            if (typeof value === 'string') return new Date(value);
            if (value instanceof Date) return value;
            return null;
          };

          const dueDate = parseDate(txData.dueDate);
          const paidDate = parseDate(txData.paidDate);

          // Crear transacción en PostgreSQL
          await prisma.transaction.create({
            data: {
              id: txId,
              weddingId: weddingId,
              category: txData.category || 'Otros',
              description: txData.concept || txData.description || 'Sin descripción',
              amount: parseFloat(txData.amount) || 0,
              type: txData.type || 'expense',
              status: txData.status || 'pending',
              dueDate: dueDate,
              paidDate: paidDate,
              supplierId: txData.supplierId || null,
              notes: txData.notes || null,
            },
          });

          migratedCount++;
          totalMigrated++;
          console.log(`    ✅ Migrada: ${txData.concept || txData.description} - $${txData.amount}`);
        } catch (error) {
          console.error(`    ❌ Error migrando transacción ${txId}:`, error.message);
        }
      }

      console.log(`  ✅ Total migradas para esta boda: ${migratedCount}`);
    }

    console.log(`\n✅ Migración completada. Total transacciones migradas: ${totalMigrated}`);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateTransactions()
  .then(() => {
    console.log('\n✅ Proceso de migración finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el proceso de migración:', error);
    process.exit(1);
  });
