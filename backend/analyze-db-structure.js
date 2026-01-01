/**
 * Análisis profundo de la estructura de base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n🔍 ANÁLISIS DE ESTRUCTURA DE BASE DE DATOS\n');
console.log('='.repeat(80));

// Obtener información de cada tabla
// Obtener información de cada tabla (comentado para evitar error)
const tables = {};

// Contar registros en cada tabla
console.log('\n📊 REGISTROS POR TABLA');
console.log('-'.repeat(80));

const counts = {
  users: await prisma.user.count(),
  weddings: await prisma.wedding.count(),
  guests: await prisma.guest.count(),
  suppliers: await prisma.supplier.count(),
  budgets: await prisma.budget.count(),
  seatingPlans: await prisma.seatingPlan.count(),
  weddingSuppliers: await prisma.weddingSupplier.count(),
  supplierPortfolio: await prisma.supplierPortfolio.count(),
  craftWebs: await prisma.craftWeb.count(),
  rsvpResponses: await prisma.rsvpResponse.count(),
  refreshTokens: await prisma.refreshToken.count(),
  planners: await prisma.planner.count(),
};

Object.entries(counts).forEach(([table, count]) => {
  const status = count > 0 ? '✅' : '⚠️ ';
  console.log(`${status} ${table.padEnd(20)} ${count.toString().padStart(5)} registros`);
});

// Análisis de relaciones
console.log('\n\n🔗 ANÁLISIS DE RELACIONES');
console.log('-'.repeat(80));

// 1. Usuarios sin bodas
const usersWithoutWeddings = await prisma.user.findMany({
  where: { weddings: { none: {} } },
  select: { id: true, email: true }
});

if (usersWithoutWeddings.length > 0) {
  console.log(`\n⚠️  ${usersWithoutWeddings.length} usuarios SIN bodas:`);
  usersWithoutWeddings.forEach(u => console.log(`   - ${u.email}`));
}

// 2. Bodas sin invitados
const weddingsWithoutGuests = await prisma.wedding.findMany({
  where: { guests: { none: {} } },
  select: { id: true, coupleName: true }
});

if (weddingsWithoutGuests.length > 0) {
  console.log(`\n⚠️  ${weddingsWithoutGuests.length} bodas SIN invitados:`);
  weddingsWithoutGuests.forEach(w => console.log(`   - ${w.coupleName}`));
}

// 3. Bodas sin presupuesto
const weddingsWithoutBudget = await prisma.wedding.findMany({
  where: { budgets: { none: {} } },
  select: { id: true, coupleName: true }
});

if (weddingsWithoutBudget.length > 0) {
  console.log(`\n⚠️  ${weddingsWithoutBudget.length} bodas SIN presupuesto:`);
  weddingsWithoutBudget.forEach(w => console.log(`   - ${w.coupleName}`));
}

// 4. Proveedores sin portfolio
const suppliersWithoutPortfolio = await prisma.supplier.findMany({
  where: { portfolioItems: { none: {} } },
  select: { id: true, businessName: true }
});

if (suppliersWithoutPortfolio.length > 0) {
  console.log(`\n⚠️  ${suppliersWithoutPortfolio.length} proveedores SIN portfolio:`);
  suppliersWithoutPortfolio.forEach(s => console.log(`   - ${s.businessName}`));
}

// 5. Proveedores sin bodas asignadas
const suppliersWithoutWeddings = await prisma.supplier.findMany({
  where: { weddingSuppliers: { none: {} } },
  select: { id: true, businessName: true }
});

if (suppliersWithoutWeddings.length > 0) {
  console.log(`\n⚠️  ${suppliersWithoutWeddings.length} proveedores SIN bodas asignadas:`);
  suppliersWithoutWeddings.forEach(s => console.log(`   - ${s.businessName}`));
}

// Análisis de campos
console.log('\n\n📋 ANÁLISIS DE CAMPOS');
console.log('-'.repeat(80));

// Campos opcionales vs requeridos en Wedding
const weddingsWithMissingData = await prisma.wedding.findMany({
  where: {
    OR: [
      { celebrationPlace: null },
      { celebrationAddress: null },
      { numGuests: 0 }
    ]
  },
  select: { id: true, coupleName: true, celebrationPlace: true, numGuests: true }
});

if (weddingsWithMissingData.length > 0) {
  console.log(`\n⚠️  ${weddingsWithMissingData.length} bodas con datos incompletos:`);
  weddingsWithMissingData.forEach(w => {
    const missing = [];
    if (!w.celebrationPlace) missing.push('lugar');
    if (w.numGuests === 0) missing.push('num_invitados');
    console.log(`   - ${w.coupleName}: falta ${missing.join(', ')}`);
  });
}

// Análisis de inconsistencias
console.log('\n\n⚠️  INCONSISTENCIAS DETECTADAS');
console.log('-'.repeat(80));

// Invitados con weddingId que no existe
const orphanGuests = await prisma.$queryRaw`
  SELECT COUNT(*) as count FROM guests g 
  WHERE NOT EXISTS (SELECT 1 FROM weddings w WHERE w.id = g."weddingId")
`;

if (orphanGuests[0].count > 0) {
  console.log(`\n❌ ${orphanGuests[0].count} invitados huérfanos (weddingId no existe)`);
}

// Proveedores con userId que no existe
const orphanSuppliers = await prisma.$queryRaw`
  SELECT COUNT(*) as count FROM suppliers s 
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s."userId")
`;

if (orphanSuppliers[0].count > 0) {
  console.log(`\n❌ ${orphanSuppliers[0].count} proveedores huérfanos (userId no existe)`);
}

console.log('\n\n' + '='.repeat(80));
console.log('📊 RESUMEN');
console.log('='.repeat(80));

const totalTables = Object.keys(counts).length;
const tablesWithData = Object.values(counts).filter(c => c > 0).length;
const emptyTables = totalTables - tablesWithData;

console.log(`\nTablas totales:     ${totalTables}`);
console.log(`Tablas con datos:   ${tablesWithData}`);
console.log(`Tablas vacías:      ${emptyTables}`);

if (emptyTables > 0) {
  console.log(`\n⚠️  Tablas vacías detectadas:`);
  Object.entries(counts).forEach(([table, count]) => {
    if (count === 0) console.log(`   - ${table}`);
  });
}

console.log('\n');

await prisma.$disconnect();
