/**
 * Consolidar Budget y SeatingPlan en Wedding como JSON
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n📦 CONSOLIDACIÓN: Budget y SeatingPlan → Wedding\n');
console.log('='.repeat(70));

async function consolidateData() {
  // 1. Migrar Budgets
  console.log('\n1. Migrando budgets a weddings.budgetData...');
  
  const budgets = await prisma.budget.findMany();
  console.log(`   Encontrados: ${budgets.length} budgets`);
  
  let budgetsMigrated = 0;
  for (const budget of budgets) {
    try {
      await prisma.wedding.update({
        where: { id: budget.weddingId },
        data: {
          budgetData: {
            totalBudget: budget.totalBudget,
            items: budget.items,
            migratedAt: new Date().toISOString()
          }
        }
      });
      budgetsMigrated++;
    } catch (error) {
      console.error(`   ❌ Error migrando budget de boda ${budget.weddingId}:`, error.message);
    }
  }
  console.log(`   ✅ ${budgetsMigrated}/${budgets.length} budgets migrados`);

  // 2. Migrar Seating Plans
  console.log('\n2. Migrando seating plans a weddings.seatingData...');
  
  const seatingPlans = await prisma.seatingPlan.findMany();
  console.log(`   Encontrados: ${seatingPlans.length} seating plans`);
  
  let seatingMigrated = 0;
  for (const seating of seatingPlans) {
    try {
      await prisma.wedding.update({
        where: { id: seating.weddingId },
        data: {
          seatingData: {
            layout: seating.layout,
            tables: seating.tables,
            migratedAt: new Date().toISOString()
          }
        }
      });
      seatingMigrated++;
    } catch (error) {
      console.error(`   ❌ Error migrando seating de boda ${seating.weddingId}:`, error.message);
    }
  }
  console.log(`   ✅ ${seatingMigrated}/${seatingPlans.length} seating plans migrados`);

  // 3. Verificar migración
  console.log('\n3. Verificando datos migrados...');
  
  const weddingsWithBudget = await prisma.wedding.count({
    where: { budgetData: { not: null } }
  });
  
  const weddingsWithSeating = await prisma.wedding.count({
    where: { seatingData: { not: null } }
  });
  
  console.log(`   Bodas con budgetData:  ${weddingsWithBudget}/${budgets.length}`);
  console.log(`   Bodas con seatingData: ${weddingsWithSeating}/${seatingPlans.length}`);
  
  if (weddingsWithBudget === budgets.length && weddingsWithSeating === seatingPlans.length) {
    console.log('\n✅ MIGRACIÓN DE DATOS COMPLETADA\n');
    console.log('⚠️  Ahora puedes eliminar las tablas antiguas con:');
    console.log('   DROP TABLE budgets CASCADE;');
    console.log('   DROP TABLE seating_plans CASCADE;');
  } else {
    console.log('\n⚠️  ADVERTENCIA: No todos los datos se migraron correctamente');
  }
}

try {
  await consolidateData();
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error);
}

await prisma.$disconnect();
