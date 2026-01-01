/**
 * Migrar invitados de Firebase a PostgreSQL
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

async function migrateGuests() {
  console.log('\n👥 Migrando invitados de Firebase a PostgreSQL...\n');

  try {
    const weddingsSnapshot = await db.collection('weddings').get();
    console.log(`📋 Bodas encontradas: ${weddingsSnapshot.size}\n`);

    let totalMigrated = 0;

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

      // Obtener invitados de Firebase
      const guestsSnapshot = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('guests')
        .get();

      console.log(`   👥 Invitados encontrados: ${guestsSnapshot.size}`);

      if (guestsSnapshot.empty) {
        console.log(`   ℹ️  No hay invitados para migrar`);
        continue;
      }

      let migratedCount = 0;

      for (const guestDoc of guestsSnapshot.docs) {
        const guestData = guestDoc.data();
        const guestId = guestDoc.id;

        try {
          // Verificar si ya existe
          const exists = await prisma.guest.findUnique({
            where: { id: guestId },
          });

          if (exists) {
            console.log(`    ⏭️  Invitado ${guestData.name} ya existe, saltando...`);
            continue;
          }

          // Crear invitado en PostgreSQL
          await prisma.guest.create({
            data: {
              id: guestId,
              weddingId: weddingId,
              userId: guestData.userId || null,
              name: guestData.name || 'Sin nombre',
              email: guestData.email || null,
              phone: guestData.phone || null,
              confirmed: guestData.confirmed || false,
              status: guestData.status || 'pending',
              companions: guestData.companions || 0,
              dietaryRestrictions: guestData.dietaryRestrictions || null,
              notes: guestData.notes || null,
              tableNumber: guestData.tableNumber || null,
              seatNumber: guestData.seatNumber || null,
            },
          });

          migratedCount++;
          totalMigrated++;
          console.log(`    ✅ Migrado: ${guestData.name}`);
        } catch (error) {
          console.error(`    ❌ Error migrando invitado ${guestId}:`, error.message);
        }
      }

      console.log(`  ✅ Total migrados para esta boda: ${migratedCount}`);
    }

    console.log(`\n✅ Migración completada. Total invitados migrados: ${totalMigrated}`);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateGuests()
  .then(() => {
    console.log('\n✅ Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
