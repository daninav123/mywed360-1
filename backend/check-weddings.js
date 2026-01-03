import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWeddings() {
  try {
    console.log('\n🔍 Verificando bodas en PostgreSQL...\n');
    
    const weddings = await prisma.wedding.findMany({
      select: {
        id: true,
        userId: true,
        coupleName: true,
        weddingDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📊 Total de bodas encontradas: ${weddings.length}\n`);

    if (weddings.length === 0) {
      console.log('❌ No hay bodas en la base de datos PostgreSQL');
      console.log('\n💡 Necesitas crear una boda desde la interfaz o migrar desde Firestore\n');
    } else {
      console.log('✅ Bodas encontradas:\n');
      weddings.forEach((w, i) => {
        console.log(`${i + 1}. ${w.coupleName}`);
        console.log(`   ID: ${w.id}`);
        console.log(`   User ID: ${w.userId}`);
        console.log(`   Fecha: ${w.weddingDate}`);
        console.log('');
      });
    }

    // Verificar usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
      take: 5
    });

    console.log(`\n👥 Usuarios encontrados: ${users.length}\n`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email} (${u.role})`);
      console.log(`   ID: ${u.id}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWeddings();
