/**
 * Re-migrar bodas de Firebase asignándolas al primer usuario real
 */

import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Verificar si ya está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const prisma = new PrismaClient();

console.log('\n🔄 RE-MIGRACIÓN DE BODAS E INVITADOS\n');
console.log('='.repeat(60));

// Obtener primer usuario real (danielnavarrocampos@icloud.com)
const realUser = await prisma.user.findFirst({
  where: {
    email: { contains: 'danielnavarrocampos' }
  }
});

if (!realUser) {
  console.error('❌ No se encontró usuario real');
  process.exit(1);
}

console.log(`✅ Usuario real: ${realUser.email} (${realUser.id})\n`);

// MIGRAR BODAS
console.log('💒 Migrando bodas...');
const weddingsSnap = await db.collection('weddings').get();
let weddingsOk = 0;

for (const doc of weddingsSnap.docs) {
  try {
    const d = doc.data();
    
    await prisma.wedding.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        userId: realUser.id, // Todas las bodas al usuario real
        coupleName: d.coupleName || d.couple || 'Boda sin nombre',
        weddingDate: d.weddingDate?.toDate ? d.weddingDate.toDate() : (d.weddingDate ? new Date(d.weddingDate) : new Date()),
        celebrationPlace: d.celebrationPlace || d.venue || null,
        celebrationAddress: d.celebrationAddress || d.address || null,
        banquetPlace: d.banquetPlace || null,
        receptionAddress: d.receptionAddress || null,
        schedule: d.schedule || null,
        numGuests: d.numGuests || d.guestCount || 0,
        weddingStyle: d.weddingStyle || d.style || null,
        colorScheme: d.colorScheme || d.colors || null,
        rsvpDeadline: d.rsvpDeadline?.toDate ? d.rsvpDeadline.toDate() : (d.rsvpDeadline ? new Date(d.rsvpDeadline) : null),
        giftAccount: d.giftAccount || null,
        transportation: d.transportation || null,
        importantInfo: d.importantInfo || null,
        status: d.status || 'active',
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
      },
      update: { 
        updatedAt: new Date() 
      }
    });
    weddingsOk++;
  } catch (e) {
    console.error(`  ❌ ${doc.id}:`);
    console.error(`     ${e.message}`);
  }
}
console.log(`  ✅ ${weddingsOk}/${weddingsSnap.size} bodas migradas\n`);

// MIGRAR INVITADOS
console.log('👥 Migrando invitados...');
const migratedWeddings = await prisma.wedding.findMany({ select: { id: true } });
const weddingIdSet = new Set(migratedWeddings.map(w => w.id));

let guestsOk = 0, guestsTotal = 0;

for (const weddingDoc of weddingsSnap.docs) {
  if (!weddingIdSet.has(weddingDoc.id)) continue;
  
  const guestsSnap = await db.collection('weddings').doc(weddingDoc.id).collection('guests').get();
  guestsTotal += guestsSnap.size;
  
  for (const guestDoc of guestsSnap.docs) {
    try {
      const d = guestDoc.data();
      await prisma.guest.upsert({
        where: { id: guestDoc.id },
        create: {
          id: guestDoc.id,
          weddingId: weddingDoc.id,
          name: d.name || d.fullName || 'Invitado',
          email: d.email || null,
          phone: d.phone || null,
          confirmed: d.confirmed || false,
          status: d.status || 'pending',
          companions: d.companions || 0,
          tableNumber: d.tableNumber || d.table || null,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
        },
        update: { 
          updatedAt: new Date() 
        }
      });
      guestsOk++;
    } catch (e) {
      console.error(`  ❌ Invitado ${guestDoc.id}: ${e.message.substring(0, 60)}`);
    }
  }
}
console.log(`  ✅ ${guestsOk}/${guestsTotal} invitados migrados\n`);

// MIGRAR PROVEEDORES
console.log('🏢 Migrando proveedores...');
const suppliersSnap = await db.collection('suppliers').get();
let suppliersOk = 0;

for (const doc of suppliersSnap.docs) {
  try {
    const d = doc.data();
    
    await prisma.supplier.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        userId: realUser.id,
        businessName: d.businessName || d.name || 'Proveedor',
        category: d.category || 'general',
        description: d.description || null,
        email: d.email || `supplier-${doc.id}@malove.app`,
        phone: d.phone || null,
        website: d.website || null,
        address: d.address || null,
        city: d.city || null,
        country: d.country || null,
        instagram: d.instagram || null,
        facebook: d.facebook || null,
        services: d.services || null,
        priceRange: d.priceRange || null,
        rating: d.rating || 0,
        reviewCount: d.reviewCount || 0,
        verified: d.verified || false,
        featured: d.featured || false,
        active: d.active !== false,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
      },
      update: { updatedAt: new Date() }
    });
    suppliersOk++;
  } catch (e) {
    console.error(`  ❌ ${doc.id}: ${e.message.substring(0, 60)}`);
  }
}
console.log(`  ✅ ${suppliersOk}/${suppliersSnap.size} proveedores migrados\n`);

// RESUMEN
console.log('='.repeat(60));
console.log('📊 RESUMEN FINAL');
console.log('='.repeat(60));
console.log(`💒 Bodas:       ${weddingsOk}/${weddingsSnap.size}`);
console.log(`👥 Invitados:   ${guestsOk}/${guestsTotal}`);
console.log(`🏢 Proveedores: ${suppliersOk}/${suppliersSnap.size}`);
console.log('='.repeat(60));
console.log(`\n✅ Todas las bodas asignadas a: ${realUser.email}\n`);

await prisma.$disconnect();
