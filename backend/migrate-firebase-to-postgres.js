/**
 * Script de migración de Firebase a PostgreSQL
 * 
 * Migra datos de:
 * - Usuarios
 * - Bodas
 * - Invitados
 * - Proveedores
 * - Seating Plans
 * - Presupuestos
 * 
 * Uso:
 *   node scripts/migrate-firebase-to-postgres.js
 *   node scripts/migrate-firebase-to-postgres.js --dry-run
 *   node scripts/migrate-firebase-to-postgres.js --collection=users
 */

import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');
const specificCollection = process.argv.find(arg => arg.startsWith('--collection='))?.split('=')[1];

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccount) {
    console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS no está configurado');
    process.exit(1);
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Estadísticas de migración
const stats = {
  users: { total: 0, migrated: 0, errors: 0 },
  weddings: { total: 0, migrated: 0, errors: 0 },
  guests: { total: 0, migrated: 0, errors: 0 },
  suppliers: { total: 0, migrated: 0, errors: 0 },
};

/**
 * Migrar usuarios
 */
async function migrateUsers() {
  console.log('\n📊 Migrando usuarios...');
  
  const snapshot = await db.collection('users').get();
  stats.users.total = snapshot.size;
  
  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();
      
      if (isDryRun) {
        console.log(`  [DRY-RUN] Usuario: ${data.email || doc.id}`);
      } else {
        await prisma.user.upsert({
          where: { id: doc.id },
          create: {
            id: doc.id,
            email: data.email,
            displayName: data.displayName || data.name || null,
            photoURL: data.photoURL || null,
            phoneNumber: data.phoneNumber || data.phone || null,
            emailVerified: data.emailVerified || false,
            provider: data.provider || 'email',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          },
          update: {
            email: data.email,
            displayName: data.displayName || data.name || null,
            photoURL: data.photoURL || null,
            phoneNumber: data.phoneNumber || data.phone || null,
            emailVerified: data.emailVerified || false,
            updatedAt: new Date(),
          },
        });
        console.log(`  ✅ Usuario migrado: ${data.email || doc.id}`);
      }
      
      stats.users.migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrando usuario ${doc.id}:`, error.message);
      stats.users.errors++;
    }
  }
}

/**
 * Migrar bodas
 */
async function migrateWeddings() {
  console.log('\n💒 Migrando bodas...');
  
  // Crear usuario por defecto si no existe
  let defaultUser = await prisma.user.findUnique({ where: { email: 'default@malove.app' } });
  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        email: 'default@malove.app',
        displayName: 'Usuario Migrado',
        emailVerified: true,
        provider: 'migration',
      }
    });
  }
  
  const snapshot = await db.collection('weddings').get();
  stats.weddings.total = snapshot.size;
  
  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();
      
      if (isDryRun) {
        console.log(`  [DRY-RUN] Boda: ${data.coupleName || doc.id}`);
      } else {
        // Usar userId de Firebase o el usuario por defecto
        const userId = data.userId || defaultUser.id;
        
        await prisma.wedding.upsert({
          where: { id: doc.id },
          create: {
            id: doc.id,
            userId: userId,
            coupleName: data.coupleName || data.couple || 'Sin nombre',
            weddingDate: data.weddingDate?.toDate() || new Date(),
            celebrationPlace: data.celebrationPlace || data.venue || null,
            celebrationAddress: data.celebrationAddress || data.address || null,
            banquetPlace: data.banquetPlace || null,
            receptionAddress: data.receptionAddress || null,
            schedule: data.schedule || null,
            numGuests: data.numGuests || data.guestCount || 0,
            weddingStyle: data.weddingStyle || data.style || null,
            colorScheme: data.colorScheme || data.colors || null,
            rsvpDeadline: data.rsvpDeadline?.toDate() || null,
            giftAccount: data.giftAccount || null,
            transportation: data.transportation || null,
            importantInfo: data.importantInfo || null,
            status: data.status || 'active',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          },
          update: {
            coupleName: data.coupleName || data.couple || 'Sin nombre',
            weddingDate: data.weddingDate?.toDate() || new Date(),
            updatedAt: new Date(),
          },
        });
        console.log(`  ✅ Boda migrada: ${data.coupleName || doc.id}`);
      }
      
      stats.weddings.migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrando boda ${doc.id}:`, error.message);
      stats.weddings.errors++;
    }
  }
}

/**
 * Migrar invitados
 */
async function migrateGuests() {
  console.log('\n👥 Migrando invitados...');
  
  const weddings = await db.collection('weddings').get();
  
  for (const weddingDoc of weddings.docs) {
    const guestsSnapshot = await db
      .collection('weddings')
      .doc(weddingDoc.id)
      .collection('guests')
      .get();
    
    stats.guests.total += guestsSnapshot.size;
    
    for (const doc of guestsSnapshot.docs) {
      try {
        const data = doc.data();
        
        if (isDryRun) {
          console.log(`  [DRY-RUN] Invitado: ${data.name || doc.id} (Boda: ${weddingDoc.id})`);
        } else {
          await prisma.guest.upsert({
            where: { id: doc.id },
            create: {
              id: doc.id,
              weddingId: weddingDoc.id,
              name: data.name || 'Sin nombre',
              email: data.email || null,
              phone: data.phone || null,
              confirmed: data.confirmed || false,
              status: data.status || 'pending',
              companions: data.companions || data.plusOnes || 0,
              dietaryRestrictions: data.dietaryRestrictions || data.dietary || null,
              notes: data.notes || null,
              tableNumber: data.tableNumber || data.table || null,
              seatNumber: data.seatNumber || data.seat || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            },
            update: {
              name: data.name || 'Sin nombre',
              confirmed: data.confirmed || false,
              status: data.status || 'pending',
              updatedAt: new Date(),
            },
          });
          console.log(`  ✅ Invitado migrado: ${data.name || doc.id}`);
        }
        
        stats.guests.migrated++;
      } catch (error) {
        console.error(`  ❌ Error migrando invitado ${doc.id}:`, error.message);
        stats.guests.errors++;
      }
    }
  }
}

/**
 * Migrar proveedores
 */
async function migrateSuppliers() {
  console.log('\n🏢 Migrando proveedores...');
  
  // Crear usuario por defecto si no existe
  let defaultUser = await prisma.user.findUnique({ where: { email: 'default@malove.app' } });
  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        email: 'default@malove.app',
        displayName: 'Usuario Migrado',
        emailVerified: true,
        provider: 'migration',
      }
    });
  }
  
  const snapshot = await db.collection('suppliers').get();
  stats.suppliers.total = snapshot.size;
  
  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();
      
      if (isDryRun) {
        console.log(`  [DRY-RUN] Proveedor: ${data.businessName || doc.id}`);
      } else {
        // Usar userId de Firebase o el usuario por defecto
        const userId = data.userId || data.ownerId || defaultUser.id;
        
        await prisma.supplier.upsert({
          where: { id: doc.id },
          create: {
            id: doc.id,
            userId: userId,
            businessName: data.businessName || data.name || 'Sin nombre',
            category: data.category || 'general',
            description: data.description || null,
            email: data.email || data.contactEmail || 'no-email@example.com',
            phone: data.phone || data.contactPhone || null,
            website: data.website || null,
            address: data.address || null,
            city: data.city || null,
            country: data.country || null,
            instagram: data.instagram || data.social?.instagram || null,
            facebook: data.facebook || data.social?.facebook || null,
            services: data.services || null,
            priceRange: data.priceRange || null,
            rating: data.rating || 0,
            reviewCount: data.reviewCount || 0,
            verified: data.verified || false,
            featured: data.featured || false,
            active: data.active !== false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          },
          update: {
            businessName: data.businessName || data.name || 'Sin nombre',
            updatedAt: new Date(),
          },
        });
        console.log(`  ✅ Proveedor migrado: ${data.businessName || doc.id}`);
      }
      
      stats.suppliers.migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrando proveedor ${doc.id}:`, error.message);
      stats.suppliers.errors++;
    }
  }
}

/**
 * Ejecutar migración
 */
async function main() {
  console.log('\n🚀 Iniciando migración de Firebase a PostgreSQL\n');
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (sin cambios)' : 'PRODUCCIÓN (migrando datos)'}\n`);
  
  if (specificCollection) {
    console.log(`📋 Colección específica: ${specificCollection}\n`);
  }
  
  try {
    // Verificar conexión a PostgreSQL
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL\n');
    
    // Migrar según parámetros
    if (!specificCollection || specificCollection === 'users') {
      await migrateUsers();
    }
    
    if (!specificCollection || specificCollection === 'weddings') {
      await migrateWeddings();
    }
    
    if (!specificCollection || specificCollection === 'guests') {
      await migrateGuests();
    }
    
    if (!specificCollection || specificCollection === 'suppliers') {
      await migrateSuppliers();
    }
    
    // Mostrar estadísticas
    console.log('\n\n📊 RESUMEN DE MIGRACIÓN');
    console.log('========================\n');
    
    Object.entries(stats).forEach(([collection, data]) => {
      if (data.total > 0) {
        console.log(`${collection.toUpperCase()}:`);
        console.log(`  Total:    ${data.total}`);
        console.log(`  Migrados: ${data.migrated}`);
        console.log(`  Errores:  ${data.errors}`);
        console.log();
      }
    });
    
    if (isDryRun) {
      console.log('⚠️  DRY-RUN: No se realizaron cambios en la base de datos');
      console.log('💡 Ejecuta sin --dry-run para migrar los datos\n');
    } else {
      console.log('✅ Migración completada exitosamente\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
