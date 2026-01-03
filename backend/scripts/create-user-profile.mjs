/**
 * Script para crear UserProfile para usuarios que no lo tienen
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserProfile() {
  try {
    console.log('🔍 Buscando usuarios sin perfil...');
    
    const usersWithoutProfile = await prisma.user.findMany({
      where: {
        profile: null
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    console.log(`📊 Encontrados ${usersWithoutProfile.length} usuarios sin perfil`);

    for (const user of usersWithoutProfile) {
      console.log(`\n👤 Creando perfil para: ${user.email}`);
      
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          role: user.role || 'user',
          settings: {},
        }
      });
      
      console.log(`✅ Perfil creado para: ${user.email}`);
    }

    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUserProfile();
