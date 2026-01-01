/**
 * Migrar información general de bodas de Firebase a PostgreSQL
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

async function migrateWeddingInfo() {
  console.log('\n💒 Migrando información de bodas de Firebase a PostgreSQL...\n');

  try {
    const weddingsSnapshot = await db.collection('weddings').get();
    console.log(`📋 Bodas encontradas: ${weddingsSnapshot.size}\n`);

    let updatedCount = 0;

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

      console.log(`\n📍 Boda: ${weddingData.coupleName || weddingId}`);

      // Obtener info adicional del subdocumento
      let weddingInfo = {};
      try {
        const infoDoc = await db
          .collection('weddings')
          .doc(weddingId)
          .collection('info')
          .doc('weddingInfo')
          .get();
        
        if (infoDoc.exists) {
          weddingInfo = infoDoc.data();
          console.log(`   ℹ️  Info adicional encontrada`);
        }
      } catch (err) {
        console.log(`   ℹ️  No hay info adicional`);
      }

      // Consolidar toda la información
      const consolidatedData = {
        // Campos que ya deberían existir pero actualizamos por si acaso
        coupleName: weddingData.coupleName || wedding.coupleName,
        weddingDate: weddingData.weddingDate ? new Date(weddingData.weddingDate) : wedding.weddingDate,
        celebrationPlace: weddingData.celebrationPlace || weddingData.location || wedding.celebrationPlace || null,
        
        // Info adicional en JSON
        weddingInfo: {
          numGuests: weddingInfo.numGuests || weddingData.numGuests || null,
          venue: weddingInfo.venue || weddingData.venue || null,
          venueAddress: weddingInfo.venueAddress || weddingData.venueAddress || null,
          dresscode: weddingInfo.dresscode || weddingData.dresscode || null,
          theme: weddingInfo.theme || weddingData.theme || null,
          colors: weddingInfo.colors || weddingData.colors || null,
          invitesSentDate: weddingInfo.invitesSentDate || weddingData.invitesSentDate || null,
          rsvpDeadline: weddingInfo.rsvpDeadline || weddingData.rsvpDeadline || null,
          websiteUrl: weddingInfo.websiteUrl || weddingData.websiteUrl || null,
          hashtag: weddingInfo.hashtag || weddingData.hashtag || null,
          notes: weddingInfo.notes || weddingData.notes || null,
          ...weddingInfo,
        },
      };

      // Actualizar en PostgreSQL
      try {
        await prisma.wedding.update({
          where: { id: weddingId },
          data: {
            coupleName: consolidatedData.coupleName,
            weddingDate: consolidatedData.weddingDate,
            location: consolidatedData.location,
            weddingInfo: consolidatedData.weddingInfo,
          },
        });

        console.log(`   ✅ Información actualizada`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Error actualizando:`, error.message);
      }
    }

    console.log(`\n✅ Migración completada. Total bodas actualizadas: ${updatedCount}`);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateWeddingInfo()
  .then(() => {
    console.log('\n✅ Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
