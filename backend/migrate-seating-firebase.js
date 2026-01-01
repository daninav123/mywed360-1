/**
 * Migrar planes de mesas de Firebase a PostgreSQL
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

async function migrateSeatingPlans() {
  console.log('\n🪑 Migrando planes de mesas de Firebase a PostgreSQL...\n');

  try {
    const weddingsSnapshot = await db.collection('weddings').get();
    console.log(`📋 Bodas encontradas: ${weddingsSnapshot.size}\n`);

    let updatedCount = 0;

    for (const weddingDoc of weddingsSnapshot.docs) {
      const weddingId = weddingDoc.id;
      const weddingData = weddingDoc.data();

      const wedding = await prisma.wedding.findUnique({
        where: { id: weddingId },
      });

      if (!wedding) {
        console.log(`⏭️  Boda ${weddingId} no existe en PostgreSQL, saltando...`);
        continue;
      }

      console.log(`\n📍 Boda: ${weddingData.coupleName || weddingId}`);

      // Obtener seating plan de Firebase
      let seatingData = null;
      try {
        const seatingDoc = await db
          .collection('weddings')
          .doc(weddingId)
          .collection('seatingPlan')
          .doc('main')
          .get();
        
        if (seatingDoc.exists) {
          seatingData = seatingDoc.data();
          console.log(`   🪑 Plan de mesas encontrado`);
        } else {
          console.log(`   ℹ️  No hay plan de mesas`);
          continue;
        }
      } catch (err) {
        console.log(`   ℹ️  No hay plan de mesas`);
        continue;
      }

      // Actualizar en PostgreSQL
      try {
        await prisma.wedding.update({
          where: { id: weddingId },
          data: {
            seatingData: seatingData,
          },
        });

        console.log(`   ✅ Plan de mesas migrado`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Error actualizando:`, error.message);
      }
    }

    console.log(`\n✅ Migración completada. Total planes migrados: ${updatedCount}`);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSeatingPlans()
  .then(() => {
    console.log('\n✅ Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
