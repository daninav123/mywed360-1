/**
 * Seed de datos de prueba para PostgreSQL
 * 
 * Ejecuta: node backend/prisma/seed.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Sembrando datos de prueba...\n');

  // 1. Crear usuarios
  const user1 = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      email: 'maria@example.com',
      displayName: 'María García',
      phoneNumber: '+34612345678',
      emailVerified: true,
      provider: 'email',
    },
  });
  console.log('✅ Usuario creado:', user1.displayName);

  const user2 = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      email: 'juan@example.com',
      displayName: 'Juan Martínez',
      phoneNumber: '+34687654321',
      emailVerified: true,
      provider: 'email',
    },
  });
  console.log('✅ Usuario creado:', user2.displayName);

  // 2. Crear bodas
  const wedding1 = await prisma.wedding.upsert({
    where: { id: 'wedding-demo-1' },
    update: {},
    create: {
      id: 'wedding-demo-1',
      userId: user1.id,
      coupleName: 'María & Juan',
      weddingDate: new Date('2025-06-15'),
      celebrationPlace: 'Hacienda Los Naranjos',
      celebrationAddress: 'Calle Real 123, Sevilla',
      banquetPlace: 'Salón Andaluz',
      numGuests: 120,
      weddingStyle: 'Rústico elegante',
      colorScheme: 'Verde salvia y dorado',
      status: 'active',
    },
  });
  console.log('✅ Boda creada:', wedding1.coupleName);

  const wedding2 = await prisma.wedding.upsert({
    where: { id: 'wedding-demo-2' },
    update: {},
    create: {
      id: 'wedding-demo-2',
      userId: user2.id,
      coupleName: 'Laura & Carlos',
      weddingDate: new Date('2025-09-20'),
      celebrationPlace: 'Playa de las Arenas',
      celebrationAddress: 'Valencia',
      numGuests: 80,
      weddingStyle: 'Playa bohemio',
      colorScheme: 'Blanco y azul marino',
      status: 'active',
    },
  });
  console.log('✅ Boda creada:', wedding2.coupleName);

  // 3. Crear invitados
  const guest1 = await prisma.guest.create({
    data: {
      weddingId: wedding1.id,
      name: 'Pedro López',
      email: 'pedro@example.com',
      phone: '+34611223344',
      confirmed: true,
      status: 'confirmed',
      companions: 1,
      tableNumber: 5,
    },
  });
  console.log('✅ Invitado creado:', guest1.name);

  await prisma.guest.create({
    data: {
      weddingId: wedding1.id,
      name: 'Ana Rodríguez',
      email: 'ana@example.com',
      confirmed: false,
      status: 'pending',
      companions: 0,
    },
  });
  console.log('✅ Invitado creado: Ana Rodríguez');

  // 4. Crear proveedores
  const supplier1 = await prisma.supplier.create({
    data: {
      userId: user1.id,
      businessName: 'Flores del Sur',
      category: 'Floristería',
      description: 'Decoración floral para bodas y eventos',
      email: 'flores@example.com',
      phone: '+34954123456',
      website: 'https://floresdelsur.com',
      city: 'Sevilla',
      country: 'España',
      instagram: '@floresdelsur',
      rating: 4.8,
      reviewCount: 45,
      verified: true,
      featured: true,
    },
  });
  console.log('✅ Proveedor creado:', supplier1.businessName);

  await prisma.supplier.create({
    data: {
      userId: user2.id,
      businessName: 'Fotografía Momentos',
      category: 'Fotografía',
      description: 'Fotografía artística de bodas',
      email: 'foto@example.com',
      phone: '+34961234567',
      city: 'Valencia',
      country: 'España',
      rating: 4.9,
      reviewCount: 78,
      verified: true,
    },
  });
  console.log('✅ Proveedor creado: Fotografía Momentos');

  // 5. Crear presupuesto
  await prisma.budget.create({
    data: {
      weddingId: wedding1.id,
      totalBudget: 25000,
      items: {
        catering: { amount: 8000, paid: 2000 },
        venue: { amount: 5000, paid: 5000 },
        flowers: { amount: 2000, paid: 0 },
        photography: { amount: 3000, paid: 1000 },
        music: { amount: 2500, paid: 0 },
        other: { amount: 4500, paid: 500 },
      },
    },
  });
  console.log('✅ Presupuesto creado para:', wedding1.coupleName);

  // 6. Crear plan de asientos
  await prisma.seatingPlan.create({
    data: {
      weddingId: wedding1.id,
      layout: { type: 'banquet', rows: 12, columns: 10 },
      tables: [
        { number: 1, capacity: 10, shape: 'round', guests: [] },
        { number: 2, capacity: 10, shape: 'round', guests: [] },
        { number: 3, capacity: 8, shape: 'rectangular', guests: [] },
      ],
    },
  });
  console.log('✅ Plan de asientos creado');

  console.log('\n✨ DATOS DE PRUEBA CREADOS EXITOSAMENTE\n');
  console.log('📊 Resumen:');
  console.log('   - 2 usuarios');
  console.log('   - 2 bodas');
  console.log('   - 2 invitados');
  console.log('   - 2 proveedores');
  console.log('   - 1 presupuesto');
  console.log('   - 1 plan de asientos\n');
  console.log('🔍 Revisa en Prisma Studio: http://localhost:5555\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
