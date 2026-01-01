/**
 * Script para limpiar datos de prueba y migración
 * Ejecuta: node backend/clean-test-data.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n🧹 LIMPIEZA DE DATOS DE PRUEBA Y MIGRACIÓN\n');
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

console.log('\n📋 ELEMENTOS A ELIMINAR:');
console.log('-'.repeat(60));
testUsers.forEach(u => {
  console.log(`  👤 Usuario: ${u.email}`);
});

// 2. Identificar bodas de usuarios test
const testWeddings = await prisma.wedding.findMany({
  where: { userId: { in: testUserIds } }
});

const testWeddingIds = testWeddings.map(w => w.id);

if (testWeddings.length > 0) {
  console.log('\n  💒 Bodas de usuarios test:');
  testWeddings.forEach(w => {
    console.log(`     - ${w.coupleName || 'Sin nombre'}`);
  });
}

// 3. Contar invitados que se eliminarán
const guestsToDelete = await prisma.guest.count({
  where: { weddingId: { in: testWeddingIds } }
});

if (guestsToDelete > 0) {
  console.log(`\n  👥 Invitados de bodas test: ${guestsToDelete}`);
}

// 4. Proveedores de usuarios test
const testSuppliers = await prisma.supplier.findMany({
  where: { userId: { in: testUserIds } }
});

if (testSuppliers.length > 0) {
  console.log('\n  🏢 Proveedores de usuarios test:');
  testSuppliers.forEach(s => {
    console.log(`     - ${s.businessName}`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  ¿Confirmas la eliminación? (Ctrl+C para cancelar)');
console.log('Presiona ENTER para continuar...\n');

// Esperar confirmación del usuario
await new Promise(resolve => {
  process.stdin.once('data', () => resolve());
});

console.log('\n🗑️  Eliminando datos de prueba...\n');

// ELIMINAR EN ORDEN (respetar foreign keys)
let deleted = { guests: 0, weddings: 0, suppliers: 0, users: 0 };

// 1. Eliminar invitados de bodas test
if (testWeddingIds.length > 0) {
  const delGuests = await prisma.guest.deleteMany({
    where: { weddingId: { in: testWeddingIds } }
  });
  deleted.guests = delGuests.count;
  console.log(`✅ ${deleted.guests} invitados eliminados`);
}

// 2. Eliminar bodas de usuarios test
if (testWeddingIds.length > 0) {
  const delWeddings = await prisma.wedding.deleteMany({
    where: { id: { in: testWeddingIds } }
  });
  deleted.weddings = delWeddings.count;
  console.log(`✅ ${deleted.weddings} bodas eliminadas`);
}

// 3. Eliminar proveedores de usuarios test
if (testUserIds.length > 0) {
  const delSuppliers = await prisma.supplier.deleteMany({
    where: { userId: { in: testUserIds } }
  });
  deleted.suppliers = delSuppliers.count;
  console.log(`✅ ${deleted.suppliers} proveedores eliminados`);
}

// 4. Eliminar usuarios test/migración
if (testUserIds.length > 0) {
  const delUsers = await prisma.user.deleteMany({
    where: { id: { in: testUserIds } }
  });
  deleted.users = delUsers.count;
  console.log(`✅ ${deleted.users} usuarios eliminados`);
}

console.log('\n' + '='.repeat(60));
console.log('✨ LIMPIEZA COMPLETADA\n');

// Verificar datos finales
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
console.log('\n✅ Base de datos limpia - solo datos reales\n');

await prisma.$disconnect();
