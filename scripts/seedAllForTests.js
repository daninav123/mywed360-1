#!/usr/bin/env node
/**
 * Script maestro para ejecutar todos los seeds necesarios para tests E2E
 * Ejecuta los seeds en el orden correcto para asegurar dependencias
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seeds = [
  'seedAdminData.js',
  'seedPersonalizationProfiles.js',
  'seedTestDataForPlanner.js',
  'seedWeddingGuests.js',
  'seedSeatingPlan.js',
  'seedFinanceMovements.js',
  'seedSuppliersSimple.js',
];

async function runSeed(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🌱 Ejecutando: ${scriptName}...`);
    const scriptPath = join(__dirname, scriptName);
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: { ...process.env },
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Error en ${scriptName} (código ${code})`);
        reject(new Error(`Seed ${scriptName} failed with code ${code}`));
      } else {
        console.log(`✅ ${scriptName} completado`);
        resolve();
      }
    });

    child.on('error', (err) => {
      console.error(`❌ Error ejecutando ${scriptName}:`, err.message);
      reject(err);
    });
  });
}

async function main() {
  console.log('🚀 Iniciando seeds para tests E2E...\n');
  console.log(`Total de seeds: ${seeds.length}\n`);

  let completed = 0;
  let failed = 0;

  for (const seed of seeds) {
    try {
      await runSeed(seed);
      completed++;
    } catch (error) {
      failed++;
      // Continuar con el siguiente seed aunque falle uno
      console.warn(`⚠️  Continuando con siguiente seed...`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE SEEDS');
  console.log('='.repeat(50));
  console.log(`✅ Completados: ${completed}/${seeds.length}`);
  console.log(`❌ Fallidos: ${failed}/${seeds.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 Todos los seeds se ejecutaron correctamente');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} seed(s) fallaron, pero el proceso continuó`);
    process.exit(0); // No fallar el proceso para permitir que tests continúen
  }
}

main().catch((error) => {
  console.error('\n❌ Error fatal ejecutando seeds:', error.message);
  process.exit(1);
});
