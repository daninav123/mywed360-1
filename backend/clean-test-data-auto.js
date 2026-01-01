/**
 * Script para limpiar datos de prueba y migración (AUTO)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n🧹 LIMPIEZA AUTOMÁTICA DE DATOS DE PRUEBA\n');
console.log('='.repeat(60));

// 1. Identificar usuarios de test/migración
const testUsers = await prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: 'test' } },
      { email: { contains: 'e2e' } },
      { email: { contains: 'migration' } },
    ]
  }
});

const testUserIds = testUsers.map(u => u.id);

console.log('\n📋 ELIMINANDO:');
console.log('-'.repeat(60));
testUsers.forEach(u => {
  console.log(`  👤 ${u.email}`);
});

// 2. Bodas de usuarios test
const testWeddings = await prisma.wedding.findMany({
  where: { userId: { in: testUserIds } }
});

const testWeddingIds = testWeddings.map(w => w.id);

if (testWeddings.length > 0) {
  console.log('\n  💒 Bodas:');
  testWeddings.forEach(w => {
    console.log(`     - ${w.coupleName || 'Sin nombre'}`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('\n🗑️  Eliminando...\n');

let deleted = { guests: 0, weddings: 0, suppliers: 0, users: 0 };

// ELIMINAR EN ORDEN (respetar foreign keys)

// 1. Invitados
if (testWeddingIds.length > 0) {
  const delGuests = await prisma.guest.deleteMany({
    where: { weddingId: { in: testWeddingIds } }
  });
  deleted.guests = delGuests.count;
  console.log(`✅ ${deleted.guests} invitados eliminados`);
}

// 2. Bodas
if (testWeddingIds.length > 0) {
  const delWeddings = await prisma.wedding.deleteMany({
    where: { id: { in: testWeddingIds } }
  });
  deleted.weddings = delWeddings.count;
  console.log(`✅ ${deleted.weddings} bodas eliminadas`);
}

// 3. Proveedores
if (testUserIds.length > 0) {
  const delSuppliers = await prisma.supplier.deleteMany({
    where: { userId: { in: testUserIds } }
  });
  deleted.suppliers = delSuppliers.count;
  console.log(`✅ ${deleted.suppliers} proveedores eliminados`);
}

// 4. Usuarios
if (testUserIds.length > 0) {
  const delUsers = await prisma.user.deleteMany({
    where: { id: { in: testUserIds } }
  });
  deleted.users = delUsers.count;
  console.log(`✅ ${deleted.users} usuarios eliminados`);
}

console.log('\n' + '='.repeat(60));
console.log('✨ LIMPIEZA COMPLETADA\n');

// Datos finales
const finalUsers = await prisma.user.count();
const finalWeddings = await prisma.wedding.count();
const finalGuests = await prisma.guest.count();
const finalSuppliers = await prisma.supplier.count();

console.log('📊 DATOS FINALES (solo reales):');
console.log('-'.repeat(60));
console.log(`Usuarios:    ${finalUsers}`);
console.log(`Bodas:       ${finalWeddings}`);
console.log(`Invitados:   ${finalGuests}`);
console.log(`Proveedores: ${finalSuppliers}`);
console.log('\n✅ Base de datos 100% limpia - solo datos reales\n');

await prisma.$disconnect();
