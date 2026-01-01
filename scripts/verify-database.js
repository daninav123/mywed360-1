/**
 * Script de verificación - ¿Usa PostgreSQL o Firebase?
 * 
 * Ejecuta: node scripts/verify-database.js
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
dotenv.config({ path: './backend/.env' });

console.log('\n🔍 VERIFICACIÓN DE BASE DE DATOS\n');
console.log('================================\n');

// 1. Verificar variable de entorno
const useFirebase = process.env.USE_FIREBASE !== 'false';
console.log('1️⃣ Variable USE_FIREBASE:');
console.log(`   Valor: ${process.env.USE_FIREBASE || '(no definida)'}`);
console.log(`   Interpretación: ${useFirebase ? '❌ Usando Firebase' : '✅ Usando PostgreSQL'}\n`);

// 2. Verificar DATABASE_URL
console.log('2️⃣ Conexión DATABASE_URL:');
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const isPostgres = dbUrl.startsWith('postgresql://');
  console.log(`   ${isPostgres ? '✅' : '❌'} ${dbUrl.substring(0, 50)}...`);
  
  if (isPostgres) {
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      console.log(`   Usuario: ${match[1]}`);
      console.log(`   Host: ${match[3]}`);
      console.log(`   Puerto: ${match[4]}`);
      console.log(`   Base de datos: ${match[5]}\n`);
    }
  }
} else {
  console.log('   ❌ DATABASE_URL no está definida\n');
}

// 3. Intentar conexión a PostgreSQL
console.log('3️⃣ Probando conexión a PostgreSQL:');
try {
  const prisma = new PrismaClient();
  
  await prisma.$connect();
  console.log('   ✅ Conexión exitosa a PostgreSQL\n');
  
  // 4. Listar tablas
  console.log('4️⃣ Tablas en PostgreSQL:');
  const tables = await prisma.$queryRaw`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `;
  
  console.log(`   Total: ${tables.length} tablas`);
  tables.forEach((table, i) => {
    console.log(`   ${i + 1}. ${table.tablename}`);
  });
  
  // 5. Contar registros (si hay)
  console.log('\n5️⃣ Registros en tablas principales:');
  const userCount = await prisma.user.count();
  const weddingCount = await prisma.wedding.count();
  const guestCount = await prisma.guest.count();
  const supplierCount = await prisma.supplier.count();
  
  console.log(`   users: ${userCount}`);
  console.log(`   weddings: ${weddingCount}`);
  console.log(`   guests: ${guestCount}`);
  console.log(`   suppliers: ${supplierCount}`);
  
  await prisma.$disconnect();
  
  console.log('\n✅ RESULTADO: El proyecto está usando PostgreSQL correctamente\n');
  
} catch (error) {
  console.error('\n❌ Error al conectar con PostgreSQL:');
  console.error(`   ${error.message}\n`);
  
  if (error.message.includes('ECONNREFUSED')) {
    console.log('💡 Solución: Asegúrate de que Docker está corriendo:');
    console.log('   docker-compose up -d\n');
  }
  
  process.exit(1);
}
