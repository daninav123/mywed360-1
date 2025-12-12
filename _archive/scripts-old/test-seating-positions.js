/**
 * Script de prueba manual para verificar las posiciones de las mesas
 * Ejecutar con: node test-seating-positions.js
 */

import { generateAutoLayout } from './apps/main-app/src/utils/seatingLayoutGenerator.js';

console.log('🧪 Iniciando tests de posiciones de mesas...\n');

// Crear 250 invitados de prueba
const mockGuests = Array.from({ length: 250 }, (_, i) => ({
  id: `guest-${i + 1}`,
  name: `Guest ${i + 1}`,
  table: `Mesa ${Math.floor(i / 10) + 1}`,
  confirmed: true,
}));

const hallSize = { width: 1800, height: 1200 };

// TEST 1: Generar layout con columns
console.log('📋 TEST 1: Generando layout tipo "columns"');
const result1 = generateAutoLayout(mockGuests, 'columns', hallSize);

console.log(`   ✓ Mesas generadas: ${result1.tables.length}`);
console.log(`   ✓ Total invitados: ${result1.totalGuests}`);
console.log(`   ✓ Invitados asignados: ${result1.totalAssigned}`);

// Verificar posiciones únicas
const positions1 = new Set(result1.tables.map((t) => `${t.x},${t.y}`));
const uniqueRatio1 = positions1.size / result1.tables.length;

console.log(`   ✓ Posiciones únicas: ${positions1.size} de ${result1.tables.length}`);
console.log(`   ✓ Ratio de unicidad: ${(uniqueRatio1 * 100).toFixed(1)}%`);

if (uniqueRatio1 < 0.8) {
  console.error('   ❌ ERROR: Menos del 80% de las mesas tienen posiciones únicas!');
  console.error('   🔍 Primeras 10 posiciones:');
  result1.tables.slice(0, 10).forEach((t, i) => {
    console.error(`      Mesa ${i + 1}: (${t.x}, ${t.y})`);
  });
  process.exit(1);
} else {
  console.log('   ✅ PASS: Las mesas tienen posiciones únicas');
}

// Mostrar primeras 5 posiciones
console.log('\n   📍 Primeras 5 posiciones:');
result1.tables.slice(0, 5).forEach((t, i) => {
  console.log(`      Mesa ${i + 1}: (${t.x}, ${t.y}) - ${t.seats} asientos`);
});

// TEST 2: Verificar que no todas están en la misma posición
console.log('\n📋 TEST 2: Verificando que no todas las mesas están apiladas');
const firstPosition = `${result1.tables[0].x},${result1.tables[0].y}`;
const allSame = result1.tables.every((t) => `${t.x},${t.y}` === firstPosition);

if (allSame) {
  console.error(`   ❌ ERROR: Todas las mesas están en la posición ${firstPosition}!`);
  process.exit(1);
} else {
  console.log('   ✅ PASS: Las mesas están distribuidas');
}

// TEST 3: Verificar que no hay valores por defecto excesivos
console.log('\n📋 TEST 3: Verificando posiciones por defecto (120, 120)');
const defaultCount = result1.tables.filter((t) => t.x === 120 && t.y === 120).length;
const defaultRatio = defaultCount / result1.tables.length;

console.log(`   ✓ Mesas en posición por defecto: ${defaultCount}`);
console.log(`   ✓ Ratio: ${(defaultRatio * 100).toFixed(1)}%`);

if (defaultRatio > 0.1) {
  console.error('   ❌ ERROR: Más del 10% de las mesas están en la posición por defecto!');
  process.exit(1);
} else {
  console.log('   ✅ PASS: Pocas mesas en posición por defecto');
}

// TEST 4: Generar layout circular
console.log('\n📋 TEST 4: Generando layout tipo "circular"');
const result2 = generateAutoLayout(mockGuests, 'circular', hallSize);

const positions2 = new Set(result2.tables.map((t) => `${t.x},${t.y}`));
const uniqueRatio2 = positions2.size / result2.tables.length;

console.log(`   ✓ Mesas generadas: ${result2.tables.length}`);
console.log(`   ✓ Posiciones únicas: ${positions2.size}`);
console.log(`   ✓ Ratio de unicidad: ${(uniqueRatio2 * 100).toFixed(1)}%`);

if (uniqueRatio2 < 0.7) {
  console.error('   ❌ ERROR: Layout circular con demasiadas posiciones duplicadas!');
  process.exit(1);
} else {
  console.log('   ✅ PASS: Layout circular OK');
}

// TEST 5: Verificar valores numéricos válidos
console.log('\n📋 TEST 5: Verificando que todas las coordenadas son números válidos');
const invalidTables = result1.tables.filter(
  (t) =>
    typeof t.x !== 'number' ||
    typeof t.y !== 'number' ||
    isNaN(t.x) ||
    isNaN(t.y) ||
    t.x == null ||
    t.y == null
);

if (invalidTables.length > 0) {
  console.error(`   ❌ ERROR: ${invalidTables.length} mesas con coordenadas inválidas!`);
  console.error('   🔍 Mesas problemáticas:');
  invalidTables.slice(0, 5).forEach((t) => {
    console.error(`      Mesa ${t.id}: x=${t.x}, y=${t.y}`);
  });
  process.exit(1);
} else {
  console.log('   ✅ PASS: Todas las coordenadas son válidas');
}

// TEST 6: Comparar múltiples generaciones
console.log('\n📋 TEST 6: Verificando consistencia entre generaciones');
const result3 = generateAutoLayout(mockGuests, 'columns', hallSize);

const positions3 = new Set(result3.tables.map((t) => `${t.x},${t.y}`));
const uniqueRatio3 = positions3.size / result3.tables.length;

console.log(`   ✓ Primera generación: ${(uniqueRatio1 * 100).toFixed(1)}% únicas`);
console.log(`   ✓ Segunda generación: ${(uniqueRatio3 * 100).toFixed(1)}% únicas`);

if (uniqueRatio1 >= 0.8 && uniqueRatio3 >= 0.8) {
  console.log('   ✅ PASS: Generaciones consistentes');
} else {
  console.error('   ❌ ERROR: Inconsistencia entre generaciones');
  process.exit(1);
}

// RESUMEN FINAL
console.log('\n' + '='.repeat(60));
console.log('✅ TODOS LOS TESTS PASARON CORRECTAMENTE');
console.log('='.repeat(60));
console.log('\n📊 Resumen:');
console.log(
  `   • Layout columns: ${result1.tables.length} mesas, ${(uniqueRatio1 * 100).toFixed(1)}% únicas`
);
console.log(
  `   • Layout circular: ${result2.tables.length} mesas, ${(uniqueRatio2 * 100).toFixed(1)}% únicas`
);
console.log(`   • Todas las coordenadas son válidas`);
console.log(`   • No hay apilamiento de mesas`);
console.log(`   • Posiciones por defecto: ${(defaultRatio * 100).toFixed(1)}%\n`);

process.exit(0);
