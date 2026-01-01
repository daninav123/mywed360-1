import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
const serviceAccount = await import(serviceAccountPath, { with: { type: 'json' } });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount.default),
});

const db = admin.firestore();
const prisma = new PrismaClient();

console.log('\n🚀 MIGRACIÓN FIREBASE → POSTGRESQL (VERSIÓN CORREGIDA)\n');

// Crear usuario por defecto
let defaultUser = await prisma.user.findUnique({ where: { email: 'migration@malove.app' } });
if (!defaultUser) {
  defaultUser = await prisma.user.create({
    data: {
      email: 'migration@malove.app',
      displayName: 'Usuario Migrado',
      emailVerified: true,
      provider: 'migration',
    }
  });
}

// Obtener todos los usuarios existentes para mapeo
const existingUsers = await prisma.user.findMany();
const userIdMap = new Map(existingUsers.map(u => [u.id, u.id]));

// 1. USUARIOS
console.log('\n👤 Migrando usuarios...');
const usersSnap = await db.collection('users').get();
let usersOk = 0;

for (const doc of usersSnap.docs) {
  try {
    const d = doc.data();
    const user = await prisma.user.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        email: d.email || `user-${doc.id}@malove.app`,
        displayName: d.displayName || d.name || 'Usuario',
        phoneNumber: d.phoneNumber || d.phone || null,
        photoURL: d.photoURL || d.avatar || null,
        emailVerified: d.emailVerified || false,
        provider: d.provider || 'firebase',
        createdAt: d.createdAt?.toDate() || new Date(),
        updatedAt: d.updatedAt?.toDate() || new Date(),
      },
      update: { updatedAt: new Date() },
    });
    userIdMap.set(user.id, user.id);
    usersOk++;
  } catch (e) {
    console.error(`  ❌ ${doc.id}`);
  }
}
console.log(`  ✅ ${usersOk}/${usersSnap.size} usuarios`);

// 2. BODAS - CON VALIDACIÓN DE USERID
console.log('\n💒 Migrando bodas...');
const weddingsSnap = await db.collection('weddings').get();
let weddingsOk = 0;

for (const doc of weddingsSnap.docs) {
  try {
    const d = doc.data();
    
    // Validar userId: si existe en la BD, usarlo; si no, usar defaultUser
    let userId = d.userId;
    if (!userId || !userIdMap.has(userId)) {
      userId = defaultUser.id;
    }
    
    await prisma.wedding.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        userId: userId,
        coupleName: d.coupleName || d.couple || 'Boda sin nombre',
        weddingDate: d.weddingDate?.toDate() || new Date(),
        celebrationPlace: d.celebrationPlace || d.venue || null,
        celebrationAddress: d.celebrationAddress || d.address || null,
        banquetPlace: d.banquetPlace || null,
        receptionAddress: d.receptionAddress || null,
        schedule: d.schedule || null,
        numGuests: d.numGuests || d.guestCount || 0,
        weddingStyle: d.weddingStyle || d.style || null,
        colorScheme: d.colorScheme || d.colors || null,
        rsvpDeadline: d.rsvpDeadline?.toDate() || null,
        giftAccount: d.giftAccount || null,
        transportation: d.transportation || null,
        importantInfo: d.importantInfo || null,
        status: d.status || 'active',
        createdAt: d.createdAt?.toDate() || new Date(),
        updatedAt: d.updatedAt?.toDate() || new Date(),
      },
      update: { updatedAt: new Date() },
    });
    weddingsOk++;
  } catch (e) {
    console.error(`  ❌ Boda ${doc.id}: ${e.message.substring(0, 100)}`);
  }
}
console.log(`  ✅ ${weddingsOk}/${weddingsSnap.size} bodas`);

// 3. INVITADOS
console.log('\n👥 Migrando invitados...');
let guestsOk = 0, guestsTotal = 0;

// Obtener bodas migradas
const migratedWeddings = await prisma.wedding.findMany({ select: { id: true } });
const weddingIdSet = new Set(migratedWeddings.map(w => w.id));

for (const weddingDoc of weddingsSnap.docs) {
  // Solo procesar invitados de bodas que SÍ se migraron
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
          createdAt: d.createdAt?.toDate() || new Date(),
          updatedAt: d.updatedAt?.toDate() || new Date(),
        },
        update: { updatedAt: new Date() },
      });
      guestsOk++;
    } catch (e) {
      console.error(`  ❌ Invitado ${guestDoc.id}`);
    }
  }
}
console.log(`  ✅ ${guestsOk}/${guestsTotal} invitados`);

// 4. PROVEEDORES
console.log('\n🏢 Migrando proveedores...');
const suppliersSnap = await db.collection('suppliers').get();
let suppliersOk = 0;

for (const doc of suppliersSnap.docs) {
  try {
    const d = doc.data();
    
    // Validar userId
    let userId = d.userId || d.ownerId;
    if (!userId || !userIdMap.has(userId)) {
      userId = defaultUser.id;
    }
    
    await prisma.supplier.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        userId: userId,
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
        createdAt: d.createdAt?.toDate() || new Date(),
        updatedAt: d.updatedAt?.toDate() || new Date(),
      },
      update: { updatedAt: new Date() },
    });
    suppliersOk++;
  } catch (e) {
    console.error(`  ❌ Proveedor ${doc.id}`);
  }
}
console.log(`  ✅ ${suppliersOk}/${suppliersSnap.size} proveedores`);

// RESUMEN
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN FINAL');
console.log('='.repeat(50));
console.log(`👤 Usuarios:    ${usersOk}/${usersSnap.size}`);
console.log(`💒 Bodas:       ${weddingsOk}/${weddingsSnap.size}`);
console.log(`👥 Invitados:   ${guestsOk}/${guestsTotal}`);
console.log(`🏢 Proveedores: ${suppliersOk}/${suppliersSnap.size}`);
console.log('='.repeat(50));

const totalOk = usersOk + weddingsOk + guestsOk + suppliersOk;
const totalAll = usersSnap.size + weddingsSnap.size + guestsTotal + suppliersSnap.size;
console.log(`\n✅ ${totalOk}/${totalAll} documentos migrados a PostgreSQL\n`);

await prisma.$disconnect();
