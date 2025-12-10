/**
 * Script de migración de Firebase a PostgreSQL
 * Migra usuarios, bodas, invitados, proveedores, etc.
 */

import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.migration' });

const prisma = new PrismaClient();

// Estadísticas de migración
const stats = {
  users: 0,
  weddings: 0,
  guests: 0,
  suppliers: 0,
  craftWebs: 0,
  errors: [],
};

/**
 * Migra usuarios
 */
async function migrateUsers() {
  console.log('\n👤 Migrando usuarios...');

  const usersSnapshot = await admin.firestore().collection('users').get();

  for (const doc of usersSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.user.upsert({
        where: { id: doc.id },
        update: {
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          phoneNumber: data.phoneNumber || null,
          emailVerified: data.emailVerified || false,
          provider: data.provider || 'email',
          lastLogin: data.lastLogin?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          phoneNumber: data.phoneNumber || null,
          emailVerified: data.emailVerified || false,
          provider: data.provider || 'email',
          lastLogin: data.lastLogin?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
      });

      stats.users++;
    } catch (error) {
      stats.errors.push({ type: 'user', id: doc.id, error: error.message });
      console.error(`✗ Error migrando usuario ${doc.id}:`, error.message);
    }
  }

  console.log(`✓ ${stats.users} usuarios migrados`);
}

/**
 * Migra bodas
 */
async function migrateWeddings() {
  console.log('\n💒 Migrando bodas...');

  const weddingsSnapshot = await admin.firestore().collection('weddings').get();

  for (const doc of weddingsSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.wedding.upsert({
        where: { id: doc.id },
        update: {
          userId: data.userId,
          coupleName: data.coupleName || '',
          weddingDate: data.weddingDate?.toDate() || new Date(),
          celebrationPlace: data.celebrationPlace || null,
          celebrationAddress: data.celebrationAddress || null,
          banquetPlace: data.banquetPlace || null,
          receptionAddress: data.receptionAddress || null,
          schedule: data.schedule || null,
          numGuests: data.numGuests || 0,
          weddingStyle: data.weddingStyle || null,
          colorScheme: data.colorScheme || null,
          rsvpDeadline: data.rsvpDeadline?.toDate() || null,
          giftAccount: data.giftAccount || null,
          transportation: data.transportation || null,
          importantInfo: data.importantInfo || null,
          status: data.status || 'active',
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          userId: data.userId,
          coupleName: data.coupleName || '',
          weddingDate: data.weddingDate?.toDate() || new Date(),
          celebrationPlace: data.celebrationPlace || null,
          celebrationAddress: data.celebrationAddress || null,
          banquetPlace: data.banquetPlace || null,
          receptionAddress: data.receptionAddress || null,
          schedule: data.schedule || null,
          numGuests: data.numGuests || 0,
          weddingStyle: data.weddingStyle || null,
          colorScheme: data.colorScheme || null,
          rsvpDeadline: data.rsvpDeadline?.toDate() || null,
          giftAccount: data.giftAccount || null,
          transportation: data.transportation || null,
          importantInfo: data.importantInfo || null,
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
      });

      stats.weddings++;

      // Migrar invitados de esta boda
      await migrateGuestsForWedding(doc.id);
    } catch (error) {
      stats.errors.push({ type: 'wedding', id: doc.id, error: error.message });
      console.error(`✗ Error migrando boda ${doc.id}:`, error.message);
    }
  }

  console.log(`✓ ${stats.weddings} bodas migradas`);
}

/**
 * Migra invitados de una boda
 */
async function migrateGuestsForWedding(weddingId) {
  const guestsSnapshot = await admin
    .firestore()
    .collection('weddings')
    .doc(weddingId)
    .collection('guests')
    .get();

  for (const doc of guestsSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.guest.upsert({
        where: { id: doc.id },
        update: {
          weddingId,
          userId: data.userId || null,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          confirmed: data.confirmed || false,
          status: data.status || 'pending',
          companions: data.companions || 0,
          dietaryRestrictions: data.dietaryRestrictions || null,
          notes: data.notes || null,
          tableNumber: data.tableNumber || null,
          seatNumber: data.seatNumber || null,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          weddingId,
          userId: data.userId || null,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          confirmed: data.confirmed || false,
          status: data.status || 'pending',
          companions: data.companions || 0,
          dietaryRestrictions: data.dietaryRestrictions || null,
          notes: data.notes || null,
          tableNumber: data.tableNumber || null,
          seatNumber: data.seatNumber || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
      });

      stats.guests++;
    } catch (error) {
      stats.errors.push({ type: 'guest', id: doc.id, error: error.message });
    }
  }
}

/**
 * Migra proveedores
 */
async function migrateSuppliers() {
  console.log('\n🏢 Migrando proveedores...');

  const suppliersSnapshot = await admin.firestore().collection('suppliers').get();

  for (const doc of suppliersSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.supplier.upsert({
        where: { id: doc.id },
        update: {
          userId: data.userId,
          businessName: data.businessName || data.name || '',
          category: data.category || '',
          description: data.description || null,
          email: data.email || '',
          phone: data.phone || null,
          website: data.website || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
          instagram: data.instagram || null,
          facebook: data.facebook || null,
          services: data.services || null,
          priceRange: data.priceRange || null,
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          verified: data.verified || false,
          featured: data.featured || false,
          active: data.active !== false,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          userId: data.userId,
          businessName: data.businessName || data.name || '',
          category: data.category || '',
          description: data.description || null,
          email: data.email || '',
          phone: data.phone || null,
          website: data.website || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
          instagram: data.instagram || null,
          facebook: data.facebook || null,
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
      });

      stats.suppliers++;
    } catch (error) {
      stats.errors.push({ type: 'supplier', id: doc.id, error: error.message });
      console.error(`✗ Error migrando proveedor ${doc.id}:`, error.message);
    }
  }

  console.log(`✓ ${stats.suppliers} proveedores migrados`);
}

/**
 * Migra webs Craft
 */
async function migrateCraftWebs() {
  console.log('\n🌐 Migrando webs Craft...');

  const websSnapshot = await admin.firestore().collection('craft-webs').get();

  for (const doc of websSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.craftWeb.upsert({
        where: { id: doc.id },
        update: {
          weddingId: data.weddingId,
          userId: data.userId,
          slug: data.slug,
          title: data.title || '',
          published: data.published || false,
          structure: data.structure || {},
          theme: data.theme || {},
          publishedAt: data.publishedAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
        create: {
          id: doc.id,
          weddingId: data.weddingId,
          userId: data.userId,
          slug: data.slug,
          title: data.title || '',
          published: data.published || false,
          structure: data.structure || {},
          theme: data.theme || {},
          publishedAt: data.publishedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
      });

      stats.craftWebs++;
    } catch (error) {
      stats.errors.push({ type: 'craftWeb', id: doc.id, error: error.message });
      console.error(`✗ Error migrando web ${doc.id}:`, error.message);
    }
  }

  console.log(`✓ ${stats.craftWebs} webs migradas`);
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando migración de Firebase a PostgreSQL...\n');
  console.log('⚠️  ADVERTENCIA: Este proceso puede tardar varios minutos\n');

  try {
    await migrateUsers();
    await migrateWeddings();
    await migrateSuppliers();
    await migrateCraftWebs();

    console.log('\n✅ Migración completada');
    console.log('\n📊 Resumen:');
    console.log(`   Usuarios: ${stats.users}`);
    console.log(`   Bodas: ${stats.weddings}`);
    console.log(`   Invitados: ${stats.guests}`);
    console.log(`   Proveedores: ${stats.suppliers}`);
    console.log(`   Webs: ${stats.craftWebs}`);
    console.log(`   Errores: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errores encontrados:');
      stats.errors.forEach((err) => {
        console.log(`   ${err.type} ${err.id}: ${err.error}`);
      });
    }
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
