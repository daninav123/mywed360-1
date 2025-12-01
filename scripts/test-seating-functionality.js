#!/usr/bin/env node
/**
 * Script de verificación funcional del Seating Plan
 * Opción A: Verificar que todo funciona
 */

import fetch from 'node-fetch';

const FRONTEND_URL = 'http://localhost:5173';
const TIMEOUT = 5000;

console.log('🧪 VERIFICACIÓN FUNCIONAL DEL SEATING PLAN\n');
console.log('═'.repeat(60));

let allChecks = [];

// Helper para checks
function addCheck(name, status, details = '') {
  allChecks.push({ name, status, details });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
}

// 1. Verificar que el servidor está corriendo
async function checkServerRunning() {
  console.log('\n1️⃣ Verificando servidor...\n');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(FRONTEND_URL, {
      signal: controller.signal,
      method: 'HEAD',
    });

    clearTimeout(timeoutId);

    if (response.ok || response.status === 200) {
      addCheck('Servidor frontend', 'pass', `${FRONTEND_URL} accesible`);
      return true;
    } else {
      addCheck('Servidor frontend', 'fail', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      addCheck('Servidor frontend', 'fail', 'Timeout - servidor no responde');
    } else {
      addCheck('Servidor frontend', 'fail', error.message);
    }
    return false;
  }
}

// 2. Verificar archivos corregidos existen
async function checkFixedFiles() {
  console.log('\n2️⃣ Verificando correcciones implementadas...\n');

  const { existsSync, readFileSync } = await import('fs');
  const { join } = await import('path');
  const { fileURLToPath } = await import('url');
  const { dirname } = await import('path');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const rootDir = join(__dirname, '..');

  const checks = [
    {
      name: 'SeatingPlanModern.jsx corregido',
      path: 'apps/main-app/src/components/seating/SeatingPlanModern.jsx',
      contains: "import { motion } from 'framer-motion'",
    },
    {
      name: 'Minimap.jsx corregido',
      path: 'apps/main-app/src/components/seating/Minimap.jsx',
      contains: 'minimap-table-',
    },
    {
      name: 'SeatingCanvas.jsx corregido',
      path: 'apps/main-app/src/features/seating/SeatingCanvas.jsx',
      contains: 'addedVertical',
    },
    {
      name: 'Traducciones añadidas',
      path: 'apps/main-app/src/i18n/locales/es/common.json',
      contains: 'fullAssignment',
    },
    {
      name: 'Logs activados',
      path: 'apps/main-app/src/hooks/_useSeatingPlanDisabled.js',
      contains: "console.log('[setupSeatingPlanAutomatically]",
    },
  ];

  for (const check of checks) {
    const filePath = join(rootDir, check.path);

    if (!existsSync(filePath)) {
      addCheck(check.name, 'fail', 'Archivo no encontrado');
      continue;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      if (content.includes(check.contains)) {
        addCheck(check.name, 'pass');
      } else {
        addCheck(check.name, 'fail', 'Corrección no encontrada');
      }
    } catch (error) {
      addCheck(check.name, 'fail', error.message);
    }
  }
}

// 3. Instrucciones de prueba manual
function printManualTestInstructions() {
  console.log('\n3️⃣ PRUEBAS MANUALES REQUERIDAS\n');
  console.log('═'.repeat(60));
  console.log('\n📝 Sigue estos pasos en el navegador:\n');

  console.log('1. Abre el navegador en: ' + FRONTEND_URL);
  console.log('2. Abre DevTools (F12 o Cmd+Option+I)');
  console.log('3. Ve a la pestaña Console');
  console.log('4. Navega a: /invitados/seating');
  console.log('5. Cambia a la pestaña "Banquete"');
  console.log('');
  console.log('6. Si hay mesas, limpia el layout:');
  console.log('   - Click en menú (⋮) → "Limpiar Layout"');
  console.log('');
  console.log('7. Click en "Generar Plan Automáticamente"');
  console.log('');
  console.log('8. Observa y verifica:\n');

  return [
    {
      id: 'a',
      description: '¿Se generan las mesas en el canvas?',
      expected: 'Sí, múltiples mesas aparecen visualmente',
      lookFor: 'Círculos o rectángulos con números',
    },
    {
      id: 'b',
      description: '¿Aparecen logs con emojis en la consola?',
      expected: 'Sí, logs con 🚀, ✅, 📊, 🎯, etc.',
      lookFor: '[setupSeatingPlanAutomatically] 🚀 Iniciando...',
    },
    {
      id: 'c',
      description: '¿Se asignan los invitados a las mesas?',
      expected: 'Sí, logs muestran "✅ Asignando invitado X a mesa Y"',
      lookFor: '[autoAssignGuests] ✅ Asignando...',
    },
    {
      id: 'd',
      description: '¿Aparece toast de éxito en español?',
      expected: 'Sí, mensaje en español con estadísticas',
      lookFor: 'Toast con "Plan generado exitosamente"',
    },
    {
      id: 'e',
      description: '¿Hay errores en rojo en la consola?',
      expected: 'NO, la consola debe estar limpia',
      lookFor: 'Líneas rojas con "Error"',
    },
    {
      id: 'f',
      description: '¿Hay warnings de React (amarillo)?',
      expected: 'NO warnings de keys duplicadas',
      lookFor: 'Warning: Encountered two children with the same key',
    },
    {
      id: 'g',
      description: '¿Las estadísticas del footer se actualizan?',
      expected: 'Sí, muestra "X mesas, Y% asignados"',
      lookFor: 'Números en la parte inferior',
    },
    {
      id: 'h',
      description: '¿El minimap se actualiza con las mesas?',
      expected: 'Sí, minimap muestra mesas en miniatura',
      lookFor: 'Mini-vista en esquina con puntos de colores',
    },
  ];
}

// 4. Generar checklist
function generateChecklist(items) {
  console.log('📋 CHECKLIST DE VERIFICACIÓN\n');
  console.log('Marca cada item después de verificarlo:\n');

  items.forEach((item) => {
    console.log(`[ ] ${item.id.toUpperCase()}. ${item.description}`);
    console.log(`    Esperado: ${item.expected}`);
    console.log(`    Buscar: ${item.lookFor}`);
    console.log('');
  });

  console.log('═'.repeat(60));
  console.log('\n💡 TIPS:\n');
  console.log('• Si no ves logs: Recarga la página (Cmd+R / F5)');
  console.log('• Si los logs están muy rápido: Click derecho en consola → "Preserve log"');
  console.log('• Para ver mejor: Filtra por "[setupSeatingPlanAutomatically]"');
  console.log('• Si hay errores: Copia el mensaje completo');
}

// Resumen final
function printSummary() {
  console.log('\n═'.repeat(60));
  console.log('\n📊 RESUMEN DE VERIFICACIÓN AUTOMÁTICA\n');

  const passed = allChecks.filter((c) => c.status === 'pass').length;
  const failed = allChecks.filter((c) => c.status === 'fail').length;
  const warnings = allChecks.filter((c) => c.status === 'warn').length;
  const total = allChecks.length;

  console.log(`Total de checks: ${total}`);
  console.log(`✅ Pasados: ${passed}`);
  console.log(`❌ Fallados: ${failed}`);
  console.log(`⚠️  Advertencias: ${warnings}`);
  console.log('');

  const percentage = Math.round((passed / total) * 100);
  console.log(`Porcentaje de éxito: ${percentage}%`);

  if (percentage === 100) {
    console.log('\n🎉 TODAS LAS VERIFICACIONES AUTOMÁTICAS PASARON');
    console.log('Procede con las pruebas manuales en el navegador.\n');
  } else if (percentage >= 80) {
    console.log('\n✅ La mayoría de verificaciones pasaron');
    console.log('Revisa los fallos antes de continuar.\n');
  } else {
    console.log('\n⚠️  Varios checks fallaron');
    console.log('Corrige los problemas antes de las pruebas manuales.\n');
  }
}

// Ejecutar todas las verificaciones
async function runAllChecks() {
  console.log('Iniciando verificaciones...\n');

  const serverOk = await checkServerRunning();
  await checkFixedFiles();

  printSummary();

  if (serverOk) {
    const manualTests = printManualTestInstructions();
    generateChecklist(manualTests);

    console.log('\n🔗 ENLACES RÁPIDOS\n');
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Seating Plan: ${FRONTEND_URL}/invitados/seating`);
    console.log('');
    console.log('═'.repeat(60));
    console.log('\n✨ Una vez completadas las pruebas manuales, reporta los resultados.\n');
  } else {
    console.log('\n❌ El servidor no está corriendo.');
    console.log('Ejecuta: npm run dev:all');
    console.log('Y luego vuelve a ejecutar este script.\n');
  }
}

// Ejecutar
runAllChecks().catch((error) => {
  console.error('\n❌ Error ejecutando verificaciones:', error.message);
  process.exit(1);
});
