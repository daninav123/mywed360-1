import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const prisma = new PrismaClient();

console.log('\n🚀 MIGRACIÓN FIREBASE → POSTGRESQL\n');

// Crear usuario por defecto PRIMERO
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
  console.log('✅ Usuario por defecto creado');
}

// 1. USUARIOS
console.log('\n👤 Migrando usuarios...');
const usersSnap = await db.collection('users').get();
let usersOk = 0, usersErr = 0;

for (const doc of usersSnap.docs) {
  try {
    const d = doc.data();
    await prisma.user.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        email: d.email || `user-${doc.id}@malove.app`,
        displayName: d.displayName || d.name || 'Usuario',
        phoneNumber: d.phoneNumber || d.phone || null,
        photoURL: d.photoURL || d.avatar || null,
        emailVerified: d.emailVerified || false,
        provider: d.provider || 'firebase',
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
      },
      update: { updatedAt: new Date() },
    });
    usersOk++;
  } catch (e) {
    console.error(`  ❌ ${doc.id}:`, e.message.substring(0, 80));
    usersErr++;
  }
}
console.log(`  ✅ ${usersOk}/${usersSnap.size} migrados (${usersErr} errores)`);

// Crear mapa de usuarios existentes para validación
const existingUsers = await prisma.user.findMany();
const userIdMap = new Map(existingUsers.map(u => [u.id, u.id]));

// 2. BODAS
console.log('\n💒 Migrando bodas...');
const weddingsSnap = await db.collection('weddings').get();
let weddingsOk = 0, weddingsErr = 0;

for (const doc of weddingsSnap.docs) {
  try {
    const d = doc.data();
    // Validar que userId existe en la BD
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
        weddingDate: d.weddingDate?.toDate ? d.weddingDate.toDate() : (d.weddingDate ? new Date(d.weddingDate) : new Date()),
        celebrationPlace: d.celebrationPlace || d.venue || null,
        celebrationAddress: d.celebrationAddress || d.address || null,
        numGuests: d.numGuests || d.guestCount || 0,
        status: d.status || 'active',
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
      },
      update: { updatedAt: new Date() },
    });
    weddingsOk++;
  } catch (e) {
    console.error(`  ❌ ${doc.id}:`, e.message.substring(0, 80));
    weddingsErr++;
  }
}
console.log(`  ✅ ${weddingsOk}/${weddingsSnap.size} migrados (${weddingsErr} errores)`);

// 3. INVITADOS (de todas las bodas)
console.log('\n👥 Migrando invitados...');
let guestsOk = 0, guestsErr = 0, guestsTotal = 0;

// Obtener IDs de bodas migradas
const migratedWeddings = await prisma.wedding.findMany({ select: { id: true } });
const weddingIdSet = new Set(migratedWeddings.map(w => w.id));

for (const weddingDoc of weddingsSnap.docs) {
  // Solo procesar invitados si la boda se migró
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
        update: { updatedAt: new Date() },
      });
      guestsOk++;
    } catch (e) {
      console.error(`  ❌ ${guestDoc.id}:`, e.message.substring(0, 60));
      guestsErr++;
    }
  }
}
console.log(`  ✅ ${guestsOk}/${guestsTotal} migrados (${guestsErr} errores)`);

// 4. PROVEEDORES
console.log('\n🏢 Migrando proveedores...');
const suppliersSnap = await db.collection('suppliers').get();
let suppliersOk = 0, suppliersErr = 0;

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
        email: d.email || `supplier-${doc.id}@malove.app`,
        phone: d.phone || null,
        city: d.city || null,
        rating: d.rating || 0,
        reviewCount: d.reviewCount || 0,
        verified: d.verified || false,
        featured: d.featured || false,
        active: d.active !== false,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
      },
      update: { updatedAt: new Date() },
    });
    suppliersOk++;
  } catch (e) {
    console.error(`  ❌ ${doc.id}:`, e.message.substring(0, 80));
    suppliersErr++;
  }
}
console.log(`  ✅ ${suppliersOk}/${suppliersSnap.size} migrados (${suppliersErr} errores)`);

// RESUMEN FINAL
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
console.log(`\n✅ TOTAL: ${totalOk}/${totalAll} documentos migrados\n`);

await prisma.$disconnect();
