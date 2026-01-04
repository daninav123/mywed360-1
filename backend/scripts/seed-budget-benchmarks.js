import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para poblar la tabla SystemMetadata con datos de benchmarks de presupuesto
 * Ejecutar: node scripts/seed-budget-benchmarks.js
 */

const benchmarkData = [
  // España - Global
  {
    key: 'budget_benchmark_espana_global',
    value: {
      averageBudget: 22000,
      minBudget: 12000,
      maxBudget: 45000,
      categories: {
        catering: { avg: 8500, min: 5000, max: 15000 },
        venue: { avg: 4500, min: 2000, max: 10000 },
        photography: { avg: 2500, min: 1200, max: 5000 },
        music: { avg: 1800, min: 800, max: 4000 },
        flowers: { avg: 1500, min: 600, max: 3500 },
        dress: { avg: 1800, min: 800, max: 4000 },
        invitations: { avg: 400, min: 200, max: 800 },
        other: { avg: 1000, min: 400, max: 2700 }
      },
      currency: 'EUR',
      sampleSize: 450,
      lastUpdated: new Date().toISOString()
    }
  },
  // Global - 50-100 invitados
  {
    key: 'budget_benchmark_global_51-100',
    value: {
      averageBudget: 18000,
      minBudget: 10000,
      maxBudget: 35000,
      categories: {
        catering: { avg: 7000, min: 4000, max: 12000 },
        venue: { avg: 3500, min: 1500, max: 8000 },
        photography: { avg: 2000, min: 1000, max: 4000 },
        music: { avg: 1500, min: 700, max: 3500 },
        flowers: { avg: 1200, min: 500, max: 3000 },
        dress: { avg: 1500, min: 700, max: 3500 },
        invitations: { avg: 300, min: 150, max: 600 },
        other: { avg: 1000, min: 450, max: 2400 }
      },
      currency: 'EUR',
      sampleSize: 320,
      lastUpdated: new Date().toISOString()
    }
  },
  // Global - 101-150 invitados
  {
    key: 'budget_benchmark_global_101-150',
    value: {
      averageBudget: 25000,
      minBudget: 15000,
      maxBudget: 50000,
      categories: {
        catering: { avg: 10000, min: 6000, max: 18000 },
        venue: { avg: 5000, min: 2500, max: 12000 },
        photography: { avg: 2800, min: 1500, max: 5500 },
        music: { avg: 2000, min: 900, max: 4500 },
        flowers: { avg: 1800, min: 700, max: 4000 },
        dress: { avg: 2000, min: 900, max: 4500 },
        invitations: { avg: 500, min: 250, max: 1000 },
        other: { avg: 900, min: 250, max: 2500 }
      },
      currency: 'EUR',
      sampleSize: 280,
      lastUpdated: new Date().toISOString()
    }
  },
  // Global - Global (fallback)
  {
    key: 'budget_benchmark_global_global',
    value: {
      averageBudget: 20000,
      minBudget: 11000,
      maxBudget: 40000,
      categories: {
        catering: { avg: 8000, min: 4500, max: 14000 },
        venue: { avg: 4000, min: 1800, max: 9000 },
        photography: { avg: 2300, min: 1100, max: 4500 },
        music: { avg: 1700, min: 750, max: 3800 },
        flowers: { avg: 1400, min: 600, max: 3200 },
        dress: { avg: 1700, min: 750, max: 3800 },
        invitations: { avg: 350, min: 180, max: 700 },
        other: { avg: 550, min: 320, max: 2000 }
      },
      currency: 'EUR',
      sampleSize: 850,
      lastUpdated: new Date().toISOString()
    }
  }
];

async function seedBenchmarks() {
  try {
    console.log('🌱 Sembrando datos de benchmarks de presupuesto...');

    for (const benchmark of benchmarkData) {
      await prisma.systemMetadata.upsert({
        where: { key: benchmark.key },
        update: { value: benchmark.value },
        create: benchmark
      });
      console.log(`✅ Creado/actualizado: ${benchmark.key}`);
    }

    console.log('✅ Benchmarks sembrados exitosamente');
  } catch (error) {
    console.error('❌ Error sembrando benchmarks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedBenchmarks();
