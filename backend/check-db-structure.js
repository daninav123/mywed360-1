import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n📊 ANÁLISIS DE BASE DE DATOS POSTGRESQL\n');
console.log('='.repeat(60));

// USUARIOS
const users = await prisma.user.findMany();
console.log('\n👤 USUARIOS (' + users.length + ' total)');
console.log('-'.repeat(60));
users.forEach(u => {
  const tipo = u.email.includes('test') || u.email.includes('e2e') ? '🧪 TEST' : 
               u.email.includes('migration') ? '⚙️  MIGRACIÓN' : '✅ REAL';
  console.log(`${tipo} | ${u.displayName || 'Sin nombre'} | ${u.email}`);
});

// BODAS
const weddings = await prisma.wedding.findMany();
const guestCounts = {};
for (const w of weddings) {
  guestCounts[w.id] = await prisma.guest.count({ where: { weddingId: w.id } });
}

console.log('\n\n💒 BODAS (' + weddings.length + ' total)');
console.log('-'.repeat(60));
weddings.forEach(w => {
  const user = users.find(u => u.id === w.userId);
  const tipo = user?.email.includes('test') || user?.email.includes('e2e') ? '🧪 TEST' : '✅ REAL';
  console.log(`${tipo} | ${w.coupleName} | ${guestCounts[w.id]} invitados | ${w.status}`);
});

// INVITADOS
const totalGuests = await prisma.guest.count();
console.log('\n\n👥 INVITADOS');
console.log('-'.repeat(60));
console.log(`Total: ${totalGuests}`);

// PROVEEDORES
const suppliers = await prisma.supplier.findMany();
console.log('\n\n🏢 PROVEEDORES (' + suppliers.length + ' total)');
console.log('-'.repeat(60));
suppliers.forEach(s => {
  const user = users.find(u => u.id === s.userId);
  const tipo = user?.email.includes('test') || user?.email.includes('e2e') ? '🧪 TEST' : '✅ REAL';
  console.log(`${tipo} | ${s.businessName} | ${s.category} | ${s.verified ? 'Verificado' : 'No verificado'}`);
});

// RESUMEN Y RECOMENDACIONES
console.log('\n\n📋 RESUMEN Y ELEMENTOS RAROS');
console.log('='.repeat(60));
const testUsers = users.filter(u => u.email.includes('test') || u.email.includes('e2e'));
const migrationUsers = users.filter(u => u.email.includes('migration'));
const realUsers = users.filter(u => !u.email.includes('test') && !u.email.includes('e2e') && !u.email.includes('migration'));

console.log(`\nUsuarios REALES:      ${realUsers.length} ✅`);
console.log(`Usuarios TEST/E2E:    ${testUsers.length} ${testUsers.length > 0 ? '⚠️' : '✅'}`);
console.log(`Usuario migración:    ${migrationUsers.length} ${migrationUsers.length > 0 ? '⚠️' : '✅'}`);
console.log(`Bodas:                ${weddings.length}`);
console.log(`Invitados:            ${totalGuests}`);
console.log(`Proveedores:          ${suppliers.length}`);

if (testUsers.length > 0 || migrationUsers.length > 0) {
  console.log('\n⚠️  ELEMENTOS A LIMPIAR (datos de prueba/migración):');
  if (migrationUsers.length > 0) {
    console.log(`   • ${migrationUsers.length} usuario auxiliar de migración: ${migrationUsers[0].email}`);
  }
  if (testUsers.length > 0) {
    console.log(`   • ${testUsers.length} usuarios de test/e2e:`);
    testUsers.forEach(u => console.log(`     - ${u.email}`));
  }
  console.log('\n💡 Puedes eliminarlos para tener solo datos reales.');
}

console.log('\n');

await prisma.$disconnect();
