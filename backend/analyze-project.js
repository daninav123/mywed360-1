/**
 * Análisis completo del proyecto - Detección de errores
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n🔍 ANÁLISIS COMPLETO DEL PROYECTO\n');
console.log('='.repeat(70));

const errors = [];
const warnings = [];
const info = [];

// 1. VERIFICAR ARCHIVOS DE CONFIGURACIÓN
console.log('\n📁 1. ARCHIVOS DE CONFIGURACIÓN');
console.log('-'.repeat(70));

const requiredFiles = [
  '.env',
  'backend/.env',
  'package.json',
  'backend/package.json',
  'backend/prisma/schema.prisma',
  'docker-compose.yml'
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(file);
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NO EXISTE`);
    errors.push(`Falta archivo: ${file}`);
  }
}

// 2. VERIFICAR VARIABLES DE ENTORNO
console.log('\n\n⚙️  2. VARIABLES DE ENTORNO');
console.log('-'.repeat(70));

const envVars = [
  'USE_FIREBASE',
  'DATABASE_URL',
  'VITE_BACKEND_URL',
  'GOOGLE_APPLICATION_CREDENTIALS'
];

const rootEnv = fs.readFileSync('.env', 'utf-8');
const backendEnv = fs.readFileSync('backend/.env', 'utf-8');

for (const envVar of envVars) {
  const inRoot = rootEnv.includes(envVar);
  const inBackend = backendEnv.includes(envVar);
  
  if (inRoot || inBackend) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`⚠️  ${envVar} - NO CONFIGURADA`);
    warnings.push(`Variable ${envVar} no encontrada`);
  }
}

// Verificar USE_FIREBASE=false
if (backendEnv.includes('USE_FIREBASE=false')) {
  console.log(`✅ PostgreSQL activado (USE_FIREBASE=false)`);
  info.push('Sistema configurado para usar PostgreSQL');
} else if (backendEnv.includes('USE_FIREBASE=true')) {
  console.log(`⚠️  Firebase activado (USE_FIREBASE=true)`);
  warnings.push('Sistema aún usa Firebase en lugar de PostgreSQL');
}

// 3. VERIFICAR BASE DE DATOS POSTGRESQL
console.log('\n\n🗄️  3. BASE DE DATOS POSTGRESQL');
console.log('-'.repeat(70));

try {
  await prisma.$connect();
  console.log('✅ Conexión a PostgreSQL exitosa');
  
  // Contar registros
  const users = await prisma.user.count();
  const weddings = await prisma.wedding.count();
  const guests = await prisma.guest.count();
  const suppliers = await prisma.supplier.count();
  
  console.log(`   Usuarios:    ${users}`);
  console.log(`   Bodas:       ${weddings}`);
  console.log(`   Invitados:   ${guests}`);
  console.log(`   Proveedores: ${suppliers}`);
  
  if (users === 0) {
    errors.push('Base de datos sin usuarios');
  }
  
  // Detectar usuarios de test
  const testUsers = await prisma.user.count({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { email: { contains: 'e2e' } },
        { email: { contains: 'migration' } }
      ]
    }
  });
  
  if (testUsers > 0) {
    warnings.push(`${testUsers} usuarios de test/migración en BD`);
  }
  
  // Detectar bodas sin invitados
  const emptyWeddings = await prisma.wedding.count({
    where: {
      OR: [
        { coupleName: { contains: 'Test' } },
        { coupleName: { contains: 'test' } }
      ]
    }
  });
  
  if (emptyWeddings > 0) {
    warnings.push(`${emptyWeddings} bodas de prueba detectadas`);
  }
  
} catch (e) {
  console.log(`❌ Error conexión PostgreSQL: ${e.message}`);
  errors.push(`PostgreSQL: ${e.message}`);
}

// 4. VERIFICAR ESTRUCTURA DE PAQUETES
console.log('\n\n📦 4. DEPENDENCIAS Y PAQUETES');
console.log('-'.repeat(70));

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf-8'));

console.log(`✅ Root: ${Object.keys(packageJson.dependencies || {}).length} dependencias`);
console.log(`✅ Backend: ${Object.keys(backendPackageJson.dependencies || {}).length} dependencias`);

// Verificar dependencias críticas
const criticalDeps = ['@prisma/client', 'firebase-admin', 'express', 'dotenv'];
const backendDeps = Object.keys(backendPackageJson.dependencies || {});

for (const dep of criticalDeps) {
  if (backendDeps.includes(dep)) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - NO INSTALADA`);
    errors.push(`Falta dependencia: ${dep}`);
  }
}

// 5. VERIFICAR NODE_MODULES
console.log('\n\n📚 5. NODE_MODULES');
console.log('-'.repeat(70));

if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules/ existe en root');
} else {
  console.log('❌ node_modules/ no existe en root');
  errors.push('Ejecutar: npm install');
}

if (fs.existsSync('backend/node_modules')) {
  console.log('✅ node_modules/ existe en backend');
} else {
  console.log('❌ node_modules/ no existe en backend');
  errors.push('Ejecutar: cd backend && npm install');
}

// 6. VERIFICAR APPS
console.log('\n\n🚀 6. APLICACIONES');
console.log('-'.repeat(70));

const apps = ['main-app', 'admin-app', 'suppliers-app', 'planners-app'];
for (const app of apps) {
  const appPath = `apps/${app}`;
  if (fs.existsSync(appPath)) {
    console.log(`✅ ${app}`);
  } else {
    console.log(`⚠️  ${app} - NO EXISTE`);
    warnings.push(`App no encontrada: ${app}`);
  }
}

// 7. PRISMA SCHEMA
console.log('\n\n🗂️  7. PRISMA SCHEMA');
console.log('-'.repeat(70));

const schemaPath = 'backend/prisma/schema.prisma';
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const models = schema.match(/model \w+ {/g) || [];
  console.log(`✅ Prisma schema existe`);
  console.log(`   Modelos definidos: ${models.length}`);
  
  const requiredModels = ['User', 'Wedding', 'Guest', 'Supplier'];
  for (const model of requiredModels) {
    if (schema.includes(`model ${model}`)) {
      console.log(`✅ Modelo ${model}`);
    } else {
      console.log(`❌ Modelo ${model} - NO DEFINIDO`);
      errors.push(`Falta modelo: ${model}`);
    }
  }
} else {
  console.log('❌ Prisma schema no existe');
  errors.push('Falta archivo: backend/prisma/schema.prisma');
}

// RESUMEN FINAL
console.log('\n\n' + '='.repeat(70));
console.log('📊 RESUMEN DEL ANÁLISIS');
console.log('='.repeat(70));

console.log(`\n❌ ERRORES CRÍTICOS: ${errors.length}`);
if (errors.length > 0) {
  errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
}

console.log(`\n⚠️  ADVERTENCIAS: ${warnings.length}`);
if (warnings.length > 0) {
  warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
}

console.log(`\n💡 INFORMACIÓN: ${info.length}`);
if (info.length > 0) {
  info.forEach((inf, i) => console.log(`   ${i + 1}. ${inf}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ PROYECTO SIN ERRORES CRÍTICOS\n');
} else {
  console.log('\n⚠️  PROYECTO REQUIERE ATENCIÓN\n');
}

await prisma.$disconnect();
