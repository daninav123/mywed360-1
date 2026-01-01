/**
 * Migrar datos de ceremonia de Firebase a PostgreSQL
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

async function migrateCeremonyData() {
  console.log('\n💒 Migrando datos de ceremonia de Firebase a PostgreSQL...\n');

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

      const ceremonyData = {};
      let hasData = false;

      // Obtener checklist de ceremonia
      try {
        const checklistDoc = await db
          .collection('weddings')
          .doc(weddingId)
          .collection('ceremony')
          .doc('checklist')
          .get();
        
        if (checklistDoc.exists) {
          ceremonyData.checklist = checklistDoc.data();
          console.log(`   ✓ Checklist encontrado`);
          hasData = true;
        }
      } catch (err) {
        // No hay checklist
      }

      // Obtener timeline de ceremonia
      try {
        const timelineDoc = await db
          .collection('weddings')
          .doc(weddingId)
          .collection('ceremony')
          .doc('timeline')
          .get();
        
        if (timelineDoc.exists) {
          ceremonyData.timeline = timelineDoc.data();
          console.log(`   ✓ Timeline encontrado`);
          hasData = true;
        }
      } catch (err) {
        // No hay timeline
      }

      // Obtener textos de ceremonia
      try {
        const textsDoc = await db
          .collection('weddings')
          .doc(weddingId)
          .collection('ceremony')
          .doc('texts')
          .get();
        
        if (textsDoc.exists) {
          ceremonyData.texts = textsDoc.data();
          console.log(`   ✓ Textos encontrados`);
          hasData = true;
        }
      } catch (err) {
        // No hay textos
      }

      if (!hasData) {
        console.log(`   ℹ️  No hay datos de ceremonia`);
        continue;
      }

      // Actualizar en PostgreSQL
      try {
        await prisma.wedding.update({
          where: { id: weddingId },
          data: {
            ceremonyData: ceremonyData,
          },
        });

        console.log(`   ✅ Datos de ceremonia migrados`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Error actualizando:`, error.message);
      }
    }

    console.log(`\n✅ Migración completada. Total bodas con ceremonia: ${updatedCount}`);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateCeremonyData()
  .then(() => {
    console.log('\n✅ Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
