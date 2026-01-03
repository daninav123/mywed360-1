#!/usr/bin/env node
/**
 * Script de verificación manual de correcciones del Seating Plan
 * Ejecuta verificaciones básicas sin necesidad de Cypress
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Verificando correcciones del Seating Plan...\n');

let allPassed = true;
const results = [];

// Test 1: Verificar import de motion en SeatingPlanModern.jsx
function test1() {
  const filePath = join(rootDir, 'apps/main-app/src/components/seating/SeatingPlanModern.jsx');

  if (!existsSync(filePath)) {
    return { pass: false, name: 'Import de motion', error: 'Archivo no encontrado' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const hasMotionImport =
    content.includes("import { motion } from 'framer-motion'") ||
    content.includes('import { motion } from "framer-motion"');

  return {
    pass: hasMotionImport,
    name: '✅ Import de motion en SeatingPlanModern.jsx',
    error: hasMotionImport ? null : 'No se encontró el import de motion',
  };
}

// Test 2: Verificar keys únicas en Minimap
function test2() {
  const filePath = join(rootDir, 'apps/main-app/src/components/seating/Minimap.jsx');

  if (!existsSync(filePath)) {
    return { pass: false, name: 'Keys en Minimap', error: 'Archivo no encontrado' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const hasUniqueKey = content.includes('minimap-table-') && content.includes('tableIndex');

  return {
    pass: hasUniqueKey,
    name: '✅ Keys únicas en Minimap.jsx',
    error: hasUniqueKey ? null : 'No se encontró key única con tableIndex',
  };
}

// Test 3: Verificar traducciones añadidas
function test3() {
  const filePath = join(rootDir, 'apps/main-app/src/i18n/locales/es/common.json');

  if (!existsSync(filePath)) {
    return { pass: false, name: 'Traducciones', error: 'Archivo no encontrado' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const hasFullAssignment = content.includes('fullAssignment');
  const hasCapacityUpdated = content.includes('capacityUpdated');
  const hasToasts = content.includes('"toasts"');

  const allTranslationsPresent = hasFullAssignment && hasCapacityUpdated && hasToasts;

  return {
    pass: allTranslationsPresent,
    name: '✅ Traducciones de planModern.toasts',
    error: allTranslationsPresent ? null : 'Faltan algunas traducciones',
    details: {
      fullAssignment: hasFullAssignment,
      capacityUpdated: hasCapacityUpdated,
      toastsSection: hasToasts,
    },
  };
}

// Test 4: Verificar logs de debugging activados
function test4() {
  const filePath = join(rootDir, 'apps/main-app/src/hooks/_useSeatingPlanDisabled.js');

  if (!existsSync(filePath)) {
    return { pass: false, name: 'Logs de debugging', error: 'Archivo no encontrado' };
  }

  const content = readFileSync(filePath, 'utf-8');

  // Buscar logs específicos que deben estar activos (sin //)
  const hasActiveSetupLog = content.includes("console.log('[setupSeatingPlanAutomatically]");
  const hasActiveAutoAssignLog = content.includes("console.log('[autoAssignGuests]");
  const hasEmojis = content.includes('🚀') && content.includes('✅');

  const allLogsActive = hasActiveSetupLog && hasActiveAutoAssignLog && hasEmojis;

  return {
    pass: allLogsActive,
    name: '✅ Logs de debugging activados',
    error: allLogsActive ? null : 'Algunos logs no están activados',
    details: {
      setupLogs: hasActiveSetupLog,
      autoAssignLogs: hasActiveAutoAssignLog,
      hasEmojis: hasEmojis,
    },
  };
}

// Test 5: Verificar que updateTable está expuesto
function test5() {
  const filePath = join(rootDir, 'apps/main-app/src/hooks/_useSeatingPlanDisabled.js');

  if (!existsSync(filePath)) {
    return { pass: false, name: 'updateTable expuesto', error: 'Archivo no encontrado' };
  }

  const content = readFileSync(filePath, 'utf-8');

  // Verificar que updateTable existe como función
  const hasUpdateTableFunction =
    content.includes('const updateTable =') || content.includes('const updateTable=');

  // Verificar que está en el return del hook
  const isExposed = content.includes('updateTable,') || content.includes('updateTable:');

  const isComplete = hasUpdateTableFunction && isExposed;

  return {
    pass: isComplete,
    name: '✅ updateTable existe y está expuesto',
    error: isComplete ? null : 'updateTable no está correctamente implementado',
    details: {
      functionExists: hasUpdateTableFunction,
      exposed: isExposed,
    },
  };
}

// Test 6: Verificar que no hay console.log comentados en las funciones clave
function test6() {
  const filePath = join(rootDir, 'apps/main-app/src/hooks/_useSeatingPlanDisabled.js');

  if (!existsSync(filePath)) {
    return { pass: false, name: 'Logs no comentados', error: 'Archivo no encontrado' };
  }

  const content = readFileSync(filePath, 'utf-8');

  // Buscar líneas con console.log comentados en las funciones críticas
  const setupSection = content.substring(
    content.indexOf('setupSeatingPlanAutomatically'),
    content.indexOf('setupSeatingPlanAutomatically') + 5000
  );

  const autoAssignSection = content.substring(
    content.indexOf('const autoAssignGuests ='),
    content.indexOf('const autoAssignGuests =') + 3000
  );

  const hasCommentedLogsSetup = setupSection.includes('// console.log');
  const hasCommentedLogsAssign = autoAssignSection.includes('// console.log');

  const noCommentedLogs = !hasCommentedLogsSetup && !hasCommentedLogsAssign;

  return {
    pass: noCommentedLogs,
    name: '✅ Todos los logs están activos (no comentados)',
    error: noCommentedLogs ? null : 'Hay logs comentados en funciones críticas',
    details: {
      setupSection: !hasCommentedLogsSetup,
      autoAssignSection: !hasCommentedLogsAssign,
    },
  };
}

// Test 7: Verificar estructura del archivo de test E2E
function test7() {
  const filePath = join(rootDir, 'cypress/e2e/seating/seating-bugfixes-verification.cy.js');

  if (!existsSync(filePath)) {
    return { pass: false, name: 'Test E2E creado', error: 'Archivo de test no encontrado' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const hasMotionTest = content.includes('motion is not defined');
  const hasKeysTest = content.includes('same key');
  const hasTranslationsTest = content.includes('fullAssignment');
  const hasLogsTest = content.includes('consoleLog');
  const hasUpdateTableTest = content.includes('updateTable');

  const allTestsPresent =
    hasMotionTest && hasKeysTest && hasTranslationsTest && hasLogsTest && hasUpdateTableTest;

  return {
    pass: allTestsPresent,
    name: '✅ Test E2E completo creado',
    error: allTestsPresent ? null : 'Faltan algunos tests',
    details: {
      motionTest: hasMotionTest,
      keysTest: hasKeysTest,
      translationsTest: hasTranslationsTest,
      logsTest: hasLogsTest,
      updateTableTest: hasUpdateTableTest,
    },
  };
}

// Ejecutar todos los tests
console.log('Ejecutando verificaciones...\n');

const tests = [test1, test2, test3, test4, test5, test6, test7];

tests.forEach((test, index) => {
  try {
    const result = test();
    results.push(result);

    if (result.pass) {
      console.log(`${index + 1}. ${result.name}`);
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          const status = value ? '✓' : '✗';
          console.log(`   ${status} ${key}: ${value}`);
        });
      }
    } else {
      allPassed = false;
      console.log(`${index + 1}. ❌ ${result.name}`);
      console.log(`   Error: ${result.error}`);
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          const status = value ? '✓' : '✗';
          console.log(`   ${status} ${key}: ${value}`);
        });
      }
    }
    console.log('');
  } catch (error) {
    allPassed = false;
    console.log(`${index + 1}. ❌ Error ejecutando test: ${error.message}\n`);
  }
});

// Resumen
console.log('═'.repeat(60));
console.log('\n📊 RESUMEN DE VERIFICACIÓN\n');

const passed = results.filter((r) => r.pass).length;
const total = results.length;

console.log(`Tests pasados: ${passed}/${total}`);
console.log(`Porcentaje: ${Math.round((passed / total) * 100)}%\n`);

if (allPassed) {
  console.log('✅ TODAS LAS VERIFICACIONES PASARON\n');
  console.log('Las siguientes correcciones están implementadas correctamente:');
  console.log('1. ✓ Import de motion desde framer-motion');
  console.log('2. ✓ Keys únicas en Minimap');
  console.log('3. ✓ Traducciones de planModern.toasts');
  console.log('4. ✓ Logs de debugging activados con emojis');
  console.log('5. ✓ updateTable existe y está expuesto');
  console.log('6. ✓ No hay logs comentados en funciones críticas');
  console.log('7. ✓ Tests E2E completos creados\n');

  console.log('📝 PRÓXIMOS PASOS:');
  console.log('1. Ejecutar la aplicación y verificar en el navegador');
  console.log('2. Ir a /invitados/seating');
  console.log('3. Click en "Generar Plan Automáticamente"');
  console.log('4. Verificar en la consola del navegador los logs con emojis');
  console.log('5. Confirmar que no hay errores ni warnings');

  process.exit(0);
} else {
  console.log('⚠️ ALGUNAS VERIFICACIONES FALLARON\n');
  console.log('Revisa los errores arriba y corrige los problemas identificados.\n');
  process.exit(1);
}
