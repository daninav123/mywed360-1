/**
 * Migrar datos existentes al nuevo sistema de roles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n🔄 MIGRACIÓN DE DATOS AL SISTEMA DE ROLES\n');
console.log('='.repeat(70));

async function migrateData() {
  // 1. Verificar usuarios (ya tienen role por default)
  console.log('\n1. Verificando usuarios...');
  const totalUsers = await prisma.user.count();
  console.log(`   ✅ ${totalUsers} usuarios con role asignado (default: OWNER)`);

  // 2. Crear wedding_access para bodas existentes
  console.log('\n2. Creando registros en wedding_access...');
  
  const weddings = await prisma.wedding.findMany({
    select: { id: true, userId: true }
  });
  
  let accessCreated = 0;
  
  for (const wedding of weddings) {
    try {
      // Verificar si ya existe
      const existing = await prisma.weddingAccess.findUnique({
        where: {
          userId_weddingId: {
            userId: wedding.userId,
            weddingId: wedding.id
          }
        }
      });
      
      if (!existing) {
        await prisma.weddingAccess.create({
          data: {
            userId: wedding.userId,
            weddingId: wedding.id,
            role: 'OWNER',
            status: 'active'
          }
        });
        accessCreated++;
      }
    } catch (error) {
      console.error(`   ❌ Error en boda ${wedding.id}:`, error.message);
    }
  }
  
  console.log(`   ✅ ${accessCreated} registros creados en wedding_access`);

  // 3. Verificar datos migrados
  console.log('\n3. Verificando migración...');
  
  const usersCount = await prisma.user.count();
  const weddingsCount = await prisma.wedding.count();
  const accessCount = await prisma.weddingAccess.count();
  
  console.log(`   Usuarios: ${usersCount} con role asignado`);
  console.log(`   Bodas: ${weddingsCount}`);
  console.log(`   Accesos: ${accessCount} registros en wedding_access`);
  
  if (accessCount >= weddingsCount) {
    console.log('\n✅ MIGRACIÓN COMPLETADA CON ÉXITO\n');
  } else {
    console.log('\n⚠️  REVISAR: Algunos datos no se migraron correctamente\n');
  }
}

try {
  await migrateData();
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error);
}

await prisma.$disconnect();
